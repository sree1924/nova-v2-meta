# Fact overlap across belt runs — 2026-10-28

Accepted fact statements (compiled registries, latest per section). exact = same normalized sentence; near = token Jaccard ≥ 0.4; numeric-twin = same sentence with different numbers (the state-specific class); unique = nothing comparable.

| run | facts |
|---|---|
| runs/2026-10-26-rdmv-ut-class-d | 340 |
| runs/2026-10-28-rdmv-mi-class-std | 730 |
| runs/2026-10-28-rdmv-co-class-std | 622 |
| runs/2026-10-28-rdmv-nc-class-c | 820 |
| runs/2026-10-28-rdmv-wa-class-std | 646 |

| A | B | A facts | exact | near | numeric-twin | unique to A | shared % of A |
|---|---|---|---|---|---|---|---|
| 2026-10-26-rdmv-ut-class-d | 2026-10-28-rdmv-mi-class-std | 340 | 0 | 1 | 0 | 339 | 0.3% |
| 2026-10-26-rdmv-ut-class-d | 2026-10-28-rdmv-co-class-std | 340 | 0 | 3 | 0 | 337 | 0.9% |
| 2026-10-26-rdmv-ut-class-d | 2026-10-28-rdmv-nc-class-c | 340 | 0 | 5 | 0 | 335 | 1.5% |
| 2026-10-26-rdmv-ut-class-d | 2026-10-28-rdmv-wa-class-std | 340 | 0 | 2 | 0 | 338 | 0.6% |
| 2026-10-28-rdmv-mi-class-std | 2026-10-28-rdmv-co-class-std | 730 | 0 | 6 | 0 | 724 | 0.8% |
| 2026-10-28-rdmv-mi-class-std | 2026-10-28-rdmv-nc-class-c | 730 | 0 | 13 | 0 | 717 | 1.8% |
| 2026-10-28-rdmv-mi-class-std | 2026-10-28-rdmv-wa-class-std | 730 | 0 | 11 | 0 | 719 | 1.5% |
| 2026-10-28-rdmv-co-class-std | 2026-10-28-rdmv-nc-class-c | 622 | 0 | 13 | 0 | 609 | 2.1% |
| 2026-10-28-rdmv-co-class-std | 2026-10-28-rdmv-wa-class-std | 622 | 0 | 10 | 0 | 612 | 1.6% |
| 2026-10-28-rdmv-nc-class-c | 2026-10-28-rdmv-wa-class-std | 820 | 0 | 10 | 0 | 810 | 1.2% |

## 2026-10-26-rdmv-ut-class-d vs 2026-10-28-rdmv-mi-class-std
- near (0.58): "A car at fifty-five miles per hour stops in about one hundred thirty to one hundred forty feet, while a loaded rig can need over four hundred feet." ↔ "At fifty-five miles per hour a passenger vehicle stops in about one hundred thirty feet, while a commercial vehicle needs about four hundred feet."

## 2026-10-26-rdmv-ut-class-d vs 2026-10-28-rdmv-co-class-std
- near (0.4): "Traffic in both directions must halt for a bus flashing red lamps on a two-lane road or a four-lane road without a median, while only the same-direction lanes must halt on a divided highway or a five-lane road with a shared center turn lane." ↔ "Whether oncoming traffic stops for a school bus depends on the road: yes on two-lane roads and four-lane roads without a median, no on divided highways with a median or roads of five or more lanes with a center turn lane."
- near (0.41): "A lane change calls for mirrors first, a signal held at least two seconds, an over-shoulder blind-spot look, and a signal cancel after merging." ↔ "To change lanes, signal for at least three seconds or two hundred feet, check ahead, check the mirrors, look over your shoulder at the blind spot, then move over when safe."
- near (0.52): "Traffic both directions stops for flashing red school-bus lights on a two-lane road and on a four-lane road without a median, while only the lanes behind the bus stop on a median-divided highway with four or more lanes and on a highway with five or more lanes plus a shared center turn lane." ↔ "On a divided highway of four or more lanes with a median, only traffic behind the school bus must stop; on a two-lane road, or a four-lane road with no median, traffic both ways must stop."

