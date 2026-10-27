// Local PDF inspector for Role 15 (tool-assisted, no model, no network).
// Dependency-free: parses page tree + content streams with node:zlib only.
// Text decoding resolves each font through its embedded ToUnicode CMap
// (exact for Identity-H composite + subset TrueType fonts); fonts without a
// CMap fall back to WinAnsi and are flagged per page.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

export function sha256Bytes(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

// Decode a PDF literal string body (contents between parens, escapes resolved)
// or hex string body (contents between <>) to a JS string via WinAnsi->Unicode
// approximation (Latin-1 mapping; correct for ASCII + Western punctuation).
function decodeLiteral(body) {
  let out = '';
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c !== '\\') { out += c; continue; }
    const n = body[++i];
    if (n === 'n') out += '\n';
    else if (n === 'r') out += '\r';
    else if (n === 't') out += '\t';
    else if (n === 'b') out += '\b';
    else if (n === 'f') out += '\f';
    else if (n === '(' || n === ')' || n === '\\') out += n;
    else if (n >= '0' && n <= '7') {
      const oct = body.slice(i, i + 3).match(/^[0-7]{1,3}/)[0];
      out += String.fromCharCode(parseInt(oct, 8));
      i += oct.length - 1;
    } else out += n;
  }
  // Latin-1 bytes -> JS string chars 1:1 is what Buffer.toString('latin1') gives
  // callers on already-latin1 strings; keep as-is.
  return out;
}

function decodeHex(body) {
  const clean = body.replace(/\s+/g, '');
  const even = clean.length % 2 ? clean + '0' : clean;
  let out = '';
  for (let i = 0; i < even.length; i += 2) out += String.fromCharCode(parseInt(even.slice(i, i + 2), 16));
  return out;
}

// ---- ToUnicode CMap decoding (exact route for Identity-H + subset fonts) ----
export function parseToUnicode(cmapText) {
  const map = new Map();
  const dstToString = (hex) => {
    const units = [];
    for (let i = 0; i + 4 <= hex.length; i += 4) units.push(parseInt(hex.slice(i, i + 4), 16));
    // Fold UTF-16 surrogate pairs into code points.
    const points = [];
    for (let i = 0; i < units.length; i++) {
      const u = units[i];
      if (u >= 0xD800 && u <= 0xDBFF && i + 1 < units.length) {
        const v = units[i + 1];
        if (v >= 0xDC00 && v <= 0xDFFF) { points.push(0x10000 + ((u - 0xD800) << 10) + (v - 0xDC00)); i++; continue; }
      }
      points.push(u);
    }
    return String.fromCodePoint(...points);
  };
  const bfchar = /beginbfchar([\s\S]*?)endbfchar/g;
  let m;
  while ((m = bfchar.exec(cmapText)) !== null) {
    const row = /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g;
    let r;
    while ((r = row.exec(m[1])) !== null) map.set(parseInt(r[1], 16), dstToString(r[2]));
  }
  const bfrange = /beginbfrange([\s\S]*?)endbfrange/g;
  while ((m = bfrange.exec(cmapText)) !== null) {
    const row = /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*(?:<([0-9A-Fa-f]+)>|\[([^\]]*)\])/g;
    let r;
    while ((r = row.exec(m[1])) !== null) {
      const lo = parseInt(r[1], 16); const hi = parseInt(r[2], 16);
      if (r[3] !== undefined) {
        const startUnits = r[3].match(/.{1,4}/g).map(h => parseInt(h, 16));
        for (let c = lo; c <= hi; c++) {
          const u = startUnits.map(x => x + (c - lo));
          map.set(c, String.fromCodePoint(...u.map(x => (x >= 0xD800 && x <= 0xDFFF) ? 0xFFFD : x)));
        }
      } else {
        const dsts = [...r[4].matchAll(/<([0-9A-Fa-f]+)>/g)].map(x => dstToString(x[1]));
        for (let c = lo; c <= hi && (c - lo) < dsts.length; c++) map.set(c, dsts[c - lo]);
      }
    }
  }
  return map;
}

