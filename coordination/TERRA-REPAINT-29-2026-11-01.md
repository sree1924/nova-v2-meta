# Terra — 29 re-paints (REJECT by review, 2026-11-01)

From: Fable (coordinator), on the founder's instruction. Founder: Sridhar.
Drop each new PNG into the flat `scratch/video-samples/nd-all-lessons/visuals/` folder under the ORIGINAL catalog
filename given below. The old `.bad-` file stays in `_quarantine_regen/` as history; the review pass will pick the
new file up. Ordered by how many learner slots the scene fills: fix the big ones first.

## 1. drv-284-two-way-traffic-yellow-arrows-sign  (slots: 2088)
- **Drop as:** `drv-284-two-way-traffic-yellow-arrows-sign.png`
- **Title:** Two-Way Traffic Warning Sign (Opposing Up/Down Arrows): Stay Right of Yellow Centerline
- **What the reviewer saw:** Rear view of a blue sedan following a white SUV in the right lane of a two-lane road with double-yellow centerline, with a red pickup approaching in the left oncoming lane; city on left, lake and mountains ahead, no road sign visible.
- **Scene PARTIAL:** Image shows undivided two-lane two-way road with double-yellow center, but the required yellow diamond warning sign with opposing up/down arrows on the right is absent.
- **Fix:** Correct two-way right-hand traffic geometry but missing the mandated two-way warning sign, requires human review.
- **Original prompt:**
```text
Modern vibrant Neo-Pop graphic-novel cel-shaded editorial illustration, crisp dark ink outlines, 16:9 widescreen, warm cinematic lighting. STRICT RULES: ZERO text, ZERO letters, ZERO numbers, ZERO words anywhere (leave all signs, paddles, papers, cards, screens, and license plates completely blank geometric shapes or pure simple icons). Strictly U.S. right-hand road traffic (yellow centerline on LEFT of travel lane, white edge line or curb on RIGHT). Daylight U.S. highway transition from a one-way urban segment into an undivided two-lane road (yellow diamond sign on right showing opposing down-left and up-right black arrows, double-yellow line down center, zero words). Zero text, zero letters, zero numbers anywhere.
```

## 2. drv-608-wrong-way-driver-coming-at-you-on-divided-freeway  (slots: 339)
- **Drop as:** `drv-608-wrong-way-driver-coming-at-you-on-divided-freeway.png`
- **Title:** Wrong-Way Driver Approaching on Divided Freeway (Most Often in Left Fast Lane at Night!): Steer Right & Flash/Honk!
- **What the reviewer saw:** Nighttime multi-lane divided freeway with city skyline ahead, four cars seen from behind with red taillights driving away, foreground silver sedan straddling the right white edge line onto the shoulder.
- **Teaching WRONG:** Without any wrong-way vehicle, learner sees normal night driving, not steer right onto shoulder away from left lane.
- **Scene MISMATCH:** Prompt requires oncoming wrong-way car with headlights in far-left fast lane; image shows only same-direction taillights ahead, no oncoming vehicle.
- **Fix:** Night freeway with correct markings but no wrong-way driver shown, so it fails to teach steer-right avoidance.
- **Original prompt:**
```text
Modern vibrant Neo-Pop graphic-novel cel-shaded editorial illustration, crisp dark ink outlines, 16:9 widescreen, warm cinematic lighting. STRICT RULES: ZERO text, ZERO letters, ZERO numbers, ZERO words anywhere (leave all signs, paddles, papers, cards, screens, and license plates completely blank geometric shapes or pure simple icons). Strictly U.S. right-hand road traffic (yellow centerline on LEFT of travel lane, white edge line or curb on RIGHT). Nighttime U.S. 3-lane divided freeway diagram (concrete median on far left, zero text): an oncoming wrong-way car's headlights appear in the far-left fast lane — our right-lane sedan brakes smoothly onto the wide right shoulder away from the left lane. Zero text, zero letters, zero numbers anywhere.
```

## 3. drv-171-sr22-financial-responsibility-certificate  (slots: 286)
- **Drop as:** `drv-171-sr22-financial-responsibility-certificate.png`
- **Title:** SR-22 / Future Financial Responsibility High-Risk Insurance Filing Kept on Record
- **What the reviewer saw:** Left foreground woman stamps a gold-sealed certificate at a desk; center shows calendar icons arrowing to a DMV-like building and a locked card becoming unlocked; right foreground smiling driver in blue car holds a card with city roads behind.
- **Rule failures:** us_right_hand_traffic: Background road on mid-right behind blue car shows solid yellow line on RIGHT edge of travel lanes with same-direction traffic, while white line is in middle - opposite of US rule requiring yellow on LEFT and white edge on RIGHT.
- **Fix:** Illustration matches SR-22 filing concept and is text-free, but fails US right-hand traffic geometry due to yellow line on right edge of mid-right road.
- **Original prompt:**
```text
Modern vibrant Neo-Pop graphic-novel cel-shaded editorial illustration, crisp dark ink outlines, 16:9 widescreen, warm cinematic lighting. STRICT RULES: ZERO text, ZERO letters, ZERO numbers, ZERO words anywhere (leave all signs, paddles, papers, cards, screens, and license plates completely blank geometric shapes or pure simple icons). Strictly U.S. right-hand road traffic (yellow centerline on LEFT of travel lane, white edge line or curb on RIGHT). Clean office/DMV desk graphic illustration (ZERO letters or numbers): an insurance agent stamps a gold-sealed shield certificate connected by a three-calendar-stack icon directly to a state DMV building emblem, unlocking a suspended driver card. Zero text, zero letters, zero numbers anywhere.
```

