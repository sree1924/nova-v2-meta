# Environment setup — Meta tooling for NOVA V2

Recorded 2026-10-26. **Correction (founder, 2026-10-26 evening): the build window opened 2026-10-26 — the
founder attended the kickoff that day; Meta's announcement states Oct 26–Nov 4. RULES-REVIEW.md's "October 27"
is superseded.** Everything in this folder dated 2026-10-26 is therefore event-time work. The genuine
pre-event inventory is only the machine state in the table below plus Nova itself (`D:/nova` outside this folder). Facts below were read from
`dev.meta.ai/docs/*` on 2026-10-26; re-check if a later official update changes them.

## Machine inventory (pre-event)

| Item | State |
|---|---|
| Node / npm | v22.13.1 / 10.9.2 |
| Python | 3.13.1 |
| git / gh | 2.47.1 / 2.95.0, signed in as `sree1924` |
| VS Code | 1.141.0 |
| `muse` (Muse Code) | not installed before 2026-10-26; **installed 2026-10-26 12:21 MDT, v1.4.13-R6996.1** (400 MB, `%LOCALAPPDATA%\Programs\muse`, user PATH updated — open a new terminal) |
| `MODEL_API_KEY` | **not set** — see step 2 |
| Other LLM keys in env | `OPENAI_API_KEY` only (belt audio/TTS) |
| Meta credits | $150 granted to the approved participant (founder, 2026-10-26) |

## Meta Model API — facts the lane depends on

- Base URL `https://api.meta.ai/v1`; chat completions `POST /v1/chat/completions`; also
  `/v1/responses` and an Anthropic-compatible `/v1/messages`.
- Auth: `Authorization: Bearer $MODEL_API_KEY`; keys start with `LLM_`; created in the
  dashboard at `https://dev.meta.ai` → API keys → Create (shown once). SDKs do NOT read
  `MODEL_API_KEY` automatically — pass it explicitly.
- Text models: `muse-spark-1.3` (default), `-1.2`, `-1.1`; `muse-spark-1.3-contributor`
  (discounted; Meta may train on your content — do NOT use for Nova content, it would put
  source-derived material under a training license); `muse-wonder-1.0` (preview, 1M ctx).
- Pricing (USD per 1M tokens): spark standard in 1.25 / out 4.25 / cached 0.15;
  wonder in 4.00 / out 20.00. → a full 147-card decompression run ≈ $1–2. $150 ≈ 30M+ tokens.
- Rate limits (per team): spark/wonder 3,000 RPM, 4M TPM.
- Structured output: chat completions `response_format: {type:"json_schema", json_schema:{name, schema, strict}}`.
  `strict:true` rules: root plain object, `additionalProperties:false` everywhere, `required`
  lists every property, no `allOf`/`oneOf`, no recursive `$ref`; depth ≤ 10, ≤ 5,000 properties.
  Nova schemas in `D:/nova/schemas/` need a strict-subset projection before use as response schemas.
- Chat-completions params: `max_completion_tokens` (not `max_output_tokens`), `seed` best-effort,
  `reasoning_effort` minimal|low|medium|high|xhigh (`none` → 400). Unsupported → 400: `stop`,
  `n>1`, `logit_bias`, `logprobs:true`, `top_p:0`.
- Open-weights: Muse Spark Open, Muse Glimmer (self-host; rules accept them as "Meta openweights").

## Muse Code (Meta's coding agent — the "Meta IDE")

Terminal + CI agent; TypeScript SDK `@muse-code/sdk`. No editor plugin is documented. On Windows:
agent commands run in PowerShell; first sandbox init may show a UAC prompt; voice input and
session messaging unavailable. Default model `muse-spark-1.2`. Auth: browser sign-in or
`META_API_KEY` (note: a *different* env var name from the Model API's `MODEL_API_KEY`).

Installer (`https://dev.meta.ai/install.ps1`, inspected 2026-10-26, 8,368 bytes): HTTPS-only fetch
of `https://api.meta.ai/muse-launcher.ps1` with sha256 header check → `%LOCALAPPDATA%\Programs\muse\`
(`muse.cmd` shim + `.muse-launcher.ps1`), prepends that dir to the **user** PATH.

## Steps (founder)

1. Install Muse Code — PowerShell, non-admin:
   `irm https://dev.meta.ai/install.ps1 | iex` then open a new terminal, `muse --version`.
2. Create a Model API key at `https://dev.meta.ai` (confirm the $150 credit shows on the billing
   page), then `copy .env.example .env` in this folder and paste the key into `MODEL_API_KEY=`.
   Never commit `.env` (gitignored).
3. `npm run smoke` here → writes `evidence/smoke-<ts>.json` (model, request hash, usage, latency,
   est. cost) and `evidence/raw-smoke-<ts>.json`. This is the first provenance record.
4. Optional: `cd D:\nova\fb-ai-hackathon; muse` — trust the workspace when asked.

## Installed in this folder (2026-10-26)

- `package.json` — `openai@7.44.0` (used purely as the OpenAI-compatible HTTP client against
  `api.meta.ai`), `dotenv@16.4.7`.
- `tools/meta-smoke.mjs` — one structured-output call; provenance record; never prints the key.
- `.env.example`, `.gitignore`.
- `tools/freeze-baseline.mjs` + `baseline/citizenship/BASELINE.json` — pre-event freeze of the V1 citizenship
  reference run (20 artifacts, combined sha256 `82ed9fe8…2231a`, 2026-10-26). Read-only on the run.
- `AGENTS.md` — operating briefing for Muse Code / any coding agent in this folder.

## Separation rule for the experiment (from INSTRUCTIONS.md)

Measured generator = Meta Model API (`muse-spark-1.3` unless the qualification task says otherwise).
Engineering assistants (Claude Code, Muse Code) and independent evaluation models are logged
separately and never approve their own output.
