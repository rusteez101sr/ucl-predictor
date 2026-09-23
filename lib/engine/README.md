# `/lib/engine` — Professor

Quantitative UCL engine.

| File | Role |
|------|------|
| `ratings.ts` | UEFA×Elo strength + attack/defense form; availability modifier |
| `poisson.ts` | Match Poisson sims + two-legged ties |
| `montecarlo.ts` | 10k tournament bracket Monte Carlo |
| `updates.ts` | Diff probs → `/data/updates.json` for moves >2pp |
| `probability-sum.test.ts` | Stage / match probability sum gates |

```bash
npm test
npm run engine:run   # writes probabilities.json + updates.json
```

Demo seed is deterministic (`seed = 42`). Live mode uses `Math.random`.
When Scout refreshes data or Referee validates availability news, call
`runEngine({ availability, reason })` and post any `notable` (>5pp) moves
to the team thread.

## League phase
When `data/bracket.json` has `"stage": "league_phase"` (empty ties), `runEngine`
uses `leaguephase.ts`: MD results + scheduled fixtures + average-opponent padding
to 8 games → table → top-8 / playoff / R16 knockout MC.
