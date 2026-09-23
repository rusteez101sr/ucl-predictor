/**
 * Team ratings from UEFA coefficients, Elo, and blended form.
 *
 * strength = 0.4 × normalised UEFA coefficient + 0.6 × normalised Elo
 *
 * Attack/defense per-game rates blend (when present):
 * - 35% recent window (xG or gf/ga last 10)
 * - 35% domestic league form (OpenLigaDB etc.)
 * - 30% UCL last-two-seasons league-phase rate (ucl2yGf / (seasons×8))
 * Missing layers redistribute weight to whatever is available.
 * Empty injuries.json is ignored — never a signal.
 */

import type { AvailabilityModifier, TeamInput, TeamRatings } from "./types";

const GAMES = 10;
/** Typical top-flight goals per team per match — used to centre λ. */
export const LEAGUE_AVG_GOALS = 1.35;
/** Approximate UCL league-phase games per season. */
const UCL_GAMES_PER_SEASON = 8;

function minMaxNorm(values: number[]): number[] {
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  if (hi === lo) return values.map(() => 0.5);
  return values.map((v) => (v - lo) / (hi - lo));
}

type Layer = { rate: number; weight: number };

function blendRates(layers: Layer[]): number {
  const usable = layers.filter((l) => l.weight > 0 && Number.isFinite(l.rate));
  if (usable.length === 0) return LEAGUE_AVG_GOALS;
  const wSum = usable.reduce((s, l) => s + l.weight, 0);
  return usable.reduce((s, l) => s + l.rate * (l.weight / wSum), 0);
}

/**
 * Goals-for per game from Scout's richer fields + recent window.
 */
export function attackRate(t: TeamInput): number {
  const recent = (t.xgForLast10 ?? t.gfLast10) / GAMES;
  const domesticPlayed = t.domesticPlayed && t.domesticPlayed > 0
    ? t.domesticPlayed
    : t.domesticGfLast10 != null
      ? GAMES
      : 0;
  const domestic =
    t.domesticGfLast10 != null && domesticPlayed > 0
      ? t.domesticGfLast10 / domesticPlayed
      : NaN;
  const seasons = t.ucl2ySeasons && t.ucl2ySeasons > 0 ? t.ucl2ySeasons : 0;
  const ucl2y =
    t.ucl2yGf != null && seasons > 0
      ? t.ucl2yGf / (seasons * UCL_GAMES_PER_SEASON)
      : NaN;

  return blendRates([
    { rate: recent, weight: 0.35 },
    { rate: domestic, weight: Number.isFinite(domestic) ? 0.35 : 0 },
    { rate: ucl2y, weight: Number.isFinite(ucl2y) ? 0.3 : 0 },
  ]);
}

/** Goals-against per game (lower is better defensively). */
export function defenseRate(t: TeamInput): number {
  const recent = (t.xgAgainstLast10 ?? t.gaLast10) / GAMES;
  const domesticPlayed = t.domesticPlayed && t.domesticPlayed > 0
    ? t.domesticPlayed
    : t.domesticGaLast10 != null
      ? GAMES
      : 0;
  const domestic =
    t.domesticGaLast10 != null && domesticPlayed > 0
      ? t.domesticGaLast10 / domesticPlayed
      : NaN;
  const seasons = t.ucl2ySeasons && t.ucl2ySeasons > 0 ? t.ucl2ySeasons : 0;
  const ucl2y =
    t.ucl2yGa != null && seasons > 0
      ? t.ucl2yGa / (seasons * UCL_GAMES_PER_SEASON)
      : NaN;

  return blendRates([
    { rate: recent, weight: 0.35 },
    { rate: domestic, weight: Number.isFinite(domestic) ? 0.35 : 0 },
    { rate: ucl2y, weight: Number.isFinite(ucl2y) ? 0.3 : 0 },
  ]);
}

/**
 * Build attack, defense, and composite strength for every team in the sample.
 */
export function buildRatings(teams: TeamInput[]): TeamRatings[] {
  if (teams.length === 0) return [];

  const coefNorm = minMaxNorm(teams.map((t) => t.uefaCoefficient));
  const eloNorm = minMaxNorm(teams.map((t) => t.elo));

  const attackRaw = teams.map(attackRate);
  const defenseRaw = teams.map(defenseRate);

  const meanAttack =
    attackRaw.reduce((a, b) => a + b, 0) / attackRaw.length || LEAGUE_AVG_GOALS;
  const meanDefense =
    defenseRaw.reduce((a, b) => a + b, 0) / defenseRaw.length || LEAGUE_AVG_GOALS;

  return teams.map((t, i) => {
    const strength = 0.4 * coefNorm[i] + 0.6 * eloNorm[i];
    const strengthMult = 0.85 + 0.3 * strength;

    const attack = (attackRaw[i] / meanAttack) * strengthMult;
    const defense = (defenseRaw[i] / meanDefense) / strengthMult;

    return {
      id: t.id,
      name: t.name,
      strength: strengthMult,
      attack,
      defense,
      elo: t.elo,
      uefaCoefficient: t.uefaCoefficient,
    };
  });
}

/**
 * Player availability modifier (Referee-validated injuries/suspensions only).
 *
 * Heuristic: if a key player is out, scale team attack down by
 *   (player goal contributions per 90 ÷ team goals per 90) × 0.5
 * Cap the cut at 35%. Empty injuries caches are not a signal — only explicit
 * modifiers passed into runEngine() apply.
 */
export function applyAvailabilityModifier(
  ratings: TeamRatings[],
  mod: AvailabilityModifier
): TeamRatings[] {
  const share =
    mod.teamGoalsPer90 > 0
      ? Math.min(0.35, (mod.playerGcPer90 / mod.teamGoalsPer90) * 0.5)
      : 0;

  return ratings.map((r) => {
    if (r.id !== mod.teamId) return r;
    return {
      ...r,
      attack: r.attack * (1 - share),
    };
  });
}

/**
 * Elo update after a real result (standard logistic, K=20 for club comps).
 */
export function updateElo(
  homeElo: number,
  awayElo: number,
  homeGoals: number,
  awayGoals: number,
  k = 20
): { homeElo: number; awayElo: number } {
  const expectedHome =
    1 / (1 + Math.pow(10, (awayElo - homeElo) / 400));
  const expectedAway = 1 - expectedHome;
  let scoreHome = 0.5;
  if (homeGoals > awayGoals) scoreHome = 1;
  else if (homeGoals < awayGoals) scoreHome = 0;
  return {
    homeElo: homeElo + k * (scoreHome - expectedHome),
    awayElo: awayElo + k * (1 - scoreHome - expectedAway),
  };
}
