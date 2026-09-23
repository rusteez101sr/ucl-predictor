/**
 * Team ratings from UEFA coefficients, Elo, and recent attack/defense form.
 *
 * strength = 0.4 × normalised UEFA coefficient + 0.6 × normalised Elo
 * Attack/defense use xG when present, else goals for/against over last 10 games,
 * scaled so league average ≈ 1.
 */

import type { AvailabilityModifier, TeamInput, TeamRatings } from "./types";

const GAMES = 10;
/** Typical top-flight goals per team per match — used to centre λ. */
export const LEAGUE_AVG_GOALS = 1.35;

function minMaxNorm(values: number[]): number[] {
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  if (hi === lo) return values.map(() => 0.5);
  return values.map((v) => (v - lo) / (hi - lo));
}

/**
 * Build attack, defense, and composite strength for every team in the sample.
 */
export function buildRatings(teams: TeamInput[]): TeamRatings[] {
  if (teams.length === 0) return [];

  const coefNorm = minMaxNorm(teams.map((t) => t.uefaCoefficient));
  const eloNorm = minMaxNorm(teams.map((t) => t.elo));

  const attackRaw = teams.map((t) => {
    const forPerGame =
      (t.xgForLast10 ?? t.gfLast10) / GAMES;
    return forPerGame;
  });
  const defenseRaw = teams.map((t) => {
    const againstPerGame =
      (t.xgAgainstLast10 ?? t.gaLast10) / GAMES;
    return againstPerGame;
  });

  const meanAttack =
    attackRaw.reduce((a, b) => a + b, 0) / attackRaw.length || LEAGUE_AVG_GOALS;
  const meanDefense =
    defenseRaw.reduce((a, b) => a + b, 0) / defenseRaw.length || LEAGUE_AVG_GOALS;

  return teams.map((t, i) => {
    // Blend UEFA pedigree with current Elo form.
    const strength = 0.4 * coefNorm[i] + 0.6 * eloNorm[i];
    // Map strength into a mild multiplier around 1 (±~15%).
    const strengthMult = 0.85 + 0.3 * strength;

    const attack = (attackRaw[i] / meanAttack) * strengthMult;
    // Defense: below-average goals conceded → rating < 1 (harder to score against).
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
 * Cap the cut at 35% so one missing star never collapses the side unrealistically.
 * We only touch attack (creation), not defense — a crude but transparent proxy.
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
 * Bundled here so Scout/Professor stay aligned when results land.
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
