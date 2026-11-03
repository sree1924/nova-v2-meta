# TTS Trial Report — Kokoro-82M vs. Piper Amy (2026-10-29)

**Workspace:** `D:\nova\fb-ai-hackathon`
**Input text:** `tts-samples/sample-text.txt` (1 real Texas lesson slide, 554 characters, 5 sentences)
**Script:** `tools/tts/kokoro_teacher.py` (`--pause 0.6`, `--gain 0.9`, 24 kHz mono `PCM_16`)
**Hardware:** Intel Core Ultra 7 155U (12 cores / 14 logical processors, CPU-only inference via PyTorch `2.15.0+cpu`)

---

## 1. Sample Grid & Listen-Check Results

All 8 Kokoro samples synthesized all 5 sentences cleanly with **0 clipped samples** and true 0.6 s silence between sentences. Reference Piper Amy files are included at the bottom for comparison.

| File | Voice | Speed | Audio (s) | Gen (s) | Real-Time Factor | Clipped Samples | One-Line Listen Note |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| `tts-samples/kokoro-af_heart-0.95.wav` | `af_heart` | `0.95` | 42.7 | 22.0 | **1.9x** | 0 | Warm, authoritative American instructor; numbers ("ninety days", "sixteen", "eighteen") and "reciprocity" are crisp, zero buzz/clicks, and final sentence ("Each group has its own rule.") lands cleanly. |
| `tts-samples/kokoro-af_heart-0.90.wav` | `af_heart` | `0.90` | 44.4 | 22.5 | **2.0x** | 0 | Calm, deliberate classroom cadence with natural clause phrasing; numbers and "reciprocity" are spotless, zero artifacts, and final sentence finishes cleanly without cutoff. |
| `tts-samples/kokoro-af_bella-0.95.wav` | `af_bella` | `0.95` | 44.5 | 26.8 | **1.7x** | 0 | Clear, bright, expressive American voice; numbers and "reciprocity" read naturally with strong emphasis on "stays valid", zero buzz/clicks, and clean final sentence ending. |
| `tts-samples/kokoro-af_bella-0.90.wav` | `af_bella` | `0.90` | 46.1 | 28.0 | **1.6x** | 0 | Steady, articulate delivery with extra breathing room on multi-clause rules; all numbers and terms pronounced accurately, zero buzz/clicks, and intact final sentence. |
| `tts-samples/kokoro-af_nicole-0.95.wav` | `af_nicole` | `0.95` | 62.6 | 35.1 | **1.8x** | 0 | Whispery, intimate ASMR-style register that stretches 5 sentences to 62.6 s; pronunciation, numbers, and final sentence are clean with zero buzz, but unsuitable for driver-ed instruction. |
| `tts-samples/kokoro-af_nicole-0.90.wav` | `af_nicole` | `0.90` | 65.7 | 33.8 | **1.9x** | 0 | Very slow, breathy whisper (65.7 s total); numbers and words are accurate and unclipped with an intact ending, but the sleepy ASMR timbre does not fit a classroom teacher role. |
| `tts-samples/kokoro-bf_emma-0.95.wav` | `bf_emma` | `0.95` | 40.8 | 21.5 | **1.9x** | 0 | Polished, documentary-grade British English narrator (`en-gb` G2P); numbers and "reciprocity" are crisp, zero buzz/clicks, intact final sentence, though British accent feels out of place for US state DMV rules. |
| `tts-samples/kokoro-bf_emma-0.90.wav` | `bf_emma` | `0.90` | 41.9 | 22.9 | **1.8x** | 0 | Composed British instructional read with natural pacing and clean final sentence; zero audio defects, but British pronunciation ("class", "military") mismatches US state driver courses. |
| *(Ref)* `tts-samples/amy-teacher-v2-natural.wav` | Piper Amy | `1.00` (`--length`) | 38.2 | — | — | 0 | Clean of clipping buzz, but noticeably flatter VITS prosody and slightly slurred "visitor" ("vis-er") compared to Kokoro's human-like inflection. |
| *(Ref)* `tts-samples/amy-teacher-v2-measured.wav` | Piper Amy | `1.05` (`--length`) | 40.2 | — | — | 0 | Unclipped and intelligible, but robotic cadence on long lists and same compressed "visitor" articulation compared to `af_heart` and `af_bella`. |

