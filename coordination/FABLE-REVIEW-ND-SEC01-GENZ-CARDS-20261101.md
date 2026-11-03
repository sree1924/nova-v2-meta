# Fable Review Packet — Flashcard Frame Changes (`R1`–`R4`, `S1`) + Updated ND `sec01` Script

- **Date:** 2026-11-01
- **Spec Implemented:** `coordination/ARGON-FLASHCARD-CHANGES-2026-11-01.md` (`R1`, `R2`, `R3`, `R4`, `S1`)
- **Full Implementation Report:** `coordination/ARGON-REPORTS/FLASHCARD-CHANGES-20261101.md`
- **Target State / Run Ancestry:** `ND` · `2026-10-28-rdmv-nd-class-d` (`sec01-licensing-and-testing`, 42 cards + 3 recaps) + unified `.plp-deck` card frame across all 51 states
- **Paid Model / TTS Spend:** `$0.000` (offline CPU Piper `en_US-amy-medium`)

---

## 1. Summary of Completed Changes (`R1`–`R4`, `S1`)

1. **`R1` — Mobile `<= 768px` Order & 1-Line Header (`scrollWidth === 375`):**
   - Header collapses to one `38px` line: `CH 01 · M 01 · CARD 1/16` + `0 / 400 XP` (bar hidden) + `[▶]` + `[⏱]`.
   - Top-to-bottom visual order on phone: **Header (`y=204`) → Question (`y=252..529`) → Illustration (`img y=553..720`, box bottom `769 <= 812`) → Official Answer (`y=779`) → Memory Hook + Pills (`y=933`) → Collapsed `"Why it matters"` (`y=1134`) → Rate row + Source (`y=1187`) → Pager (`y=1341`)**.
   - Question + Picture both fit on Screen 1 at `375x812`; `ILLUSTRATION` tag hidden on mobile; caption visible. Desktop `>= 1024px` keeps the two-column layout.
2. **`R2` — Instant Flip Default `OFF` + `localStorage` (`plp:flip-mode`) Persistence:**
   - Fresh profile opens Card 1 with answer hidden and `⏱ 3s Recall: ON` (`aria-pressed="false"`).
   - Toggle persists across reloads under `plp:flip-mode`; Auto-Play temporarily forces instant mode and restores saved `plp:flip-mode` when stopped.
3. **`R3` — Say the Rule Once + `"Why it matters"` Disclosure:**
   - Generator template rule (`formatStoreCoachWhy` in `scratch/nd-genz-cards/build-nd-sec01-deck.mjs`) strips rule restatements and hook duplicates across all 42 `sec01` cards (e.g. Card 1: `"Do not get bounced at the front desk before question one."`).
   - Re-rendered all 45 `.teach.mp3` + `.recap.mp3` offline Piper clips; wrapped Coach in `<details data-plp-coach>` `"Why it matters"` (collapsed at `<= 768px`, open on desktop).
4. **`R4` — Game Words Trimmed + Customer Jargon Lint:**
   - Dropped `ND · CLASS D QUEST` → `ND · NORTH DAKOTA` and `LEVEL 1 ·` → `CHAPTER 1 · LICENSING AND TESTING`; renamed `"Level one"` in `sec01-m01` recap; renamed buttons to `↻ Show again` and `✓ Got it (+25 XP) →`.
   - Added `\bclass d quest\b|\blevel \d+\s*·|\bspin again\b|\blocked \(\+25 xp\)` to `tools/preview/verify-learner.cjs:729`.
5. **`S1` — Unified `.plp-deck` / `plp-` Store Card Frame (51 States):**
   - Renamed `.nd-neopop-deck` / `nd-*` → `.plp-deck` / `plp-*` across `customer-ui.mjs`, `gate.js`, and `learner.css` (`0` leftover `nd-` UI selectors), driven by `states.json` (`ST.code`, `ST.name`, optional `ST.theme` defaulting to `"indigo"`).

---

## 2. Exact File Paths & SHA-256 Hashes

| Artifact | Path | Bytes | SHA-256 |
|---|---|---:|---|
| Implementation Report (`R1`–`R4`, `S1`) | `D:/nova/fb-ai-hackathon/coordination/ARGON-REPORTS/FLASHCARD-CHANGES-20261101.md` | 10,980 | `b5267b9abe594867a7e86784ab8167162a8afb456049f5480e11ff8e7aa2d79b` |
| Updated 42-Card + 3-Recap Script (`R3`/`R4`) | `D:/nova/fb-ai-hackathon/coordination/ND-SEC01-GENZ-FLASHCARD-SCRIPT.md` | 39,717 | `1dc9272d3374e39921ce4da37d6561812da9c7648e6bb10158bdab6250324cea` |
| Store Deck Overlay JSON | `D:/nova/fb-ai-hackathon/store/learner-assets/decks/nd-sec01-genz.json` | 56,964 | `5dd87870194bbac4c4441b8267d31b9f37c7bcae1cde3959dfc8f9a1f365428e` |
| Belt-Shape `04.cards` Artifact | `D:/nova/fb-ai-hackathon/scratch/nd-genz-cards/out/04-cards.json` | 63,501 | `6e1f5580855b29af2cc2e5021342be5f380e51c7e75351274424bc954b034cea` |
| Belt-Shape `05.card_scripts` Artifact | `D:/nova/fb-ai-hackathon/scratch/nd-genz-cards/out/05-card-scripts.json` | 97,274 | `b90b0816610d8a5c9a757c448d349678bead1d057303bd20cc2f92c787780d25` |
| Belt Check Receipt (`21/21` + `19/19`) | `D:/nova/fb-ai-hackathon/scratch/nd-genz-cards/out/validation-receipt.json` | 10,030 | `6dc5d19c25bae32f27301651a5df53120b71aa5d42aed73f94a443608c17ca17` |
| CDP Proof Screenshots + Metrics JSON | `D:/nova/fb-ai-hackathon/scratch/store-local/plp-flashcards/` | — | `ui-verification.json` + `01..07*.png` |

---

## 3. Harness & Sync Receipts

- `04-cards.mjs`: **21/21 PASS** · `05-card-scripts.mjs`: **19/19 PASS**
- `node tools/preview/verify-learner.cjs`: **`RESULT: ALL CHECKS PASSED`**
- `node tools/preview/verify-learner.cjs --root=store/public/app` (22,439 routes, 51 states): **`RESULT: ALL CHECKS PASSED`**
- `node tools/preview/sync-store.mjs --check`: **`copied 0 · unchanged 163658 · removed stale 0`** (`0` drift)