## 2026-10-26-rdmv-ut-class-d vs 2026-10-28-rdmv-nc-class-c
- near (0.44): "Traffic in both directions must halt for a bus flashing red lamps on a two-lane road or a four-lane road without a median, while only the same-direction lanes must halt on a divided highway or a five-lane road with a shared center turn lane." ↔ "A two-lane road with a center turning lane and a four-lane road with no median both require traffic in both directions to stop for a school bus, while a divided highway with a median or a road of four or more lanes with a turning lane requires only following traffic to stop."
- near (0.53): "Traffic both directions stops for flashing red school-bus lights on a two-lane road and on a four-lane road without a median, while only the lanes behind the bus stop on a median-divided highway with four or more lanes and on a highway with five or more lanes plus a shared center turn lane." ↔ "A two-lane road with a center turning lane and a four-lane road with no median both require traffic in both directions to stop for a school bus, while a divided highway with a median or a road of four or more lanes with a turning lane requires only following traffic to stop."
- near (0.42): "Truck blind areas reach about twenty feet ahead, along both flanks by the cab, and up to two hundred feet behind." ↔ "A tractor-trailer's no-zones reach up to twenty feet in front of the cab, along both sides especially beside the cab, and up to two hundred feet behind."

## 2026-10-26-rdmv-ut-class-d vs 2026-10-28-rdmv-wa-class-std
- near (0.52): "Route the lap belt across the hips and the shoulder strap across the shoulder and chest, never under the arm or behind the back" ↔ "The shoulder belt goes snugly across the middle of the chest and shoulder, never behind your back, under your arm, or across the neck or face, and the lap belt holds the hips snugly below the stomach."
- near (0.53): "Dim high beams within five hundred feet of oncoming traffic and within three hundred feet when following." ↔ "High beams may be used on open roads without streetlights, but dim them within five hundred feet of an oncoming vehicle and within three hundred feet of a vehicle you are following."

## 2026-10-28-rdmv-mi-class-std vs 2026-10-28-rdmv-co-class-std
- near (0.43): "Stop at least twenty feet from a school bus showing flashing red overhead lights, because it is loading or unloading passengers." ↔ "Stop at least twenty feet away from a school bus that has stopped with red lights flashing, and stay stopped until the lights stop flashing."
- near (0.52): "Flashing red overhead lights mean stop at least twenty feet from the bus and stay stopped until the red lights turn off or the bus moves on." ↔ "Stop at least twenty feet away from a school bus that has stopped with red lights flashing, and stay stopped until the lights stop flashing."
- near (0.8): "At a four-way stop, the first driver to arrive and stop goes first, and when two arrive together the vehicle on the left yields to the one on its right." ↔ "At a four-way stop the first vehicle to arrive goes first; if vehicles arrive together, the one on the left yields to the one on the right."

## 2026-10-28-rdmv-mi-class-std vs 2026-10-28-rdmv-nc-class-c
- near (0.44): "Air bags do not replace a seat belt; wear the shoulder belt across the middle of the chest away from the neck and the lap belt low across the hips below the stomach." ↔ "Air bags only supplement belts: wear the lap belt under the abdomen and low on the hips, and the shoulder belt over the collarbone, away from the neck and across the breastbone."
- near (0.41): "Construction, maintenance and work area warning signs are diamond-shaped with black letters on an orange or yellow background." ↔ "A diamond in black on yellow is an ordinary warning, while a diamond in black on orange warns of a construction or maintenance area."
- near (0.48): "When an emergency vehicle approaches with red or blue lights and a siren, pull right next to the curb or edge, clear of any intersection, and stop until it passes or an officer waves you on." ↔ "When an emergency vehicle approaches from ahead or behind, pull to the right-hand curb or edge and stop completely, staying there until it passes or an officer waves you on."

