"""kokoro_teacher.py - teacher-tone narration with Kokoro-82M (free, offline). Mirrors tools/tts/piper_teacher.py so the
two engines compare like for like: one sentence at a time, true silence between sentences, headroom, refuse to write
a clipped file, and report speed so a 51-state run can be estimated.

Setup (once):  pip install kokoro soundfile    (Windows also needs espeak-ng installed for out-of-dictionary words)
Run:           python tools/tts/kokoro_teacher.py --text-file tts-samples/sample-text.txt --out tts-samples/kokoro-af_heart-0.95.wav --voice af_heart --speed 0.95
"""
import argparse, re, sys, time
import numpy as np
import soundfile as sf
from kokoro import KPipeline

p = argparse.ArgumentParser()
p.add_argument('--text-file', required=True)
p.add_argument('--out', required=True)
p.add_argument('--voice', default='af_heart')   # American English female voices start af_, male am_; British bf_/bm_
p.add_argument('--speed', type=float, default=0.95)
p.add_argument('--pause', type=float, default=0.6)  # seconds of silence after each sentence (teacher beat)
p.add_argument('--gain', type=float, default=0.9)   # loudest sample = gain x full scale; never boost quiet audio
a = p.parse_args()

RATE = 24000  # Kokoro output sample rate
text = open(a.text_file, encoding='utf-8').read().strip()
sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if s.strip()]
pipe = KPipeline(lang_code=a.voice[0])  # 'a' = American English, 'b' = British English

t0 = time.time()
parts = []
silence = np.zeros(int(RATE * a.pause), dtype=np.float32)
for s in sentences:
    for _, _, audio in pipe(s, voice=a.voice, speed=a.speed):
        parts.append(np.asarray(audio, dtype=np.float32))
    parts.append(silence)
pcm = np.concatenate(parts) if parts else np.zeros(1, dtype=np.float32)
elapsed = time.time() - t0

peak = float(np.max(np.abs(pcm))) or 1.0
pcm = pcm * min(1.0, a.gain / peak)
clipped = int(np.sum(np.abs(pcm) >= 0.98))
if clipped:
    sys.exit(f'REFUSED: {clipped} clipped samples; lower --gain')
sf.write(a.out, pcm, RATE, subtype='PCM_16')
dur = len(pcm) / RATE
print(f'{a.out}: voice {a.voice} speed {a.speed} | {len(sentences)} sentences, {dur:.1f} s audio, '
      f'{elapsed:.1f} s to generate (x{dur / max(elapsed, 1e-6):.1f} real time), peak {np.max(np.abs(pcm)):.3f}, clipped 0')
