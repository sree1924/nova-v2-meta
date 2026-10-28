# Fact overlap across belt runs — 2026-10-28

Accepted fact statements (compiled registries, latest per section). exact = same normalized sentence; near = token Jaccard ≥ 0.6; numeric-twin = same sentence with different numbers (the state-specific class); unique = nothing comparable.

| run | facts |
|---|---|
| runs/2026-10-26-rdmv-ut-class-d | 340 |
| runs/2026-10-27-rdmv-ut-class-d-muse | 60 |

| A | B | A facts | exact | near | numeric-twin | unique to A | shared % of A |
|---|---|---|---|---|---|---|---|
| 2026-10-26-rdmv-ut-class-d | 2026-10-27-rdmv-ut-class-d-muse | 340 | 0 | 3 | 0 | 337 | 0.9% |

## 2026-10-26-rdmv-ut-class-d vs 2026-10-27-rdmv-ut-class-d-muse
- near (0.63): "An alcohol restricted driver is barred from operating with any alcohol in the body following an alcohol-related conviction, suspension or revocation." ↔ "An Alcohol Restricted Driver is anyone barred from driving with any alcohol in their body after an alcohol-related conviction, suspension, or revocation."
- near (0.63): "Cancellation ends a license granted through error or fraud, after application for another state credential, or after required consent is withdrawn." ↔ "Cancellation ends a driver license issued through error or fraud, through an application for a state license or ID card, or after required consent is withdrawn."
- near (0.83): "A roundabout is a circular intersection with counterclockwise flow." ↔ "A roundabout is a circular intersection with counterclockwise traffic flow."