// Unescape a PDF literal string into raw byte values.
export function literalBytes(body) {
  const bytes = [];
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c !== '\\') { bytes.push(body.charCodeAt(i) & 0xFF); continue; }
    const n = body[++i];
    if (n === 'n') bytes.push(10);
    else if (n === 'r') bytes.push(13);
    else if (n === 't') bytes.push(9);
    else if (n === 'b') bytes.push(8);
    else if (n === 'f') bytes.push(12);
    else if (n === '(' || n === ')' || n === '\\') bytes.push(n.charCodeAt(0));
    else if (n >= '0' && n <= '7') {
      const oct = body.slice(i, i + 3).match(/^[0-7]{1,3}/)[0];
      bytes.push(parseInt(oct, 8) & 0xFF);
      i += oct.length - 1;
    } else if (n === '\r' && body[i + 1] === '\n') { i++; }
    else if (n === '\r' || n === '\n') { /* line continuation: no bytes */ }
    else bytes.push(n.charCodeAt(0) & 0xFF);
  }
  return bytes;
}

export function hexBytes(body) {
  const clean = body.replace(/\s+/g, '');
  const even = clean.length % 2 ? clean + '0' : clean;
  const bytes = [];
  for (let i = 0; i < even.length; i += 2) bytes.push(parseInt(even.slice(i, i + 2), 16));
  return bytes;
}

// Decode raw bytes through a font: composite (Identity-H) fonts consume
// 2-byte big-endian codes, simple fonts 1-byte codes, both resolved through
// the font's ToUnicode map when present, else WinAnsi (latin1) fallback.
export function decodeBytes(bytes, font) {
  const map = font && font.tounicode;
  const composite = !!(font && font.composite);
  if (composite) {
    // UTF-16BE literal strings in composite fonts start with FE FF.
    let off = 0;
    if (bytes.length >= 2 && bytes[0] === 0xFE && bytes[1] === 0xFF) off = 2;
    let out = '';
    for (let i = off; i + 1 < bytes.length; i += 2) {
      const code = (bytes[i] << 8) | bytes[i + 1];
      if (map && map.has(code)) out += map.get(code);
      else if (code >= 0x20 && code < 0x7F) out += String.fromCharCode(code);
      else out += '�';
    }
    // Odd trailing byte: resolve single.
    if ((bytes.length - off) % 2 === 1) {
      const code = bytes[bytes.length - 1];
      out += (map && map.get(code)) ?? (code >= 0x20 && code < 0x7F ? String.fromCharCode(code) : '�');
    }
    return out;
  }
  return bytes.map(b => (map && map.has(b)) ? map.get(b) : String.fromCharCode(b)).join('');
}