## 4. drv-341-waiting-to-turn-left-keep-wheels-straight  (slots: 222)
- **Drop as:** `drv-341-waiting-to-turn-left-keep-wheels-straight.png`
- **Title:** Waiting to Turn Left: Keep Front Wheels Pointed STRAIGHT Ahead Until Starting the Turn!
- **What the reviewer saw:** Split sunset intersection with blue sedan waiting to turn left in foreground of both panels; left inset shows front wheel pointed straight, right inset shows front wheel turned left.
- **Rule failures:** single_bulb_signal: Both overhead signals show two lit lenses: top red lit and bottom green lit simultaneously in left and right panels.
- **Fix:** Correct left-turn wheel lesson but REJECT for signal fault with red and green lenses lit together.
- **Original prompt:**
```text
Modern vibrant Neo-Pop graphic-novel cel-shaded editorial illustration, crisp dark ink outlines, 16:9 widescreen, warm cinematic lighting. STRICT RULES: ZERO text, ZERO letters, ZERO numbers, ZERO words anywhere (leave all signs, paddles, papers, cards, screens, and license plates completely blank geometric shapes or pure simple icons). Strictly U.S. right-hand road traffic (yellow centerline on LEFT of travel lane, white edge line or curb on RIGHT). Elevated split U.S. intersection safety diagram (zero text): Left (green checkmark) shows our blue sedan waiting to turn left with its front tires aimed STRAIGHT forward so a rear-end bump cannot shove it into oncoming cars; Right (red X) crosses out waiting with wheels pre-cocked left into oncoming traffic. Zero text, zero letters, zero numbers anywhere.
```

## 5. drv-340-dual-double-left-turn-lanes-stay-in-channel  (slots: 220)
- **Drop as:** `drv-340-dual-double-left-turn-lanes-stay-in-channel.png`
- **Title:** Dual / Multiple Left-Turn Lanes: Stay Strictly Between Dotted White Guide Stripes Through Entire Turn
- **What the reviewer saw:** Elevated rear view of a blue sedan on the left and silver SUV on the right stopped in two marked left-turn lanes at a signalized intersection with palm trees and crosswalks.
- **Rule failures:** single_bulb_signal: Overhead signal heads show two lit lenses at once - red top and green bottom both illuminated - instead of at most one.
- **Scene PARTIAL:** Shows two side-by-side left-turn lanes with blue sedan inner and silver SUV outer, but cars are stopped before intersection and curved dotted guide stripes through the turn are not shown.
- **Fix:** Dual left-lane setup is recognizable but overhead signals illegally show red and green together, requiring rejection.
- **Original prompt:**
```text
Modern vibrant Neo-Pop graphic-novel cel-shaded editorial illustration, crisp dark ink outlines, 16:9 widescreen, warm cinematic lighting. STRICT RULES: ZERO text, ZERO letters, ZERO numbers, ZERO words anywhere (leave all signs, paddles, papers, cards, screens, and license plates completely blank geometric shapes or pure simple icons). Strictly U.S. right-hand road traffic (yellow centerline on LEFT of travel lane, white edge line or curb on RIGHT). Aerial view of a major U.S. intersection with TWO side-by-side left-turn lanes separated by a curved dotted white guide line (zero text): a blue sedan in the inner turn lane and a silver SUV in the outer turn lane turn left in parallel, each staying cleanly inside its own channel. Zero text, zero letters, zero numbers anywhere.
```

## 6. drv-160-pulling-away-from-curb-signal-mirror-check  (slots: 212)
- **Drop as:** `drv-160-pulling-away-from-curb-signal-mirror-check.png`
- **Title:** Entering Traffic From Right Curb: Left Signal, Mirror + Left Shoulder Check & Yield
- **What the reviewer saw:** A blue sedan viewed from behind parked at the right curb with its left amber blinker on, on a sunny street with double-yellow on the left; an inset circle top-right shows the male driver looking over his left shoulder.
- **Scene PARTIAL:** Shows parked blue sedan at right curb with left signal and left shoulder check, but the passing red car to yield to described in prompt/title is absent; lane ahead is empty.
- **Fix:** Correct right-curb parking, left signal and shoulder-check details with US traffic and zero text, but missing the passing red car to yield to, so PARTIAL match requires human review.
- **Original prompt:**
```text
Modern vibrant Neo-Pop graphic-novel cel-shaded editorial illustration, crisp dark ink outlines, 16:9 widescreen, warm cinematic lighting. STRICT RULES: ZERO text, ZERO letters, ZERO numbers, ZERO words anywhere (leave all signs, paddles, papers, cards, screens, and license plates completely blank geometric shapes or pure simple icons). Strictly U.S. right-hand road traffic (yellow centerline on LEFT of travel lane, white edge line or curb on RIGHT). Sunny U.S. neighborhood street viewed from behind (double-yellow centerline on LEFT, right concrete curb on RIGHT, zero text): a parked blue sedan flashes its LEFT amber turn signal, waits for a passing red car in the right lane to clear, and checks over the left shoulder before pulling smoothly into the lane. Zero text, zero letters, zero numbers anywhere.
```

## 7. drv-400-scanning-left-right-left-at-every-intersection  (slots: 202)
- **Drop as:** `drv-400-scanning-left-right-left-at-every-intersection.png`
- **Title:** Left–Right–Left Intersection Visual Scan Habit (Nearest Danger Comes From the Left First!)
- **What the reviewer saw:** Rear view of a blue sedan stopped at a white stop line at a sunlit intersection, with three large blue arrows projecting left, forward-left, and right, and red traffic lights on both sides.
- **Scene PARTIAL:** Shows blue sedan at stop line with left and right scan arrows, but middle arrow points straight/forward-left, not a distinct right-then-left-again sequence; not top-down as prompted.
- **Fix:** Rules pass but scan sequence is left-ahead-right rather than clear left-right-left, needs human review.
- **Original prompt:**
```text
Modern vibrant Neo-Pop graphic-novel cel-shaded editorial illustration, crisp dark ink outlines, 16:9 widescreen, warm cinematic lighting. STRICT RULES: ZERO text, ZERO letters, ZERO numbers, ZERO words anywhere (leave all signs, paddles, papers, cards, screens, and license plates completely blank geometric shapes or pure simple icons). Strictly U.S. right-hand road traffic (yellow centerline on LEFT of travel lane, white edge line or curb on RIGHT). Top-down U.S. intersection approach diagram behind our blue sedan at the stop line (zero text or numbers): three numbered-by-color sequential sightline cones sweep (1) LEFT along the nearest cross-traffic lane, (2) RIGHT along the far lane, and (3) LEFT again right before moving. Zero text, zero letters, zero numbers anywhere.
```

