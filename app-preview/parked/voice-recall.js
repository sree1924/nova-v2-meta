// parked 2026-10-28 — not part of the learner loop; candidate for an onboarding/marketing agent; needs MODEL_API_KEY from .env; never log the key
//
// voice-recall.js — the former flashcard "Say it" spoken-recall feature, moved
// verbatim out of app-preview/index.html (founder decision 2026-10-28 23:20 MDT:
// "no spoken recall on this, just good old memory session, flashcards, test").
// NOT loaded by any page. Browser side only: MediaRecorder capture (<= 10 s),
// 16 kHz mono WAV re-encode, POST to the dev proxy /api/transcribe, lenient
// transcript-vs-answer scoring. The server half (the Meta Voice Transcribe
// proxy) is parked in tools/preview/transcribe-proxy.parked.mjs; that proxy is
// the only place the key is read. This file never sees the key.
// Free identifiers it expects from the host page: store, esc, view.

// ---- progress hook (was next to markDone) ----
export const markVoice = (unitId, cardId, rec) => { const s = store.read(); s.progress = s.progress || {}; s.progress[unitId] = s.progress[unitId] || {}; const v = s.progress[unitId].voice = s.progress[unitId].voice || {}; v[cardId] = rec; store.write(s); };

// ---- Spoken recall ("Say it") ----
export const VOICE_NOTE = "voice is transcribed by Meta Voice Transcribe via a local dev proxy; nothing is stored beyond this browser and the local log";

// number words -> digits so "25" and "twenty five" match each other
const NUM_WORDS = { zero: "0", one: "1", two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7", eight: "8", nine: "9", ten: "10", eleven: "11", twelve: "12", thirteen: "13", fourteen: "14", fifteen: "15", sixteen: "16", seventeen: "17", eighteen: "18", nineteen: "19", twenty: "20", thirty: "30", forty: "40", fifty: "50", sixty: "60", seventy: "70", eighty: "80", ninety: "90" };
function normalizeTokens(s) {
  const toks = String(s || "").toLowerCase().replace(/-/g, " ").replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  const out = [];
  for (let i = 0; i < toks.length; i++) {
    const w = toks[i], n = NUM_WORDS[w];
    if (n !== undefined && Number(n) % 10 === 0 && Number(n) < 100 && NUM_WORDS[toks[i + 1]] !== undefined && Number(NUM_WORDS[toks[i + 1]]) < 10) {
      out.push(String(Number(n) + Number(NUM_WORDS[toks[i + 1]]))); i++;
    } else if (n !== undefined && (toks[i + 1] === "hundred" || toks[i + 1] === "thousand") && Number(n) < 10) {
      out.push(String(Number(n) * (toks[i + 1] === "hundred" ? 100 : 1000))); i++;
    } else if (n !== undefined) {
      out.push(n);
    } else {
      out.push(w);
    }
  }
  return out;
}
// Lenient normalized match: lowercase, punctuation stripped, numbers accepted
// as digits or words. Score = fraction of answer tokens heard; >= 0.6 recalls.
export function voiceMatch(spoken, answer) {
  const a = normalizeTokens(answer), heard = new Set(normalizeTokens(spoken));
  if (!a.length) return { score: 0, recalled: false };
  const score = Math.round((a.filter((t) => heard.has(t)).length / a.length) * 100) / 100;
  return { score, recalled: score >= 0.6 };
}

// Mono 16-bit PCM WAV writer (Meta Voice Transcribe takes 16/24 kHz mono WAV).
function encodeWav(samples, rate) {
  const n = samples.length, bytes = new ArrayBuffer(44 + n * 2), v = new DataView(bytes);
  const wstr = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  wstr(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); wstr(8, "WAVE"); wstr(12, "fmt ");
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  wstr(36, "data"); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([bytes], { type: "audio/wav" });
}
async function resampleToWav16k(decoded) {
  const dur = Math.min(decoded.duration || 0, 10.5);
  if (!(dur > 0)) throw new Error("empty");
  const off = new OfflineAudioContext(1, Math.max(1, Math.ceil(16000 * dur)), 16000);
  const src = off.createBufferSource();
  src.buffer = decoded;
  src.connect(off.destination);
  src.start();
  return encodeWav((await off.startRendering()).getChannelData(0), 16000);
}

// One spoken-recall attempt. Records ≤ 10 s, posts WAV to the dev proxy,
// scores the transcript against cardBack, marks local progress, then calls
// reveal(transcript, score, recalled). Every failure degrades to a message;
// the manual Recall path is never blocked.
export async function recordSayIt(btn, statusEl, cardBack, unitId, cardId, reveal) {
  const say = (t) => { statusEl.hidden = false; statusEl.textContent = t; };
  const endAs = (label, msg) => { delete btn.dataset.busy; btn.disabled = false; btn.textContent = label; if (msg) say(msg); };
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === "undefined") {
    endAs("🎤 Say it — no mic in this browser", "Microphone capture is not available here — use Recall instead. Your manual path is unchanged.");
    return;
  }
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    endAs("🎤 Say it — mic blocked", "Microphone access was denied — use Recall instead. Your manual path is unchanged.");
    return;
  }
  const chunks = [];
  let rec;
  try {
    rec = new MediaRecorder(stream);
  } catch {
    stream.getTracks().forEach((t) => t.stop());
    endAs("🎤 Say it — no mic in this browser", "Recording is not available here — use Recall instead.");
    return;
  }
  rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
  const stopped = new Promise((resolve) => { rec.onstop = resolve; });
  btn.textContent = "⏺ Recording… tap to stop (max 10 s)";
  btn.onclick = (ev) => { ev.preventDefault(); try { rec.stop(); } catch { /* already stopped */ } };
  const timer = setTimeout(() => { try { rec.stop(); } catch { /* already stopped */ } }, 10000);
  say("Listening… speak your answer now.");
  try { rec.start(); } catch { /* fall through to stop handling */ }
  await stopped;
  clearTimeout(timer);
  btn.onclick = null;
  stream.getTracks().forEach((t) => t.stop());
  btn.disabled = true;
  btn.textContent = "🎤 Say it — transcribing…";
  let wav;
  try {
    const blob = new Blob(chunks, { type: (rec.mimeType || "audio/webm").split(";")[0] });
    const raw = await blob.arrayBuffer();
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) throw new Error("no AudioContext");
    const ac = new AC();
    let decoded;
    try { decoded = await ac.decodeAudioData(raw); } finally { try { await ac.close(); } catch { /* no-op */ } }
    wav = await resampleToWav16k(decoded);
  } catch {
    endAs("🎤 Say it — retry", "That recording could not be decoded — try again, or use Recall instead.");
    return;
  }
  let resp;
  try {
    resp = await fetch("/api/transcribe", { method: "POST", headers: { "content-type": "audio/wav" }, body: wav });
  } catch {
    endAs("🎤 Say it — no endpoint", "Transcription endpoint unreachable (is the dev server running?) — use Recall instead.");
    return;
  }
  if (!resp.ok) {
    endAs("🎤 Say it — unavailable", `Transcription unavailable (proxy ${resp.status}) — use Recall instead.`);
    return;
  }
  let transcript = "";
  try { transcript = (await resp.json()).transcript || ""; } catch { /* empty transcript */ }
  const { score, recalled } = voiceMatch(transcript, cardBack);
  try { markVoice(unitId, cardId, { recalled, score, at: new Date().toISOString() }); } catch { /* progress is best-effort */ }
  delete btn.dataset.busy;
  btn.textContent = recalled ? "🎤 Say it — recalled ✓" : "🎤 Say it — missed, see answer";
  say(recalled ? "Heard it — nicely recalled." : "Heard it — compare with the answer below.");
  reveal(transcript, score, recalled);
}