// Extract text-showing fragments from one decompressed content stream.
// fontByResource: Map(resourceName -> {composite, tounicode}); unlisted
// fonts fall back to WinAnsi. Tracks `/Name size Tf` to select the font.
export function extractStreamText(streamLatin1, fontByResource) {
  const fonts = fontByResource ?? new Map();
  const tfEvents = [];
  const tfRe = /\/(\S+?)\s+[\d.]+\s+Tf/g;
  let tm;
  while ((tm = tfRe.exec(streamLatin1)) !== null) tfEvents.push({ at: tm.index, name: tm[1] });
  const token = /(\((?:\\.|[^\\()])*\))\s*(Tj|'|")|<([0-9A-Fa-f\s]*)>\s*Tj|\[((?:[^\[\]]|\[(?:[^\[\]])*\])*)\]\s*TJ/g;
  const parts = [];
  let current = '';
  const fontFor = (at) => {
    let name = null;
    for (const e of tfEvents) { if (e.at < at) name = e.name; else break; }
    return fonts.get(name) ?? null;
  };
  let m;
  while ((m = token.exec(streamLatin1)) !== null) {
    const font = fontFor(m.index);
    if (m[1] !== undefined) {
      const bytes = literalBytes(m[1].slice(1, -1));
      if (m[2] === '"') {
        // " : aw ac string " — two leading number operands are word/char
        // spacing; the string itself decodes normally.
        parts.push(decodeBytes(bytes, font));
      } else {
        parts.push(decodeBytes(bytes, font));
      }
      current = '';
    } else if (m[3] !== undefined) {
      parts.push(decodeBytes(hexBytes(m[3]), font));
    } else if (m[4] !== undefined) {
      const arr = m[4];
      const inner = /(\((?:\\.|[^\\()])*\))|<([0-9A-Fa-f\s]*)>|(-?\d+(?:\.\d+)?)/g;
      let im;
      const chunk = [];
      while ((im = inner.exec(arr)) !== null) {
        if (im[1] !== undefined) chunk.push(decodeBytes(literalBytes(im[1].slice(1, -1)), font));
        else if (im[2] !== undefined) chunk.push(decodeBytes(hexBytes(im[2]), font));
        // kern numbers ignored
      }
      parts.push(chunk.join(' '));
    }
  }
  void current;
  return parts.join('\n');
}

export function extractStreamTextLegacy(streamLatin1) {
  const parts = [];
  // Split balanced literal strings and hex strings preceding Tj/TJ/'/" ops.
  const re = /(\((?:\\.|[^\\()])*\)|<(?:[0-9A-Fa-f\s])*>)|\[([^\]]*)\]\s*TJ|\((?:\\.|[^\\()])*\)\s*Tj|'(?:[^']*)'|"(?:[^"]*)"/g;
  // Simpler robust pass: walk tokens.
  const token = /(\((?:\\.|[^\\()])*\))\s*(Tj|')|<([0-9A-Fa-f\s]*)>\s*Tj|\[((?:[^\[\]]|\[(?:[^\[\]])*\])*)\]\s*TJ/g;
  let m;
  while ((m = token.exec(streamLatin1)) !== null) {
    if (m[1] !== undefined && (m[2] === 'Tj' || m[2] === "'")) {
      parts.push(decodeLiteral(m[1].slice(1, -1)));
    } else if (m[3] !== undefined) {
      parts.push(decodeHex(m[3]));
    } else if (m[4] !== undefined) {
      const arr = m[4];
      const inner = /(\((?:\\.|[^\\()])*\))|<([0-9A-Fa-f\s]*)>/g;
      let im;
      const chunk = [];
      while ((im = inner.exec(arr)) !== null) {
        chunk.push(im[1] !== undefined ? decodeLiteral(im[1].slice(1, -1)) : decodeHex(im[2]));
      }
      parts.push(chunk.join(' '));
    }
  }
  void re;
  return parts.join('\n');
}

function findObjects(latin) {
  const objs = new Map();
  // Non-stream objects only: a dict containing a stream marker belongs to
  // collectStreams, not here (binary payloads may contain "endobj").
  const re = /(\d+)\s+(\d+)\s+obj((?:(?!stream|endobj)[\s\S])*?)endobj/g;
  let m;
  while ((m = re.exec(latin)) !== null) {
    objs.set(`${m[1]} ${m[2]}`, { num: Number(m[1]), gen: Number(m[2]), body: m[3], start: m.index });
  }
  return objs;
}

function streamBytes(buf, objBodyEnd, latin) {
  // Locate `stream\r?\n ... endstream` right after the object dictionary.
  return { latin, buf };
}

// Collect raw (possibly compressed) stream payloads for an object body.
export function collectStreams(buf) {
  const latin = buf.toString('latin1');
  const streams = [];
  // Tempered dict: never span past endobj, so a stream is keyed to its own
  // object. EOL after `stream` may be CRLF, CR, or LF in this file.
  const re = /(\d+)\s+(\d+)\s+obj((?:(?!endobj)[\s\S])*?)stream(?:\r\n|\r|\n)/g;
  let m;
  while ((m = re.exec(latin)) !== null) {
    const dict = m[3];
    const dataStart = m.index + m[0].length;
    const end = latin.indexOf('endstream', dataStart);
    if (end < 0) continue;
    // CRLF before endstream belongs to the EOL marker, strip one trailing CRLF.
    let dataEnd = end;
    if (latin[dataEnd - 1] === '\n') dataEnd--;
    if (latin[dataEnd - 1] === '\r') dataEnd--;
    const raw = buf.subarray(dataStart, dataEnd);
    const isFlate = /\/FlateDecode/.test(dict);
    const isDCT = /\/DCTDecode/.test(dict);
    streams.push({
      obj: `${m[1]} ${m[2]}`,
      dict: dict.slice(-400),
      flate: isFlate,
      image: isDCT || /\/Subtype\s*\/Image/.test(dict),
      raw,
    });
    // Advance past this stream.
    re.lastIndex = end + 9;
  }
  return streams;
}

