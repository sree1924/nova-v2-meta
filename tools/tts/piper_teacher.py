"""piper_teacher.py - teacher-tone narration with Piper (free, offline). 2026-10-29.

Piper's built-in --sentence-silence clipped heavily in piper-tts 1.4.2 (about 8,800 full-scale samples per 40 s clip,
heard as buzz). This script synthesizes ONE SENTENCE AT A TIME at natural pace, inserts true silence between sentences,
applies a little headroom, and refuses to write a file that clips.

  python tools/tts/piper_teacher.py --text-file in.txt --out out.wav [--model en_US-amy-medium.onnx]
         [--length 1.0] [--pause 0.6] [--gain 0.9]
"""
import argparse, array, re, sys, wave
from piper import PiperVoice, SynthesisConfig

p = argparse.ArgumentParser()
p.add_argument('--text-file', required=True)
p.add_argument('--out', required=True)
p.add_argument('--model', default='D:/nova/samples/piper-demo/en_US-amy-medium.onnx')
p.add_argument('--length', type=float, default=1.0)   # 1.0 = natural pace; >1.1 sounds buzzy/stretched
p.add_argument('--noise', type=float, default=0.667)
p.add_argument('--noise-w', type=float, default=0.8)
p.add_argument('--pause', type=float, default=0.6)    # seconds of silence after each sentence (teacher beat)
p.add_argument('--gain', type=float, default=0.9)     # headroom below full scale
a = p.parse_args()

text = open(a.text_file, encoding='utf-8').read().strip()
sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if s.strip()]
voice = PiperVoice.load(a.model)
rate = voice.config.sample_rate
cfg = SynthesisConfig(length_scale=a.length, noise_scale=a.noise, noise_w_scale=a.noise_w, normalize_audio=False, volume=1.0)

pcm = array.array('h')
silence = array.array('h', [0] * int(rate * a.pause))
for s in sentences:
    for chunk in voice.synthesize(s, syn_config=cfg):
        pcm.frombytes(chunk.audio_int16_bytes)
    pcm.extend(silence)

peak = max((abs(x) for x in pcm), default=0) or 1
scale = min(1.0, (32767 * a.gain) / peak)            # bring the loudest sample to gain x full scale, never boost
out = array.array('h', (int(x * scale) for x in pcm))
clipped = sum(1 for x in out if abs(x) >= 32000)
if clipped:
    sys.exit(f'REFUSED: {clipped} clipped samples after gain; lower --gain')
with wave.open(a.out, 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate); w.writeframes(out.tobytes())
print(f'{a.out}: {len(sentences)} sentences, {len(out) / rate:.1f} s, peak {max(abs(x) for x in out)}, clipped 0')
