# TESTING.md — UCL Predictor Acceptance Checklist

Owned by **Referee**. Nothing merges until every item below is green (or explicitly waived with a documented reason).

Demo mode means: zero env vars, sample data under `/data`, app still runs.

---

## 0. Gate commands

| # | Check | Pass criteria |
|---|--------|---------------|
| G1 | `npm run dev` (zero env) | Starts without error; home loads |
| G2 | `npm run build` | Exit 0; **zero** TypeScript errors |
| G3 | Unit tests | All pass, including probability-sum assertion |

---

## 1. Demo / empty-state resilience

| # | Check | Pass criteria |
|---|--------|---------------|
| D1 | Zero API keys | Every page works on sample `/data` only |
| D2 | Missing / corrupt JSON | Page shows empty state — **never** crashes |
| D3 | Failed live API | Falls back to cache; UI stays up |
| D4 | No TODO / placeholder copy in UI | No "TODO", "lorem", "coming soon" shipping strings |

---

## 2. Probabilities & engine (Professor)

| # | Check | Pass criteria |
|---|--------|---------------|
| P1 | Stage probs sum | Across teams, each stage sums to ~100% (±0.5pp); **unit test fails the build if not** |
| P2 | Match sim output | P(home)+P(draw)+P(away) ≈ 100%; top-5 scorelines; O/U 2.5; BTTS present |
| P3 | Tournament MC | P(trophy/final/semi/quarter) present per team; sum rule holds |
| P4 | Seeds | Demo = deterministic seed; live = random seed |
| P5 | Availability modifier | Documented heuristic; only applied after Referee validates news |

---

## 3. Data layer (Scout)

| # | Check | Pass criteria |
|---|--------|---------------|
| S1 | Clients | `/lib/api/` for football-data.org + OpenLigaDB fallback |
| S2 | Timeouts / retries | 10s timeout, 2 retries with backoff on every call |
| S3 | Rate limit | Queue for football-data.org (10 req/min) |
| S4 | Cache writes | `/data/*.json` includes `{ timestamp, reason }` |
| S5 | Secrets | Keys only in env; never logged or hardcoded |
| S6 | Team ping | After refresh, thread gets what changed + affected teams/fixtures |

---

## 4. UI (Striker)

| # | Check | Pass criteria |
|---|--------|---------------|
| U1 | Shell | Layout, dark CL theme (navy/black + electric blue), responsive nav |
| U2 | `/` | Top-5 trophy favorites, upcoming predicted matches, latest what-changed |
| U3 | `/bracket` | Knockout ties with advancement probs; links to match pages |
| U4 | `/matches`, `/matches/[id]` | List + scoreline grid, outcome bars, graceful empties |
| U5 | `/teams`, `/teams/[id]` | Index + rating history, stage probs, fixtures |
| U6 | `/updates` | Feed of moves >2pp with timestamp + reason |
| U7 | Freshness label | Every prediction shows `updated X ago · reason` |
| U8 | Mobile | Usable on phone widths; no horizontal overflow on core pages |

---

## 5. News honesty (Referee)

| # | Check | Pass criteria |
|---|--------|---------------|
| N1 | Dedupe | Articles unique by URL |
| N2 | Junk filter | Transfer rumor / sensationalist copy does **not** move probs |
| N3 | Availability path | Concrete injury/suspension → importance check → Professor only if above threshold → feed reason logged |
| N4 | Chain | Scout → Referee validates → Professor applies → feed entry |

---

## 6. Pipeline / preview gate

| # | Check | Pass criteria |
|---|--------|---------------|
| R1 | Scout signal | "data updated: {what changed}" in thread |
| R2 | Professor signal | Updated tables; flags moves >5pp |
| R3 | Striker signal | Vercel preview link posted |
| R4 | Referee review | Preview checked against this file; approve or send back with specifics |

---

## Audit log

| Date | Repo state | Result | Notes |
|------|------------|--------|-------|
| 2026-09-22 | Initial commit (README + TESTING.md) | **ALL RED** (expected) | Scaffold pending: Scout `/data` + API clients, Professor engine, Striker Next.js shell. |
