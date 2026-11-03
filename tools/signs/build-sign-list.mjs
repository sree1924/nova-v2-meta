// build-sign-list.mjs — the national road-sign list (one entry per sign a learner's-permit test can ask about), with
// the image prompt per sign and, per state, which signs that state's handbook cards actually mention.
// Output: coordination/SIGNS/sign-list.json (signs[] + by_state{XX:[ids]} + counts). MUTCD designations are from
// the belt author's knowledge of the Manual and are marked `(verify)`: the picture is judged by the shape/colour/legend
// spec below (Meta vision QA), never by the code. Pavement markings and signal heads are NOT signs and live elsewhere.
// Usage: node tools/signs/build-sign-list.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(ROOT, 'coordination/SIGNS/sign-list.json');
fs.mkdirSync(path.dirname(OUT), { recursive: true });

// [id, name, mutcd, category, visual spec (what the picture must show), meaning (one sentence, learner-facing), match terms]
const S = [
  // Regulatory — red/white
  ['stop', 'STOP', 'R1-1', 'regulatory', 'red octagon, white border, white legend STOP', 'Come to a complete stop; go only when the way is clear and it is your turn.', ['stop sign', 'octagon']],
  ['yield', 'YIELD', 'R1-2', 'regulatory', 'downward-pointing white triangle with a wide red border and red legend YIELD', 'Slow down and give the right-of-way; stop if needed.', ['yield sign', 'yield']],
  ['do-not-enter', 'DO NOT ENTER', 'R5-1', 'regulatory', 'white square with a red circle and a white horizontal bar, legend DO NOT ENTER in black above and below the circle', 'Do not drive in; you would be going the wrong way.', ['do not enter']],
  ['wrong-way', 'WRONG WAY', 'R5-1a', 'regulatory', 'red horizontal rectangle with white legend WRONG WAY', 'You are driving against traffic; pull over and turn around safely.', ['wrong way']],
  ['no-left-turn', 'No Left Turn', 'R3-2', 'regulatory', 'white square with a black left-turn arrow inside a red circle with a red diagonal slash', 'Left turns are not allowed here.', ['no left turn']],
  ['no-right-turn', 'No Right Turn', 'R3-1', 'regulatory', 'white square with a black right-turn arrow inside a red circle with a red diagonal slash', 'Right turns are not allowed here.', ['no right turn']],
  ['no-u-turn', 'No U-Turn', 'R3-4', 'regulatory', 'white square with a black U-turn arrow inside a red circle with a red diagonal slash', 'U-turns are not allowed here.', ['no u-turn', 'no u turn']],
  ['no-turn-on-red', 'NO TURN ON RED', 'R10-11', 'regulatory', 'white vertical rectangle with black legend NO TURN ON RED', 'Wait for a green light before turning, even if the way is clear.', ['no turn on red']],
  ['no-trucks', 'No Trucks', 'R5-2', 'regulatory', 'white square with a black truck symbol inside a red circle with a red diagonal slash', 'Trucks are not allowed on this road.', ['no trucks']],
  ['no-bicycles', 'No Bicycles', 'R5-6', 'regulatory', 'white square with a black bicycle symbol inside a red circle with a red diagonal slash', 'Bicycles are not allowed here.', ['no bicycles']],
  ['no-pedestrians', 'No Pedestrians', 'R9-3', 'regulatory', 'white square with a black walking-person symbol inside a red circle with a red diagonal slash', 'Pedestrians are not allowed here.', ['no pedestrians']],
  ['no-parking', 'No Parking', 'R8-3', 'regulatory', 'white vertical rectangle with a black letter P inside a red circle with a red diagonal slash', 'Parking is not allowed here.', ['no parking']],
  ['do-not-pass', 'DO NOT PASS', 'R4-1', 'regulatory', 'white vertical rectangle with black legend DO NOT PASS', 'Passing other vehicles is not allowed in this zone.', ['do not pass', 'no passing']],
  ['pass-with-care', 'PASS WITH CARE', 'R4-2', 'regulatory', 'white vertical rectangle with black legend PASS WITH CARE', 'You may pass again when it is safe.', ['pass with care']],
  ['keep-right', 'KEEP RIGHT', 'R4-7', 'regulatory', 'white vertical rectangle with black legend KEEP RIGHT and an arrow curving right around a black vertical obstruction bar', 'Stay to the right of the divider or obstruction ahead.', ['keep right']],
  ['keep-left', 'KEEP LEFT', 'R4-8', 'regulatory', 'white vertical rectangle with black legend KEEP LEFT and an arrow curving left around a black vertical obstruction bar', 'Stay to the left of the divider or obstruction ahead.', ['keep left']],
  ['slower-traffic-keep-right', 'SLOWER TRAFFIC KEEP RIGHT', 'R4-3', 'regulatory', 'white vertical rectangle with black legend SLOWER TRAFFIC KEEP RIGHT', 'If you are driving slower than others, use the right lane.', ['slower traffic keep right', 'slow traffic']],
  ['speed-limit', 'SPEED LIMIT', 'R2-1', 'regulatory', 'white vertical rectangle with black legend SPEED LIMIT above large black numerals 55', 'The maximum legal speed under ideal conditions.', ['speed limit']],
  ['minimum-speed', 'MINIMUM SPEED', 'R2-4', 'regulatory', 'white vertical rectangle with black legend MINIMUM SPEED above large black numerals 40', 'Do not drive slower than this unless conditions require it.', ['minimum speed']],
  ['one-way', 'ONE WAY', 'R6-1', 'regulatory', 'black horizontal rectangle with a white arrow pointing right and white legend ONE WAY inside the arrow', 'Traffic moves only in the direction of the arrow.', ['one way', 'one-way']],
  ['divided-highway-crossing', 'Divided Highway Crossing', 'R6-3', 'regulatory', 'white square with a black diagram of a divided highway and arrows showing traffic directions', 'You are crossing a divided highway; traffic on each side moves one way.', ['divided highway crossing']],
  ['left-turn-only', 'Left Lane Must Turn Left', 'R3-7', 'regulatory', 'white vertical rectangle with black legend LEFT LANE MUST TURN LEFT and a left arrow', 'Vehicles in this lane must turn left.', ['must turn left', 'left turn only']],
  ['lane-use-control', 'Lane Use Control (straight or right)', 'R3-6', 'regulatory', 'white vertical rectangle with black arrows showing straight-ahead and right-turn movements allowed from the lane', 'This lane may go straight or turn as the arrows show.', ['lane use', 'lane control sign']],
  ['center-lane-left-turn-only', 'Center Lane Left Turn Only', 'R3-9b', 'regulatory', 'white vertical rectangle with black legend CENTER LANE LEFT TURN ONLY and opposing left-turn arrows', 'The center lane is reserved for left turns from either direction; do not use it as a through or passing lane.' /* fact-check 2026-11-01: DC describes a different 3-lane passing layout; TWLTL meaning kept, reworded */, ['center lane', 'two-way left-turn', 'center turn lane']],
  ['hov-lane', 'HOV Lane', 'R3-10', 'regulatory', 'white vertical rectangle with a black diamond symbol and black legend HOV 2+ ONLY', 'Only vehicles with the posted minimum number of people may use this lane.', ['hov', 'carpool', 'diamond lane']],
  ['reserved-parking-accessible', 'Reserved Parking (Accessible)', 'R7-8', 'regulatory', 'white vertical rectangle with black legend RESERVED PARKING and the blue-and-white wheelchair accessibility symbol', 'Parking here is only for vehicles with a disability permit.', ['reserved parking', 'handicap', 'accessible parking', 'disabled parking']],
  ['road-closed', 'ROAD CLOSED', 'R11-2', 'regulatory', 'white horizontal rectangle with black legend ROAD CLOSED', 'The road ahead is closed to traffic; only authorized vehicles may enter.' /* fact-check 2026-11-01: ID p.47 */, ['road closed']],
  ['walk-left-facing-traffic', 'Pedestrians Walk Facing Traffic', 'R9-1', 'regulatory', 'white vertical rectangle with black legend WALK ON LEFT FACING TRAFFIC', 'Where there is no sidewalk, walk on the left so you face oncoming cars.', ['facing traffic', 'walk on left']],
  // Warning — yellow diamonds
  ['turn-right', 'Turn (sharp)', 'W1-1', 'warning', 'yellow diamond with a black right-angle turn arrow', 'A sharp turn ahead; slow down before it.', ['sharp turn', 'turn sign']],
  ['curve-right', 'Curve', 'W1-2', 'warning', 'yellow diamond with a black curved arrow bending right', 'The road curves ahead; slow down and stay in your lane.', ['curve']],
  ['reverse-curve', 'Reverse Curve', 'W1-4', 'warning', 'yellow diamond with a black S-shaped arrow bending right then left', 'Two curves ahead in opposite directions.', ['reverse curve']],
  ['winding-road', 'Winding Road', 'W1-5', 'warning', 'yellow diamond with a black wavy arrow of three or more bends', 'A series of curves ahead; slow down.', ['winding road']],
  ['chevron', 'Chevron Alignment', 'W1-8', 'warning', 'yellow vertical rectangle with one large black chevron arrow pointing right', 'The road bends sharply in the direction the chevron points.', ['chevron']],
  ['large-arrow', 'One-Direction Large Arrow', 'W1-6', 'warning', 'yellow horizontal rectangle with one large black arrow pointing right', 'Warns of a sharp change in direction ahead; slow down before the curve.' /* fact-check 2026-11-01: PA p.18, MO p.47 */, ['large arrow']],
  ['crossroad', 'Crossroad', 'W2-1', 'warning', 'yellow diamond with a black plus-shaped cross symbol', 'A four-way intersection ahead; watch for crossing traffic.', ['crossroad', 'cross road', 'intersection ahead']],
  ['side-road', 'Side Road', 'W2-2', 'warning', 'yellow diamond with a black vertical line and a shorter black line joining it from the right', 'A road enters from the side ahead.', ['side road']],
  ['t-intersection', 'T-Intersection', 'W2-4', 'warning', 'yellow diamond with a black T-shaped symbol', 'The road ends ahead at a T; you must turn left or right.', ['t-intersection', 't intersection']],
  ['y-intersection', 'Y-Intersection', 'W2-5', 'warning', 'yellow diamond with a black Y-shaped symbol', 'The road splits ahead into two branches.', ['y-intersection', 'y intersection']],
  ['roundabout-ahead', 'Circular Intersection (Roundabout)', 'W2-6', 'warning', 'yellow diamond with three black arrows forming a counter-clockwise circle', 'A roundabout ahead; slow down and yield to traffic already in the circle.', ['roundabout', 'traffic circle']],
  ['stop-ahead', 'Stop Ahead', 'W3-1', 'warning', 'yellow diamond with a small red STOP octagon symbol and a black upward arrow', 'A stop sign is ahead; begin slowing now.', ['stop ahead']],
  ['yield-ahead', 'Yield Ahead', 'W3-2', 'warning', 'yellow diamond with a small red-and-white YIELD triangle symbol and a black upward arrow', 'A yield sign is ahead; be ready to slow or stop.', ['yield ahead']],
  ['signal-ahead', 'Signal Ahead', 'W3-3', 'warning', 'yellow diamond with a black traffic-signal symbol showing red, yellow and green lenses', 'A traffic signal is ahead; be ready to stop.', ['signal ahead']],
  ['merge', 'Merge', 'W4-1', 'warning', 'yellow diamond with a black vertical arrow and a second line joining it from the right', 'Traffic is merging from the right; adjust speed and position.', ['merge', 'merging traffic']],
  ['lane-ends', 'Lane Ends', 'W4-2', 'warning', 'yellow diamond with two black lines where the right one tapers into the left', 'The right lane ends ahead; merge left, yielding to traffic already in the open lane.' /* fact-check 2026-11-01: MI p.59; zipper guidance (CO, IL) means "early" was wrong */, ['lane ends', 'lane reduction']],
  ['added-lane', 'Added Lane', 'W4-3', 'warning', 'yellow diamond with two black parallel arrows, one joining from the right without merging', 'A lane is added from the right; no merge needed.', ['added lane']],
  ['two-way-traffic', 'Two-Way Traffic', 'W6-3', 'warning', 'yellow diamond with two black vertical arrows pointing in opposite directions', 'You are entering a road with traffic in both directions.', ['two-way traffic', 'two way traffic']],
  ['divided-highway-begins', 'Divided Highway Begins', 'W6-1', 'warning', 'yellow diamond with two black arrows splitting around a black island', 'The road ahead becomes a divided highway; keep right of the median.', ['divided highway begins', 'divided highway ahead']],
  ['divided-highway-ends', 'Divided Highway Ends', 'W6-2', 'warning', 'yellow diamond with two black arrows joining after a black island', 'The divided highway ends; two-way traffic ahead.', ['divided highway ends']],
  ['hill', 'Hill (Steep Grade)', 'W7-1', 'warning', 'yellow diamond with a black truck on a downward slope and legend 8%', 'A steep downhill ahead; shift to a lower gear and control speed.', ['hill', 'steep grade', 'downgrade']],
  ['bump', 'Bump', 'W8-1', 'warning', 'yellow diamond with black legend BUMP', 'A bump in the road ahead; slow down.', ['bump']],
  ['dip', 'Dip', 'W8-2', 'warning', 'yellow diamond with black legend DIP', 'A dip in the road ahead; slow down.', ['dip']],
  ['pavement-ends', 'Pavement Ends', 'W8-3', 'warning', 'yellow diamond with black legend PAVEMENT ENDS', 'The paved road ends ahead; expect gravel or dirt.', ['pavement ends']],
  ['slippery-when-wet', 'Slippery When Wet', 'W8-5', 'warning', 'yellow diamond with a black car symbol with wavy skid lines behind it', 'The road is slippery when wet; slow down and avoid sudden moves.', ['slippery']],
  ['loose-gravel', 'Loose Gravel', 'W8-7', 'warning', 'yellow diamond with a black car symbol and flying gravel dots', 'Loose gravel ahead; slow down and keep distance.', ['loose gravel', 'gravel']],
  ['low-shoulder', 'Low Shoulder', 'W8-9', 'warning', 'yellow diamond with black legend LOW SHOULDER', 'The shoulder is lower than the road; do not drift off the edge.', ['low shoulder', 'soft shoulder', 'shoulder drop']],
  ['bridge-ices', 'Bridge Ices Before Road', 'W8-13', 'warning', 'yellow diamond with black legend BRIDGE ICES BEFORE ROAD', 'Bridges freeze first; slow down in cold weather.', ['bridge ices', 'ices before road', 'bridge may be icy']],
  ['narrow-bridge', 'Narrow Bridge', 'W5-2', 'warning', 'yellow diamond with black legend NARROW BRIDGE', 'The bridge ahead is narrower than the road.', ['narrow bridge']],
  ['road-narrows', 'Road Narrows', 'W5-1', 'warning', 'yellow diamond with black legend ROAD NARROWS', 'The road gets narrower ahead.', ['road narrows']],
  ['low-clearance', 'Low Clearance', 'W12-2', 'warning', 'yellow diamond with black legend 12 FT 6 IN between two black arrows pointing up and down', 'The overpass ahead is low; tall vehicles cannot pass.', ['low clearance', 'clearance']],
  ['railroad-advance', 'Railroad Crossing Advance Warning', 'W10-1', 'warning', 'yellow circle with a large black X and the letters R R in two quadrants', 'A railroad crossing is ahead; slow down, look and listen.', ['railroad', 'advance warning', 'round yellow']],
  ['crossbuck', 'Railroad Crossbuck', 'R15-1', 'regulatory', 'white X-shaped crossbuck with black legend: the single word RAILROAD on one arm and the single word CROSSING on the other arm, each word appearing exactly once', 'You are at the tracks; yield to any train, stop if one is coming.', ['crossbuck']],
  ['pedestrian-crossing', 'Pedestrian Crossing', 'W11-2', 'warning', 'fluorescent yellow-green diamond with a black walking-person symbol', 'Pedestrians may be crossing ahead; be ready to stop.', ['pedestrian crossing', 'pedestrian sign']],
  ['bicycle-crossing', 'Bicycle Crossing', 'W11-1', 'warning', 'fluorescent yellow-green diamond with a black bicycle symbol' /* fact-check 2026-11-01: handbooks state bicycle signs are fluorescent yellow-green */, 'Bicycles may be crossing or sharing the road ahead.', ['bicycle crossing', 'bicycle sign', 'bike crossing']],
  ['deer-crossing', 'Deer Crossing', 'W11-3', 'warning', 'yellow diamond with a black leaping-deer symbol', 'Deer often cross here, especially at dawn and dusk.', ['deer']],
  ['cattle-crossing', 'Cattle Crossing', 'W11-4', 'warning', 'yellow diamond with a black cow symbol', 'Livestock may be on the road ahead.', ['cattle', 'livestock']],
  ['truck-crossing', 'Truck Crossing', 'W11-10', 'warning', 'yellow diamond with a black truck symbol', 'Trucks may be entering or crossing ahead.', ['truck crossing', 'truck sign']],
  ['playground', 'Playground', 'W15-1', 'warning', 'yellow diamond with a black child-on-swing symbol', 'A playground is nearby; watch for children.', ['playground']],
  ['fire-station', 'Fire Station (Emergency Vehicle)', 'W11-8', 'warning', 'yellow diamond with a black fire-truck symbol', 'Emergency vehicles may enter the road ahead.', ['fire station', 'emergency vehicle sign']],
  ['dead-end', 'DEAD END', 'W14-1', 'warning', 'yellow diamond with black legend DEAD END', 'The road ahead has no exit.', ['dead end']],
  ['no-outlet', 'NO OUTLET', 'W14-2', 'warning', 'yellow diamond with black legend NO OUTLET', 'The street network ahead has no other exit.', ['no outlet']],
  ['no-passing-zone', 'No Passing Zone (pennant)', 'W14-3', 'warning', 'yellow sideways triangle (pennant) pointing right with black legend NO PASSING ZONE', 'Do not pass; this pennant marks the start of a no-passing zone on the left side of the road.', ['no passing zone', 'pennant']],
  ['advisory-speed', 'Advisory Speed plaque', 'W13-1P', 'warning', 'yellow square plaque with black numerals 35 and legend M.P.H.', 'The safe speed for the curve or hazard above this plaque.', ['advisory speed']],
  // School — fluorescent yellow-green
  ['school', 'School', 'S1-1', 'school', 'fluorescent yellow-green pentagon (pointed top) with two black children walking', 'You are near a school; watch for children and obey the school speed limit.', ['school sign', 'school zone', 'pentagon']],
  ['school-crossing', 'School Crossing', 'S1-1 + W16-7P', 'school', 'fluorescent yellow-green pentagon with two black children and a black diagonal-arrow plaque below', 'A school crossing is here; stop for children in the crosswalk.', ['school crossing', 'school crosswalk']],
  ['school-speed-limit', 'School Speed Limit When Flashing', 'S5-1', 'school', 'white vertical sign with a fluorescent yellow-green panel at the top reading SCHOOL, then black legend SPEED LIMIT 20 WHEN FLASHING' /* QA 2026-11-01: spec was wrong, the SCHOOL panel is yellow-green by standard */, 'Obey the lower speed while the beacons flash.', ['school speed', 'when flashing']],
  // Work zone — orange
  ['road-work-ahead', 'ROAD WORK AHEAD', 'W20-1', 'work-zone', 'orange diamond with black legend ROAD WORK AHEAD', 'A work zone is ahead; slow down and watch for workers.', ['road work', 'work zone sign', 'construction sign', 'orange sign']],
  ['workers-ahead', 'Workers (symbol)', 'W21-1a', 'work-zone', 'orange diamond with a black worker-with-shovel symbol', 'Workers are on or near the road; slow down.', ['workers', 'worker symbol']],
  ['flagger-ahead', 'Flagger (symbol)', 'W20-7a', 'work-zone', 'orange diamond with a black flagger-holding-flag symbol', 'A flagger is directing traffic ahead; obey the paddle or flag.', ['flagger']],
  ['detour', 'DETOUR', 'M4-8', 'work-zone', 'orange horizontal rectangle with black legend DETOUR and an arrow', 'Follow the detour route around the closed road.', ['detour']],
  ['flagger-stop-paddle', 'Flagger STOP/SLOW paddle', 'STOP/SLOW paddle', 'work-zone', 'hand-held paddle on a staff: red octagon face with white legend STOP', 'When the flagger shows STOP, stop and wait; SLOW means proceed slowly.', ['paddle', 'stop/slow']],
  // Guide / services
  ['interstate-shield', 'Interstate Route Marker', 'M1-1', 'guide', 'red-white-and-blue shield with white legend INTERSTATE on the red band and large white numerals 80 on blue', 'Marks an Interstate highway route number.', ['interstate', 'route marker', 'shield']],
  ['us-route', 'U.S. Route Marker', 'M1-4', 'guide', 'white shield outline with black numerals 66', 'Marks a U.S. numbered highway.', ['u.s. route', 'us route']],
  ['exit-sign', 'EXIT (green guide)', 'E5-1', 'guide', 'green horizontal rectangle with white legend EXIT 24 and a white arrow', 'Marks the exit ramp from a freeway.', ['exit sign', 'exit ramp sign', 'green sign']],
  ['destination-distance', 'Destination and Distance', 'D1-1', 'guide', 'green horizontal rectangle with white legends Springfield 12 and Dayton 48', 'Shows the distance to the places listed.', ['destination', 'distance sign', 'mileage sign']],
  ['hospital', 'Hospital', 'D9-2', 'services', 'blue square with a white letter H', 'A hospital is ahead or at this exit.', ['hospital']],
  ['gas', 'Gas (fuel) service', 'D9-7', 'services', 'blue square with a white fuel-pump symbol', 'Fuel is available at this exit.', ['gas', 'fuel', 'service sign', 'blue sign']],
  ['rest-area', 'REST AREA', 'D5-2', 'services', 'blue horizontal rectangle with white legend REST AREA 1 MILE', 'A rest area is ahead.', ['rest area']],
  ['accessible', 'Accessible (wheelchair symbol)', 'D9-6', 'services', 'blue square with the white wheelchair accessibility symbol', 'Facilities or parking for people with disabilities.', ['accessible', 'wheelchair']],
  ['recreation-brown', 'Recreational area (brown)', 'RG-series', 'guide', 'brown horizontal rectangle with white legend STATE PARK and a white arrow', 'Points to parks and recreation areas.', ['brown sign', 'recreation', 'state park']],
  ['emergency-notification', 'Railroad Emergency Notification (ENS)', 'I-13', 'guide', 'blue vertical rectangle with white legend REPORT PROBLEM OR EMERGENCY and a crossing ID number', 'Call the number to report a problem at a railroad crossing.', ['emergency notification', 'ens']],
  ['slow-moving-vehicle', 'Slow-Moving Vehicle emblem', 'SMV emblem', 'warning', 'fluorescent orange triangle with a dark red reflective border, point up', 'The vehicle ahead moves at 25 mph or less; slow down well back.', ['slow-moving', 'slow moving vehicle', 'orange triangle']],
  ['object-marker', 'Object Marker (diagonal stripes)', 'OM3-R', 'warning', 'vertical rectangle with alternating black and yellow diagonal stripes sloping down to the right', 'Marks an obstruction next to the road; keep to the side the stripes slope toward.', ['object marker']],
  ['keep-right-island', 'Keep Right (island symbol)', 'R4-7 symbol', 'regulatory', 'white vertical rectangle with a black arrow curving to the right of a black vertical bar', 'Pass to the right of the island or divider ahead.', ['island']],
];

