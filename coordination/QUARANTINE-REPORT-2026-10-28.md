# Card-back quarantine — 2026-10-28 (read-only scan, no card/registry/belt artifact changed)
Rule: hidden at point of sale until re-authored; fact unchanged. Files: `app-preview/data/<xx>/quarantine.json` (UT → `data/ut/`), `app-preview/data/quarantine-summary.json`.
**Totals: 330 of 15,427 unique cards hidden (2.14%) across 23 states** — 148 meaning-changing, 130 raw-digit, 52 cosmetic (primary class). 52 cards with clean form/route codes listed, not hidden. 14 extra garbles outside the 11 classes listed, not hidden.
Per state hidden: MO 45 · NJ 32 · NV 32 · AL 22 · UT 21 · MN 21 · NC 20 · IN 20 · MI 18 · SC 18 · WA 16 · AZ 14 · OR 10 · TN 9 · WI 8 · CO 7 · MD 6 · FL 4 · CT 3 · TX/CA/VA/NY 1 each.
Per class (a card can hit more than one): c1 dot-decimal 29 · c2 fraction-as-"or" 19 · c3 ", dollars" 34 · c4 clock 6 · c5 911 55 · c6 digits 130 · c7 year 36 · c8 "and or or" 9 · c9 symbols 0 · c10 "(six)" 8 · c11 "½" 9 · codes 52.
Exam impact (informational): 330 of 15,453 items lose their only scripted supporting card. Items map 1:1 to cards (15,445 single-card, 2 two-card, 6 none), so every hidden card takes one item with it.

## Regexes (case-insensitive unless noted; NUM = zero…nineteen | twenty…ninety[-one…nine] | hundred | thousand)
- c1 `\b(of|over|at|below|or|a|than|is|above|under|exceeds?|to|from|and|reaches|with)\.(zero…nine)\b`, `(^|\s)\.(zero…nine)\b`, and case-SENSITIVE `[a-z]\.(zero…nine)\b`
- c2 `\b(one|two|three|five|seven) or (two|three|four|eight|ten|sixteen|thirty-two)( of an)? inch(es)?\b` · `\btwenty or (forty|fifty|seventy|two hundred)\b` · `\b(one|three) or (two|four) of (a|an) (mile|second|inch)\b`
- c3 `,\s*dollars?\b` · c4 `\bNUM:\s?(NUM|oh)\b` · c5 `\bnine hundred (and )?eleven\b` · c7 `\bone thousand nine hundred\b`, unless a measure word (feet, pounds, miles, dollars …) follows within 3 words
- c8 `\band or or\b|\bor or\b|\band and\b` · c9 `[*#@/]` · c10 `\(\s*NUM([\s-]+NUM)*\s*\)` · c11 `[½¼¾⅓⅔⅛⅜⅝⅞⅕⅖⅗⅘⅙⅚]`
- c6: tokens containing a digit. Hidden: plain numbers (26,001; 25,000), ordinals (21st), 125cc, 1960s, internal belt ids, and half-spoken codes. Codes (not hidden): letters and digits in one token (MV3001, DL-123A, I-94, SR22, az511.com), or a number right after an UPPERCASE acronym, §, or "form/section/route/…".
- Controls: 12 positive strings fire, and 10 negative strings (spokenize's fixed forms, e.g. "point zero eight", "one sixteenth inch", "nine one one", "nineteen ninety-eight") stay silent. The scan aborts if any control fails.

## False-positive notes
- c1's generic rule also catches statute citations ("RCW forty-six point six one.five hundred two", WA ×4). These are real garbles of codes, not BAC values. A sentence boundary ("rules.One") cannot match because the rule is case-sensitive.
- c2 with "inches", or "three or four of a second", could be a real alternative in theory; the 19 hits I read by hand are all fractions or acuity values.
- c7 would flag a real quantity of 1,900–1,999 that has no unit word ("1,976 lives"). All 36 hits are years or model years.
- c8 "and and" / "or or" can be legitimate prose; all 9 hits are "and/or". c9 had 0 hits in backs, fronts or hooks; its positive control passes.
- c10 also catches phone area codes ("(eight hundred sixty) two hundred sixty-three-five thousand…", CT ×3, CA ×1) and the SC "§…(A)(one-seven)" codes. All are garbles.
- c6 bug found and fixed before writing: a /i flag let any 2-letter word count as a "code lead". That would have under-hidden 112 digit cards (18 vs 130 hidden).
- **UT finding, not a number issue:** 11 UT backs carry leaked KG bookkeeping ("grp: residency; pre: none; dif: 1; conf: sec02-R03", "difficulty_hint 2", "Alcohol presec10-F03."). They are hidden via c6.
- **Not hidden (outside scope, listed in each quarantine.json):** 4 phone numbers read as cardinals (OR, IN, NY, TN, e.g. "five hundred three-nine hundred forty-five-five thousand") and 10 SC "§fifty-six-five-one thousand…" codes.
- TN and AZ each have one section with two accepted 04 artifacts (1,328 / 1,231 card instances; 1,262 / 1,163 unique ids). Hiding is by card id; `source_task_id` is recorded on those entries.

## 10 worst examples
1. NV sec12-F15 — "averaging about one hundred fifty, dollars … alcohol was.eight percent" (c1+c3)
2. CO sec02-R02 — "over.eight for most adults, over.two for drivers under twenty-one" (BAC)
3. AL sec06-R02 — "at.five percent, below the.eight percent level"
4. NC sec11-R04 — "unsafe below one or sixteen inch of tread" (1/16)
5. NJ sec03-F12 — "Basic license applicants need twenty or fifty vision" (20/50)
6. MN sec11-F09 — "about three or four of a second to go from noticing danger" (3/4 s)
7. NJ sec02-F15 — "may not drive between eleven:one pm and five:zero am"
8. MO sec15-F22 — "your license and or or plates stay suspended"
9. NC sec04-F03 — "The Safe Roads Act of one thousand nine hundred eighty-three"
10. AZ sec22-F06 — "call nine hundred eleven" (one of 55 cards across 13 states)
