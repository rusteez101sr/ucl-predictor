/**
 * UCL prediction engine — public API.
 * Professor owns this package. Call runEngine() after Scout refreshes /data
 * or after Referee validates availability modifiers.
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import {
  simulateLeagueFixtures,
  simulateLeaguePhaseTournament,
} from "./leaguephase";
import { simulateTournament } from "./montecarlo";
import { simulateMatch } from "./poisson";
import {
  applyAvailabilityModifier,
  buildRatings,
} from "./ratings";
import { makeRng } from "./rng";
import type {
  AvailabilityModifier,
  BracketTie,
  MatchProbabilities,
  TeamInput,
  TournamentResult,
} from "./types";
import {
  appendUpdates,
  diffProbabilities,
  loadPreviousProbabilities,
  notableMoves,
  type UpdateEntry,
} from "./updates";

export * from "./types";
export {
  buildRatings,
  applyAvailabilityModifier,
  updateElo,
  LEAGUE_AVG_GOALS,
} from "./ratings";
export { simulateMatch, expectedGoals, simulateTwoLeggedTie } from "./poisson";
export { simulateTournament, sumStage } from "./montecarlo";
export {
  simulateLeaguePhaseTournament,
  simulateLeagueFixtures,
} from "./leaguephase";
export { makeRng, mulberry32 } from "./rng";
export {
  diffProbabilities,
  appendUpdates,
  notableMoves,
  MOVE_THRESHOLD_PP,
  NOTABLE_MOVE_PP,
  type UpdateEntry,
} from "./updates";

const DEMO_SEED = 42;

function dataPath(file: string, root = process.cwd()) {
  return join(root, "data", file);
}

export function loadTeams(root?: string): TeamInput[] {
  const raw = JSON.parse(readFileSync(dataPath("teams.json", root), "utf8"));
  return raw.teams as TeamInput[];
}

export function loadBracket(root?: string): {
  stage?: string;
  ties: BracketTie[];
} {
  const raw = JSON.parse(readFileSync(dataPath("bracket.json", root), "utf8"));
  return { stage: raw.stage as string | undefined, ties: (raw.ties ?? []) as BracketTie[] };
}

export function loadResults(root?: string) {
  const raw = JSON.parse(readFileSync(dataPath("results.json", root), "utf8"));
  return (raw.results ?? []) as Array<{
    homeId: string;
    awayId: string;
    homeGoals: number;
    awayGoals: number;
  }>;
}

export function loadFixtures(root?: string) {
  const raw = JSON.parse(readFileSync(dataPath("fixtures.json", root), "utf8"));
  return (raw.fixtures ?? []) as Array<{
    id: string;
    homeId: string;
    awayId: string;
    status: string;
  }>;
}

export interface EngineOutput {
  timestamp: string;
  reason: string;
  demo: boolean;
  seed: number | "random";
  matches: MatchProbabilities[];
  tournament: TournamentResult;
}

export interface RunEngineResult extends EngineOutput {
  moves: UpdateEntry[];
  notable: UpdateEntry[];
}

/**
 * Full engine pass. League-phase when bracket.stage === "league_phase"
 * (or ties empty); otherwise classic 4-tie knockout MC.
 */
export function runEngine(opts: {
  demo?: boolean;
  seed?: number;
  root?: string;
  reason?: string;
  availability?: AvailabilityModifier[];
  iterations?: number;
}): RunEngineResult {
  const seed = opts.seed ?? DEMO_SEED;
  const root = opts.root ?? process.cwd();
  const bracket = loadBracket(root);
  const leaguePhase =
    bracket.stage === "league_phase" || bracket.ties.length === 0;
  const demo =
    opts.demo !== undefined ? opts.demo : !leaguePhase ? true : false;
  const rng = makeRng(demo, seed);
  const iters = opts.iterations ?? 10_000;

  const previous = loadPreviousProbabilities(root);

  let ratings = buildRatings(loadTeams(root));
  for (const mod of opts.availability ?? []) {
    ratings = applyAvailabilityModifier(ratings, mod);
  }

  let matches: MatchProbabilities[];
  let tournament: TournamentResult;

  if (leaguePhase) {
    const fixtures = loadFixtures(root);
    const results = loadResults(root);
    matches = simulateLeagueFixtures(ratings, fixtures, rng, iters);
    tournament = simulateLeaguePhaseTournament(
      ratings,
      results,
      fixtures,
      rng,
      iters
    );
  } else {
    const ties = bracket.ties;
    const ratingMap = new Map(ratings.map((r) => [r.id, r]));
    matches = ties.map((tie) =>
      simulateMatch(
        ratingMap.get(tie.homeId)!,
        ratingMap.get(tie.awayId)!,
        rng,
        iters
      )
    );
    tournament = simulateTournament(ratings, ties, rng, iters);
  }

  tournament.seed = demo ? seed : "random";

  const output: EngineOutput = {
    timestamp: new Date().toISOString(),
    reason:
      opts.reason ??
      (leaguePhase
        ? "league-phase Monte Carlo (free live slate)"
        : demo
          ? "demo seed run"
          : "live re-sim"),
    demo,
    seed: tournament.seed,
    matches,
    tournament,
  };

  const moves = diffProbabilities(previous, output);
  if (moves.length > 0) {
    appendUpdates(root, moves, output.reason);
  }

  writeFileSync(
    dataPath("probabilities.json", root),
    JSON.stringify(output, null, 2) + "\n",
    "utf8"
  );

  return {
    ...output,
    moves,
    notable: notableMoves(moves),
  };
}