## 8. drv-334-roundabout-single-lane-yield-left-counterclockwise  (slots: 192)
- **Drop as:** `drv-334-roundabout-single-lane-yield-left-counterclockwise.png`
- **Title:** Single-Lane Roundabout Routine: Slow Down, Yield to Walkers & Left Circulating Traffic, Signal Right to Exit
- **What the reviewer saw:** Bird's-eye view of a landscaped single-lane roundabout with central island, blue sedan stopped at shark-teeth yield line in foreground and red sedan circulating on the right side with green counter-clockwise arrows.
- **Teaching WRONG:** Blue at south entry should yield to traffic from left/west, but red conflict car is shown on right/east already past the entry, teaching yield to the wrong direction.
- **Scene PARTIAL:** Roundabout with yield and CCW arrows present, but red circulating car is on the right/east side of the entry, not approaching from the left as prompt requires.
- **Fix:** Roundabout markings correct but circulating red car is positioned on the wrong side for a left-yield lesson, teaching incorrect priority.
- **Original prompt:**
```text
Modern vibrant Neo-Pop graphic-novel cel-shaded editorial illustration, crisp dark ink outlines, 16:9 widescreen, warm cinematic lighting. STRICT RULES: ZERO text, ZERO letters, ZERO numbers, ZERO words anywhere (leave all signs, paddles, papers, cards, screens, and license plates completely blank geometric shapes or pure simple icons). Strictly U.S. right-hand road traffic (yellow centerline on LEFT of travel lane, white edge line or curb on RIGHT). Crisp bird's-eye view of a landscaped U.S. single-lane roundabout (counter-clockwise flow around central island, white shark-teeth yield lines, zero text): our blue sedan yields at entry for a red car circulating from the LEFT, then follows a green counter-clockwise path flashing its RIGHT blinker to exit. Zero text, zero letters, zero numbers anywhere.
```

## 9. drv-403-pedestrian-walking-facing-traffic-left-shoulder  (slots: 160)
- **Drop as:** `drv-403-pedestrian-walking-facing-traffic-left-shoulder.png`
- **Title:** Roads Without Sidewalks: Pedestrians Walk on the LEFT Shoulder Facing Oncoming Traffic
- **What the reviewer saw:** A woman in a yellow reflective vest walks on the grassy far-left shoulder facing the camera in the foreground, while a black SUV in the right lane drives away from the camera into the distance on a sunny rural two-lane road.
- **Teaching WRONG:** Left-shoulder walker faces toward camera/foreground while left-lane oncoming traffic would approach from behind her toward foreground; she walks with her back to oncoming traffic instead of facing it, teaching the unsafe direction.
- **Scene PARTIAL:** Rural two-lane road with no sidewalks and vest-wearing walker on far-left shoulder matches, but walker faces toward foreground while the adjacent left lane traffic would come toward foreground, so she is not facing oncoming traffic and no oncoming front-facing car is shown.
- **Fix:** Walker is placed on left shoulder but faces the wrong way, walking with adjacent traffic rather than facing oncoming traffic, teaching the opposite of the rule.
- **Original prompt:**
```text
Modern vibrant Neo-Pop graphic-novel cel-shaded editorial illustration, crisp dark ink outlines, 16:9 widescreen, warm cinematic lighting. STRICT RULES: ZERO text, ZERO letters, ZERO numbers, ZERO words anywhere (leave all signs, paddles, papers, cards, screens, and license plates completely blank geometric shapes or pure simple icons). Strictly U.S. right-hand road traffic (yellow centerline on LEFT of travel lane, white edge line or curb on RIGHT). Sunny rural U.S. two-lane country road with no sidewalks (dashed yellow centerline, grassy shoulders, zero text): a walker wearing a bright yellow vest walks prudently along the far-LEFT shoulder FACING oncoming southbound cars so both see each other clearly. Zero text, zero letters, zero numbers anywhere.
```

## 10. drv-348-turnabout-definition-safest-go-around-block  (slots: 142)
- **Drop as:** `drv-348-turnabout-definition-safest-go-around-block.png`
- **Title:** Safest Way to Reverse Direction in Busy Traffic: Drive Around the Block Instead of Mid-Street Turnabout!
- **What the reviewer saw:** Top-down aerial of a square city block with a blue sedan on the top road and thick green arrows forming a clockwise loop around the central building via four right turns.
- **Scene PARTIAL:** Shows blue sedan and green clockwise right-turn loop around block, but risky mid-block U-turn with red X described in prompt is absent.
- **Fix:** Clean U.S. right-hand aerial go-around-the-block diagram with no text violations, but missing the contrasting red-X U-turn element, requiring human review.
- **Original prompt:**
```text
Modern vibrant Neo-Pop graphic-novel cel-shaded editorial illustration, crisp dark ink outlines, 16:9 widescreen, warm cinematic lighting. STRICT RULES: ZERO text, ZERO letters, ZERO numbers, ZERO words anywhere (leave all signs, paddles, papers, cards, screens, and license plates completely blank geometric shapes or pure simple icons). Strictly U.S. right-hand road traffic (yellow centerline on LEFT of travel lane, white edge line or curb on RIGHT). Aerial sunny U.S. city-block diagram (zero text): instead of attempting a risky mid-block U-turn across busy traffic (red X), a blue sedan follows a calm clockwise green path of right turns cleanly around the square city block. Zero text, zero letters, zero numbers anywhere.
```

## 11. drv-325-white-lane-arrows-mandatory-only-vs-shared  (slots: 128)
- **Drop as:** `drv-325-white-lane-arrows-mandatory-only-vs-shared.png`
- **Title:** White Pavement Turn Arrows: Dedicated Turn-Only Lane vs. Shared Straight-or-Turn Lane
- **What the reviewer saw:** Rear view of three stopped vehicles at a sunset intersection: blue sedan in left lane over a left-turn arrow, white SUV in middle over straight arrow, red pickup in right lane over straight-right arrow, with overhead traffic lights above.
- **Rule failures:** single_bulb_signal: Leftmost overhead signal shows two lit lenses at once: red ball on top and green left-arrow below, violating at-most-one-lit rule.
- **Fix:** Lane arrow layout matches prompt and teaches correctly, but left traffic signal shows red and green arrow lit simultaneously, failing single-bulb rule, so REJECT.
- **Original prompt:**
```text
Modern vibrant Neo-Pop graphic-novel cel-shaded editorial illustration, crisp dark ink outlines, 16:9 widescreen, warm cinematic lighting. STRICT RULES: ZERO text, ZERO letters, ZERO numbers, ZERO words anywhere (leave all signs, paddles, papers, cards, screens, and license plates completely blank geometric shapes or pure simple icons). Strictly U.S. right-hand road traffic (yellow centerline on LEFT of travel lane, white edge line or curb on RIGHT). Elevated bird's-eye U.S. 3-lane intersection approach (ZERO words painted on asphalt — pure bold white arrows only): Left lane has curved left arrow (blue car turns left); Middle lane has straight arrow; Right lane has combined straight+right arrow. Zero text, zero letters, zero numbers anywhere.
```

