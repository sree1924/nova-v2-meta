# Before `gh repo edit sree1924/nova-v2-meta --visibility public`

## STATUS 2026-11-03 17:40Z — tree READY on `main` = `sol/store-local` = `11058b366`, pushed (repo still PRIVATE)
- Working tree committed: 24,283 paths (51 state runs, app-preview exports, coordination, store frame, deploy tooling, submission).
- Code only: `.gitignore` now blocks every media type + mirrors + Vercel/Wrangler state + `.env.cloudflare` + regenerable
  bulk (R2 ledgers, per-state `real-embedded.js`); the 1,509 tracked Utah mp3s and the 2 cloud pin zips were dropped from the index.
- Secrets: two sweeps (Stripe/Clerk/Cloudflare/R2/Vercel/OpenAI/Google/AWS/private-key patterns) over all tracked + untracked
  files → only placeholders (`sk_test_xxx` in `.env.example`, doc prose). `.env.cloudflare`, `store/.env.local`,
  `store/.vercel/`, `deploy/.secrets` (outside the lane) all confirmed ignored. Porkbun order JSON: no PII fields.
- **Two founder decisions before the flip:**
  1. **History still holds the 1,509 Utah mp3s + 2 pin zips** (1,513 blobs, ~400 MB of the 488 MB pack). Removing them needs a
     history rewrite (`git filter-repo --invert-paths --path-glob '*.mp3' --path-glob 'coordination/cloud/*.zip'`) + force-push
     of every branch. Say "rewrite history" or accept that old commits expose Utah narration audio (not secrets).
  2. **Course content is in the repo as JSON** (all 51 states' dossiers, cards, exam banks under `runs/` and `app-preview/data/`,
     ~400 MB; the paid chapters included). It is the belt's evidence for judges, but it is also the product. Options: ship as-is
     (judges get full evidence, anyone can rebuild the course) or strip `app-preview/data/*/` + `runs/**/accepted` of chapters 2+
     before the flip (evidence then = ledgers/receipts + chapter 1). Default if no answer: ship as-is.
- Flip command unchanged (§6). After flipping: `git push` is NOT needed; verify README renders signed out.

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
