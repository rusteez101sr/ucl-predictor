/**
 * Data refresh pipeline (Scout).
 *
 * Flow:
 * 1. Try football-data.org for CL scheduled + finished matches.
 * 2. On failure / missing key → keep cached /data (never crash).
 * 3. Always write touched files with { timestamp, reason }.
 * 4. Return a thread-ready summary: what changed + affected teams/fixtures.
 */

import { footballData } from "./index";
import type { FdMatch } from "./football-data";
import { readJson, writeJson } from "../data/cache";

export type RefreshChange = {
  file: string;
  summary: string;
};

export type RefreshReport = {
  mode: "live" | "demo-cache";
  reason: string;
  changes: RefreshChange[];
  affectedTeamIds: string[];
  affectedFixtureIds: string[];
  /** One-liner for the team thread: `data updated: …` */
  threadMessage: string;
};

type TeamRow = {
  id: string;
  name: string;
  uefaCoefficient: number;
  elo: number;
  gfLast10: number;
  gaLast10: number;
};

type FixtureRow = {
  id: string;
  homeId: string;
  awayId: string;
  stage: string;
  leg: number;
  kickoff: string;
  status: string;
};

type ResultRow = {
  id: string;
  homeId: string;
  awayId: string;
  homeGoals: number;
  awayGoals: number;
  date: string;
};

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Map football-data team names onto our short string ids. */
function buildNameIndex(teams: TeamRow[]): Map<string, string> {
  const index = new Map<string, string>();
  const aliases: Record<string, string[]> = {
    rma: ["real madrid", "real madrid cf"],
    mci: ["manchester city", "manchester city fc", "man city"],
    bay: ["bayern munich", "fc bayern munchen", "bayern munchen", "fc bayern munich"],
    psg: ["paris saint germain", "paris sg", "psg"],
    ars: ["arsenal", "arsenal fc"],
    bar: ["barcelona", "fc barcelona"],
    int: ["inter", "inter milan", "fc internazionale milano", "internazionale"],
    liv: ["liverpool", "liverpool fc"],
  };
  for (const t of teams) {
    index.set(normalizeName(t.name), t.id);
    for (const a of aliases[t.id] ?? []) {
      index.set(normalizeName(a), t.id);
    }
  }
  return index;
}

function resolveTeamId(
  index: Map<string, string>,
  name: string
): string | null {
  const key = normalizeName(name);
  if (index.has(key)) return index.get(key)!;
  for (const [k, id] of index) {
    if (key.includes(k) || k.includes(key)) return id;
  }
  return null;
}

function stageFromMatchday(matchday?: number): string {
  // Rough CL knockout mapping when API doesn't expose stage clearly
  if (!matchday) return "knockout";
  if (matchday >= 13) return "final";
  if (matchday >= 11) return "semi";
  if (matchday >= 9) return "quarter";
  return "round_of_16";
}