// ---- click wiring (was inside the route() post-render hook) ----
export function wireSayIt(view) {
  view.querySelectorAll("[data-sayit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled || btn.dataset.busy) return;
      btn.dataset.busy = "1";
      const card = btn.closest(".card");
      const statusEl = card.querySelector("[data-sayit-status]");
      const ans = card.querySelector("[data-answer]");
      const recallBtn = card.querySelector("[data-recall]");
      recordSayIt(btn, statusEl, btn.dataset.back || "", btn.dataset.unit || "", btn.dataset.card || "", (transcript, score, recalled) => {
        ans.hidden = false;
        const beat = card.querySelector("[data-beat]");
        if (beat) beat.hidden = true;
        if (recallBtn) { recallBtn.disabled = true; recallBtn.textContent = "Answer shown"; }
        const slot = ans.querySelector("[data-voice-result]");
        if (slot) slot.innerHTML = `<p class="${recalled ? "result-good" : "result-bad"}">You said: “${esc(transcript)}” — match ${score.toFixed(2)} — ${recalled ? "recalled ✓" : "missed"}</p>`;
      }).catch(() => { delete btn.dataset.busy; btn.disabled = false; });
    });
  });
}

// ---- former vCards() markup, kept for reference (template-literal fragments) ----
/*
  <p class="muted">Spoken recall: say your answer aloud with “Say it” (needs the dev server: <code>node tools/preview/serve.mjs</code>) — ${esc(VOICE_NOTE)}.</p>
    <p><button data-recall>Recall, then reveal</button> <button data-sayit data-unit="${esc(unitId)}" data-card="${esc(c.card_id)}" data-back="${esc(c.back)}">🎤 Say it</button> ${cardPlayHtml(c.card_id, sec)}</p>
    <p class="muted" data-sayit-status hidden></p>
    <div data-voice-result></div>
*/