## 12. drv-185-hearing-awareness-no-headphones-earbuds  (slots: 92)
- **Drop as:** `drv-185-hearing-awareness-no-headphones-earbuds.png`
- **Title:** Hearing Safety: Never Wear Dual Headphones or Earbuds Over Both Ears While Driving
- **What the reviewer saw:** Rear view over left-seat driver inside car looking forward to a fire engine on the left and a train at a crossing on the right, with red-slashed headphone and earbud prohibition icons top left and right.
- **Rule failures:** single_bulb_signal: Railroad crossing signal post on right foreground shows two red lenses lit at once, exceeding one lit lens.
- **Fix:** Correct hearing-safety scene and traffic geometry, but REJECT for railroad signal showing two lit red lenses at once.
- **Original prompt:**
```text
Modern vibrant Neo-Pop graphic-novel cel-shaded editorial illustration, crisp dark ink outlines, 16:9 widescreen, warm cinematic lighting. STRICT RULES: ZERO text, ZERO letters, ZERO numbers, ZERO words anywhere (leave all signs, paddles, papers, cards, screens, and license plates completely blank geometric shapes or pure simple icons). Strictly U.S. right-hand road traffic (yellow centerline on LEFT of travel lane, white edge line or curb on RIGHT). Rear-over-right-shoulder U.S. front-left driver view (driver on LEFT, window slightly cracked for outside awareness, zero text): a bold red prohibition slash crosses out over-ear headphones and wireless earbuds in BOTH ears while exterior soundwaves from a distant fire engine siren and train horn reach the alert driver. Zero text, zero letters, zero numbers anywhere.
```

## 13. drv-309-five-section-doghouse-cluster-signal  (slots: 83)
- **Drop as:** `drv-309-five-section-doghouse-cluster-signal.png`
- **Title:** Five-Section 'Doghouse' Signal Cluster: Understanding Shared Straight & Turn Lens Combinations
- **What the reviewer saw:** A yellow five-lens doghouse traffic signal hangs centered in foreground over a palm-lined street, with bottom-left green ball and bottom-right green right-arrow lit and upper lenses dark.
- **Rule failures:** single_bulb_signal: Two lenses lit simultaneously: bottom-left green ball and bottom-right green right-arrow both illuminated bright green.
- **Fix:** Doghouse depiction matches prompt but violates single-bulb rule with two green lenses lit simultaneously, requiring REJECT.
- **Original prompt:**
```text
Modern vibrant Neo-Pop graphic-novel cel-shaded editorial illustration, crisp dark ink outlines, 16:9 widescreen, warm cinematic lighting. STRICT RULES: ZERO text, ZERO letters, ZERO numbers, ZERO words anywhere (leave all signs, paddles, papers, cards, screens, and license plates completely blank geometric shapes or pure simple icons). Strictly U.S. right-hand road traffic (yellow centerline on LEFT of travel lane, white edge line or curb on RIGHT). Crisp close-up daylight diagram of a 5-lens U.S. doghouse traffic signal housing suspended over an intersection (top red ball dark, lower-left green ball + lower-right green arrow illuminated cleanly, zero text). Zero text, zero letters, zero numbers anywhere.
```

## 14. drv-183-color-blindness-signal-position-order  (slots: 79)
- **Drop as:** `drv-183-color-blindness-signal-position-order.png`
- **Title:** Color-Vision Deficiency Compensation: Reading Standard Vertical & Horizontal Signal Positions
- **What the reviewer saw:** Top insets show a vertical traffic signal on the left and horizontal signal on the right with all lenses lit, over a sunset multi-lane highway with cars driving away in the foreground.
- **Rule failures:** single_bulb_signal: Both inset housings show three lit lenses at once: left vertical has top red, middle yellow, bottom green all illuminated; right horizontal has far-left red, middle yellow, far-right green all illuminated.
- **Teaching WRONG:** Both housings illuminate all three lenses simultaneously, which never occurs in operation and defeats color-blind position learning.
- **Fix:** Shows correct vertical/horizontal signal layouts but violates single-lit-lens rule by lighting all three lenses in both housings, teaching incorrect signal operation.
- **Original prompt:**
```text
Modern vibrant Neo-Pop graphic-novel cel-shaded editorial illustration, crisp dark ink outlines, 16:9 widescreen, warm cinematic lighting. STRICT RULES: ZERO text, ZERO letters, ZERO numbers, ZERO words anywhere (leave all signs, paddles, papers, cards, screens, and license plates completely blank geometric shapes or pure simple icons). Strictly U.S. right-hand road traffic (yellow centerline on LEFT of travel lane, white edge line or curb on RIGHT). Clean diagram of two standard U.S. traffic signal housings against sky (ZERO words or numbers): Left shows a vertical housing highlighting TOP position (stop), MIDDLE (caution), BOTTOM (go); Right shows a horizontal housing highlighting FAR-LEFT position (stop), MIDDLE, FAR-RIGHT (go) by pure geometric position cues. Zero text, zero letters, zero numbers anywhere.
```

## 15. drv-246-one-way-street-flow-and-left-on-red  (slots: 79)
- **Drop as:** `drv-246-one-way-street-flow-and-left-on-red.png`
- **Title:** One-Way Street Flow & Legal Left Turn on Red From One-Way Street Onto Another One-Way Street
- **What the reviewer saw:** Bird's-eye view of two one-way streets intersecting, with a blue sedan stopped behind the white stop bar in the far-left lane under a red signal and a blue arrow curving left into the westbound lanes.
- **Rule failures:** us_right_hand_traffic: Bottom northbound one-way correct with yellow on left and white on right, but westbound cross street has yellow curb on north/top which is its right edge and white line on south/bottom which is its left edge - reversed for US one-way markings.
- **Fix:** Correct one-way left-on-red concept but cross-street edge colors are reversed, failing US right-hand traffic markings.
- **Original prompt:**
```text
Modern vibrant Neo-Pop graphic-novel cel-shaded editorial illustration, crisp dark ink outlines, 16:9 widescreen, warm cinematic lighting. STRICT RULES: ZERO text, ZERO letters, ZERO numbers, ZERO words anywhere (leave all signs, paddles, papers, cards, screens, and license plates completely blank geometric shapes or pure simple icons). Strictly U.S. right-hand road traffic (yellow centerline on LEFT of travel lane, white edge line or curb on RIGHT). Elevated bird's-eye urban intersection of two ONE-WAY multi-lane streets (all white dashed lane lines, horizontal black-and-white arrow plaques with ZERO letters): our blue sedan in the far-LEFT lane of the bottom northbound one-way street makes a complete stop behind the white stop bar at a single red bulb, checks the clear crosswalk, and turns LEFT into the leftmost lane of the westbound one-way cross street. Zero text, zero letters, zero numbers anywhere.
```