function inflateIfNeeded(st) {
  if (!st.flate) return st.raw.toString('latin1');
  try {
    return inflateSync(st.raw).toString('latin1');
  } catch {
    return '';
  }
}

// Resolve the page tree in Kids order -> array of page object ids "N G".
export function pageOrder(objs) {
  const pagesObj = [...objs.values()].find(o => /\/Type\s*\/Pages/.test(o.body));
  if (!pagesObj) return [];
  const kids = [];
  const re = /(\d+)\s+(\d+)\s+R/g;
  // Kids array is the first [...] containing R refs inside the Pages object.
  const arr = pagesObj.body.match(/\/Kids\s*\[([\s\S]*?)\]/);
  const src = arr ? arr[1] : pagesObj.body;
  let m;
  while ((m = re.exec(src)) !== null) kids.push(`${Number(m[1])} ${Number(m[2])}`);
  // Recurse into intermediate /Pages nodes.
  const out = [];
  const visit = (id) => {
    const o = objs.get(id);
    if (!o) return;
    if (/\/Type\s*\/Page[^s]/.test(o.body)) { out.push(id); return; }
    const k = o.body.match(/\/Kids\s*\[([\s\S]*?)\]/);
    if (!k) return;
    let mm;
    const rr = /(\d+)\s+(\d+)\s+R/g;
    while ((mm = rr.exec(k[1])) !== null) visit(`${Number(mm[1])} ${Number(mm[2])}`);
  };
  kids.forEach(visit);
  return out;
}