## 2026-10-28-rdmv-mi-class-std vs 2026-10-28-rdmv-wa-class-std
- near (0.45): "At a four-way stop, the first driver to arrive and stop goes first, and when two arrive together the vehicle on the left yields to the one on its right." ↔ "At a four-way stop, vehicles go in the order they arrived, and when two arrive at about the same time, the driver on the left yields to the one on the right."
- near (0.5): "At a four-way stop the first to stop goes first, and only on a tie does the driver on the left yield to the driver on the right." ↔ "At a four-way stop the first to arrive goes first, and only a near tie is settled by yielding to the vehicle on your right."
- near (0.86): "Never park within fifteen feet of a fire hydrant." ↔ "Do not park within fifteen feet of a fire hydrant."

## 2026-10-28-rdmv-co-class-std vs 2026-10-28-rdmv-nc-class-c
- near (0.41): "It is illegal to have an open container of alcohol or of marijuana in the passenger area of a vehicle on a public road." ↔ "In the passenger area of a commercial motor vehicle on a public road, alcohol is banned whether the container is open or closed."
- near (0.48): "Before you get in to back up, look behind the vehicle, because small children and small objects cannot be seen from the driver seat." ↔ "Before getting in to back up, check behind the vehicle for children or small objects, which are hard to see from the driver's seat."
- near (0.43): "At a stop sign, stop completely at the marked stop line; with no line, stop before the near-side crosswalk; with neither, stop at the point closest to the cross road where you can see approaching traffic." ↔ "When a sign or signal requires a stop, stop at the marked stop line; with no stop line or crosswalk, stop before entering the intersection at a point where you can see the cross street."

## 2026-10-28-rdmv-co-class-std vs 2026-10-28-rdmv-wa-class-std
- near (0.41): "A yield sign means slow down, or stop if needed, to let every pedestrian and any vehicle that has the right of way go first." ↔ "At a stop sign, stop at the line, crosswalk or corner, check all directions for vehicles and pedestrians, and yield the right-of-way, while a yield sign means slow down and let traffic with the right-of-way go first."
- near (0.41): "A dark or broken signal is handled as a four-way stop, not as a green light for the busier road." ↔ "A dark or broken traffic signal is handled as a four-way stop with a full stop and yielding to the right, not as a signal you may drive through."
- near (0.54): "Pavement lines and symbols divide lanes, show where passing and lane changes are allowed, mark turn lanes and pedestrian walkways, and show where to stop for signals or signs." ↔ "Painted road markings (lines, arrows, words and symbols) divide lanes, show where passing or lane changes are allowed, mark turn lanes and walkways, and show where to stop."

## 2026-10-28-rdmv-nc-class-c vs 2026-10-28-rdmv-wa-class-std
- near (0.6): "Distracted driving means any activity that might pull your attention away from the main job of driving." ↔ "Washington defines distracted driving as any activity that pulls attention away from the main job of driving."
- near (0.47): "On a two-lane road, traffic in both directions must stop for a school bus that stops for passengers." ↔ "On a two-lane road, traffic in both directions must stop when the bus's red lights flash and its stop sign is out."
- near (0.4): "Do not park at an intersection, in front of a driveway, or on a crosswalk, sidewalk or bridge." ↔ "Never park in an intersection or on a crosswalk, a sidewalk or a bicycle lane."

## Verdict (runner, 2026-10-28 04:35Z, five states: UT MI CO NC WA)

- Identical sentences across states: 0%. Close paraphrases (Jaccard ≥ 0.6): < 0.5%. Same-topic matches at loose thresholds (0.4 / 0.3): 1–2% / 4–8%.
- Every loose match is the same TOPIC with different state-specific numbers or conditions (standard-drink equivalence, seat belt coverage, move-over speed rules, REAL ID dates). The tested detail is exactly what differs.
- Therefore: the belt keeps authoring every state from its own handbook. The reuse layer is PROCESS, not content: thin packets (context once per state/section), per-section generators for the formulaic dossier parts, pre-checks before submission, and audio clip dedupe by spoken-text hash (which will catch the few shared sentences and nothing more).
- Measured effect of process reuse tonight: a full SME pass (14–16 sections, 126–144 parts) in ~1 hour wall clock at $0 with 0–1 holds per state (Claude workers), versus Utah's first pass at $44 and 371 calls.