## 16. drv-298-shared-road-bicycle-may-use-full-lane  (slots: 73)
- **Drop as:** `drv-298-shared-road-bicycle-may-use-full-lane.png`
- **Title:** Narrow Lane 'Bicycles May Use Full Lane' / Shared-Lane Sharrow Pavement Chevron
- **What the reviewer saw:** View from behind a black sedan following a cyclist centered in a narrow right lane over a white sharrow marking; double-yellow centerline on left, white edge line on right, with a traffic signal on the right sidewalk.
- **Rule failures:** single_bulb_signal: Right-side traffic signal shows two lit lenses at once: red on top and green on bottom.
- **Fix:** Correct bicycle-full-lane composition but traffic signal illegally shows red and green lit together, requiring rejection.
- **Original prompt:**
```text
Modern vibrant Neo-Pop graphic-novel cel-shaded editorial illustration, crisp dark ink outlines, 16:9 widescreen, warm cinematic lighting. STRICT RULES: ZERO text, ZERO letters, ZERO numbers, ZERO words anywhere (leave all signs, paddles, papers, cards, screens, and license plates completely blank geometric shapes or pure simple icons). Strictly U.S. right-hand road traffic (yellow centerline on LEFT of travel lane, white edge line or curb on RIGHT). Sunny narrow U.S. historic-town street (double-yellow centerline on left, white bicycle-under-double-chevron sharrow symbol painted in center of right lane, zero words): a cyclist rides safely in the center of the narrow right lane while our sedan follows calmly three seconds behind until a safe passing zone opens. Zero text, zero letters, zero numbers anywhere.
```

## 17. drv-512-about-to-be-hit-from-behind-head-against-headrest-brake  (slots: 66)
- **Drop as:** `drv-512-about-to-be-hit-from-behind-head-against-headrest-brake.png`
- **Title:** If About to Be Rear-Ended: Press Back & Head Firmly Against Seat/Headrest & Hold Brake (Unless Room Ahead to Pull Forward)
- **What the reviewer saw:** Side cutaway of a blue car with a belted woman driver, hands on wheel and foot on pedal, head upright forward with a clear gap to the headrest and no approaching car in the mirror.
- **Teaching WRONG:** Shows upright posture with gap between skull and head restraint instead of pressing back firmly, teaching incorrect bracing for rear impact.
- **Scene PARTIAL:** Title requires head firmly against headrest and implied rear threat; image shows clear gap between head and headrest and no fast car in mirror.
- **Fix:** Driver shown with head forward off the headrest and no rear threat visible, teaching opposite of brace-against-headrest rule.
- **Original prompt:**
```text
Modern vibrant Neo-Pop graphic-novel cel-shaded editorial illustration, crisp dark ink outlines, 16:9 widescreen, warm cinematic lighting. STRICT RULES: ZERO text, ZERO letters, ZERO numbers, ZERO words anywhere (leave all signs, paddles, papers, cards, screens, and license plates completely blank geometric shapes or pure simple icons). Strictly U.S. right-hand road traffic (yellow centerline on LEFT of travel lane, white edge line or curb on RIGHT). Side-cutaway U.S. front-left driver protection diagram (hood on left, zero text): seeing a fast car in the mirror, the braced driver presses skull squarely back against the padded head restraint and holds brakes so they aren't pushed into cross traffic. Zero text, zero letters, zero numbers anywhere.
```

## 18. drv-350-multi-lane-same-direction-merging-into-center  (slots: 61)
- **Drop as:** `drv-350-multi-lane-same-direction-merging-into-center.png`
- **Title:** Three-Lane Highway Simultaneous Lane Change Into Center Lane: Left-Lane Car Yields to Right-Lane Car
- **What the reviewer saw:** Aerial rear view of a 3-lane one-way highway with a red sedan in the left lane and white SUV in the right lane, both with amber mirror lights and blue arrows pointing into the empty center lane.
- **Teaching WRONG:** Both vehicles shown abreast with equal merge arrows into center lane with no yielding gap; teaches simultaneous collision course opposite of left-yields rule.
- **Scene PARTIAL:** Shows far-left and far-right cars both signaling toward open middle lane, but left-lane car is side-by-side not eased back yielding as title/prompt requires.
- **Fix:** Both cars signal to center but left car does not yield/ease back, teaching simultaneous entry instead of left-yields-to-right.
- **Original prompt:**
```text
Modern vibrant Neo-Pop graphic-novel cel-shaded editorial illustration, crisp dark ink outlines, 16:9 widescreen, warm cinematic lighting. STRICT RULES: ZERO text, ZERO letters, ZERO numbers, ZERO words anywhere (leave all signs, paddles, papers, cards, screens, and license plates completely blank geometric shapes or pure simple icons). Strictly U.S. right-hand road traffic (yellow centerline on LEFT of travel lane, white edge line or curb on RIGHT). Aerial 3-lane one-direction U.S. highway diagram (all cars facing forward, zero text): when a car in the far-left lane and a car in the far-right lane both signal toward the open middle lane at the same moment, the left-lane car eases back yielding so they never collide. Zero text, zero letters, zero numbers anywhere.
```

