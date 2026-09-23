/**
 * League-phase tournament Monte Carlo (36-team UCL league phase).
 *
 * UEFA format approximation:
 * - Each club plays 8 matches.
 * - Top 8 → round of 16 directly.
 * - 9–24 → knockout playoff (two-legged); winners join R16.
 * - 25–36 eliminated.
 *
 * Incomplete schedule (MD1 results + MD2 fixtures only): remaining games are
 * simulated as matches against a league-average opponent so every club
 * still reaches 8 matches.
 *
 * Stage field mapping (reuse existing UI keys):
 * - pQuarter ≈ P(finish ≤24) — make the knockout phase at all
 * - pSemi    ≈ P(reach R16)
 * - pFinal   ≈ P(reach final)
 * - pTrophy  ≈ P(win the trophy)
 */

import {
  expectedGoals,
  samplePoisson,
  simulateMatch,
  simulateTwoLeggedTie,
} from "./poisson";
import type { Rng } from "./rng";
import type {
  MatchProbabilities,
  StageProbabilities,
  TeamRatings,
  TournamentResult,
} from "./types";

export interface LeagueResult {
  homeId: string;
  awayId: string;
  homeGoals: number;
  awayGoals: number;
}

export interface LeagueFixture {
  id: string;
  homeId: string;
  awayId: string;
  status: string;
}

const MATCHES_PER_TEAM = 8;
const DEFAULT_ITERS = 10_000;

type Row = { pts: number; gd: number; gf: number; played: number };

function emptyRow(): Row {
  return { pts: 0, gd: 0, gf: 0, played: 0 };
}

function applyMatch(
  table: Map<string, Row>,
  homeId: string,
  awayId: string,
  hg: number,
  ag: number
) {
  const h = table.get(homeId) ?? emptyRow();
  const a = table.get(awayId) ?? emptyRow();
  h.played++;
  a.played++;
  h.gf += hg;
  a.gf += ag;
  h.gd += hg - ag;
  a.gd += ag - hg;
  if (hg > ag) h.pts += 3;
  else if (hg < ag) a.pts += 3;
  else {
    h.pts += 1;
    a.pts += 1;
  }
  table.set(homeId, h);
  table.set(awayId, a);
}

function sortedIds(table: Map<string, Row>, ids: string[]): string[] {
  return [...ids].sort((a, b) => {
    const A = table.get(a) ?? emptyRow();
    const B = table.get(b) ?? emptyRow();
    if (B.pts !== A.pts) return B.pts - A.pts;
    if (B.gd !== A.gd) return B.gd - A.gd;
    return B.gf - A.gf;
  });
}

function averageOpponent(ratings: TeamRatings[]): TeamRatings {
  const n = ratings.length || 1;
  const attack = ratings.reduce((s, r) => s + r.attack, 0) / n;
  const defense = ratings.reduce((s, r) => s + r.defense, 0) / n;
  return {
    id: "_avg",
    name: "League Average",
    strength: 1,
    attack,
    defense,
    elo: 1500,
    uefaCoefficient: 0,
  };
}

function padRemaining(
  table: Map<string, Row>,
  team: TeamRatings,
  avg: TeamRatings,
  rng: Rng
) {
  const row = table.get(team.id) ?? emptyRow();
  let left = MATCHES_PER_TEAM - row.played;
  while (left > 0) {
    const asHome = left % 2 === 0;
    if (asHome) {
      const { lambdaHome, lambdaAway } = expectedGoals(team, avg);
      applyMatch(
        table,
        team.id,
        avg.id,
        samplePoisson(lambdaHome, rng),
        samplePoisson(lambdaAway, rng)
      );
    } else {
      const { lambdaHome, lambdaAway } = expectedGoals(avg, team);
      applyMatch(
        table,
        avg.id,
        team.id,
        samplePoisson(lambdaHome, rng),
        samplePoisson(lambdaAway, rng)
      );
    }
    left--;
  }
}

