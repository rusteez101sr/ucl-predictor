/**
 * What-changed feed: every prediction move >2 percentage points gets an entry.
 * Professor writes data/updates.json after each engine run.
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { MatchProbabilities, TournamentResult } from "./types";

/** Threshold in percentage points (2pp = 0.02 absolute probability). */
export const MOVE_THRESHOLD_PP = 2;
export const NOTABLE_MOVE_PP = 5; // flagged in team-thread messaging

/** Minimal shape we diff — matches EngineOutput without importing index. */
export interface ProbSnapshot {
  timestamp: string;
  reason: string;
  matches: MatchProbabilities[];
  tournament: TournamentResult;
}

export interface UpdateEntry {
  timestamp: string;
  teamId?: string;
  /** Change in probability, in percentage points (e.g. +3.2). */
  deltaPp?: number;
  metric?: "pTrophy" | "pFinal" | "pSemi" | "pHome" | "pAway";
  matchId?: string;
  reason: string;
}

export interface UpdatesFile {
  timestamp: string;
  reason: string;
  entries: UpdateEntry[];
}

function dataPath(file: string, root: string) {
  return join(root, "data", file);
}

export function loadPreviousProbabilities(root: string): ProbSnapshot | null {
  const path = dataPath("probabilities.json", root);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as ProbSnapshot;
  } catch {
    return null;
  }
}

export function loadUpdates(root: string): UpdatesFile {
  const path = dataPath("updates.json", root);
  if (!existsSync(path)) {
    return { timestamp: new Date().toISOString(), reason: "init", entries: [] };
  }
  try {
    const raw = JSON.parse(readFileSync(path, "utf8")) as Partial<UpdatesFile> & {
      updates?: UpdateEntry[];
    };
    const entries = Array.isArray(raw.entries)
      ? raw.entries
      : Array.isArray(raw.updates)
        ? raw.updates
        : [];
    return {
      timestamp: raw.timestamp ?? new Date().toISOString(),
      reason: raw.reason ?? "init",
      entries,
    };
  } catch {
    return { timestamp: new Date().toISOString(), reason: "init", entries: [] };
  }
}

/**
 * Diff previous vs next engine output. Emits an entry for every absolute
 * move strictly greater than MOVE_THRESHOLD_PP on trophy / final / semi,
 * plus match home/away outcome moves.
 */
export function diffProbabilities(
  prev: ProbSnapshot | null,
  next: ProbSnapshot
): UpdateEntry[] {
  if (!prev) return [];

  const entries: UpdateEntry[] = [];
  const ts = next.timestamp;
  const reason = next.reason;

  const prevStage = new Map(
    prev.tournament.stage.map((s) => [s.teamId, s])
  );
  for (const row of next.tournament.stage) {
    const before = prevStage.get(row.teamId);
    if (!before) continue;
    for (const metric of ["pTrophy", "pFinal", "pSemi"] as const) {
      const deltaPp = (row[metric] - before[metric]) * 100;
      if (Math.abs(deltaPp) > MOVE_THRESHOLD_PP) {
        entries.push({
          timestamp: ts,
          teamId: row.teamId,
          deltaPp: Math.round(deltaPp * 10) / 10,
          metric,
          reason,
        });
      }
    }
  }

  const prevMatches = new Map(
    prev.matches.map((m) => [`${m.homeId}-${m.awayId}`, m])
  );
  for (const m of next.matches) {
    const key = `${m.homeId}-${m.awayId}`;
    const before = prevMatches.get(key);
    if (!before) continue;
    for (const metric of ["pHome", "pAway"] as const) {
      const deltaPp = (m[metric] - before[metric]) * 100;
      if (Math.abs(deltaPp) > MOVE_THRESHOLD_PP) {
        entries.push({
          timestamp: ts,
          teamId: metric === "pHome" ? m.homeId : m.awayId,
          deltaPp: Math.round(deltaPp * 10) / 10,
          metric,
          matchId: key,
          reason,
        });
      }
    }
  }

  return entries;
}

/** Moves above 5pp — call these out in the team thread. */
export function notableMoves(entries: UpdateEntry[]): UpdateEntry[] {
  return entries.filter(
    (e) => e.deltaPp !== undefined && Math.abs(e.deltaPp) > NOTABLE_MOVE_PP
  );
}

/** Prepend new diff entries onto updates.json (newest first). */
export function appendUpdates(
  root: string,
  newEntries: UpdateEntry[],
  reason: string
): UpdatesFile {
  const current = loadUpdates(root);
  const file: UpdatesFile = {
    timestamp: new Date().toISOString(),
    reason,
    entries: [...newEntries, ...current.entries].slice(0, 200),
  };
  writeFileSync(
    dataPath("updates.json", root),
    JSON.stringify(file, null, 2) + "\n",
    "utf8"
  );
  return file;
}