## 19. drv-398-median-u-turn-wide-boulevard-truck-turn  (slots: 55)
- **Drop as:** `drv-398-median-u-turn-wide-boulevard-truck-turn.png`
- **Title:** Wide Divided Boulevard Median U-Turn Loon: Yield to Oncoming High-Speed Traffic
- **What the reviewer saw:** Aerial sunset view of a palm-lined divided boulevard with a silver sedan stopped inside the brick median U-turn pocket between southbound traffic on the left and northbound traffic on the right.
- **Rule failures:** us_right_hand_traffic: Left/southbound carriageway correctly has yellow on median/left side and white on outer/right side, but right/northbound carriageway has white solid line on median/left side where yellow is required for US divided boulevard.
- **Fix:** Median U-turn concept is correct but right-side carriageway uses white instead of yellow on median/left edge, violating US right-hand traffic marking.
- **Original prompt:**
```text
Modern vibrant Neo-Pop graphic-novel cel-shaded editorial illustration, crisp dark ink outlines, 16:9 widescreen, warm cinematic lighting. STRICT RULES: ZERO text, ZERO letters, ZERO numbers, ZERO words anywhere (leave all signs, paddles, papers, cards, screens, and license plates completely blank geometric shapes or pure simple icons). Strictly U.S. right-hand road traffic (yellow centerline on LEFT of travel lane, white edge line or curb on RIGHT). Aerial view of a landscaped U.S. divided boulevard median break (zero text): a sedan pauses safely inside the protected median turn pocket checking all oncoming lanes before completing its turn. Zero text, zero letters, zero numbers anywhere.
```

## 20. drv-395-right-turn-on-red-multi-lane-turn-lanes  (slots: 53)
- **Drop as:** `drv-395-right-turn-on-red-multi-lane-turn-lanes.png`
- **Title:** Dual Right-Turn Lanes on Red: Obey Posted Restrictions & Watch Swept Path of Adjacent Turning Vehicles
- **What the reviewer saw:** Rear view of a blue SUV on the left and red sedan on the right in two right-turn lanes with white turn arrows and a dotted divider, facing an intersection with two green traffic signals overhead.
- **Teaching QUESTIONABLE:** Lane-keeping geometry is correct for dual turns, but green go display does not teach the stop-before-turn and yield and posted-restriction behavior required for turn on red.
- **Scene PARTIAL:** Shows two marked right-turn lanes with curved dotted divider and two cars turning in parallel as prompted, but both signals are green while title specifies 'on Red'.
- **Fix:** Lane geometry and all visual rules pass, but green signals do not match the 'on Red' title, so red-light teaching is not shown.
- **Original prompt:**
```text
Modern vibrant Neo-Pop graphic-novel cel-shaded editorial illustration, crisp dark ink outlines, 16:9 widescreen, warm cinematic lighting. STRICT RULES: ZERO text, ZERO letters, ZERO numbers, ZERO words anywhere (leave all signs, paddles, papers, cards, screens, and license plates completely blank geometric shapes or pure simple icons). Strictly U.S. right-hand road traffic (yellow centerline on LEFT of travel lane, white edge line or curb on RIGHT). Bird's-eye U.S. urban corner with TWO marked right-turn lanes separated by a curved dotted white stripe (zero text): two vehicles turn right in parallel channels staying strictly inside their respective lanes. Zero text, zero letters, zero numbers anywhere.
```

## 21. drv-291-photo-enforced-red-light-speed-camera  (slots: 43)
- **Drop as:** `drv-291-photo-enforced-red-light-speed-camera.png`
- **Title:** Automated Traffic Safety Camera Enforcement at Intersections & School Zones
- **What the reviewer saw:** Rear view of three cars stopped in right lanes at a sunny palm-lined urban intersection under a red traffic light, with a boxy traffic camera mounted on the right-side pole.
- **Teaching WRONG:** Cars stopped on top of / past the white stop bar under red, opposite of required stop-behind-line behavior.
- **Scene PARTIAL:** Shows sunny urban intersection with red light and roadside camera, but cars are not cleanly behind stop bar.
- **Fix:** Red-light camera scene present but foreground cars sit on/past the white stop bar instead of behind it, teaching incorrect stopping position.
- **Original prompt:**
```text
Modern vibrant Neo-Pop graphic-novel cel-shaded editorial illustration, crisp dark ink outlines, 16:9 widescreen, warm cinematic lighting. STRICT RULES: ZERO text, ZERO letters, ZERO numbers, ZERO words anywhere (leave all signs, paddles, papers, cards, screens, and license plates completely blank geometric shapes or pure simple icons). Strictly U.S. right-hand road traffic (yellow centerline on LEFT of travel lane, white edge line or curb on RIGHT). Sunny U.S. urban intersection (single red bulb lit overhead, camera-lens icon plaque on mast, zero text): all right-lane cars stop cleanly behind the white stop bar under an elevated roadside traffic-safety camera sensor. Zero text, zero letters, zero numbers anywhere.
```

## 22. drv-514-disabled-freeway-stay-buckled-or-behind-guardrail  (slots: 21)
- **Drop as:** `drv-514-disabled-freeway-stay-buckled-or-behind-guardrail.png`
- **Title:** Freeway Breakdown Pedestrian Survival: Never Stand Behind/Beside Car in Traffic — Wait Well Upstream Behind Guardrail or Buckled Inside!
- **What the reviewer saw:** Overhead view of a 4-lane freeway with a gray van with raised hood on the right shoulder and a family of four standing on grass to the right, behind a steel guardrail.
- **Teaching QUESTIONABLE:** Behind guardrail is correct vs standing by traffic, but position alongside front half/downstream does not teach well-upstream waiting and could imply being beside the car is acceptable.
- **Scene PARTIAL:** Family shown behind W-beam guardrail on grass with hood-open car on shoulder matches core idea, but not well upstream and missing prompt elements like white cloth, flashers-on cue, and red X prohibiting standing by traffic.
- **Fix:** Core safe-behind-guardrail concept shown with correct US road markings and no text, but family is alongside/downstream of disabled car rather than well upstream, and instructional details are missing.
- **Original prompt:**
```text
Modern vibrant Neo-Pop graphic-novel cel-shaded editorial illustration, crisp dark ink outlines, 16:9 widescreen, warm cinematic lighting. STRICT RULES: ZERO text, ZERO letters, ZERO numbers, ZERO words anywhere (leave all signs, paddles, papers, cards, screens, and license plates completely blank geometric shapes or pure simple icons). Strictly U.S. right-hand road traffic (yellow centerline on LEFT of travel lane, white edge line or curb on RIGHT). Sunny U.S. interstate right-shoulder breakdown scene (hood raised, white cloth on handle, 4-way flashers on, zero text): passengers stand safely on the grassy embankment WELL BEHIND the steel W-beam guardrail upstream of the car (red X crossing out standing between bumpers or next to live freeway traffic!). Zero text, zero letters, zero numbers anywhere.
```

