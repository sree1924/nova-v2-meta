"""piper-tts.py - Zero-cracking, in-RAM MP3 Piper teacher batch & streaming worker engine.

Backward-compatible with kokoro-tts.py CLI (--batch jobs.jsonl, --text/--text-file --out) plus
--worker streaming JSONL mode (stdin -> stdout) for dynamic work-stealing pools.

Anti-cracking / teacher-clarity pipeline:
1. Float32 native synthesis (chunk.audio_float_array) — eliminates double int16 quantization grain.
2. Per-phrase DC-offset removal + 10 ms raised-cosine fade-in & 18 ms raised-cosine fade-out so every
   clause and sentence boundary meets digital zero smoothly (zero boundary clicks/pops).
3. Clause micro-pauses (0.16 s on ';', ':', em-dash in long sentences) + 0.38 s sentence pauses +
   25 ms lead-in / 80 ms tail digital zero pad so MP3 encoder/decoder delay never chops consonants.
4. Pre-TTS spoken-form guard (.08 -> zero point zero eight, 911 -> nine one one, dedup '(one)' stutters).
5. -2.85 dBFS (0.72) true-peak ceiling so lossy MP3 reconstruction never overshoots 0 dBFS in browsers.
6. In-RAM LAME C encoding (lameenc quality=2, 64 kbps mono @ native 22050 Hz) — zero ffmpeg.exe spawns,
   atomic temp-file replace with Windows Defender lock retry.
"""
import argparse, json, os, pathlib, re, subprocess, sys, time
import numpy as np
import onnxruntime as ort
from piper import PiperVoice, SynthesisConfig
from piper.config import PiperConfig
from piper.voice import ESPEAK_DATA_DIR

try:
    import lameenc
except ImportError:
    lameenc = None

DEFAULT_VOICE = 'D:/nova/samples/piper-demo/en_US-amy-medium.onnx'
DEFAULT_FFMPEG = 'D:/nova/video-studio/node_modules/ffmpeg-static/ffmpeg.exe'
NOISE, NOISE_W = 0.60, 0.72  # cleaner VITS voiced frames (less stochastic vocoder grain than 0.667/0.80)

_RE_LEADING_DOT = re.compile(r'(?<![\w\d])\.(\d+)\b')
_RE_911 = re.compile(r'\b9[- ]?1[- ]?1\b')
_RE_PAREN_DUP = re.compile(r'\b([a-z]+(?:[\s-][a-z]+){0,4})\s+\(\1\)', re.IGNORECASE)
_RE_AND_OR = re.compile(r'\band(?:/|\s+)or\b', re.IGNORECASE)
_DIGIT_WORDS = {'0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
                '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine'}


def sanitize_for_tts(text: str) -> str:
    t = (text or '').encode('utf-8', 'ignore').decode('utf-8', 'ignore')
    t = (t.replace('\u2018', "'").replace('\u2019', "'")
          .replace('\u201c', '"').replace('\u201d', '"')
          .replace('\u2026', '...').replace('\u00a0', ' '))
    t = re.sub(r'\s+', ' ', t.strip())
    if not t:
        return ''
    t = _RE_PAREN_DUP.sub(r'\1', t)
    t = _RE_LEADING_DOT.sub(lambda m: 'zero point ' + ' '.join(_DIGIT_WORDS[d] for d in m.group(1)), t)
    t = _RE_911.sub('nine one one', t)
    t = _RE_AND_OR.sub('and, or', t)
    return t


_voices = {}


def get_voice(path: str, threads: int = 2) -> PiperVoice:
    key = (path, threads)
    if key not in _voices:
        cfg_path = f'{path}.json'
        with open(cfg_path, 'r', encoding='utf-8') as f:
            cfg_dict = json.load(f)
        opts = ort.SessionOptions()
        opts.intra_op_num_threads = max(1, int(threads or 2))
        opts.inter_op_num_threads = 1
        opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        sess = ort.InferenceSession(str(path), sess_options=opts, providers=['CPUExecutionProvider'])
        _voices[key] = PiperVoice(
            config=PiperConfig.from_dict(cfg_dict),
            session=sess,
            espeak_data_dir=pathlib.Path(ESPEAK_DATA_DIR),
            download_dir=pathlib.Path.cwd(),
        )
    return _voices[key]


