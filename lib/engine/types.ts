/**
 * Shared types for the UCL prediction engine.
 * Professor owns /lib/engine/. Data shapes mirror /data/*.json (Scout).
 */

export interface TeamInput {
  id: string;
  name: string;
  /** UEFA club coefficient (raw). */
  uefaCoefficient: number;
  /** Current Elo rating. */
  elo: number;
  /** Goals for in last 10 competitive matches (proxy if xG missing). */
  gfLast10: number;
  /** Goals against in last 10 competitive matches. */
  gaLast10: number;
  /** Optional expected goals for last 10 — preferred over GF when present. */
  xgForLast10?: number;
  /** Optional expected goals against last 10. */
  xgAgainstLast10?: number;
  /** Domestic league goals for (recent window) — Scout/OpenLigaDB when available. */
  domesticGfLast10?: number;
  domesticGaLast10?: number;
  domesticPlayed?: number;
  /** UCL league-phase GF/GA across last ~2 seasons (public tables). */
  ucl2yGf?: number;
  ucl2yGa?: number;
  ucl2ySeasons?: number;
}

export interface TeamRatings {
  id: string;
  name: string;
  /** 0.4 × norm(UEFA) + 0.6 × norm(Elo), roughly centred near 1. */
  strength: number;
  /** Attack rating (league-average ≈ 1). */
  attack: number;
  /** Defense rating (lower = tighter; league-average ≈ 1). */
  defense: number;
  elo: number;
  uefaCoefficient: number;
}

/**
 * Availability hit from Referee-validated injury/suspension news.
 * Heuristic (see applyAvailabilityModifier): scale attack by
 *   1 − (playerGCper90 / teamGper90) × 0.5
 */
export interface AvailabilityModifier {
  teamId: string;
  playerName: string;
  /** Player goal contributions (G+A) per 90. */
  playerGcPer90: number;
  /** Team goals per 90 (same sample window). */
  teamGoalsPer90: number;
  reason: string;
}

export interface MatchProbabilities {
  homeId: string;
  awayId: string;
  pHome: number;
  pDraw: number;
  pAway: number;
  topScorelines: Array<{ home: number; away: number; p: number }>;
  over25: number;
  under25: number;
  btts: number;
  /** Expected goals used in the Poisson draw. */
  lambdaHome: number;
  lambdaAway: number;
}

/**
 * Path probabilities. All are "reach this round" except pTrophy (win it).
 *
 * Legacy UI keys (Quarter/Semi/Final/Trophy bars):
 * - pQuarter = P(reach quarter-finals)
 * - pSemi    = P(reach semi-finals)
 * - pFinal   = P(reach final)
 * - pTrophy  = P(win trophy)
 *
 * Extra league-phase fields:
 * - pKnockout = P(finish top 24 / make KO playoffs+)
 * - pR16      = P(reach round of 16)
 */
export interface StageProbabilities {
  teamId: string;
  /** P(finish ≤24) — make knockout phase at all (league phase only). */
  pKnockout?: number;
  /** P(reach round of 16). */
  pR16?: number;
  /** P(reach quarter-finals). */
  pQuarter: number;
  /** P(reach semi-finals). */
  pSemi: number;
  /** P(reach final). */
  pFinal: number;
  /** P(win the trophy). */
  pTrophy: number;
}

export interface BracketTie {
  id: string;
  homeId: string;
  awayId: string;
  stage: "quarter" | "semi" | "final";
}

export interface TournamentResult {
  stage: StageProbabilities[];
  /** Advancement P(home advances) per QF/SF tie id. */
  tieAdvance: Record<string, { homeId: string; awayId: string; pHomeAdvances: number }>;
  iterations: number;
  seed: number | "random";
}