## 23. drv-165-commentary-scanning-ten-fifteen-seconds  (slots: 7)
- **Drop as:** `drv-165-commentary-scanning-ten-fifteen-seconds.png`
- **Title:** Visual Lead Time: Scan 10–15 Seconds Ahead (1 City Block / Quarter-Mile on Highway)
- **What the reviewer saw:** Rear view of blue sedan in foreground center with translucent cyan arc projecting forward over an urban boulevard at sunset, covering a crosswalk pedestrian on the left, stopped cars with brake lights center, and a white van on the right under a hanging traffic light.
- **Rule failures:** single_bulb_signal: Overhead signal shows two lit lenses: red on top and green on bottom simultaneously.
- **Fix:** Scene matches visual lead-time concept but signal violates single-bulb rule with red and green lit together, requiring REJECT.
- **Original prompt:**
```text
Modern vibrant Neo-Pop graphic-novel cel-shaded editorial illustration, crisp dark ink outlines, 16:9 widescreen, warm cinematic lighting. STRICT RULES: ZERO text, ZERO letters, ZERO numbers, ZERO words anywhere (leave all signs, paddles, papers, cards, screens, and license plates completely blank geometric shapes or pure simple icons). Strictly U.S. right-hand road traffic (yellow centerline on LEFT of travel lane, white edge line or curb on RIGHT). Elevated forward perspective down a U.S. urban boulevard in the right lane (yellow centerline on left, zero text): a translucent glowing cyan forward-vision horizon arc projects a full city block ahead of our blue sedan, spotting brake lights, a crosswalk pedestrian, and a merging van early. Zero text, zero letters, zero numbers anywhere.
```

## 24. drv-513-about-to-be-hit-from-side-grip-wheel-prepare-recovery  (slots: 7)
- **Drop as:** `drv-513-about-to-be-hit-from-side-grip-wheel-prepare-recovery.png`
- **Title:** Side-Impact Bracing: Grip Steering Wheel Tightly to Keep Vehicle From Spinning Into Secondary Crash
- **What the reviewer saw:** Rear view from back seat of a driver gripping the steering wheel with both hands, looking through windshield at an orange sunset over a lake and mountains.
- **Teaching WRONG:** Shows calm forward sightseeing, not bracing for side impact; teaches nothing about tight grip to prevent secondary spin.
- **Scene MISMATCH:** Prompt asked for top-down bracing diagram showing side-curtain airbags and preventing secondary spinout; image is a rear-seat scenic sunset drive with no side impact or diagram.
- **Fix:** Scenic left-hand-drive interior with no text or signals, but fails to show side-impact bracing, airbags, or spin prevention.
- **Original prompt:**
```text
Modern vibrant Neo-Pop graphic-novel cel-shaded editorial illustration, crisp dark ink outlines, 16:9 widescreen, warm cinematic lighting. STRICT RULES: ZERO text, ZERO letters, ZERO numbers, ZERO words anywhere (leave all signs, paddles, papers, cards, screens, and license plates completely blank geometric shapes or pure simple icons). Strictly U.S. right-hand road traffic (yellow centerline on LEFT of travel lane, white edge line or curb on RIGHT). Top-down defensive bracing diagram showing side-curtain airbags and steady wheel grip preventing secondary spinout (zero text). Zero text, zero letters, zero numbers anywhere.
```

## 25. drv-66-hawk-pedestrian-hybrid-beacon  (slots: 6)
- **Drop as:** `drv-66-hawk-pedestrian-hybrid-beacon.png`
- **Title:** Mid-Block Pedestrian Hybrid Beacon (HAWK) & Rapid-Flashing Crosswalk Stop
- **What the reviewer saw:** Top-down view of a two-lane road with a white ladder crosswalk where a family of four walks, a single blue sedan stopped behind the stop bar below, and an overhead signal head at upper right.
- **Teaching WRONG:** Car stopped behind stop bar is correct, but HAWK stop requires two steady reds; showing one lit red teaches incorrect HAWK indication.
- **Scene PARTIAL:** Shows mid-block crosswalk with family and stopped car, but HAWK head shows one red lit not two solid reds, no roadside rapid-flashing beacons, and only one blue car instead of silver SUV and dark sedan.
- **Fix:** Signal and vehicle count do not match HAWK/RRFB prompt; HAWK shows single red instead of required double-red stop indication, teaching wrong signal.
- **Original prompt:**
```text
Modern vibrant Neo-Pop graphic-novel cel-shaded editorial illustration, crisp dark ink outlines, 16:9 widescreen, warm cinematic lighting. STRICT RULES: ZERO text, ZERO letters, ZERO numbers, ZERO words anywhere (leave all signs, paddles, papers, cards, screens, and license plates completely blank geometric shapes or pure simple icons). Strictly U.S. right-hand road traffic (yellow centerline on LEFT of travel lane, white edge line or curb on RIGHT). Sunny U.S. suburban multi-lane avenue mid-block crosswalk scene (yellow median line on LEFT, sidewalk on RIGHT): an overhead pedestrian hybrid beacon displays two glowing RED upper lenses above a dark lower lens while roadside yellow rectangular rapid-flashing beacons blink beside a high-visibility white crosswalk. In the U.S. right-hand lanes, a silver SUV and dark sedan are stopped well behind the white yield/stop markings as a family walks safely across. Zero text.
```

## 26. drv-69-weave-lane-entrance-exit-yield  (slots: 5)
- **Drop as:** `drv-69-weave-lane-entrance-exit-yield.png`
- **Title:** Shared Freeway Weave Lane (Combined Entrance & Exit): Yield & Smooth Spacing
- **What the reviewer saw:** High aerial top-down view of a multi-lane freeway with a weave/auxiliary lane on the right, a white car ahead in the right lane and an orange car behind on the entrance from bottom-right, with an exit diverging top-right.
- **Scene PARTIAL:** Shows right-side weave with entrance bottom-right and exit top-right and orange behind white, but missing signal indication and color-coded motion arrows; white car not clearly shown exiting.
- **Fix:** Rules pass but key prompt elements (right signal and motion arrows showing yield path) are absent, so needs human review.
- **Original prompt:**
```text
Modern vibrant Neo-Pop graphic-novel cel-shaded editorial illustration, crisp dark ink outlines, 16:9 widescreen, warm cinematic lighting. STRICT RULES: ZERO text, ZERO letters, ZERO numbers, ZERO words anywhere (leave all signs, paddles, papers, cards, screens, and license plates completely blank geometric shapes or pure simple icons). Strictly U.S. right-hand road traffic (yellow centerline on LEFT of travel lane, white edge line or curb on RIGHT). Clean elevated aerial three-quarter view of a sunny U.S. divided freeway right-side auxiliary WEAVE lane where an entrance ramp joins from the bottom-right and an exit ramp leaves at the top-right (all vehicles facing forward/northbound away from camera, dark glass, zero text): an entering orange hatchback on the ramp yields courteously behind an exiting white SUV signaling right into the exit lane, showing safe non-conflicting paths with clean color-coded motion arrows.
```

