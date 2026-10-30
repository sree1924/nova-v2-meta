"""piper-tts.py - Piper batch engine with the same CLI/JSONL contract as D:/nova/tools/tts/kokoro-tts.py, so the mint
orchestrator can drive it unchanged (tools/tts/mint-piper-audio.mjs). Founder pick 2026-10-30: Piper en_US-amy-medium,
"brisk" teacher settings, for all states before the hackathon; Kokoro replaces it later.

Per clip: one sentence at a time (Piper's built-in --sentence-silence clips in piper-tts 1.4.2), true silence between
sentences, headroom gain, refuse any clip that clips, mono MP3 via ffmpeg. One process loads the voice once.

  python tools/tts/piper-tts.py --batch jobs.jsonl [--voice D:/nova/samples/piper-demo/en_US-amy-medium.onnx]
         [--speed 1.08] [--pause 0.35] [--gain 0.9] [--bitrate 48k] [--ffmpeg <path>]
  jobs.jsonl lines: {"id","text","out"}   ->   stdout lines: {"id","out","status","bytes","duration_s","gen_s","sentences","peak","clipped"}
"""
import argparse, array, json, os, re, subprocess, sys, time
from piper import PiperVoice, SynthesisConfig

DEFAULT_VOICE = 'D:/nova/samples/piper-demo/en_US-amy-medium.onnx'
DEFAULT_FFMPEG = 'D:/nova/video-studio/node_modules/ffmpeg-static/ffmpeg.exe'
NOISE, NOISE_W = 0.65, 0.75  # "brisk" teacher settings (amy-teacher-brisk.wav, 2026-10-29)

_voices = {}
def get_voice(path):
    if path not in _voices:
        _voices[path] = PiperVoice.load(path)
    return _voices[path]

def synthesize(voice, text, length, pause, gain):
    rate = voice.config.sample_rate
    cfg = SynthesisConfig(length_scale=length, noise_scale=NOISE, noise_w_scale=NOISE_W, normalize_audio=False, volume=1.0)
    sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text.strip()) if s.strip()] or [text.strip()]
    pcm = array.array('h')
    silence = array.array('h', [0] * int(rate * pause))
    for i, s in enumerate(sentences):
        for chunk in voice.synthesize(s, syn_config=cfg):
            pcm.frombytes(chunk.audio_int16_bytes)
        if i < len(sentences) - 1:
            pcm.extend(silence)
    peak = max((abs(x) for x in pcm), default=0) or 1
    scale = min(1.0, (32767 * gain) / peak)
    out = array.array('h', (int(x * scale) for x in pcm))
    clipped = sum(1 for x in out if abs(x) >= 32000)
    if clipped:
        raise RuntimeError(f'{clipped} clipped samples after gain')
    return out, rate, len(sentences)

def write_audio(pcm, rate, out_path, bitrate, ffmpeg):
    os.makedirs(os.path.dirname(out_path) or '.', exist_ok=True)
    if out_path.lower().endswith('.wav'):
        import wave
        with wave.open(out_path, 'wb') as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate); w.writeframes(pcm.tobytes())
    else:
        cmd = [ffmpeg, '-y', '-loglevel', 'error', '-f', 's16le', '-ar', str(rate), '-ac', '1', '-i', 'pipe:0', '-b:a', bitrate, out_path]
        r = subprocess.run(cmd, input=pcm.tobytes(), capture_output=True)
        if r.returncode != 0:
            raise RuntimeError('ffmpeg: ' + r.stderr.decode('utf8', 'replace')[-300:])
    return os.path.getsize(out_path)

def main():
    p = argparse.ArgumentParser(description='Piper teacher TTS (batch, kokoro-tts.py-compatible CLI)')
    p.add_argument('--batch'); p.add_argument('--text'); p.add_argument('--text-file'); p.add_argument('--out')
    p.add_argument('--voice', default=DEFAULT_VOICE, help='path to a Piper .onnx voice')
    p.add_argument('--speed', type=float, default=1.08, help='Piper length_scale (1.08 = brisk)')
    p.add_argument('--pause', type=float, default=0.35)
    p.add_argument('--gain', type=float, default=0.9)
    p.add_argument('--bitrate', default='48k')
    p.add_argument('--threads', type=int, default=0, help='accepted for CLI compatibility; unused')
    p.add_argument('--ffmpeg', default=DEFAULT_FFMPEG)
    a = p.parse_args()
    voice_path = a.voice if a.voice.endswith('.onnx') else DEFAULT_VOICE  # the orchestrator may pass a voice NAME
    if a.batch:
        voice = get_voice(voice_path)
        for line in open(a.batch, encoding='utf-8'):
            if not line.strip():
                continue
            job = json.loads(line); jid = job.get('id'); out_path = job.get('out')
            t0 = time.time()
            try:
                pcm, rate, n = synthesize(voice, job.get('text') or '', a.speed, a.pause, a.gain)
                size = write_audio(pcm, rate, out_path, job.get('bitrate') or a.bitrate, a.ffmpeg)
                print(json.dumps({'id': jid, 'out': out_path, 'status': 'rendered', 'bytes': size, 'duration_s': round(len(pcm) / rate, 2),
                                  'gen_s': round(time.time() - t0, 2), 'sentences': n, 'peak': round(max(abs(x) for x in pcm) / 32767, 3), 'clipped': 0}), flush=True)
            except Exception as exc:
                print(json.dumps({'id': jid, 'out': out_path, 'status': 'failed', 'error': str(exc)[:300]}), flush=True)
        return
    if not a.out or not (a.text or a.text_file):
        p.error('Provide --batch <jobs.jsonl> OR --out <file> with --text/--text-file')
    text = a.text or open(a.text_file, encoding='utf-8').read()
    pcm, rate, n = synthesize(get_voice(voice_path), text, a.speed, a.pause, a.gain)
    size = write_audio(pcm, rate, a.out, a.bitrate, a.ffmpeg)
    print(f'{a.out}: {n} sentences, {len(pcm) / rate:.1f} s, {size} bytes, clipped 0')

if __name__ == '__main__':
    main()