function contentsRefs(pageBody, objs) {
  const m = pageBody.match(/\/Contents\s*(\[([\s\S]*?)\]|(\d+)\s+(\d+)\s*R)/);
  if (!m) return [];
  const refs = [];
  const re = /(\d+)\s+(\d+)\s+R/g;
  let mm;
  if (m[3]) {
    const key = `${Number(m[3])} ${Number(m[4])}`;
    const target = objs ? objs.get(key) : null;
    const body = target ? target.body : '';
    if (/^\s*\[/.test(body)) {
      while ((mm = re.exec(body)) !== null) refs.push(`${Number(mm[1])} ${Number(mm[2])}`);
      return refs;
    }
    return [key];
  }
  while ((mm = re.exec(m[2])) !== null) refs.push(`${Number(mm[1])} ${Number(mm[2])}`);
  return refs;
}

// Objects packed in compressed object streams (/Type/ObjStm). Streams
// themselves are never packed; only plain dictionaries/arrays are.
export function unpackObjStm(inflated, dict) {
  const n = Number((dict.match(/\/N\s+(\d+)/) || [])[1] || 0);
  const first = Number((dict.match(/\/First\s+(\d+)/) || [])[1] || 0);
  if (!n || !first) return [];
  const head = inflated.slice(0, first).trim().split(/\s+/).map(Number);
  const out = [];
  for (let k = 0; k < n; k++) {
    const num = head[k * 2];
    const off = head[k * 2 + 1];
    const nextOff = k + 1 < n ? head[k * 2 + 3] : inflated.length - first;
    if (!Number.isFinite(num) || !Number.isFinite(off)) continue;
    out.push({ num, gen: 0, body: inflated.slice(first + off, first + nextOff), start: -1 });
  }
  return out;
}

// Build font table: object id -> {baseFont, composite, tounicode}.
// ToUnicode streams are resolved from the collected stream payloads.
export function buildFontTable(objs, streamsByObj) {
  const table = new Map();
  for (const [id, o] of objs) {
    if (!/\/Type\s*\/Font/.test(o.body)) continue;
    const base = (o.body.match(/\/BaseFont\s*\/(\S+)/) || [])[1] ?? null;
    const composite = /\/Identity-H/.test(o.body) || /\/Subtype\s*\/Type0/.test(o.body);
    const tu = o.body.match(/\/ToUnicode\s+(\d+)\s+(\d+)\s*R/);
    let tounicode = null;
    if (tu) {
      const raw = streamsByObj.get(`${Number(tu[1])} ${Number(tu[2])}`);
      if (raw) {
        try { tounicode = parseToUnicode(raw); } catch { tounicode = null; }
      }
    }
    table.set(id, { baseFont: base, composite, tounicode, codes: tounicode ? tounicode.size : 0 });
  }
  return table;
}

// Resolve an indirect ref ("N G") through the object map; returns body or null.
function resolveRef(objs, ref) {
  const o = objs.get(ref);
  return o ? o.body : null;
}

// Return the balanced <<...>> dictionary starting at index `from`.
function balancedDict(text, from) {
  let depth = 0;
  let i = from;
  while (i < text.length - 1) {
    if (text[i] === '<' && text[i + 1] === '<') { depth++; i += 2; continue; }
    if (text[i] === '>' && text[i + 1] === '>') {
      depth--;
      i += 2;
      if (depth === 0) return text.slice(from, i);
      continue;
    }
    i++;
  }
  return null;
}

// Parse a /Font resource subdict body (inline <<...>> or indirect) into
// Map(resourceName -> fontObjectId). Balances nested dicts.
function parseFontDict(objs, resBody) {
  let dict = resBody;
  const ref = resBody.match(/^\s*(\d+)\s+(\d+)\s*R\s*$/);
  if (ref) dict = resolveRef(objs, `${Number(ref[1])} ${Number(ref[2])}`) ?? '';
  const at = dict.indexOf('/Font');
  if (at < 0) return new Map();
  const rest = dict.slice(at + 5).trimStart();
  let fontDict = '';
  const ind = rest.match(/^(\d+)\s+(\d+)\s*R/);
  if (ind) fontDict = resolveRef(objs, `${Number(ind[1])} ${Number(ind[2])}`) ?? '';
  else if (rest.startsWith('<<')) fontDict = balancedDict(rest, 0) ?? '';
  const out = new Map();
  const re = /\/(\S+?)\s+(\d+)\s+(\d+)\s*R/g;
  let mm;
  while ((mm = re.exec(fontDict)) !== null) out.set(mm[1], `${Number(mm[2])} ${Number(mm[3])}`);
  return out;
}

// Walk /Parent chain merging /Resources (child wins) for inheritable lookup.
function pageFontResources(objs, pageObj) {
  const chain = [];
  let cur = pageObj;
  const seen = new Set();
  while (cur && !seen.has(cur)) {
    seen.add(cur);
    chain.unshift(cur);
    const p = cur.body.match(/\/Parent\s+(\d+)\s+(\d+)\s*R/);
    cur = p ? objs.get(`${Number(p[1])} ${Number(p[2])}`) ?? null : null;
  }
  const merged = new Map();
  for (const node of chain) {
    const at = node.body.indexOf('/Resources');
    if (at < 0) continue;
    const rest = node.body.slice(at + 10).trimStart();
    let resBody = '';
    const ind = rest.match(/^(\d+)\s+(\d+)\s*R/);
    if (ind) resBody = resolveRef(objs, `${Number(ind[1])} ${Number(ind[2])}`) ?? '';
    else if (rest.startsWith('<<')) resBody = balancedDict(rest, 0) ?? '';
    for (const [k, v] of parseFontDict(objs, resBody)) merged.set(k, v);
  }
  return merged;
}

export function inspectPdf(pdfPath) {
  const buf = readFileSync(pdfPath);
  const latin = buf.toString('latin1');
  const objs = findObjects(latin);
  // Merge ObjStm-packed objects (page Contents arrays/refs often live here).
  try {
    for (const st of collectStreams(buf)) {
      if (!/\/ObjStm/.test(st.dict)) continue;
      let inflated = '';
      try { inflated = inflateSync(st.raw).toString('latin1'); } catch { continue; }
      for (const o of unpackObjStm(inflated, st.dict)) {
        const key = `${o.num} ${o.gen}`;
        if (!objs.has(key)) objs.set(key, o);
      }
    }
  } catch { /* keep direct objects only */ }
  const order = pageOrder(objs);
  // Page count: max /Count on a /Pages node; corroborate with leaf count + regex hits.
  const counts = [...objs.values()]
    .filter(o => /\/Type\s*\/Pages/.test(o.body))
    .map(o => Number(((o.body.match(/\/Count\s+(\d+)/) || [])[1]) || 0));
  const pageCount = Math.max(0, ...counts);
  const leafHits = (latin.match(/\/Type\s*\/Page[^s]/g) || []).length;
  // Map stream object id -> decompressed text (skip images).
  const streams = collectStreams(buf);
  const byObj = new Map();
  for (const st of streams) {
    if (st.image) continue;
    byObj.set(st.obj, inflateIfNeeded(st));
  }
  const fontTable = buildFontTable(objs, byObj);
  const pages = order.map((id, i) => {
    const o = objs.get(id);
    const refs = o ? contentsRefs(o.body, objs) : [];
    const resMap = o ? pageFontResources(objs, o) : new Map();
    const fontByResource = new Map();
    for (const [name, fid] of resMap) {
      const f = fontTable.get(fid);
      if (f) fontByResource.set(name, f);
    }
    const texts = refs
      .map(r => byObj.get(r) ?? '')
      .filter(Boolean)
      .map(t => extractStreamText(t, fontByResource));
    return { page_index: i + 1, obj: id, contents: refs, text: texts.join('\n') };
  });
  // Document /Info metadata (title/author/creator/producer/dates) when present.
  const info = {};
  const trailerInfo = latin.match(/\/Info\s+(\d+)\s+(\d+)\s*R/);
  if (trailerInfo) {
    const io = objs.get(`${Number(trailerInfo[1])} ${Number(trailerInfo[2])}`);
    if (io) {
      for (const k of ['Title', 'Author', 'Creator', 'Producer', 'CreationDate', 'ModDate', 'Subject', 'Keywords']) {
        const mm = io.body.match(new RegExp(`/${k}\\s*\\(((?:\\\\.|[^\\\\()])*)\\)`));
        if (mm) info[k] = decodeLiteral(mm[1]);
      }
    }
  }
  return {
    path: pdfPath,
    sha256: sha256Bytes(buf),
    bytes: buf.length,
    page_count: pageCount,
    page_count_leaf_hits: leafHits,
    page_tree_pages: order.length,
    decoder: 'tounicode-cmap-per-font-winansi-fallback',
    fonts: [...fontTable.entries()].map(([id, f]) => ({ obj: id, baseFont: f.baseFont, composite: f.composite, tounicode_codes: f.codes })),
    info,
    pages,
  };
}

// Search all pages for a case-insensitive pattern; return page + context windows.
export function searchPages(pages, pattern, window = 160) {
  const re = new RegExp(pattern, 'gi');
  const hits = [];
  for (const p of pages) {
    let m;
    re.lastIndex = 0;
    while ((m = re.exec(p.text)) !== null) {
      const start = Math.max(0, m.index - window);
      const end = Math.min(p.text.length, m.index + m[0].length + window);
      hits.push({
        page_index: p.page_index,
        match: m[0],
        context: p.text.slice(start, end).replace(/\s+/g, ' ').trim(),
      });
      if (hits.length > 60) return hits;
    }
  }
  return hits;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) {
  const args = process.argv.slice(2);
  const get = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const pdf = get('--pdf');
  if (!pdf) { console.error('usage: node tools/belt/pdf-text.mjs --pdf <path> [--pages N | N-M] [--search <regex>]'); process.exit(2); }
  const insp = inspectPdf(pdf);
  const search = get('--search');
  const pagesArg = get('--pages');
  let pages = insp.pages;
  if (pagesArg) {
    const mm = pagesArg.match(/^(\d+)(?:-(\d+))?$/);
    const a = Number(mm[1]); const b = Number(mm[2] ?? mm[1]);
    pages = insp.pages.filter(p => p.page_index >= a && p.page_index <= b);
  }
  const out = {
    sha256: insp.sha256,
    bytes: insp.bytes,
    page_count: insp.page_count,
    page_count_leaf_hits: insp.page_count_leaf_hits,
    page_tree_pages: insp.page_tree_pages,
    info: insp.info,
    decoder: insp.decoder,
    fonts: insp.fonts,
    pages: search ? undefined : pages.map(p => ({ page_index: p.page_index, chars: p.text.length, text: p.text })),
    hits: search ? searchPages(insp.pages, search) : undefined,
  };
  console.log(JSON.stringify(out, null, 2));
}
