# Evidence ledger for the submission (every number → where it is on disk)

Compiled 2026-11-02 ~18:45Z by Fable from the lane repo (`D:/nova/fb-ai-hackathon`). "(verify)" = not re-derived today.

## Fleet content (shell + store)
| figure | value | source |
|---|---|---|
| jurisdictions complete | 51 / 51 (50 states + DC) | `app-preview/data/states.json` (51 entries, all `status: complete`) |
| chapters | 745 | `states.json` chapters summed |
| learning units / lesson videos | 4,987 | `coordination/FABLE-DROPOFF/QUEUE-STATUS.json` `counts.video_lessons` summed |
| flashcards | 37,967 | same ledger `counts.flashcards_genz`; merge log "51-State Map … 37,967 cards" |
| lesson slides | 34,793 | `merge_when_terra_done.py` output 2026-11-01 22:30Z |
| quiz items / practice forms | 36,234 / 1,490 | Argon `coordination/ARGON-REPORTS/FLASHCARD-MINT-51-20261101.md` |
| cards hidden by quarantine (known-bad facts) | 39 residual in shell quarantine files; 443 fact-check hides applied via `quarantine.mjs` | `app-preview/data/<xx>/quarantine.json`; `coordination/FACT-CHECK/<ST>/corrections.json` |
| harness | ALL CHECKS PASSED, 22,439 routes, both roots | `node tools/preview/verify-learner.cjs` (+ `--root=store/public/app`) run 2026-11-01 ~22:40Z |

## Meta model use
| figure | value | source |
|---|---|---|
| Model API calls, all purposes | 3,099 calls, $58.71 priced | `coordination/MUSE-API-SPEND.jsonl` (2,932 `muse-spark-1.3`, 167 `muse-image-1.0`) |
| Utah authoring (centerpiece) | 371 receipted calls, $44.09, 16/16 chapters | `runs/2026-10-26-rdmv-ut-class-d/ledger/`, `COST-ACCOUNTING.md`; `coordination/WORKER-TOKEN-LEDGER.md` row `meta-model-api` (24.99 M in / 2.79 M out) |
| fleet fact check | 38,074 facts, 51 states; 664 flagged → 444 MEANING / 184 CITATION / 36 OK; 4 CONTRADICTED; 1,840 calls ≈ $48.37 | `coordination/FACT-CHECK/TRIAGE.md`, `coordination/FACT-CHECK/<ST>/report.md`, spend ledger purposes `fact-check*` |
| fact-check positive control | 3 planted number swaps caught 3/3, 0 false flags | spend ledger purpose "fact-check positive control"; memory 2026-10-29 |
| vision image review | 636 verdict files; catalog review tally approved 610 / rejected 72 / held 0 | `coordination/IMAGE-CHECK/results/`, `scratch/terra-dataset/national-fleet-700-visual-catalog.json` `summary.review_tally` |
| image/vision/sign calls | 1,307 calls, $9.95 | spend ledger purposes matching image/vision/sign |
| road signs | 93 signs; image QA ACCEPT 89 / REJECT 4 (withheld: turn-right, stop-ahead, divided-highway-ends, object-marker); meanings vs handbook SUPPORTED 73 / NOT_COVERED 16 / CONTRADICTED 4 (corrections recorded) | `coordination/SIGNS/qa-report.md`, `coordination/SIGNS/factcheck-report.md`; `app-preview/signs/` (89 files); `app-preview/data/signs/signs.json` |
| Muse Code subscription authoring | 10 states (UT sec01 proof + TX CA FL NY VA KY OK CT IA); 1,035 M input / 3.28 M output tokens, $0 API | `coordination/MUSE-TOKEN-LEDGER.md`, `coordination/WORKER-TOKEN-LEDGER.md` row `muse`; `runs/2026-10-27-rdmv-ut-class-d-muse/` |
| Muse Voice Transcribe | spoken recall built, verified (20 voice checks), parked | `coordination/MUSE-VOICE-RECALL-REPORT.md`; `tools/preview/transcribe-proxy.parked.mjs` |

## Non-Meta lanes (declare, don't hide)
| lane | what | source |
|---|---|---|
| Claude (Opus workers, Fable coordinator) | SME dossiers + downstream for 16 original states, downstream for all 50 non-Utah, tooling, verification | `WORKER-TOKEN-LEDGER.md` row `claude` (26.3 M tokens through 10-30); cloud sessions HI VT WV |
| GPT Sol | belt contracts (v0.4.0), 10+12 states' dossiers, re-author pass, store-local mode | `WORKER-TOKEN-LEDGER.md` row `sol`; `coordination/SOL-*` |
| Gemini Argon (Google, $200 plan) | flashcard decks, Piper audio, video renders, road-signs module, drop-off staging, store frame | `coordination/ARGON-REPORTS/`, `coordination/FABLE-DROPOFF/` |
| GPT Terra | ~649 of 748 scene paintings (stopped 11-01) | `scratch/terra-dataset/` |
| OpenAI | Utah narration (gpt-4o-mini-tts, 1,509 clips, $7.54 est); 60 re-paints via gpt-image-1.5 (35 kept) ≈ $4.94 | `app-preview/audio/audio-manifest.json`; `coordination/IMAGE-CHECK/OPENAI-SPEND-2026-11-01.json` |
| Piper (offline) | narration for the other 50 states; 80,921 deck-overlay clips, $0 | Argon report FLASHCARD-MINT-51; `store/learner-assets/decks/audio/` (gitignored) |

## Video + media
| figure | value | source |
|---|---|---|
| lesson videos | 4,987 MP4, 23,146.8 min (385.78 h), 1080p H.264 | Argon report; `store/public/app/video/<xx>/video-manifest.json` ×51 |
| videos re-rendered after library merge | 116 / 831 (BUG-008) → all re-rendered, verified | `coordination/BUGS/BUG-008-*.md`, `coordination/IMAGE-CHECK/videos-affected-by-merge-2026-11-01.json` |
| visual library | 723 live WebPs, all `verified_*`, 25 scenes on domain fallback | `store/learner-assets/visuals/`, catalog |

## CDN drop-off (what ships)
| figure | value | source |
|---|---|---|
| state payloads | 254,314 files, 188.29 GB; 18,509 free / 235,805 paid | `QUEUE-STATUS.json` totals summed 2026-11-02 |
| shared bundle | 770 files, 125.4 MB (723 scenes, embedded JS, fonts, signs) | `coordination/FABLE-DROPOFF/shared/shared-manifest.json` |
| independent verify | 51/51 READY.json PASS: 0 issues, 0 missing, 0 sha mismatches, free tier = section 01 only | `coordination/BUGS/DROPOFF-WATCH.log` (Fable watcher, separate from Argon's `--verify`) |

## Store
| figure | value | source |
|---|---|---|
| price / free tier | $9.99 one state one year, one-time; chapter 1 free everywhere | `store/README.md` |
| domain | passlearnerspermit.com (Porkbun, paid through 2027-10-28) | `coordination/PORKBUN-ORDER-12309781.json` |
| gates still founder's | Vercel project + domain, Clerk prod, Stripe product + webhook, support@ MX, GSC sitemap | `store/README.md` |

## Bugs found and closed during the build (judges like this)
`coordination/BUGS/INDEX.md`: BUG-001 unreviewed pictures served (closed), 002 id with a space (closed), 003 shared bundle
missing JS/fonts (closed), 004 manifest categories (closed), 006 vision cache judged old file (fixed), 007 review clicks dropped
(fixed), 008 116 videos rendered pre-merge (closed). Open: 005 (content carry-ins), 009 (3:2 re-paints).
