/**
 * Fallback chain: football-data.org primary, then /data cache.
 * Never crashes the caller.
 */

import { ApiResult } from "./http";
import * as footballData from "./football-data";
import * as openLigaDB from "./openligadb";
import { readJson } from "../data/cache";

export { footballData, openLigaDB };
export type { ApiResult };

export type UnifiedMatch = {
  id: string | number;
  utcDate: string;
  status: string;
  homeTeam: { id: number | string; name: string };
  awayTeam: { id: number | string; name: string };
  score?: { home: number | null; away: number | null };
  source: "football-data" | "openligadb" | "cache";
};

/** UCL fixtures with fallback chain. */
export async function getUclFixtures(): Promise<
  ApiResult<{ matches: UnifiedMatch[]; source: string }>
> {
  const primary = await footballData.getFixtures("SCHEDULED");
  if (primary.ok) {
    return {
      ok: true,
      data: {
        source: "football-data",
        matches: primary.data.matches.map((m) => ({
          id: m.id,
          utcDate: m.utcDate,
          status: m.status,
          homeTeam: { id: m.homeTeam.id, name: m.homeTeam.name },
          awayTeam: { id: m.awayTeam.id, name: m.awayTeam.name },
          score: {
            home: m.score.fullTime.home,
            away: m.score.fullTime.away,
          },
          source: "football-data" as const,
        })),
      },
    };
  }

  try {
    const cached = await readJson<{
      fixtures?: Array<{
        id: string;
        homeId: string;
        awayId: string;
        kickoff: string;
        status: string;
      }>;
    }>("fixtures");

    let teams: Array<{ id: string; name: string }> = [];
    try {
      const teamsDoc = await readJson<{
        teams: Array<{ id: string; name: string }>;
      }>("teams");
      teams = teamsDoc.teams;
    } catch {
      teams = [];
    }
    const nameById = new Map(teams.map((t) => [t.id, t.name]));
    const fixtures = cached.fixtures ?? [];

    return {
      ok: true,
      data: {
        source: "cache",
        matches: fixtures.map((f) => ({
          id: f.id,
          utcDate: f.kickoff,
          status: f.status,
          homeTeam: {
            id: f.homeId,
            name: nameById.get(f.homeId) ?? f.homeId,
          },
          awayTeam: {
            id: f.awayId,
            name: nameById.get(f.awayId) ?? f.awayId,
          },
          source: "cache" as const,
        })),
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: `All sources failed. football-data: ${primary.error}. Cache: ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }
}
