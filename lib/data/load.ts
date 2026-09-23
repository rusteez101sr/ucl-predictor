import { promises as fs } from "fs";
import path from "path";
import type {
  BracketTie,
  Fixture,
  Probabilities,
  Team,
  UpdateEntry,
} from "./types";

const dataDir = path.join(process.cwd(), "data");

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(path.join(dataDir, file), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function loadTeams(): Promise<{
  teams: Team[];
  timestamp?: string;
  reason?: string;
}> {
  const data = await readJson<{
    teams?: Team[];
    timestamp?: string;
    reason?: string;
  }>("teams.json", { teams: [] });
  return {
    teams: Array.isArray(data.teams) ? data.teams : [],
    timestamp: data.timestamp,
    reason: data.reason,
  };
}

export async function loadFixtures(): Promise<{
  fixtures: Fixture[];
  timestamp?: string;
  reason?: string;
}> {
  const data = await readJson<{
    fixtures?: Fixture[];
    timestamp?: string;
    reason?: string;
  }>("fixtures.json", { fixtures: [] });
  return {
    fixtures: Array.isArray(data.fixtures) ? data.fixtures : [],
    timestamp: data.timestamp,
    reason: data.reason,
  };
}

export async function loadBracket(): Promise<{
  ties: BracketTie[];
  stage?: string;
  timestamp?: string;
  reason?: string;
}> {
  const data = await readJson<{
    ties?: BracketTie[];
    stage?: string;
    timestamp?: string;
    reason?: string;
  }>("bracket.json", { ties: [] });
  return {
    ties: Array.isArray(data.ties) ? data.ties : [],
    stage: data.stage,
    timestamp: data.timestamp,
    reason: data.reason,
  };
}

export async function loadProbabilities(): Promise<Probabilities | null> {
  const data = await readJson<Probabilities | null>("probabilities.json", null);
  if (!data || !data.tournament || !Array.isArray(data.matches)) return null;
  return data;
}

export async function loadUpdates(): Promise<{
  entries: UpdateEntry[];
  timestamp?: string;
  reason?: string;
}> {
  const data = await readJson<{
    entries?: UpdateEntry[];
    timestamp?: string;
    reason?: string;
  }>("updates.json", { entries: [] });
  return {
    entries: Array.isArray(data.entries) ? data.entries : [],
    timestamp: data.timestamp,
    reason: data.reason,
  };
}

export function teamMap(teams: Team[]): Map<string, Team> {
  return new Map(teams.map((t) => [t.id, t]));
}

export function teamName(map: Map<string, Team>, id: string): string {
  return map.get(id)?.name ?? id.toUpperCase();
}