const style = 'Flat vector illustration of exactly one United States road sign, front-facing, straight-on, no perspective, no pole, no scenery, no shadow, centered on a plain white background, nothing else in the image. Standard MUTCD colours and typeface (Highway Gothic), crisp edges.';
const signs = S.map(([id, name, mutcd, category, spec, meaning, terms]) => ({ id: 'sign-' + id, name, mutcd, mutcd_status: '(verify)', category, spec, meaning, match_terms: terms,
  prompt: `${style} The sign: ${spec}. ${/legend/.test(spec) ? 'Render the legend letters exactly as written, correctly spelled, no extra words.' : 'No text anywhere on the sign.'}${/arrow/.test(spec) && !/two black (vertical )?arrows|opposing|arrows pointing up and down/.test(spec) ? ' Every arrow has exactly ONE arrowhead (at its leading end); the other end is a plain tail, never a second head.' : ''}` }));

// Per-state membership: a sign belongs to a state when any of its match terms appears in that state's cards.
const walk = (o, out) => { if (!o || typeof o !== 'object') return; if (Array.isArray(o)) { for (const x of o) walk(x, out); return; } if (typeof o.front === 'string' && typeof o.back === 'string') { out.push(o); return; } for (const v of Object.values(o)) walk(v, out); };
const by_state = {}, hits = {};
// Utah is the pilot layout: its export lives at app-preview/data/real (no state folder).
const stateDirs = fs.readdirSync(path.join(ROOT, 'app-preview/data')).map((st) => [st, path.join(ROOT, 'app-preview/data', st, 'real/04_cards')]);
stateDirs.push(['ut', path.join(ROOT, 'app-preview/data/real/04_cards')]);
for (const [st, d] of stateDirs) {
  if (!fs.existsSync(d)) continue;
  const cards = [];
  for (const f of fs.readdirSync(d)) if (f.endsWith('.json')) walk(JSON.parse(fs.readFileSync(path.join(d, f), 'utf8')), cards);
  const text = cards.map((c) => (c.front + ' ' + c.back).toLowerCase()).join('\n');
  const present = signs.filter((s) => s.match_terms.some((t) => text.includes(t))).map((s) => s.id);
  by_state[st.toUpperCase()] = present;
  for (const id of present) hits[id] = (hits[id] || 0) + 1;
}
const out = { schema_version: 'nova-road-sign-list.v1', built_at: new Date().toISOString(), style, counts: { signs: signs.length, states: Object.keys(by_state).length, avg_signs_per_state: +(Object.values(by_state).reduce((a, b) => a + b.length, 0) / Object.keys(by_state).length).toFixed(1) },
  signs: signs.map((s) => ({ ...s, states_mentioning: hits[s.id] || 0 })), by_state };
fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
console.log(`${signs.length} signs; per-state ${JSON.stringify(Object.fromEntries(Object.entries(by_state).map(([k, v]) => [k, v.length])))}`);
console.log('never mentioned by any state:', signs.filter((s) => !hits[s.id]).map((s) => s.id).join(', ') || 'none');
