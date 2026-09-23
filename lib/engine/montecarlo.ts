/**
 * Tournament Monte Carlo — 10,000 full bracket runs from the current stage.
 *
 * Two-legged ties through the semi-finals (no away-goals rule; ET/pens = 50/50
 * after a drawn aggregate). Final is a single neutral-venue match (home
 * advantage cancelled).
 *
 * Output per team: P(trophy), P(final), P(semi), P(quarter).
 * Probabilities at each reached stage must sum to ~100% across teams.
 */

import { expectedGoals, samplePoisson, simulateTwoLeggedTie } from "./poisson";
import type { Rng } from "./rng";
import type {
  BracketTie,
  StageProbabilities,
  TeamRatings,
  TournamentResult,
} from "./types";

const DEFAULT_ITERS = 10_000;
const HOME_ADVANTAGE = 1.15;

function byId(ratings: TeamRatings[]): Map<string, TeamRatings> {
  return new Map(ratings.map((r) => [r.id, r]));
}

/**
 * Run full knockout Monte Carlo from the provided quarter-final ties.
 * Semi pairings: winner(qf1) vs winner(qf2), winner(qf3) vs winner(qf4).
 */
export function simulateTournament(
  ratings: TeamRatings[],
  quarterTies: BracketTie[],
  rng: Rng,
  iterations = DEFAULT_ITERS
): TournamentResult {
  if (quarterTies.length !== 4) {
    throw new Error(
      `Expected 4 quarter-final ties, got ${quarterTies.length}`
    );
  }

  const map = byId(ratings);
  const allIds = [
    ...new Set(quarterTies.flatMap((t) => [t.homeId, t.awayId])),
  ];

  const counts: Record<
    string,
    { quarter: number; semi: number; final: number; trophy: number }
  > = {};
  for (const id of allIds) {
    counts[id] = { quarter: 0, semi: 0, final: 0, trophy: 0 };
  }

  const tieAdvanceCounts: Record<string, { home: number; away: number }> = {};
  for (const t of quarterTies) {
    tieAdvanceCounts[t.id] = { home: 0, away: 0 };
  }

  for (let i = 0; i < iterations; i++) {
    // Eight QF clubs have reached the quarter-final stage.
    for (const id of allIds) counts[id].quarter++;

    const qfWinners: string[] = [];
    for (const tie of quarterTies) {
      const home = map.get(tie.homeId)!;
      const away = map.get(tie.awayId)!;
      const { aAdvances } = simulateTwoLeggedTie(home, away, rng);
      if (aAdvances) {
        qfWinners.push(tie.homeId);
        tieAdvanceCounts[tie.id].home++;
      } else {
        qfWinners.push(tie.awayId);
        tieAdvanceCounts[tie.id].away++;
      }
    }

    for (const id of qfWinners) counts[id].semi++;

    // Semi-finals (two-legged)
    const sfWinners: string[] = [];
    const semis: Array<[string, string]> = [
      [qfWinners[0], qfWinners[1]],
      [qfWinners[2], qfWinners[3]],
    ];
    for (const [aId, bId] of semis) {
      const { aAdvances } = simulateTwoLeggedTie(
        map.get(aId)!,
        map.get(bId)!,
        rng
      );
      sfWinners.push(aAdvances ? aId : bId);
    }

    for (const id of sfWinners) counts[id].final++;

    // Neutral final: cancel the 1.15 home-advantage factor.
    const [fA, fB] = sfWinners;
    const sideA = map.get(fA)!;
    const sideB = map.get(fB)!;
    const { lambdaHome, lambdaAway } = expectedGoals(sideA, sideB);
    const lh = lambdaHome / HOME_ADVANTAGE;
    const la = lambdaAway;
    let goalsA = samplePoisson(lh, rng);
    let goalsB = samplePoisson(la, rng);
    if (goalsA === goalsB) {
      // Extra time / pens — coin flip.
      if (rng() < 0.5) goalsA++;
      else goalsB++;
    }
    const winnerId = goalsA > goalsB ? fA : fB;
    counts[winnerId].trophy++;
  }

  const stage: StageProbabilities[] = allIds.map((teamId) => ({
    teamId,
    pQuarter: counts[teamId].quarter / iterations,
    pSemi: counts[teamId].semi / iterations,
    pFinal: counts[teamId].final / iterations,
    pTrophy: counts[teamId].trophy / iterations,
  }));

  const tieAdvance: TournamentResult["tieAdvance"] = {};
  for (const tie of quarterTies) {
    const c = tieAdvanceCounts[tie.id];
    tieAdvance[tie.id] = {
      homeId: tie.homeId,
      awayId: tie.awayId,
      pHomeAdvances: c.home / iterations,
    };
  }

  return {
    stage,
    tieAdvance,
    iterations,
    seed: "random",
  };
}

/** Sum of a stage column across teams — must be ~1.0 for reached stages. */
export function sumStage(
  stage: StageProbabilities[],
  key: keyof Omit<StageProbabilities, "teamId">
): number {
  return stage.reduce((acc, row) => acc + row[key], 0);
}
