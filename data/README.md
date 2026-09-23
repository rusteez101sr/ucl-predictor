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


## Richer form inputs (free-only)

- `form-domestic.json` — OpenLigaDB Bundesliga + football-data.co.uk 2026-27 CSVs for Big-5 and P1/N1/B1/T1/G1 + NOR/AUT extras; Wikipedia/table GF/GA proxy for Shakhtar/Slavia/Slovan/Sabah (36/36 teams with `domestic*`)
- `form-ucl-2y.json` — UCL league-phase GF/GA for 2024-25 + 2025-26 (public Wikipedia tables)
- `injuries.json` — empty; no free injury feed without signup (gap labeled)
- Teams carry `domesticGfLast10` / `ucl2yGf` fields for Professor ratings; domestic coverage now 36/36 (wikipedia/table proxies labeled weaker for shk/slp/slo/sab)

- `ucl-pedigree.json` — recent UCL titles/finals/SF for KO resume (Professor)
