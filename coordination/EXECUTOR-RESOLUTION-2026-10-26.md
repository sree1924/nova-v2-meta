# Executor resolution — Utah run, 2026-10-26 ~23:55Z

Two executors received a "go" tonight and both wrote `tools/belt/controller.mjs` (Sol at 17:47–17:50 MDT; Muse in the
same minutes). Muse detected the overwrite, stopped writing, and reported — correct behaviour. Resolution (Claude, validator;
founder to confirm by relaying this file):

| Owner | Scope from now |
|---|---|
| **Sol** (`01a17a94-0bf3-7003-8f7d-b3af6a96e219`, holds `runs/2026-10-26-rdmv-ut-class-d/EXECUTOR.lock.md`) | Belt controller + ledger + Meta client + lock tooling in `tools/belt/{controller,ledger,meta-client,executor-lock,execution-policy,atomic-file,artifact-task,trace}.mjs`; all stage dispatches on the Utah run; the 0.4.0 seal and prompt hash pins. |
| **Muse Code** | `tools/belt/pdf-text.mjs` (hers — Sol's registry consumed it; keep it), `app-preview/**` (the learner dev preview), and **operator**: runs Sol's controller commands when asked; never edits Sol's controller files. |
| **Claude** | `schemas-strict/**`, `tools/belt/post-validate.mjs` + checks/fixtures/tests, `probe-strict`, `meta-smoke`; validates every artifact; reviews. |
| **Founder** | `--go` per paid stage. |

Why Sol keeps it: her controller exists, is ledger-backed, and has already produced an **accepted Role 15** (0 model calls, i.e. still a dry
run): passing score **80% verified from the handbook PDF** (p33 / printed p23, §6.A), 115 pages, snapshot hash matches intake, liveness
receipt honestly `VERIFICATION_DEBT` (effective_date null; issuer-current-edition confirmation null — resolve or carry as debt).
Swapping executors now costs an hour and gains nothing; the Meta-tooling story stays intact (Muse built the PDF inspector, operates the
belt, builds the preview; Meta's model is the measured generator).

## Next gate: founder `--go` for stage 02 (first paid call)
Before the founder is asked:
1. Sol: `node tools/belt/controller.mjs dispatch --run 2026-10-26-rdmv-ut-class-d --executor <id> --stage 02.dossier_sections --section <first text-first section>` **without `--go`** → must print the rendered envelope hashes (body/header/request), the adapter sha (`25bebb10…` for 02), the max-tokens/cost reservation in micro-USD, and make **no** network call (`model_calls` stays 0). Paste that output.
2. Claude validates the dry envelope against the handoff (adapter hash, `reasoning_effort: low`, `max_completion_tokens` bounded, no Nova artifact in inputs, run-config `spend_mode` honoured).
3. Founder: `--go`. One section. Then `post-validate` decides.

Credits: the founder has not yet chosen between the $150 free credits (content may be used for product improvement) and card spend.
Record the choice in run-config `producer.billing_mode` before `--go`.
