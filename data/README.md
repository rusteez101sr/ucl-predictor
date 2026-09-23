# `/data`

Scout owns this folder.

Required sample files for demo mode (zero API keys):

- `teams.json` — id, name, UEFA coefficient, starting Elo, attack/defense proxies (last-10 GF/GA)
- `fixtures.json` — upcoming + recent UCL knockout fixtures
- `results.json` — finished matches used for Elo / form updates
- `coefficients.json` — UEFA club coefficient table (or embedded on teams)
- `bracket.json` — current knockout bracket structure
- `probabilities.json` — written by Professor after sims (`timestamp`, `reason`, tables)
- `updates.json` — what-changed feed (>2pp moves)
- `news.json` — cached articles (Referee / Scout)

Every refreshed file must include `{ "timestamp": "<ISO>", "reason": "<why>" }`.
- `squads.json` — key players for availability modifiers

## Current seed (2026-09)

Live **league phase** slate (not the old demo QF): 36 teams, MD1 results, MD2 fixtures. Sourced from public UEFA/Wikipedia tables (TheSportsDB free tier is too sparse for a full season dump). `demo: false` on data files. Probabilities are placeholders until Professor re-sims.