export async function refreshData(opts?: {
  reason?: string;
}): Promise<RefreshReport> {
  const teamsDoc = await readJson<{ teams: TeamRow[] }>("teams");
  const nameIndex = buildNameIndex(teamsDoc.teams);
  const changes: RefreshChange[] = [];
  const affectedTeamIds = new Set<string>();
  const affectedFixtureIds = new Set<string>();

  const scheduled = await footballData.getFixtures("SCHEDULED");
  const finished = await footballData.getMatches({ status: "FINISHED" });

  const liveOk = scheduled.ok || finished.ok;
  if (!liveOk) {
    // Demo / offline: re-stamp fixtures so callers see a fresh timestamp+reason
    const fixturesDoc = await readJson<{ fixtures: FixtureRow[] }>("fixtures");
    const reason =
      opts?.reason ??
      "refresh: demo cache validated (no live API / key missing)";
    await writeJson(
      "fixtures",
      { fixtures: fixturesDoc.fixtures },
      reason
    );
    changes.push({
      file: "fixtures.json",
      summary: `re-validated ${fixturesDoc.fixtures.length} cached fixtures`,
    });
    for (const f of fixturesDoc.fixtures) {
      affectedFixtureIds.add(f.id);
      affectedTeamIds.add(f.homeId);
      affectedTeamIds.add(f.awayId);
    }
    const threadMessage = `data updated: ${reason} — fixtures ${[
      ...affectedFixtureIds,
    ].join(", ")} (teams: ${[...affectedTeamIds].join(", ")})`;
    return {
      mode: "demo-cache",
      reason,
      changes,
      affectedTeamIds: [...affectedTeamIds],
      affectedFixtureIds: [...affectedFixtureIds],
      threadMessage,
    };
  }

  const reason =
    opts?.reason ?? "refresh: live football-data.org CL pull";

  // --- Fixtures (scheduled) ---
  if (scheduled.ok) {
    const prev = await readJson<{ fixtures: FixtureRow[] }>("fixtures");
    const next: FixtureRow[] = [];
    for (const m of scheduled.data.matches) {
      const homeId = resolveTeamId(nameIndex, m.homeTeam.name);
      const awayId = resolveTeamId(nameIndex, m.awayTeam.name);
      if (!homeId || !awayId) continue; // skip teams outside our tracked set
      const id = `fd-${m.id}`;
      next.push({
        id,
        homeId,
        awayId,
        stage: stageFromMatchday(m.matchday),
        leg: 1,
        kickoff: m.utcDate,
        status: m.status,
      });
      affectedFixtureIds.add(id);
      affectedTeamIds.add(homeId);
      affectedTeamIds.add(awayId);
    }
    // If live returned nothing mappable, keep previous fixtures
    const fixtures = next.length > 0 ? next : prev.fixtures;
    if (next.length === 0) {
      for (const f of prev.fixtures) {
        affectedFixtureIds.add(f.id);
        affectedTeamIds.add(f.homeId);
        affectedTeamIds.add(f.awayId);
      }
    }
    await writeJson("fixtures", { fixtures }, reason);
    changes.push({
      file: "fixtures.json",
      summary:
        next.length > 0
          ? `wrote ${next.length} live scheduled matches`
          : `kept ${prev.fixtures.length} cached fixtures (no mappable live rows)`,
    });
  }

  // --- Results (finished) ---
  if (finished.ok) {
    const mapped: ResultRow[] = [];
    for (const m of finished.data.matches) {
      const homeId = resolveTeamId(nameIndex, m.homeTeam.name);
      const awayId = resolveTeamId(nameIndex, m.awayTeam.name);
      const hg = m.score.fullTime.home;
      const ag = m.score.fullTime.away;
      if (!homeId || !awayId || hg == null || ag == null) continue;
      mapped.push({
        id: `fd-${m.id}`,
        homeId,
        awayId,
        homeGoals: hg,
        awayGoals: ag,
        date: m.utcDate.slice(0, 10),
      });
      affectedTeamIds.add(homeId);
      affectedTeamIds.add(awayId);
    }
    if (mapped.length > 0) {
      // Keep newest ~40 for form windows
      const results = mapped.slice(-40);
      await writeJson("results", { results }, reason);
      changes.push({
        file: "results.json",
        summary: `wrote ${results.length} finished matches`,
      });
    } else {
      changes.push({
        file: "results.json",
        summary: "no mappable finished matches — cache unchanged",
      });
    }
  }

  const changeBits = changes.map((c) => `${c.file}: ${c.summary}`).join("; ");
  const threadMessage = `data updated: ${reason} — ${changeBits}. Affected teams: ${
    [...affectedTeamIds].join(", ") || "none"
  }. Fixtures: ${[...affectedFixtureIds].join(", ") || "none"}.`;

  return {
    mode: "live",
    reason,
    changes,
    affectedTeamIds: [...affectedTeamIds],
    affectedFixtureIds: [...affectedFixtureIds],
    threadMessage,
  };
}

/** Exposed for tests — map a raw FdMatch list through the name index. */
export function mapFdMatchesForTest(
  teams: TeamRow[],
  matches: FdMatch[]
): FixtureRow[] {
  const index = buildNameIndex(teams);
  const out: FixtureRow[] = [];
  for (const m of matches) {
    const homeId = resolveTeamId(index, m.homeTeam.name);
    const awayId = resolveTeamId(index, m.awayTeam.name);
    if (!homeId || !awayId) continue;
    out.push({
      id: `fd-${m.id}`,
      homeId,
      awayId,
      stage: stageFromMatchday(m.matchday),
      leg: 1,
      kickoff: m.utcDate,
      status: m.status,
    });
  }
  return out;
}
