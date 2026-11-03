# Before `gh repo edit sree1924/nova-v2-meta --visibility public`

Rules: public repository is required; "must have been built during the event". Founder owns the flip (external_publish gate).

## 1. What is uncommitted right now (2026-11-02 18:30Z): 11,549 paths
| area | paths | call |
|---|---|---|
| `runs/` | 6,503 | COMMIT — ledgers, receipts, accepted artifacts for the 51 state runs; `**/sources/private/` and `*.sqlite` are gitignored (ledgers for 5 cloud runs are un-ignored on purpose) |
| `app-preview/` | 4,879 | COMMIT — exported state data, states.json, signs; mp3/mp4/jpg already ignored |
| `coordination/` | 110 | COMMIT — reports, briefs, BUGS/, FABLE-DROPOFF manifests (payload/ ignored) |
| `store/`, `tools/` | 56 | COMMIT — Sol's + Argon's frame work (commit as theirs per the 11-01 brief), audit tools |
| `submission/` | new | COMMIT |

Media never in git (standing rule): audio, video, posters, drop-off payload — all covered by `.gitignore`. Verify before push:
```bash
git -C D:/nova/fb-ai-hackathon status --short | grep -E "\.(mp3|mp4|jpg|png|webp|webm|pdf)$" | head
```
Swept 2026-11-02 18:50Z: the only media in `git status` are the 1,509 **already-tracked** Utah mp3s showing as modified
(re-encoded for pace; ~1.8 MB delta). Everything else is JSON/MD/JS. Secrets sweep (tracked + untracked, Stripe/Meta/OpenAI
key patterns): clean — only the literal placeholder `MODEL_API_KEY=file-transport-no-key` in cloud prompt templates.

## 2. Secrets sweep
```bash
git -C D:/nova/fb-ai-hackathon grep -n -E "sk_(live|test)_|pk_live_|MODEL_API_KEY=|OPENAI_API_KEY=|Bearer [A-Za-z0-9]{20}" -- . ":!node_modules" | head
```
Expect none. `.env*` ignored. Porkbun order JSON holds no credentials (check).

## 3. Private source material
Handbook PDFs + extracted text: `runs/**/sources/private/` ignored. Muse launch transcripts (echo handbook text): ignored.
Cloud pins zip `coordination/cloud/parent-pins.zip` carries Nova factory role contracts → **remove or confirm founder is fine
publishing them** (memory 10-29 flagged this).

## 4. README refresh
Lane README still reads "Utah, 2026-10-28". Replace the state-of-the-lane block with the 51-state figures from
`submission/EVIDENCE.md`; keep the Utah centerpiece section. Link `submission/`.

## 5. Contributors + license
`CONTRIBUTORS.md` present. Add a LICENSE if judges' guide expects one (not required by the rules read 10-26). Waiver grants
a broad submission-use license regardless.

## 6. Flip + verify
```bash
gh repo edit sree1924/nova-v2-meta --visibility public --accept-visibility-change-consequences
```
Then open the repo signed out and confirm README renders and `app-preview/trace.html` is reachable via raw/Pages if linked.
