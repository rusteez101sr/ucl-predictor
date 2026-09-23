/**
 * Primary source: football-data.org
 * Auth: FOOTBALL_DATA_API_KEY as header X-Auth-Token
 * Competition code: CL
 */

import { ApiResult, fetchWithRetry } from "./http";
import { enqueue } from "./queue";

const BASE = "https://api.football-data.org/v4";
const COMPETITION = "CL";

function apiKey(): string | undefined {
  return process.env.FOOTBALL_DATA_API_KEY;
}

async function fdFetch<T>(path: string): Promise<ApiResult<T>> {
  const key = apiKey();
  if (!key) {
    return { ok: false, error: "FOOTBALL_DATA_API_KEY not set" };
  }

  return enqueue(async () => {
    const res = await fetchWithRetry(`${BASE}${path}`, {
      headers: {
        "X-Auth-Token": key,
        Accept: "application/json",
      },
    });
    if (!res.ok) return res;
    try {
      const data = (await res.data.json()) as T;
      return { ok: true, data };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "JSON parse failed",
      };
    }
  });
}

export type FdMatch = {
  id: number;
  utcDate: string;
  status: string;
  matchday?: number;
  homeTeam: { id: number; name: string; shortName?: string; tla?: string };
  awayTeam: { id: number; name: string; shortName?: string; tla?: string };
  score: {
    fullTime: { home: number | null; away: number | null };
    winner: string | null;
  };
};

export async function getFixtures(
  status:
    | "SCHEDULED"
    | "TIMED"
    | "LIVE"
    | "IN_PLAY"
    | "PAUSED"
    | "FINISHED" = "SCHEDULED"
): Promise<ApiResult<{ matches: FdMatch[] }>> {
  return fdFetch(`/competitions/${COMPETITION}/matches?status=${status}`);
}

export async function getMatches(opts?: {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<ApiResult<{ matches: FdMatch[] }>> {
  const q = new URLSearchParams();
  if (opts?.status) q.set("status", opts.status);
  if (opts?.dateFrom) q.set("dateFrom", opts.dateFrom);
  if (opts?.dateTo) q.set("dateTo", opts.dateTo);
  const qs = q.toString();
  return fdFetch(
    `/competitions/${COMPETITION}/matches${qs ? `?${qs}` : ""}`
  );
}

export async function getStandings(): Promise<ApiResult<unknown>> {
  return fdFetch(`/competitions/${COMPETITION}/standings`);
}

export async function getScorers(): Promise<ApiResult<unknown>> {
  return fdFetch(`/competitions/${COMPETITION}/scorers`);
}