function knockoutFromR16(
  orderedR16: string[],
  map: Map<string, TeamRatings>,
  rng: Rng
): { finalists: [string, string]; champion: string } {
  const play = (a: string, b: string) => {
    const { aAdvances } = simulateTwoLeggedTie(map.get(a)!, map.get(b)!, rng);
    return aAdvances ? a : b;
  };

  const qf: string[] = [];
  for (let i = 0; i < 8; i++) {
    qf.push(play(orderedR16[i], orderedR16[15 - i]));
  }
  const sf: string[] = [];
  for (let i = 0; i < 4; i++) {
    sf.push(play(qf[i], qf[7 - i]));
  }
  const f0 = play(sf[0], sf[3]);
  const f1 = play(sf[1], sf[2]);

  const sideA = map.get(f0)!;
  const sideB = map.get(f1)!;
  const { lambdaHome, lambdaAway } = expectedGoals(sideA, sideB);
  let gA = samplePoisson(lambdaHome / 1.15, rng);
  let gB = samplePoisson(lambdaAway, rng);
  if (gA === gB) {
    if (rng() < 0.5) gA++;
    else gB++;
  }
  return { finalists: [f0, f1], champion: gA > gB ? f0 : f1 };
}

export function simulateLeaguePhaseTournament(
  ratings: TeamRatings[],
  results: LeagueResult[],
  fixtures: LeagueFixture[],
  rng: Rng,
  iterations = DEFAULT_ITERS
): TournamentResult {
  const ids = ratings.map((r) => r.id);
  const map = new Map(ratings.map((r) => [r.id, r]));
  const avg = averageOpponent(ratings);

  const counts: Record<
    string,
    { quarter: number; semi: number; final: number; trophy: number }
  > = {};
  for (const id of ids) {
    counts[id] = { quarter: 0, semi: 0, final: 0, trophy: 0 };
  }

  for (let iter = 0; iter < iterations; iter++) {
    const table = new Map<string, Row>();
    for (const id of ids) table.set(id, emptyRow());

    for (const r of results) {
      applyMatch(table, r.homeId, r.awayId, r.homeGoals, r.awayGoals);
    }
    for (const f of fixtures) {
      if (f.status === "FINISHED") continue;
      const home = map.get(f.homeId);
      const away = map.get(f.awayId);
      if (!home || !away) continue;
      const { lambdaHome, lambdaAway } = expectedGoals(home, away);
      applyMatch(
        table,
        f.homeId,
        f.awayId,
        samplePoisson(lambdaHome, rng),
        samplePoisson(lambdaAway, rng)
      );
    }
    for (const team of ratings) {
      padRemaining(table, team, avg, rng);
    }

    const order = sortedIds(table, ids);
    for (const id of order.slice(0, 24)) counts[id].quarter++;

    const direct = order.slice(0, 8);
    const playoff = order.slice(8, 24);
    const playoffWinners: string[] = [];
    for (let k = 0; k < 8; k++) {
      const a = playoff[k];
      const b = playoff[15 - k];
      const { aAdvances } = simulateTwoLeggedTie(
        map.get(a)!,
        map.get(b)!,
        rng
      );
      playoffWinners.push(aAdvances ? a : b);
    }
    const r16 = [...direct, ...playoffWinners];
    for (const id of r16) counts[id].semi++;

    const { finalists, champion } = knockoutFromR16(r16, map, rng);
    counts[finalists[0]].final++;
    counts[finalists[1]].final++;
    counts[champion].trophy++;
  }

  const stage: StageProbabilities[] = ids.map((teamId) => ({
    teamId,
    pQuarter: counts[teamId].quarter / iterations,
    pSemi: counts[teamId].semi / iterations,
    pFinal: counts[teamId].final / iterations,
    pTrophy: counts[teamId].trophy / iterations,
  }));

  return {
    stage,
    tieAdvance: {},
    iterations,
    seed: "random",
  };
}

export function simulateLeagueFixtures(
  ratings: TeamRatings[],
  fixtures: LeagueFixture[],
  rng: Rng,
  iterations = DEFAULT_ITERS
): MatchProbabilities[] {
  const map = new Map(ratings.map((r) => [r.id, r]));
  const out: MatchProbabilities[] = [];
  for (const f of fixtures) {
    if (f.status === "FINISHED") continue;
    const home = map.get(f.homeId);
    const away = map.get(f.awayId);
    if (!home || !away) continue;
    out.push(simulateMatch(home, away, rng, iterations));
  }
  return out;
}
