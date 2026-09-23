/**
 * Scorebat highlight embeds — no API key.
 * Never throws; returns empty list on failure so UI can show empty state.
 */

import { ApiResult, fetchWithRetry } from "./http";

export type ScorebatVideo = {
  title: string;
  embed: string;
  url?: string;
  thumbnail?: string;
  date?: string;
};

/** Fetch recent football video embeds. Filter client-side by team name. */
export async function getVideos(): Promise<ApiResult<ScorebatVideo[]>> {
  const res = await fetchWithRetry(
    "https://www.scorebat.com/video-api/v3/",
    { headers: { Accept: "application/json" } }
  );
  if (!res.ok) return res;
  try {
    const body = (await res.data.json()) as {
      response?: Array<{
        title: string;
        embed: string;
        matchviewUrl?: string;
        thumbnail?: string;
        date?: string;
      }>;
    };
    const videos: ScorebatVideo[] = (body.response ?? []).map((v) => ({
      title: v.title,
      embed: v.embed,
      url: v.matchviewUrl,
      thumbnail: v.thumbnail,
      date: v.date,
    }));
    return { ok: true, data: videos };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "JSON parse failed",
    };
  }
}

export async function videosForTeam(
  teamName: string
): Promise<ApiResult<ScorebatVideo[]>> {
  const all = await getVideos();
  if (!all.ok) return all;
  const needle = teamName.toLowerCase();
  return {
    ok: true,
    data: all.data.filter((v) => v.title.toLowerCase().includes(needle)),
  };
}