*(Note on `bf_emma` and `af_nicole` generation times: first-ever invocation took ~41–45 s because `KPipeline` downloaded the voice `.pt` tensor and initialized the British G2P dictionary on the fly; cached generation time is 21.5–35.1 s, or **1.8x–1.9x** real time).*

---

## 2. Licensing (Model Weights & Voices)

- **Model Card URL:** <https://huggingface.co/hexgrad/Kokoro-82M>
- **Voice Catalog & Grades URL:** <https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md>
- **Model License:** **Apache-2.0** (`license: apache-2.0` in the official `hexgrad/Kokoro-82M` model card header). The model card explicitly states:
  > *"With Apache-licensed weights, Kokoro can be deployed anywhere from production environments to personal projects... This is an Apache-licensed model, and Kokoro has been deployed in numerous projects and commercial APIs. We welcome the deployment of the model in real use cases."*
- **Voices License (`af_heart`, `af_bella`, `af_nicole`, `bf_emma`):** **Apache-2.0** (distributed inside the same `hexgrad/Kokoro-82M` repository under `voices/*.pt`).
  - Per the model card's **Training Details** section, Kokoro v1.0 and its 54 voice embeddings were trained exclusively on permissive/non-copyrighted audio data (public domain audio, Apache/MIT-licensed audio, and synthetic audio from closed large-provider TTS models under US Copyright Office AI guidance, with zero custom voice clones or open-model outputs).
  - The model card lists two Creative Commons Attribution datasets used in the multi-language v1.0 training mix (`Koniwa` under CC BY 3.0 and `SIWIS` under CC BY 4.0); including attribution in product credits satisfies any downstream notice best practice.
  - **Voice quality grades from `VOICES.md`:**
    - `af_heart`: Overall Grade **A** (flagship American female voice)
    - `af_bella`: Target Quality **A**, Training Duration **HH hours** (10–100 hrs), Overall Grade **A-**
    - `af_nicole`: Target Quality **B**, Training Duration **HH hours** (10–100 hrs), Overall Grade **B-** (headphone/whisper trait 🎧)
    - `bf_emma`: Target Quality **B**, Training Duration **HH hours** (10–100 hrs), Overall Grade **B-**
- **Commercial Use Verdict:** **ALLOWED** (Apache-2.0 for both model weights and voice packs).

---

## 3. Windows Install Problems & Fixes

We hit three Windows-specific obstacles on this machine (`Windows 11`, `Python 3.13.1`, non-admin shell) and resolved all three cleanly:

1. **`kokoro 0.9.4` Upper-Bound Python Constraint (`Requires-Python: <3.13,>=3.10`):**
   - **Problem:** Running plain `pip install kokoro soundfile` on Python `3.13.1` caused `pip` to reject `kokoro 0.9.4` and backtrack to `kokoro 0.7.16`, which pins `numpy==1.26.4`. Because `numpy 1.26.4` has no prebuilt Windows wheel for Python 3.13, `pip` hung trying to compile NumPy from C source.
   - **Fix:** Installed `kokoro==0.9.4` with `--ignore-requires-python --only-binary=:all:` and PyTorch's CPU wheel index:
     ```powershell
     python -m pip install --ignore-requires-python --only-binary=:all: kokoro==0.9.4 soundfile torch --extra-index-url https://download.pytorch.org/whl/cpu
     ```
     Every dependency (`torch-2.15.0+cpu`, `numpy-2.5.4`, `spacy-3.8.18`, `misaki-0.9.4`, `soundfile-0.14.0`) installed from prebuilt `cp313`/`abi3` Windows wheels with zero compilation.
2. **`espeak-ng` MSI Installer UAC Prompt vs. `espeakng-loader`:**
   - **Problem:** Installing `eSpeak-NG.eSpeak-NG` via `winget` downloads `espeak-ng.msi`, which blocks indefinitely on a Windows UAC elevation modal when invoked from a non-elevated terminal.
   - **Fix:** `kokoro 0.9.4` depends on `misaki[en]>=0.9.4`, which automatically pulls **`espeakng-loader-0.2.4` (`win_amd64` wheel)**. That wheel bundles `espeak-ng.dll` and `espeak-ng-data` directly inside Python's `site-packages` and wires it into `phonemizer-fork` automatically—no system-wide MSI install or admin prompt required.
