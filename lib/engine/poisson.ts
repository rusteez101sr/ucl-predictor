/**
 * Poisson match simulation.
 *
 * Expected goals:
 *   λ_home = attack_home × defense_away × leagueAvg × 1.15   (home advantage)
 *   λ_away = attack_away × defense_home × leagueAvg
 *
 * 10,000 iterations → P(home/draw/away), top-5 scorelines, O/U 2.5, BTTS.
 */

import { LEAGUE_AVG_GOALS } from "./ratings";
import type { Rng } from "./rng";
import type { MatchProbabilities, TeamRatings } from "./types";

const HOME_ADVANTAGE = 1.15;
const DEFAULT_ITERS = 10_000;
const MAX_GOALS = 8;

/** Inverse-CDF sample from Poisson(λ) using the RN. */
export function samplePoisson(lambda: number, rng: Rng): number {
  if (lambda <= 0) return 0;
  // Knuth for small λ; otherwise normal approx with continuity correction.
  if (lambda < 30) {
    const L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do {
      k++;
      p *= rng();
    } while (p > L && k < MAX_GOALS + 20);
    return Math.min(MAX_GOALS, k - 1);
  }
  const z = Math.sqrt(-2 * Math.log(Math.max(1e-12, rng()))) *
    Math.cos(2 * Math.PI * rng());
  return Math.max(0, Math.min(MAX_GOALS, Math.round(lambda + Math.sqrt(lambda) * z)));
}

export function expectedGoals(
  home: TeamRatings,
  away: TeamRatings,
  leagueAvg = LEAGUE_AVG_GOALS
): { lambdaHome: number; lambdaAway: number } {
  return {
    lambdaHome: home.attack * away.defense * leagueAvg * HOME_ADVANTAGE,
    lambdaAway: away.attack * home.defense * leagueAvg,
  };
}

export function simulateMatch(
  home: TeamRatings,
  away: TeamRatings,
  rng: Rng,
  iterations = DEFAULT_ITERS
): MatchProbabilities {
  const { lambdaHome, lambdaAway } = expectedGoals(home, away);
  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;
  let over25 = 0;
  let btts = 0;
  const scoreCounts = new Map<string, number>();

  for (let i = 0; i < iterations; i++) {
    const hg = samplePoisson(lambdaHome, rng);
    const ag = samplePoisson(lambdaAway, rng);
    if (hg > ag) homeWins++;
    else if (hg < ag) awayWins++;
    else draws++;
    if (hg + ag > 2.5) over25++;
    if (hg > 0 && ag > 0) btts++;
    const key = `${hg}-${ag}`;
    scoreCounts.set(key, (scoreCounts.get(key) ?? 0) + 1);
  }

  const topScorelines = [...scoreCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key, n]) => {
      const [h, a] = key.split("-").map(Number);
      return { home: h, away: a, p: n / iterations };
    });

  return {
    homeId: home.id,
    awayId: away.id,
    pHome: homeWins / iterations,
    pDraw: draws / iterations,
    pAway: awayWins / iterations,
    topScorelines,
    over25: over25 / iterations,
    under25: 1 - over25 / iterations,
    btts: btts / iterations,
    lambdaHome,
    lambdaAway,
  };
}

/**
 * Simulate a two-legged tie (no away-goals rule).
 * Extra time + pens after drawn aggregate treated as 50/50.
 * Returns true if the designated "home" side of leg 1 advances
 * (we still play leg 2 with sides swapped).
 */
export function simulateTwoLeggedTie(
  teamA: TeamRatings,
  teamB: TeamRatings,
  rng: Rng
): { aAdvances: boolean; aggA: number; aggB: number } {
  // Leg 1: A home
  const l1a = samplePoisson(expectedGoals(teamA, teamB).lambdaHome, rng);
  const l1b = samplePoisson(expectedGoals(teamA, teamB).lambdaAway, rng);
  // Leg 2: B home
  const l2b = samplePoisson(expectedGoals(teamB, teamA).lambdaHome, rng);
  const l2a = samplePoisson(expectedGoals(teamB, teamA).lambdaAway, rng);

  const aggA = l1a + l2a;
  const aggB = l1b + l2b;

  if (aggA > aggB) return { aAdvances: true, aggA, aggB };
  if (aggB > aggA) return { aAdvances: false, aggA, aggB };
  // Drawn aggregate → ET/pens coin flip (UEFA abolished away goals).
  return { aAdvances: rng() < 0.5, aggA, aggB };
}
