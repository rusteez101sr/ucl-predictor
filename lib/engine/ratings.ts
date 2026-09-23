/**
 * Team ratings from UEFA coefficients, Elo, and blended form.
 *
 * strength = 0.4 × normalised UEFA coefficient + 0.6 × normalised Elo
 *
 * Attack/defense per-game rates blend recent + domestic + UCL-2y.
 * Domestic weight is **coverage-scaled**: if only a handful of clubs have
 * domestic form (e.g. OpenLigaDB Bundesliga-only), that layer is shrunk so
 * missing-data clubs are not systematically punished vs Bayern/Dortmund.
 * Empty injuries.json is ignored — never a signal.
 */

import type { AvailabilityModifier, TeamInput, TeamRatings } from "./types";

const GAMES = 10;
/** Typical top-flight goals per team per match — used to centre λ. */
export const LEAGUE_AVG_GOALS = 1.35;
/** Approximate UCL league-phase games per season. */
const UCL_GAMES_PER_SEASON = 8;

/** Target domestic weight when coverage is full (≥ this fraction of teams). */
const DOMESTIC_WEIGHT_FULL = 0.35;
/** Fraction of squad with domestic form before domestic gets full weight. */
const DOMESTIC_COVERAGE_FULL = 0.5;
/** Below this coverage, domestic weight → 0 (avoid 4-club bias). */
const DOMESTIC_COVERAGE_FLOOR = 0.15;

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

function hasDomestic(t: TeamInput): boolean {
  return t.domesticGfLast10 != null || t.domesticGaLast10 != null;
}

/**
 * Scale domestic weight by how many teams actually have domestic form.
 * Sparse OpenLigaDB-only coverage must not dominate the table.
 */
export function domesticWeightForCoverage(coverage: number): number {
  if (coverage < DOMESTIC_COVERAGE_FLOOR) return 0;
  if (coverage >= DOMESTIC_COVERAGE_FULL) return DOMESTIC_WEIGHT_FULL;
  const t =
    (coverage - DOMESTIC_COVERAGE_FLOOR) /
    (DOMESTIC_COVERAGE_FULL - DOMESTIC_COVERAGE_FLOOR);
  return DOMESTIC_WEIGHT_FULL * t;
}

function recentAttack(t: TeamInput): number {
  return (t.xgForLast10 ?? t.gfLast10) / GAMES;
}

function recentDefense(t: TeamInput): number {
  return (t.xgAgainstLast10 ?? t.gaLast10) / GAMES;
}

function domesticAttack(t: TeamInput): number {
  const played =
    t.domesticPlayed && t.domesticPlayed > 0
      ? t.domesticPlayed
      : t.domesticGfLast10 != null
        ? GAMES
        : 0;
  if (t.domesticGfLast10 == null || played <= 0) return NaN;
  return t.domesticGfLast10 / played;
}

function domesticDefense(t: TeamInput): number {
  const played =
    t.domesticPlayed && t.domesticPlayed > 0
      ? t.domesticPlayed
      : t.domesticGaLast10 != null
        ? GAMES
        : 0;
  if (t.domesticGaLast10 == null || played <= 0) return NaN;
  return t.domesticGaLast10 / played;
}

function ucl2yAttack(t: TeamInput): number {
  const seasons = t.ucl2ySeasons && t.ucl2ySeasons > 0 ? t.ucl2ySeasons : 0;
  if (t.ucl2yGf == null || seasons <= 0) return NaN;
  return t.ucl2yGf / (seasons * UCL_GAMES_PER_SEASON);
}

function ucl2yDefense(t: TeamInput): number {
  const seasons = t.ucl2ySeasons && t.ucl2ySeasons > 0 ? t.ucl2ySeasons : 0;
  if (t.ucl2yGa == null || seasons <= 0) return NaN;
  return t.ucl2yGa / (seasons * UCL_GAMES_PER_SEASON);
}

/**
 * Goals-for per game — domestic weight set by squad-wide coverage.
 */
export function attackRate(t: TeamInput, domesticWeight: number): number {
  return blendRates([
    { rate: recentAttack(t), weight: 0.35 },
    {
      rate: domesticAttack(t),
      weight: Number.isFinite(domesticAttack(t)) ? domesticWeight : 0,
    },
    { rate: ucl2yAttack(t), weight: Number.isFinite(ucl2yAttack(t)) ? 0.3 : 0 },
  ]);
}

export function defenseRate(t: TeamInput, domesticWeight: number): number {
  return blendRates([
    { rate: recentDefense(t), weight: 0.35 },
    {
      rate: domesticDefense(t),
      weight: Number.isFinite(domesticDefense(t)) ? domesticWeight : 0,
    },
    {
      rate: ucl2yDefense(t),
      weight: Number.isFinite(ucl2yDefense(t)) ? 0.3 : 0,
    },
  ]);
}

/**
 * Build attack, defense, and composite strength for every team in the sample.
 */
export function buildRatings(teams: TeamInput[]): TeamRatings[] {
  if (teams.length === 0) return [];

  const coverage =
    teams.filter(hasDomestic).length / Math.max(1, teams.length);
  const domesticWeight = domesticWeightForCoverage(coverage);

  const coefNorm = minMaxNorm(teams.map((t) => t.uefaCoefficient));
  const eloNorm = minMaxNorm(teams.map((t) => t.elo));

  const attackRaw = teams.map((t) => attackRate(t, domesticWeight));
  const defenseRaw = teams.map((t) => defenseRate(t, domesticWeight));

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