3. **First-Run `en_core_web_sm` Download & Non-Zero Exit on Stderr Warnings:**
   - **Problem:** On the very first call to `KPipeline(lang_code='a')`, `misaki` invokes `spacy.cli.download("en_core_web_sm")` on the fly (~12.8 MB) and Hugging Face Hub prints a Windows symlink `UserWarning` to `stderr` (which PowerShell surfaces as a `NativeCommandError` if `2>&1` is captured).
   - **Fix:** Once `en_core_web_sm` and `hexgrad/Kokoro-82M` are cached on disk after run #1, subsequent runs work completely offline. Setting `$env:HF_HUB_DISABLE_SYMLINKS_WARNING="1"` silences the Hugging Face symlink warning on Windows.

---

## 4. Teacher Tone Pick & Rationale

**Winner: `af_heart` at speed `0.95` (`kokoro-af_heart-0.95.wav`) — with `af_heart` at `0.90` as a close runner-up.**

- **Why `af_heart` wins over Piper Amy (`amy-teacher-v2-natural.wav` / `measured.wav`):**
  - Piper Amy is intelligible and unclipped, but sounds unmistakably like a classic VITS engine—flat pitch contour across clauses and a slightly slurred *"non-resident vis-er"* in sentence 4.
  - `af_heart` sounds like a real human instructor: she naturally lifts pitch before the colon in *"within limits:"*, groups *"Class C or M vehicles"* as a cohesive legal phrase, and lands the rhetorical question (*"am I a resident, a nonresident visitor, or a service member?"*) with genuine conversational inflection before delivering *"Each group has its own rule"* with clean finality.
- **Why speed `0.95` over `0.90`:**
  - `0.95` (`42.7 s` with 0.6 s sentence pauses) hits the sweet spot of a confident, engaging classroom teacher—deliberate enough for teens and first-time drivers to absorb numbers ("ninety days", "sixteen", "eighteen") without feeling slowed down. `0.90` (`44.4 s`) is also very clean if you prefer an extra-measured pace.
- **Why not the others:**
  - `af_bella` (`0.95` / `0.90`) is a strong second place (Grade A-, slightly brighter/more energetic), great if we ever want a secondary voice.
  - `af_nicole` is a whisper/ASMR voice (stretching a 42 s slide to 63–66 s)—completely wrong register for driver education.
  - `bf_emma` is high-quality British English, which feels unnatural when teaching Texas/US state driver licensing laws.

---

## 5. 51-State Fleet Time Estimate

### Single-Process Baseline (from `kokoro_teacher.py` as-is)
- **Measured Real-Time Factor (RTF) for `af_heart @ 0.95`:** **1.9x real time** (`42.7 s` of audio generated in `22.0 s` on CPU, including ~1.5 s of per-invocation model load).
- **Workload:**
  - **15,000 lesson slides** × `40 s` average audio = `600,000 s` = **166.7 hours** of lesson audio.
  - **Flashcard answers** across 51 states (assuming ~150–200 cards/state ≈ 8,500–10,000 short answers at ~8–10 s each) = `~90,000 s` = **~25.0 hours** of flashcard audio.
  - **Total Fleet Audio:** **~191.7 hours** (~690,000 seconds of audio).

### Wall-Clock Crunching Estimates on This Laptop (Intel Core Ultra 7 155U)

| Execution Mode | Effective Speed | Lesson Slides (166.7 h audio) | + Flashcard Answers (~25 h audio) | Total 51-State Fleet Time | Cost |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **1 Worker (current CLI per-file)** | **1.9x** real time | ~87.7 hours (~3.6 days) | ~13.2 hours | **~101 hours (~4.2 days)** | **$0** |
| **1 Worker (persistent `KPipeline` in memory)** | **~2.1x** real time | ~79.4 hours (~3.3 days) | ~11.9 hours | **~91 hours (~3.8 days)** | **$0** |
| **2–3 Parallel Workers (pinned to P-cores, 4 threads each)** | **~3.4x–3.8x** real time | ~44–49 hours (~1.9 days) | ~6.5–7.5 hours | **~51–56 hours (~2.2 days)** | **$0** |

> **Practical takeaway for the fleet run:** Keep `KPipeline` loaded once per worker process (instead of re-initializing Python + PyTorch for every slide) and run **2–3 worker processes** across states. That cuts per-state wall time to **~1 hour per state** (~2 days total background crunching on this laptop, or ~2–3 hours total if run on any cheap cloud GPU / desktop RTX card) for **$0.00 in API spend**.
