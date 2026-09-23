/**
 * OpenLigaDB fallback (no API key) when football-data.org fails for results.
 * UCL coverage is limited — best-effort only.
 */

import { ApiResult, fetchWithRetry } from "./http";

const BASE = "https://api.openligadb.de";

export type OldbMatch = {
  matchID: number;
  matchDateTimeUTC: string;
  team1: { teamId: number; teamName: string; shortName: string };
  team2: { teamId: number; teamName: string; shortName: string };
  matchResults: Array<{
    resultTypeId: number;
    pointsTeam1: number;
    pointsTeam2: number;
  }>;
};

export async function getMatchData(
  leagueShortcut: string,
  season?: number
): Promise<ApiResult<OldbMatch[]>> {
  const year = season ?? new Date().getFullYear();
  const url = `${BASE}/getmatchdata/${leagueShortcut}/${year}`;
  const res = await fetchWithRetry(url, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return res;
  try {
    const data = (await res.data.json()) as OldbMatch[];
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "JSON parse failed",
    };
  }
}

export async function getLastMatch(
  leagueShortcut: string
): Promise<ApiResult<OldbMatch>> {
  const url = `${BASE}/getmatchdata/${leagueShortcut}`;
  const res = await fetchWithRetry(url, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return res;
  try {
    const data = (await res.data.json()) as OldbMatch;
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "JSON parse failed",
    };
  }
}
