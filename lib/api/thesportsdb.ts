/**
 * TheSportsDB free client (test key "3").
 * Useful for smoke checks; free tier returns sparse UCL season dumps,
 * so league-phase seeds may still come from public UEFA/Wikipedia tables.
 */
import { ApiResult, fetchWithRetry } from "./http";

const BASE = "https://www.thesportsdb.com/api/v1/json/3";
export const UCL_LEAGUE_ID = "4480";

export async function getNextLeagueEvents(
  leagueId: string = UCL_LEAGUE_ID
): Promise<ApiResult<unknown[]>> {
  const res = await fetchWithRetry(
    `${BASE}/eventsnextleague.php?id=${leagueId}`,
    { headers: { Accept: "application/json" } }
  );
  if (!res.ok) return res;
  try {
    const body = (await res.data.json()) as { events?: unknown[] | null };
    return { ok: true, data: body.events ?? [] };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "JSON parse failed",
    };
  }
}

export async function getPastLeagueEvents(
  leagueId: string = UCL_LEAGUE_ID
): Promise<ApiResult<unknown[]>> {
  const res = await fetchWithRetry(
    `${BASE}/eventspastleague.php?id=${leagueId}`,
    { headers: { Accept: "application/json" } }
  );
  if (!res.ok) return res;
  try {
    const body = (await res.data.json()) as { events?: unknown[] | null };
    return { ok: true, data: body.events ?? [] };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "JSON parse failed",
    };
  }
}
