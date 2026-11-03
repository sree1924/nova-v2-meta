# 3-minute demo — script + shot list

Target 2:55. Record at 1920×1080, browser zoom 110%, no dev tools. Local URLs: store `http://localhost:4320` (launch entry
`plp-store`, local mode: simulated sign-in/purchase), shell `http://localhost:4310` (`app-preview`), trace
`http://localhost:4310/trace.html`. Replace with passlearnerspermit.com if the cut-over lands first.

Rule from the participant guide: show only what was built during the event. Nothing from Nova's older stores appears.

| t | shot | say (founder voice) |
|---|---|---|
| 0:00–0:15 | Store landing, state picker, hover a few states | "Every new driver in America takes the same kind of test, from a free PDF nobody reads. In eight days we turned all fifty-one official handbooks into complete study courses, and had Meta's models write, fact-check and inspect them." |
| 0:15–0:35 | Click Utah → chapter 1 → lesson video plays 5 s, then reading pages, Next ×2 | "Chapter one of every state is free. A chapter is one unit: a short video, book-style pages built from the handbook, flashcards, a quiz." |
| 0:35–0:55 | Flashcards: flip one, play narration, show the 3-second recall beat; then module quiz, answer one, see rationale | "Every card back is the handbook's accepted wording, byte for byte. Narration is pre-generated, not live." |
| 0:55–1:20 | trace.html for Utah: scroll attempts, click one accepted artifact, show request → response → validator receipt → page cite | "This is the part that matters. Utah was authored by muse-spark through Meta's Model API in strict JSON. Three hundred seventy-one receipted calls, forty-four dollars. Every attempt, its cost and the checks that accepted or held it are here. Nothing was hand-edited." |
| 1:20–1:40 | `coordination/FACT-CHECK/TRIAGE.md` in the browser, then one state report with a CONTRADICTED row and the handbook page | "Then Meta read every one of thirty-eight thousand facts against only the page it cites. Six hundred sixty-four flags, four flat contradictions. We fixed those and hid the four hundred forty-three cards the rest touched. A planted-error test caught three of three first." |
| 1:40–2:00 | `http://localhost:4330/held.html` or the repaint page: the drv-61 pickup-on-the-wrong-side reject side by side with the accepted re-paint | "Pictures too. Seven hundred twenty-three illustrations each passed a vision review for text, right-hand traffic, signal lenses. This one failed: the truck is on the wrong side of the yellow line. It was re-painted and re-inspected." |
| 2:00–2:20 | Signs page for a state (`#/<st>/signs` if wired, else `app-preview/data/signs/`), then the Muse Code terminal transcript or `MUSE-TOKEN-LEDGER.md` | "The road signs were painted by Meta's image model and checked against the handbook's meanings. Nine more states were authored by Muse Code itself, through the same validators, at zero API cost." |
| 2:20–2:40 | Store: pick Texas chapter 2 → paywall → checkout ($9.99 one state, one year) → simulated success → chapter unlocks | "Nine ninety-nine, one state, one year. Everything past chapter one is behind a server-side gate." |
| 2:40–2:55 | `coordination/BUGS/INDEX.md`, then the drop-off watcher log scrolling 51 PASS lines | "What we did not get right is in the bug folder, with what fixed it. Fifty-one states, independently verified, ready to ship." |

## Capture notes
- Hidden pane freezes fade-in animations; record from a visible window (`store-close-capture-lessons`).
- Narration audio in the frame: make sure the clip plays audibly once at 0:40; mute the rest.
- Keep the 401/sign-in wall out of frame except at 2:20.
- Export: H.264, AAC, ≤ 200 MB; upload unlisted YouTube or Drive with link-access; test the link signed out.
