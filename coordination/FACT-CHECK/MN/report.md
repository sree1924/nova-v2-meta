# Fact check — Minnesota (MN), Muse one call per section

Run 2026-10-28-rdmv-mn-class-d. Auditor muse-spark-1.3 via the Meta Model API — independent of the authors. compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass.

| Measure | Value |
|---|---|
| Sections checked | 14 of 14 |
| Facts checked | 892 |
| Supported | 880 |
| Partially supported | 12 |
| Not found on cited page | 0 |
| Contradicted | 0 |
| Exact cost | $0.5076 (97,978 input + 90,624 output tokens) |
| Cost per fact | $0.00057 |
| Projection, all 51 (37,967 facts) | $21.61 |
| Projection, states Muse can audit independently (33,681 facts) | $19.17 |

States Muse cannot audit independently (Claude or Sol must): UT TX CA FL VA NY CT KY IA OK.

## Per section

| Section | Facts | Supported | Flagged | Tokens in / out | Cost |
|---|---|---|---|---|---|
| sec01-new-laws-and-checklists | 40 | 36 | 4 | 4551 / 4840 | $0.0263 |
| sec02-license-to-drive-part-1 | 59 | 56 | 3 | 7935 / 7192 | $0.0405 |
| sec03-license-to-drive-part-2 | 60 | 59 | 1 | 9001 / 6261 | $0.0379 |
| sec04-your-vehicle | 50 | 50 | 0 | 4795 / 4820 | $0.0265 |
| sec05-traffic-laws-part-1 | 74 | 74 | 0 | 7865 / 5564 | $0.0335 |
| sec06-traffic-laws-part-2 | 72 | 72 | 0 | 7260 / 7657 | $0.0416 |
| sec07-sharing-the-road-part-1 | 79 | 77 | 2 | 9095 / 9421 | $0.0514 |
| sec08-sharing-the-road-part-2 | 71 | 71 | 0 | 7570 / 8569 | $0.0459 |
| sec09-signs-signals-part-1 | 71 | 70 | 1 | 6239 / 6395 | $0.0350 |
| sec10-signs-signals-part-2 | 63 | 63 | 0 | 5687 / 5115 | $0.0288 |
| sec11-driving-conditions-part-1 | 71 | 71 | 0 | 7898 / 6344 | $0.0368 |
| sec12-driving-conditions-part-2 | 74 | 74 | 0 | 8930 / 7018 | $0.0410 |
| sec13-driving-privileges | 43 | 43 | 0 | 3960 / 4707 | $0.0250 |
| sec14-driving-under-influence | 65 | 64 | 1 | 7192 / 6721 | $0.0376 |

## Findings to resolve (any verdict other than SUPPORTED)

| Fact | Verdict | Issue | Suggested fix |
|---|---|---|---|
| sec01-F19 | PARTIALLY_SUPPORTED | The page makes the Supplemental certificate conditional on If completed, which the fact omits. | Add that the Supplemental Parental Curriculum certificate is only brought If completed. |
| sec01-R01 | PARTIALLY_SUPPORTED | The page does not state the behind or beside positions, only a general duty to stop with one opposite-direction divided-highway exception. | State only that drivers who see a stopped bus with flashing red lights must stop at least 20 feet away, except opposite-direction travel on a divided highway. |
| sec01-R08 | PARTIALLY_SUPPORTED | Page 7 states only the age-15 written-test minimum and does not state the road-test minimum comparison. | State only that page 7 requires a teen to be at least 15 years old for the written test. |
| sec01-R09 | PARTIALLY_SUPPORTED | Page 8 states the White Card requirement but does not mention Blue or Pink cards on that page. | State only that a teen road-test applicant must be at least 16 and bring the White Card proving completed driver education. |
| sec02-F08 | PARTIALLY_SUPPORTED | The page says present, not hand in or surrender, the other licenses and cards. | A Minnesota license is issued only after you present all other driver's licenses and identification cards you hold to DVS. |
| sec02-R04 | PARTIALLY_SUPPORTED | Page 13 states the $10 written-test fee but does not state the road-test retest amount for comparison. | Two consecutive failed written tests trigger a $10 fee for the third and any subsequent tests. |
| sec02-R05 | PARTIALLY_SUPPORTED | Page 15 states the $20 road-test fee but does not state the $10 written-test fee to support double. | The road test retest fee is $20 for each attempt after two failures. |
| sec03-F35 | PARTIALLY_SUPPORTED | Page 19 states the no-wait and permit/certificate/log requirements only for farm work; the special-medical exception is on page 20, not this page. | Limit the statement to a restricted farm work license on page 19, or cite page 20 for the special medical license. |
| sec07-R01 | PARTIALLY_SUPPORTED | Omits 'at least' and 'alternately'; states fixed 100/300 feet distances. | School buses use yellow and red lights that flash alternately, with yellow activated at least 100 feet before stopping in zones of 35 mph or less and at least 300 feet before in zones over 35 mph. |
| sec07-R05 | PARTIALLY_SUPPORTED | Page 46 states owner/lessee petty misdemeanor rule but does not state driver misdemeanor penalty on that page. | On page 46, the owner or lessee is guilty of a petty misdemeanor unless they prove another person was driving, in which case the driver is charged; the driver misdemeanor penalty is stated on page 45. |
| sec09-R06 | PARTIALLY_SUPPORTED | Page 63 describes only the left-side No Passing Zone warning sign and does not mention the regulatory Do Not Pass sign. | The No Passing Zone warning sign is on the left side of a two-way highway at the start of the zone. |
| sec14-R17 | PARTIALLY_SUPPORTED | Page 98 states the 0.02 interlock threshold but does not state the 0.04 and 0.08 limits for comparison. | The ignition interlock prevents the vehicle from starting if it detects 0.02 percent or more. |

Full findings with verbatim handbook quotes: runs/2026-10-28-rdmv-mn-class-d/sources/private/audits/muse-fact-check/ (private, gitignored).
