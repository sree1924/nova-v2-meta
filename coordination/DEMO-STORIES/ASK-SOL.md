# Sol — your full belt story (paste this whole block to Sol; Astra gets the same with `sol-gpt.md` → `astra-gpt.md`)

Sol, the hackathon demo video is built from the belt as centerpiece: every lane that executed it tells its own story in its
own words, and the stories are cut together over screen captures of the live product and the receipts. No human on camera.
Fable condenses; the founder edits every line. **Right now we are collecting detail, so there is no word cap. Write everything
you know, in full. Long is right. We cut later; we cannot add later.**

Write to `coordination/DEMO-STORIES/sol-gpt.md`. First person, past tense, plain English a judge can follow. Mechanics, not
adjectives. No praise of any model, including yourself; no digs at anyone. Nothing made up: **every number, date, count or cost
points at a file you can see on disk**, written as the path next to the claim. If you cannot point at a file, write "(verify)"
after the claim or leave the number out.

## Write these sections, in this order

### 1. Timeline
Day by day from your first brief to your last handoff. For each day: what was asked, what you produced, what you handed back,
and the file you wrote.

### 2. The belt contracts (v0.4.0)
What the belt is from the author's side: the seven strict schemas, the compensating checks, the ledger receipts, lineage caps,
the controller, the adapter amendment, write barriers, export holds. What you changed in the contract, why, and who acknowledged
it. Receipts: `coordination/SOL-BELT-HANDOFF-v0.4.0.md`, `coordination/SOL-CONTROLLER-STATUS-v0.4.0.json`,
`coordination/SOL-BELT-AMENDMENT-ADAPTER-RECEIPT-20261028.json`, `coordination/SOL-BELT-CHANGES-OWNER-ACK-20261029.json`.

### 3. The state dossiers you authored
Which states (the ledger lists you against all 51 codes: `coordination/WORKER-TOKEN-LEDGER.md` row `sol`, and per-state rows such
as line 108/109 for NE). For each state or group: how many chapters, how many attempts, which checks HOLD-ed you and what the
HOLD taught, how long it took, tokens used (1.72 B client tokens, $0 API). Receipts: `runs/2026-10-28-rdmv-<xx>-*/ledger/`,
`runs/…/COST-ACCOUNTING.md` where present, the per-attempt receipt files.

### 4. The complete-dossier replacement and the write barrier
What the write-barrier request/release cycle was for, what would have gone wrong without it, how it played out.
Receipts: `coordination/SOL-COMPLETE-DOSSIER-REPLACEMENT-WRITE-BARRIER-REQUEST-20261028.json`, `-RELEASE.json`.

### 5. The fact-fix pass
The brief, the API policy, the authority files, the ID pilot; what Meta's fact-check flagged, what you re-authored, what you
refused to touch. Receipts: `coordination/SOL-FACT-FIX-BRIEF-2026-10-29.md`, `coordination/SOL-FACTFIX-API-POLICY-20261029.json`,
`SOL-FACTFIX-AUTHORITY-20261029.json`, `SOL-FACTFIX-ID-PILOT-AUTHORITY-20261029.json`, `coordination/FACT-CHECK/<ST>/`.

### 6. Export holds on the final states
The four-state and final-three export-hold releases: why the holds existed, what had to be true to release them.
Receipts: `coordination/SOL-FOUR-STATE-EXPORT-HOLD-RELEASE-AUTHORITY-20261030.json`,
`coordination/SOL-FINAL-THREE-EXPORT-HOLD-RELEASE-AUTHORITY-20261030.json`.

### 7. Store local mode
What you built so the store runs without Clerk/Stripe locally, and why that mattered for verification.

### 8. What refused you and how you recovered
Every HOLD, every validator rejection, every round you lost, with the file that records it.

### 9. Numbers table
One table: metric | value | file. Only rows with a file.

### 10. Shots
As many as you like, in priority order: file path or live URL + one line on what it shows. Live site:
https://passlearnerspermit.com — pick a state you authored, e.g. `/app/#/ne`; `app-preview/trace.html` shows a card's attempts.

### 11. Two lines of feeling, at the end. Optional.

For the record: you are a **GPT** lane (Sol; Astra is the other GPT lane; Terra was the GPT image lane, stopped 11-01).
Muse = Meta (Utah author, 51-state fact-checker, picture inspector, sign painter). Claude = Fable coordinator + Opus dossier
workers. Argon = Gemini (decks, Piper narration, 4,987 videos, road signs, store frame, CDN drop-off).

Do not edit anything else. The app and the store are frozen. Reply with the path when done.
