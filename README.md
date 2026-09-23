# UCL Predictor

UEFA Champions League knockout predictor — probabilities from a Poisson + Monte Carlo engine, surfaced in a Champions League–night web UI.

## What we're building

- **Live-feeling predictions** for UCL knockout ties and tournament paths (trophy / final / semi / quarter)
- **Demo mode** works with zero API keys (sample data under `/data`)
- **Live mode** refreshes fixtures/results/news via free-tier APIs, re-runs sims, updates the UI

## Team

| Role | Owns |
|------|------|
| **Scout** | `/lib/api/`, `/data` cache, refresh pipeline |
| **Professor** | `/lib/engine/` (ratings, Poisson match sims, tournament MC) |
| **Striker** | Next.js 14 App Router UI (`/`, `/bracket`, `/matches`, `/teams`, `/updates`) |
| **Referee** | `TESTING.md` gate, news honesty (`/lib/news/`), preview approval |

## Pipeline

```
Scout refreshes data → posts what changed
  → Referee validates availability news
  → Professor re-runs match + tournament sims
  → Striker wires tables into UI + Vercel preview
  → Referee checks preview against TESTING.md
```

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- Recharts for rating history
- Engine: TypeScript, deterministic seed in demo mode

## Getting started

```bash
npm install
npm run dev          # demo mode — no env vars required
npm run build        # must pass with zero TS errors
npm test             # includes probability-sum assertion
```

Optional env vars for live refresh (never commit secrets):

| Var | Source |
|-----|--------|
| `FOOTBALL_DATA_API_KEY` | football-data.org |
| `API_FOOTBALL_KEY` | API-Football (injuries/lineups, sparingly) |
| `THESPORTSDB_API_KEY` | TheSportsDB badges |
| `NEWSAPI_KEY` / `NEWSDATA_API_KEY` | news |

## Acceptance

Nothing merges until [TESTING.md](./TESTING.md) is green (or explicitly waived).
