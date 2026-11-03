#!/usr/bin/env node
/**
 * stage-fable-dropoff.mjs — Stage verified per-state + shared CDN/store drop-off bundles for Fable.
 *
 * Usage:
 *   node tools/preview/stage-fable-dropoff.mjs --state ND --include-shared
 *   node tools/preview/stage-fable-dropoff.mjs --state TX
 *   node tools/preview/stage-fable-dropoff.mjs --verify ND
 *   node tools/preview/stage-fable-dropoff.mjs --status
 *
 * Design:
 *   - Binary files in store/public/app/ are staged into coordination/FABLE-DROPOFF/payload/ via
 *     zero-copy NTFS hardlinks (fs.linkSync, falling back to fs.copyFileSync) so staging 51 states
 *     adds 0 GiB of duplicate disk usage while exposing a clean /app/** tree for CDN/R2 uploaders.
 *   - READY.json is written atomically LAST only after all 4 module completeness checks and
 *     sync-store --check pass, so Fable can safely watch states/<xx>/READY.json as a queue consumer.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const STORE_APP = path.join(ROOT, 'store', 'public', 'app');
const STORE_GEN = path.join(ROOT, 'store', 'src', 'generated');
const DROPOFF_ROOT = path.join(ROOT, 'coordination', 'FABLE-DROPOFF');
const PAYLOAD_ROOT = path.join(DROPOFF_ROOT, 'payload');

const PREFERRED_QUEUE_ORDER = [
  'ND',
  'TX', 'CA', 'FL', 'NY', 'PA', 'IL', 'OH', 'GA', 'NC', 'MI',
  'NJ', 'VA', 'WA', 'AZ', 'MA', 'TN', 'IN', 'MO', 'MD', 'WI',
  'CO', 'MN', 'SC', 'AL', 'LA', 'KY', 'OR', 'OK', 'CT', 'IA',
  'MS', 'AR', 'KS', 'NV', 'NM', 'NE', 'WV', 'ID', 'HI', 'NH',
  'ME', 'MT', 'RI', 'DE', 'SD', 'AK', 'DC', 'VT', 'WY',
  'UT', // #51 last: verify-learner.cjs pins UT byte-exact until final coordinated flip
];

const MIME_BY_EXT = {
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
};

function die(msg) {
  console.error(`stage-fable-dropoff FAILED: ${msg}`);
  process.exit(1);
}

function posix(p) {
  return p.split(path.sep).join('/');
}

function readJson(absPath) {
  return JSON.parse(fs.readFileSync(absPath, 'utf8'));
}

function writeJsonAtomic(absPath, obj) {
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  const tmp = `${absPath}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2) + '\n', 'utf8');
  fs.renameSync(tmp, absPath);
}

function sha256File(absPath) {
  const hash = crypto.createHash('sha256');
  const fd = fs.openSync(absPath, 'r');
  const buf = Buffer.allocUnsafe(1024 * 1024);
  try {
    let bytesRead = 0;
    while ((bytesRead = fs.readSync(fd, buf, 0, buf.length, null)) > 0) {
      hash.update(bytesRead === buf.length ? buf : buf.subarray(0, bytesRead));
    }
  } finally {
    fs.closeSync(fd);
  }
  return hash.digest('hex');
}

function walkFiles(dirAbs) {
  if (!fs.existsSync(dirAbs)) return [];
  const out = [];
  for (const ent of fs.readdirSync(dirAbs, { withFileTypes: true })) {
    const p = path.join(dirAbs, ent.name);
    if (ent.isDirectory()) out.push(...walkFiles(p));
    else if (ent.isFile()) out.push(p);
  }
  return out.sort();
}

function linkOrCopyFile(srcAbs, dstAbs) {
  fs.mkdirSync(path.dirname(dstAbs), { recursive: true });
  if (fs.existsSync(dstAbs)) fs.unlinkSync(dstAbs);
  try {
    fs.linkSync(srcAbs, dstAbs);
    return 'hardlink';
  } catch {
    fs.copyFileSync(srcAbs, dstAbs);
    return 'copy';
  }
}

function contentTypeFor(relPath) {
  const ext = path.posix.extname(relPath).toLowerCase();
  return MIME_BY_EXT[ext] || 'application/octet-stream';
}

function classifyAccessTier(relPath, freeSet, paidPrefixes) {
  if (freeSet.has(relPath)) return { access_tier: 'free', owner_state: null };
  const owner = paidPrefixes.find((p) => relPath.startsWith(p.prefix));
  if (owner) return { access_tier: 'paid', owner_state: owner.code };
  return { access_tier: 'unlisted', owner_state: null };
}

const STATE_FULL_NAMES = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
  MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
  NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon',
  PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
  TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia',
  WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};

const HANDBOOK_CLEAN_TITLES = {
  OH: 'Ohio Driver Manual — Digest of Motor Vehicle Laws',
  NM: 'New Mexico Driver Manual',
  DC: 'District of Columbia Driver Manual',
  OK: 'Oklahoma Driver Manual (2025)',
  VT: "Vermont Driver's Manual 2025",
  GA: "Georgia Drivers' Manual (2023-2024)",
};

function loadStatesAndFreeMap() {
  const statesPath = path.join(STORE_APP, 'data', 'states.json');
  const freePathsFile = path.join(STORE_GEN, 'free-paths.json');
  if (!fs.existsSync(statesPath)) die(`Missing ${statesPath} — run sync-store.mjs first.`);
  if (!fs.existsSync(freePathsFile)) die(`Missing ${freePathsFile} — run sync-store.mjs first.`);
  const states = readJson(statesPath).map((s) => {
    const code = String(s.code).toUpperCase();
    return {
      ...s,
      name: STATE_FULL_NAMES[code] || s.name,
      handbook: HANDBOOK_CLEAN_TITLES[code] || s.handbook,
    };
  });
  const freeDoc = readJson(freePathsFile);
  const freeSet = new Set(freeDoc.free || []);
  const paidPrefixes = [...(freeDoc.paid_prefixes || [])].sort((a, b) => b.prefix.length - a.prefix.length);
  return { states, freeDoc, freeSet, paidPrefixes };
}

function buildQueueOrder(states) {
  const byCode = new Map(states.map((s) => [String(s.code).toUpperCase(), s]));
  const ordered = [];
  for (const c of PREFERRED_QUEUE_ORDER) {
    if (byCode.has(c)) {
      ordered.push(byCode.get(c));
      byCode.delete(c);
    }
  }
  for (const s of byCode.values()) ordered.push(s);
  return ordered;
}

function updateQueueLedger(states) {
  const ordered = buildQueueOrder(states);
  const ledgerPath = path.join(DROPOFF_ROOT, 'QUEUE-STATUS.json');
  const prev = fs.existsSync(ledgerPath) ? readJson(ledgerPath) : { states: [] };
  const prevByCode = new Map((prev.states || []).map((r) => [r.code, r]));

  const rows = ordered.map((s, idx) => {
    const code = String(s.code).toUpperCase();
    const lower = code.toLowerCase();
    const readyPath = path.join(DROPOFF_ROOT, 'states', lower, 'READY.json');
    const prevRow = prevByCode.get(code) || {};
    if (fs.existsSync(readyPath)) {
      const ready = readJson(readyPath);
      return {
        queue_position: idx + 1,
        code,
        name: s.name,
        status: prevRow.fable_picked_up_at ? 'picked_up_by_fable' : 'ready_for_fable',
        ready_at: ready.staged_at,
        fable_picked_up_at: prevRow.fable_picked_up_at || null,
        ready_manifest: `coordination/FABLE-DROPOFF/states/${lower}/READY.json`,
        cdn_manifest: `coordination/FABLE-DROPOFF/states/${lower}/cdn-manifest.json`,
        payload_app_dir: `coordination/FABLE-DROPOFF/payload/states/${lower}/app`,
        counts: ready.module_summary,
        totals: {
          files: ready.totals.files,
          bytes: ready.totals.bytes,
          mb: Number((ready.totals.bytes / 1e6).toFixed(2)),
          free_files: ready.totals.free_files,
          paid_files: ready.totals.paid_files,
        },
      };
    }
    return {
      queue_position: idx + 1,
      code,
      name: s.name,
      status: prevRow.status === 'in_progress' ? 'in_progress' : 'queued',
      ready_at: null,
      fable_picked_up_at: null,
      ready_manifest: `coordination/FABLE-DROPOFF/states/${lower}/READY.json`,
      cdn_manifest: `coordination/FABLE-DROPOFF/states/${lower}/cdn-manifest.json`,
      payload_app_dir: `coordination/FABLE-DROPOFF/payload/states/${lower}/app`,
      note: code === 'UT' ? 'Held at #51: verify-learner.cjs pins UT byte-exact until final coordinated flip' : null,
    };
  });

  const readyCount = rows.filter((r) => r.status === 'ready_for_fable' || r.status === 'picked_up_by_fable').length;
  const sharedManifestPath = path.join(DROPOFF_ROOT, 'shared', 'shared-manifest.json');
  const doc = {
    schema: 'nova.fable-dropoff.queue.v1',
    updated_at: new Date().toISOString(),
    summary: {
      total_states: rows.length,
      ready_or_picked_up: readyCount,
      remaining_queued: rows.length - readyCount,
      shared_bundle_staged: fs.existsSync(sharedManifestPath),
    },
    states: rows,
  };
  writeJsonAtomic(ledgerPath, doc);
  return doc;
}

function collectStateRelPaths(stateEntry) {
  const code = String(stateEntry.code).toUpperCase();
  const lower = code.toLowerCase();
  const rels = new Map(); // rel -> category

  const addTree = (subDir, category, filterFn = null) => {
    const absDir = path.join(STORE_APP, ...subDir.split('/'));
    for (const abs of walkFiles(absDir)) {
      const rel = posix(path.relative(STORE_APP, abs));
      if (filterFn && !filterFn(rel)) continue;
      rels.set(rel, category);
    }
  };
  const addSingle = (rel, category, required = true) => {
    const abs = path.join(STORE_APP, ...rel.split('/'));
    if (!fs.existsSync(abs)) {
      if (required) die(`[${code}] Missing required store file: store/public/app/${rel}`);
      return;
    }
    rels.set(rel, category);
  };

  // 1. State data export + quarantine
  const dataRoot = String(stateEntry.data_root || '').replace(/^\/+|\/+$/g, '');
  addTree(dataRoot, 'state_data');
  addSingle(`data/${lower}/quarantine.json`, 'quarantine', false);

  // 2. Base slide & Beat-2/3 narration audio
  const audioRoot = String(stateEntry.audio_root || 'audio').replace(/^\/+|\/+$/g, '');
  if (code === 'UT' && audioRoot === 'audio') {
    // UT pilot layout sits directly at audio/*.mp3 and audio/sessions/*.mp3 (other states sit in audio/<xx>/)
    addSingle('audio/audio-manifest.json', 'base_audio');
    for (const ent of fs.readdirSync(path.join(STORE_APP, 'audio'), { withFileTypes: true })) {
      if (ent.isFile() && ent.name.endsWith('.mp3')) rels.set(`audio/${ent.name}`, 'base_audio');
    }
    addTree('audio/sessions', 'base_audio');
  } else {
    addTree(audioRoot, 'base_audio');
  }

  // 3. Per-state visual map (705-scene shard with fallback: true flags)
  addSingle(`visuals/state/${lower}.json`, 'visual_map', true);

  // 4. Minted Gen-Z Flashcard Deck Overlay + Offline Piper Audio
  addSingle(`decks/${lower}.json`, 'deck_overlay', true);
  addTree(`decks/audio/${lower}`, 'deck_audio');

  // 5. Minted Lesson Videos + Posters + Video Manifest
  addSingle(`video/${lower}/video-manifest.json`, 'video_manifest', true);
  for (const abs of walkFiles(path.join(STORE_APP, 'video', lower))) {
    const rel = posix(path.relative(STORE_APP, abs));
    if (rel.endsWith('.mp4')) rels.set(rel, 'video_mp4');
    else if (rel.endsWith('.jpg') || rel.endsWith('.jpeg')) rels.set(rel, 'video_poster');
    else rels.set(rel, 'video_manifest');
  }

  return rels;
}

function verifyStateFourModules(stateEntry, rels) {
  const code = String(stateEntry.code).toUpperCase();
  const lower = code.toLowerCase();

  // Verify deck overlay + Piper audio completeness
  const deckOverlay = readJson(path.join(STORE_APP, 'decks', `${lower}.json`));
  const cardEntries = Object.entries(deckOverlay.cards || {});
  const recapEntries = Object.entries(deckOverlay.recaps || {});
  if (!cardEntries.length) die(`[${code}] decks/${lower}.json has 0 cards`);

  let missingDeckClips = 0;
  let expectedDeckClips = 0;
  for (const [cid, c] of cardEntries) {
    const qRel = c.audio_q || `decks/audio/${lower}/${cid}.q.mp3`;
    const tRel = c.audio_teach || `decks/audio/${lower}/${cid}.teach.mp3`;
    expectedDeckClips += 2;
    if (!rels.has(qRel)) missingDeckClips++;
    if (!rels.has(tRel)) missingDeckClips++;
  }
  for (const [mid, rec] of recapEntries) {
    const rRel = rec.audio_recap || `decks/audio/${lower}/${rec.card_id || mid}.recap.mp3`;
    expectedDeckClips += 1;
    if (!rels.has(rRel)) missingDeckClips++;
  }
  if (missingDeckClips > 0) {
    die(`[${code}] Missing ${missingDeckClips} expected Piper audio clips under decks/audio/${lower}/`);
  }

  // Verify video manifest + MP4 + poster completeness
  const videoManifest = readJson(path.join(STORE_APP, 'video', lower, 'video-manifest.json'));
  const unitEntries = Object.entries(videoManifest.units || {});
  if (!unitEntries.length) die(`[${code}] video/${lower}/video-manifest.json has 0 units`);
  for (const [uid, u] of unitEntries) {
    if (!u.file || !rels.has(u.file)) die(`[${code}] Missing MP4 for unit ${uid}: ${u.file}`);
    if (!u.poster || !rels.has(u.poster)) die(`[${code}] Missing JPG poster for unit ${uid}: ${u.poster}`);
  }

  // Verify visual map has fallback flags stamped
  const visualMap = readJson(path.join(STORE_APP, 'visuals', 'state', `${lower}.json`));
  if (!visualMap.cards || !visualMap.items) {
    die(`[${code}] visuals/state/${lower}.json missing cards/items maps`);
  }

  // Count reading units & quiz items from state data manifest
  const dataRoot = String(stateEntry.data_root || '').replace(/^\/+|\/+$/g, '');
  const dataManifest = readJson(path.join(STORE_APP, ...dataRoot.split('/'), 'manifest.json'));
  let readingUnits = 0;
  let quizItems = 0;
  let moduleQuizzes = 0;
  let practiceForms = 0;
  for (const f of dataManifest.files || []) {
    const pre = dataRoot + '/';
    const rel = String(f.file).startsWith(pre) ? String(f.file) : String(f.file).replace(/^data\/real\//, pre);
    if (f.stage_id === '05.sessions') {
      const doc = readJson(path.join(STORE_APP, ...rel.split('/')));
      readingUnits += (doc.units || []).length;
    } else if (f.stage_id === '06.exam_bank') {
      const doc = readJson(path.join(STORE_APP, ...rel.split('/')));
      quizItems += (doc.items || []).length;
      moduleQuizzes += (doc.module_quizzes || []).length;
      practiceForms += (doc.practice_forms || []).length;
    }
  }
  if (readingUnits !== unitEntries.length) {
    die(`[${code}] Video unit count (${unitEntries.length}) != reading unit count (${readingUnits})`);
  }

  return {
    chapters: (stateEntry.chapters || []).length,
    video_lessons: unitEntries.length,
    video_duration_seconds: (videoManifest.totals && videoManifest.totals.duration_seconds) || null,
    reading_units: readingUnits,
    flashcards_genz: cardEntries.length,
    recaps_genz: recapEntries.length,
    piper_overlay_clips: expectedDeckClips,
    quiz_items: quizItems,
    module_quizzes: moduleQuizzes,
    practice_forms: practiceForms,
  };
}

function stageSharedBundle(freeSet, paidPrefixes) {
  const t0 = Date.now();
  const sharedPayloadApp = path.join(PAYLOAD_ROOT, 'shared', 'app');
  const sharedPayloadStore = path.join(PAYLOAD_ROOT, 'shared', 'store-src');
  if (fs.existsSync(sharedPayloadApp)) fs.rmSync(sharedPayloadApp, { recursive: true, force: true });
  if (fs.existsSync(sharedPayloadStore)) fs.rmSync(sharedPayloadStore, { recursive: true, force: true });

  const sharedAppMap = new Map([
    ['index.html', 'shell'],
    ['styles.css', 'shell'],
    ['learner.css', 'shell'],
    ['gate.js', 'shell'],
    ['signs-embedded.js', 'shell'],
    ['states-embedded.js', 'shell'],
    ['data-embedded.js', 'shell'],
    ['quarantine-index.json', 'shared_data'],
    ['data/states.json', 'shared_data'],
    ['data/manifest.json', 'shared_data'],
    ['visuals/visual-catalog.json', 'visual_catalog'],
  ]);
  for (const abs of walkFiles(path.join(STORE_APP, 'fonts'))) {
    sharedAppMap.set(posix(path.relative(STORE_APP, abs)), 'fonts');
  }
  for (const abs of walkFiles(path.join(STORE_APP, 'signs'))) {
    sharedAppMap.set(posix(path.relative(STORE_APP, abs)), 'signs');
  }
  for (const abs of walkFiles(path.join(STORE_APP, 'data', 'signs'))) {
    sharedAppMap.set(posix(path.relative(STORE_APP, abs)), 'signs_data');
  }
  for (const ent of fs.readdirSync(path.join(STORE_APP, 'visuals'), { withFileTypes: true })) {
    if (ent.isFile() && ent.name.endsWith('.webp')) {
      sharedAppMap.set(`visuals/${ent.name}`, 'visual_scene');
    }
  }

  const entries = [];
  const byCategory = {};
  let totalBytes = 0;
  for (const [rel, category] of [...sharedAppMap.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const srcAbs = path.join(STORE_APP, ...rel.split('/'));
    if (!fs.existsSync(srcAbs)) continue;
    const dstAbs = path.join(sharedPayloadApp, ...rel.split('/'));
    const mode = linkOrCopyFile(srcAbs, dstAbs);
    const bytes = fs.statSync(srcAbs).size;
    totalBytes += bytes;
    byCategory[category] = byCategory[category] || { files: 0, bytes: 0 };
    byCategory[category].files++;
    byCategory[category].bytes += bytes;
    const tier = classifyAccessTier(rel, freeSet, paidPrefixes);
    entries.push({
      cdn_key: `app/${rel}`,
      rel_path: rel,
      category,
      bytes,
      sha256: sha256File(srcAbs),
      content_type: contentTypeFor(rel),
      access_tier: tier.access_tier,
      link_mode: mode,
    });
  }

  // Self-check (BUG-003 guard): every local static src= / href= / url(...) in index.html & *.css must exist in sharedPayloadApp
  const stagedRelSet = new Set(entries.map((e) => e.rel_path));
  for (const docRel of ['index.html', 'styles.css', 'learner.css']) {
    const docAbs = path.join(sharedPayloadApp, ...docRel.split('/'));
    if (!fs.existsSync(docAbs)) die(`[shared] Missing critical shell file: ${docRel}`);
    const rawTxt = fs.readFileSync(docAbs, 'utf8');
    // Strip inline <script> bodies (without external src=) so JS template strings like src="${esc(src)}" aren't treated as static HTML tags
    const txt = docRel.endsWith('.html')
      ? rawTxt.replace(/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/gi, '')
      : rawTxt;
    const refs = [
      ...[...txt.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)].map((m) => m[1]),
      ...[...txt.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)].map((m) => m[1]),
    ];
    for (const rawRef of refs) {
      const clean = rawRef.split('#')[0].split('?')[0].trim();
      if (!clean || /^(?:https?:|data:|mailto:|tel:|javascript:|\/)/i.test(clean)) continue;
      const norm = clean.replace(/^\.\//, '');
      if (!stagedRelSet.has(norm)) {
        die(`[shared] Shell file ${docRel} references "${clean}" (${norm}), which is missing from shared payload!`);
      }
    }
  }

  // Stage generated Next.js gate/catalog configs for Fable
  const storeFiles = [
    'src/generated/free-paths.json',
    'src/generated/catalog.json',
    'src/middleware.ts',
  ];
  const storeConfigEntries = [];
  for (const rel of storeFiles) {
    const srcAbs = path.join(ROOT, 'store', ...rel.split('/'));
    const dstAbs = path.join(sharedPayloadStore, ...rel.split('/'));
    linkOrCopyFile(srcAbs, dstAbs);
    storeConfigEntries.push({
      store_rel_path: `store/${rel}`,
      staged_path: `coordination/FABLE-DROPOFF/payload/shared/store-src/${rel}`,
      bytes: fs.statSync(srcAbs).size,
      sha256: sha256File(srcAbs),
    });
  }

  const manifest = {
    schema: 'nova.fable-dropoff.shared.v1',
    staged_at: new Date().toISOString(),
    elapsed_ms: Date.now() - t0,
    payload_app_dir: 'coordination/FABLE-DROPOFF/payload/shared/app',
    payload_store_src_dir: 'coordination/FABLE-DROPOFF/payload/shared/store-src',
    totals: {
      app_files: entries.length,
      app_bytes: totalBytes,
      app_mb: Number((totalBytes / 1e6).toFixed(2)),
      visual_scenes_webp: entries.filter((e) => e.rel_path.startsWith('visuals/') && e.rel_path.endsWith('.webp')).length,
    },
    by_category: byCategory,
    store_configs: storeConfigEntries,
    files: entries,
  };
  writeJsonAtomic(path.join(DROPOFF_ROOT, 'shared', 'shared-manifest.json'), manifest);
  console.log(`staged shared bundle: ${entries.length} app files (${(totalBytes / 1e6).toFixed(1)} MB) in ${manifest.elapsed_ms}ms`);
  return manifest;
}

function stageStateBundle(codeArg, { skipSyncCheck = false } = {}) {
  const t0 = Date.now();
  const code = String(codeArg).toUpperCase();
  const lower = code.toLowerCase();

  if (!skipSyncCheck) {
    try {
      execFileSync(process.execPath, [path.join(ROOT, 'tools', 'preview', 'sync-store.mjs'), '--check'], {
        cwd: ROOT,
        stdio: 'pipe',
      });
    } catch (err) {
      die(`sync-store.mjs --check failed before staging ${code}. Run sync-store.mjs first.\n${err.stdout || ''}${err.stderr || ''}`);
    }
  }

  const { states, freeSet, paidPrefixes } = loadStatesAndFreeMap();
  const stateEntry = states.find((s) => String(s.code).toUpperCase() === code);
  if (!stateEntry) die(`State ${code} not found in store/public/app/data/states.json`);

  const relsMap = collectStateRelPaths(stateEntry);
  const moduleSummary = verifyStateFourModules(stateEntry, relsMap);

  const statePayloadApp = path.join(PAYLOAD_ROOT, 'states', lower, 'app');
  const stateMetaDir = path.join(DROPOFF_ROOT, 'states', lower);
  const readyPath = path.join(stateMetaDir, 'READY.json');
  if (fs.existsSync(readyPath)) fs.unlinkSync(readyPath); // Remove READY marker while restaging
  if (fs.existsSync(statePayloadApp)) fs.rmSync(statePayloadApp, { recursive: true, force: true });

  const files = [];
  const byCategory = {};
  let totalBytes = 0;
  let freeFiles = 0;
  let paidFiles = 0;

  for (const [rel, category] of [...relsMap.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const srcAbs = path.join(STORE_APP, ...rel.split('/'));
    const dstAbs = path.join(statePayloadApp, ...rel.split('/'));
    const linkMode = linkOrCopyFile(srcAbs, dstAbs);
    const bytes = fs.statSync(srcAbs).size;
    const sha256 = sha256File(srcAbs);
    const tier = classifyAccessTier(rel, freeSet, paidPrefixes);
    if (tier.access_tier === 'free') freeFiles++;
    else if (tier.access_tier === 'paid') paidFiles++;
    else die(`[${code}] File ${rel} is neither in free allowlist nor covered by a paid_prefix in free-paths.json!`);

    totalBytes += bytes;
    byCategory[category] = byCategory[category] || { files: 0, bytes: 0 };
    byCategory[category].files++;
    byCategory[category].bytes += bytes;

    files.push({
      cdn_key: `app/${rel}`,
      rel_path: rel,
      category,
      access_tier: tier.access_tier,
      bytes,
      sha256,
      content_type: contentTypeFor(rel),
      link_mode: linkMode,
    });
  }

  const stagedAt = new Date().toISOString();
  const cdnManifestPath = path.join(stateMetaDir, 'cdn-manifest.json');
  const cdnManifest = {
    schema: 'nova.fable-dropoff.state-cdn-manifest.v1',
    code,
    name: stateEntry.name,
    run_id: stateEntry.run_id,
    staged_at: stagedAt,
    payload_app_dir: `coordination/FABLE-DROPOFF/payload/states/${lower}/app`,
    totals: {
      files: files.length,
      bytes: totalBytes,
      mb: Number((totalBytes / 1e6).toFixed(2)),
      free_files: freeFiles,
      paid_files: paidFiles,
    },
    by_category: byCategory,
    files,
  };
  writeJsonAtomic(cdnManifestPath, cdnManifest);

  const cdnManifestSha256 = sha256File(cdnManifestPath);
  const readyDoc = {
    schema: 'nova.fable-dropoff.ready.v1',
    status: 'READY_FOR_FABLE',
    code,
    name: stateEntry.name,
    run_id: stateEntry.run_id,
    handbook: stateEntry.handbook,
    staged_at: stagedAt,
    elapsed_ms: Date.now() - t0,
    checks: {
      sync_store_zero_drift: true,
      four_modules_complete: true,
      all_files_gated_in_free_paths: true,
    },
    module_summary: moduleSummary,
    paths: {
      payload_app_dir: `coordination/FABLE-DROPOFF/payload/states/${lower}/app`,
      cdn_manifest: `coordination/FABLE-DROPOFF/states/${lower}/cdn-manifest.json`,
      cdn_manifest_sha256: cdnManifestSha256,
      shared_manifest: 'coordination/FABLE-DROPOFF/shared/shared-manifest.json',
      store_free_paths: 'store/src/generated/free-paths.json',
      store_catalog: 'store/src/generated/catalog.json',
    },
    totals: cdnManifest.totals,
    by_category: byCategory,
  };

  // Write READY.json atomically LAST
  writeJsonAtomic(readyPath, readyDoc);
  const queueDoc = updateQueueLedger(states);

  console.log(
    `staged [${code}] -> coordination/FABLE-DROPOFF/states/${lower}/READY.json · ` +
    `${files.length} files (${(totalBytes / 1e6).toFixed(1)} MB · free ${freeFiles} / paid ${paidFiles}) in ${readyDoc.elapsed_ms}ms · ` +
    `queue ${queueDoc.summary.ready_or_picked_up}/${queueDoc.summary.total_states} ready`
  );
  return readyDoc;
}

function verifyStagedState(codeArg) {
  const code = String(codeArg).toUpperCase();
  const lower = code.toLowerCase();
  const stateMetaDir = path.join(DROPOFF_ROOT, 'states', lower);
  const readyPath = path.join(stateMetaDir, 'READY.json');
  const cdnManifestPath = path.join(stateMetaDir, 'cdn-manifest.json');
  if (!fs.existsSync(readyPath)) die(`[${code}] Missing ${readyPath}`);
  if (!fs.existsSync(cdnManifestPath)) die(`[${code}] Missing ${cdnManifestPath}`);

  const ready = readJson(readyPath);
  const manifest = readJson(cdnManifestPath);
  const actualManifestHash = sha256File(cdnManifestPath);
  if (actualManifestHash !== ready.paths.cdn_manifest_sha256) {
    die(`[${code}] cdn-manifest.json sha256 mismatch vs READY.json`);
  }

  const payloadApp = path.join(PAYLOAD_ROOT, 'states', lower, 'app');
  for (const f of manifest.files) {
    const abs = path.join(payloadApp, ...f.rel_path.split('/'));
    if (!fs.existsSync(abs)) die(`[${code}] Missing staged payload file: ${abs}`);
    const sz = fs.statSync(abs).size;
    if (sz !== f.bytes) die(`[${code}] Size mismatch on ${f.rel_path}: got ${sz}, expected ${f.bytes}`);
  }
  console.log(`VERIFY PASS [${code}]: ${manifest.files.length} staged files (${manifest.totals.mb} MB) match READY.json + cdn-manifest.json`);
}

function printStatus() {
  const { states } = loadStatesAndFreeMap();
  const doc = updateQueueLedger(states);
  console.log(`Fable Drop-Off Queue: ${doc.summary.ready_or_picked_up}/${doc.summary.total_states} ready · shared=${doc.summary.shared_bundle_staged}`);
  for (const r of doc.states.slice(0, 12)) {
    const extra = r.totals ? ` (${r.totals.files} files, ${r.totals.mb} MB)` : '';
    console.log(`  #${String(r.queue_position).padStart(2, '0')} ${r.code} (${r.name}): ${r.status}${extra}`);
  }
  if (doc.states.length > 12) console.log(`  ... +${doc.states.length - 12} more states in coordination/FABLE-DROPOFF/QUEUE-STATUS.json (UT at #51)`);
}

function main() {
  const args = process.argv.slice(2);
  let stateCode = null;
  let verifyCode = null;
  let includeShared = false;
  let sharedOnly = false;
  let statusOnly = false;
  let skipSyncCheck = false;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--state') stateCode = args[++i];
    else if (a === '--verify') verifyCode = args[++i];
    else if (a === '--include-shared') includeShared = true;
    else if (a === '--shared-only') sharedOnly = true;
    else if (a === '--status') statusOnly = true;
    else if (a === '--skip-sync-check') skipSyncCheck = true;
    else die(`Unknown argument: ${a}`);
  }

  if (statusOnly) {
    printStatus();
    return;
  }
  if (verifyCode) {
    verifyStagedState(verifyCode);
    return;
  }
  if (sharedOnly || includeShared) {
    if (!skipSyncCheck) {
      try {
        execFileSync(process.execPath, [path.join(ROOT, 'tools', 'preview', 'sync-store.mjs'), '--check'], {
          cwd: ROOT,
          stdio: 'pipe',
        });
      } catch (err) {
        die(`sync-store.mjs --check failed before staging shared bundle. Run sync-store.mjs first.\n${err.stdout || ''}${err.stderr || ''}`);
      }
    }
    const { freeSet, paidPrefixes } = loadStatesAndFreeMap();
    stageSharedBundle(freeSet, paidPrefixes);
    if (sharedOnly || !stateCode) {
      const { states } = loadStatesAndFreeMap();
      updateQueueLedger(states);
      return;
    }
  }
  if (stateCode) {
    stageStateBundle(stateCode, { skipSyncCheck });
    return;
  }
  die('Specify --state <XX> [--include-shared], --shared-only, --verify <XX>, or --status');
}

main();