## 27. drv-153-automatic-road-test-failure-actions  (slots: 1)
- **Drop as:** `drv-153-automatic-road-test-failure-actions.png`
- **Title:** Automatic Driving Exam Disqualification: Striking Curb/Cone, Rolling Stop, or Examiner Intervention
- **What the reviewer saw:** Three side-by-side red-bordered panels with red-X icons: left close-up of blue SUV tire over a knocked-down orange cone, middle rear view of blue SUV beyond a white stop bar beside a blank stop sign and traffic light, right interior view of female driver with male passenger reaching to grab the steering wheel.
- **Rule failures:** single_bulb_signal: Middle panel traffic light shows two lit lenses simultaneously: red top lit and green bottom lit.
- **Fix:** Three disqualification scenes are correctly depicted, but traffic signal illegally shows red and green lit together, failing single-bulb rule.
- **Original prompt:**
```text
Modern vibrant Neo-Pop graphic-novel cel-shaded editorial illustration, crisp dark ink outlines, 16:9 widescreen, warm cinematic lighting. STRICT RULES: ZERO text, ZERO letters, ZERO numbers, ZERO words anywhere (leave all signs, paddles, papers, cards, screens, and license plates completely blank geometric shapes or pure simple icons). Strictly U.S. right-hand road traffic (yellow centerline on LEFT of travel lane, white edge line or curb on RIGHT). Clean 3-badge graphic-novel warning panel (zero text): three red-X caution frames illustrate automatic road-test errors — (1) a tire bumping over a knocked-down orange cone, (2) rolling past a white stop bar without halting, and (3) an examiner's hand reaching to grab a wheel. Zero text, zero letters, zero numbers anywhere.
```

## 28. drv-483-deicing-salt-chemical-following-distance  (slots: 1)
- **Drop as:** `drv-483-deicing-salt-chemical-following-distance.png`
- **Title:** Salt / Brine De-Icing Tanker Trucks: Stay Well Back From Corrosive Spray & Keep Washer Reservoir Full of Freeze-Proof Fluid
- **What the reviewer saw:** A gray SUV in foreground follows closely behind an orange salt-spreader truck spraying material onto a snowy mountain highway at sunset.
- **Teaching WRONG:** Following SUV is shown close directly inside salt/brine spray plume, contradicting title instruction to stay well back.
- **Scene PARTIAL:** Shows orange salt-spreader fanning spray with SUV behind, but 200-ft gap and blue washer spray not shown; SUV is very close inside spray.
- **Fix:** Shows salt truck and following SUV but SUV is too close inside corrosive spray, teaching opposite of stay well back.
- **Original prompt:**
```text
Modern vibrant Neo-Pop graphic-novel cel-shaded editorial illustration, crisp dark ink outlines, 16:9 widescreen, warm cinematic lighting. STRICT RULES: ZERO text, ZERO letters, ZERO numbers, ZERO words anywhere (leave all signs, paddles, papers, cards, screens, and license plates completely blank geometric shapes or pure simple icons). Strictly U.S. right-hand road traffic (yellow centerline on LEFT of travel lane, white edge line or curb on RIGHT). Winter U.S. highway right lane behind an orange salt-spreader truck fanning sand/brine onto icy asphalt (zero text): our SUV maintains a 200-ft gap with blue winter windshield-washer spray keeping glass crystal clear. Zero text, zero letters, zero numbers anywhere.
```

## 29. drv-61-t-intersection-through-road-yield  (slots: 0)
- **Drop as:** `drv-61-t-intersection-through-road-yield.png`
- **Title:** T-Intersection: Terminating Side-Road Driver Yielding to Through-Street Traffic
- **What the reviewer saw:** Silver sedan stopped at a white stop line on a bottom side street with brake lights lit, facing a horizontal through highway where a red pickup travels left-to-right above the double-yellow centerline.
- **Rule failures:** us_right_hand_traffic: Red pickup facing right (left-to-right) is positioned north of the double-yellow centerline in the north lane; for US right-hand traffic eastbound must be south of center with yellow on its left.
- **Teaching WRONG:** Terminating driver correctly stopped before stop line yielding, but through pickup traveling left-to-right on the left side of the yellow center teaches wrong-side driving.
- **Fix:** Through-road pickup is shown driving on the wrong (left) side of the centerline, violating US right-hand traffic and teaching wrong lane position, requiring rejection despite correct yield setup and zero text.
- **Original prompt:**
```text
Modern vibrant Neo-Pop graphic-novel cel-shaded editorial illustration, crisp dark ink outlines, 16:9 widescreen, warm cinematic lighting. STRICT RULES: ZERO text, ZERO letters, ZERO numbers, ZERO words anywhere (leave all signs, paddles, papers, cards, screens, and license plates completely blank geometric shapes or pure simple icons). Strictly U.S. right-hand road traffic (yellow centerline on LEFT of travel lane, white edge line or curb on RIGHT). Elevated three-quarter view of a sunny U.S. T-intersection where a two-lane side street at the bottom ends at a continuous horizontal two-lane through highway across the top (yellow centerlines, U.S. right-hand lanes): a silver sedan in the right lane of the terminating bottom street waits at a full stop with red brake lights lit, yielding to a red pickup truck traveling smoothly left-to-right in its proper U.S. lane along the through road. Zero text.
```

Global rules (every image): ZERO text/letters/numbers; US right-hand traffic (yellow centerline on the LEFT of our lane,
white edge line on the RIGHT); no right-hand-drive cabins; no head-on cars sharing one lane; at most ONE lit lens per
traffic signal; 16:9; Neo-Pop cel-shaded style; exact catalog filename.