def _smooth_phrase(arr: np.ndarray, rate: int) -> np.ndarray:
    if arr.size == 0:
        return arr
    arr = arr.astype(np.float32, copy=True)
    # Remove any DC offset so silence transitions never step-click
    arr -= float(np.mean(arr))
    fade_in = min(int(rate * 0.010), arr.size // 4)
    fade_out = min(int(rate * 0.018), arr.size // 4)
    if fade_in > 1:
        win_in = 0.5 - 0.5 * np.cos(np.linspace(0.0, np.pi, fade_in, dtype=np.float32))
        arr[:fade_in] *= win_in
    if fade_out > 1:
        win_out = 0.5 + 0.5 * np.cos(np.linspace(0.0, np.pi, fade_out, dtype=np.float32))
        arr[-fade_out:] *= win_out
    return arr


def split_phrases(text: str):
    """Returns list of (phrase_text, pause_after_kind) where kind is 'clause', 'sentence', or 'end'."""
    sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if s.strip()] or [text]
    phrases = []
    for s_idx, sent in enumerate(sentences):
        is_last_sent = (s_idx == len(sentences) - 1)
        if len(sent) > 85:
            clauses = [c.strip() for c in re.split(r'(?<=[;:])\s+|\s+[\u2014\u2013]\s+', sent) if c.strip()]
        else:
            clauses = [sent]
        for c_idx, cl in enumerate(clauses):
            if c_idx < len(clauses) - 1:
                phrases.append((cl, 'clause'))
            elif not is_last_sent:
                phrases.append((cl, 'sentence'))
            else:
                phrases.append((cl, 'end'))
    return phrases


def synthesize(voice: PiperVoice, text: str, length: float, pause: float, gain: float):
    rate = voice.config.sample_rate
    clean_text = sanitize_for_tts(text)
    if not clean_text:
        raise ValueError('empty_narration_text')
    cfg = SynthesisConfig(length_scale=length, noise_scale=NOISE, noise_w_scale=NOISE_W, normalize_audio=False, volume=1.0)
    phrases = split_phrases(clean_text)

    lead_pad = np.zeros(int(rate * 0.025), dtype=np.float32)
    tail_pad = np.zeros(int(rate * 0.080), dtype=np.float32)
    sent_sil = np.zeros(int(rate * pause), dtype=np.float32)
    clause_sil = np.zeros(int(rate * min(0.16, pause * 0.5)), dtype=np.float32)

    parts = [lead_pad]
    sent_count = 0
    for phrase, kind in phrases:
        chunks = [ np.asarray(ch.audio_float_array, dtype=np.float32) for ch in voice.synthesize(phrase, syn_config=cfg) ]
        if chunks:
            raw = np.concatenate(chunks) if len(chunks) > 1 else chunks[0]
            parts.append(_smooth_phrase(raw, rate))
        if kind == 'clause':
            parts.append(clause_sil)
        elif kind == 'sentence':
            sent_count += 1
            parts.append(sent_sil)
        else:
            sent_count += 1
    parts.append(tail_pad)

    wav = np.concatenate(parts)
    peak = float(np.max(np.abs(wav))) or 1.0
    # True-peak MP3 headroom: target 0.72 (-2.85 dBFS), cap upward boost on ultra-short words at 1.15x
    target_gain = min(gain, 0.72)
    scale = min(1.15, target_gain / peak)
    wav *= scale

    clipped = int(np.sum(np.abs(wav) >= 0.96))
    if clipped:
        raise RuntimeError(f'{clipped} clipped samples after gain')

    pcm_i16 = np.rint(wav * 32767.0).astype(np.int16)
    final_peak = float(np.max(np.abs(pcm_i16))) / 32767.0 if pcm_i16.size else 0.0
    return pcm_i16, rate, sent_count, final_peak


def _atomic_write_bytes(out_path: str, payload: bytes) -> int:
    os.makedirs(os.path.dirname(os.path.abspath(out_path)) or '.', exist_ok=True)
    tmp_path = f'{out_path}.tmp.{os.getpid()}'
    for attempt in range(8):
        try:
            with open(tmp_path, 'wb') as f:
                f.write(payload)
            os.replace(tmp_path, out_path)
            return len(payload)
        except OSError:
            if attempt == 7:
                try:
                    os.unlink(tmp_path)
                except OSError:
                    pass
                raise
            time.sleep(0.03 * (attempt + 1))
    return len(payload)


def _parse_kbps(bitrate: str) -> int:
    m = re.match(r'^(\d+)', str(bitrate or '64k').strip().lower())
    return int(m.group(1)) if m else 64


def write_audio(pcm_i16: np.ndarray, rate: int, out_path: str, bitrate: str, ffmpeg: str) -> int:
    pcm_bytes = pcm_i16.tobytes()
    if out_path.lower().endswith('.wav'):
        import io, wave
        buf = io.BytesIO()
        with wave.open(buf, 'wb') as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(rate)
            w.writeframes(pcm_bytes)
        return _atomic_write_bytes(out_path, buf.getvalue())

    if lameenc is not None:
        enc = lameenc.Encoder()
        enc.set_bit_rate(_parse_kbps(bitrate))
        enc.set_in_sample_rate(rate)
        enc.set_channels(1)
        enc.set_quality(2)  # highest LAME psychoacoustic quality (clean sibilants, zero swirl)
        mp3_bytes = bytes(enc.encode(pcm_bytes)) + bytes(enc.flush())
        return _atomic_write_bytes(out_path, mp3_bytes)

    os.makedirs(os.path.dirname(os.path.abspath(out_path)) or '.', exist_ok=True)
    tmp_path = f'{out_path}.tmp.{os.getpid()}.mp3'
    cmd = [ffmpeg, '-y', '-loglevel', 'error', '-f', 's16le', '-ar', str(rate), '-ac', '1', '-i', 'pipe:0', '-b:a', bitrate, tmp_path]
    r = subprocess.run(cmd, input=pcm_bytes, capture_output=True)
    if r.returncode != 0:
        raise RuntimeError('ffmpeg: ' + r.stderr.decode('utf8', 'replace')[-300:])
    os.replace(tmp_path, out_path)
    return os.path.getsize(out_path)


def process_job(voice: PiperVoice, job: dict, default_speed: float, default_pause: float, default_gain: float, default_bitrate: str, ffmpeg: str) -> dict:
    jid = job.get('id')
    out_path = job.get('out')
    t0 = time.perf_counter()
    try:
        speed = float(job.get('speed') or default_speed)
        pause = float(job.get('pause') or default_pause)
        gain = float(job.get('gain') or default_gain)
        bitrate = str(job.get('bitrate') or default_bitrate)
        pcm_i16, rate, n_sent, peak = synthesize(voice, job.get('text') or '', speed, pause, gain)
        size = write_audio(pcm_i16, rate, out_path, bitrate, ffmpeg)
        return {
            'id': jid,
            'out': out_path,
            'status': 'rendered',
            'bytes': size,
            'sample_rate': rate,
            'duration_s': round(pcm_i16.size / rate, 2),
            'gen_s': round(time.perf_counter() - t0, 3),
            'sentences': n_sent,
            'peak': round(peak, 3),
            'clipped': 0,
        }
    except Exception as exc:
        return {'id': jid, 'out': out_path, 'status': 'failed', 'error': str(exc)[:300]}


def main():
    p = argparse.ArgumentParser(description='Piper zero-cracking teacher TTS (batch + streaming worker)')
    p.add_argument('--batch')
    p.add_argument('--worker', action='store_true', help='persistent stdin->stdout JSONL worker mode')
    p.add_argument('--text')
    p.add_argument('--text-file')
    p.add_argument('--out')
    p.add_argument('--voice', default=DEFAULT_VOICE, help='path to a Piper .onnx voice')
    p.add_argument('--speed', type=float, default=1.03, help='Piper length_scale (1.03 = natural crisp teacher)')
    p.add_argument('--pause', type=float, default=0.38)
    p.add_argument('--gain', type=float, default=0.72)
    p.add_argument('--bitrate', default='64k')
    p.add_argument('--threads', type=int, default=2, help='ONNX intra_op_num_threads per worker')
    p.add_argument('--ffmpeg', default=DEFAULT_FFMPEG)
    a = p.parse_args()
    voice_path = a.voice if a.voice.endswith('.onnx') else DEFAULT_VOICE

    if a.worker:
        if hasattr(sys.stdin, 'reconfigure'):
            sys.stdin.reconfigure(encoding='utf-8', errors='replace')
        if hasattr(sys.stdout, 'reconfigure'):
            sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        voice = get_voice(voice_path, a.threads)
        print(json.dumps({'ready': True, 'sample_rate': voice.config.sample_rate, 'encoder': 'lameenc' if lameenc else 'ffmpeg'}), flush=True)
        for line in sys.stdin:
            s = line.strip()
            if not s:
                continue
            job = json.loads(s)
            if job.get('cmd') == 'quit':
                break
            res = process_job(voice, job, a.speed, a.pause, a.gain, a.bitrate, a.ffmpeg)
            print(json.dumps(res), flush=True)
        return

    if a.batch:
        voice = get_voice(voice_path, a.threads)
        with open(a.batch, encoding='utf-8') as f:
            for line in f:
                if not line.strip():
                    continue
                res = process_job(voice, json.loads(line), a.speed, a.pause, a.gain, a.bitrate, a.ffmpeg)
                print(json.dumps(res), flush=True)
        return

    if not a.out or not (a.text or a.text_file):
        p.error('Provide --worker, --batch <jobs.jsonl>, OR --out <file> with --text/--text-file')
    text = a.text or open(a.text_file, encoding='utf-8').read()
    voice = get_voice(voice_path, a.threads)
    pcm_i16, rate, n_sent, peak = synthesize(voice, text, a.speed, a.pause, a.gain)
    size = write_audio(pcm_i16, rate, a.out, a.bitrate, a.ffmpeg)
    print(f'{a.out}: {n_sent} sentences, {pcm_i16.size / rate:.1f} s, {size} bytes, peak {peak:.3f}, clipped 0')


if __name__ == '__main__':
    main()
