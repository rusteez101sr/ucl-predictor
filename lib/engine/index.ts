/**
 * UCL prediction engine — public API.
 * Professor owns this package. Call runEngine() after Scout refreshes /data
 * or after Referee validates availability modifiers.
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
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

export function loadBracket(root?: string): BracketTie[] {
  const raw = JSON.parse(readFileSync(dataPath("bracket.json", root), "utf8"));
  return raw.ties as BracketTie[];
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
  /** Fresh what-changed entries (>2pp) from this run. */
  moves: UpdateEntry[];
  /** Subset of moves with |Δ| > 5pp. */
  notable: UpdateEntry[];
}

/**
 * Full engine pass: ratings → match sims → tournament MC.
 * Diffs against the previous probabilities.json, appends >2pp moves to
 * updates.json, then overwrites probabilities.json for Striker.
 */
export function runEngine(opts: {
  demo?: boolean;
  seed?: number;
  root?: string;
  reason?: string;
  availability?: AvailabilityModifier[];
  iterations?: number;
}): RunEngineResult {
  const demo = opts.demo !== false;
  const seed = opts.seed ?? DEMO_SEED;
  const root = opts.root ?? process.cwd();
  const rng = makeRng(demo, seed);

  const previous = loadPreviousProbabilities(root);

  let ratings = buildRatings(loadTeams(root));
  for (const mod of opts.availability ?? []) {
    ratings = applyAvailabilityModifier(ratings, mod);
  }

  const ties = loadBracket(root);
  const ratingMap = new Map(ratings.map((r) => [r.id, r]));

  const matches: MatchProbabilities[] = ties.map((tie) =>
    simulateMatch(
      ratingMap.get(tie.homeId)!,
      ratingMap.get(tie.awayId)!,
      rng,
      opts.iterations ?? 10_000
    )
  );

  const tournament = simulateTournament(
    ratings,
    ties,
    rng,
    opts.iterations ?? 10_000
  );
  tournament.seed = demo ? seed : "random";

  const output: EngineOutput = {
    timestamp: new Date().toISOString(),
    reason: opts.reason ?? (demo ? "demo seed run" : "live re-sim"),
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
