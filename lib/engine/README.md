# `/lib/engine` — Professor

Quantitative UCL engine.

| File | Role |
|------|------|
| `ratings.ts` | UEFA×Elo strength + attack/defense form; availability modifier |
| `poisson.ts` | Match Poisson sims + two-legged ties |
| `montecarlo.ts` | 10k tournament bracket Monte Carlo |
| `probability-sum.test.ts` | Stage / match probability sum gates |

```bash
npm test
npm run engine:run   # writes data/probabilities.json
```

Demo seed is deterministic (`seed = 42`). Live mode uses `Math.random`.
