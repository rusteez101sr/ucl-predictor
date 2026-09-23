import { buildRatings } from "@/lib/engine/ratings";
import type { TeamInput, TeamRatings } from "@/lib/engine/types";
import type { Team } from "./types";

/** Map Scout's /data team row into the engine TeamInput shape. */
export function toTeamInput(t: Team): TeamInput {
  return {
    id: t.id,
    name: t.name,
    uefaCoefficient: t.uefaCoefficient ?? 50,
    elo: t.elo ?? 1500,
    gfLast10: t.gfLast10 ?? 10,
    gaLast10: t.gaLast10 ?? 10,
    xgForLast10: t.xgForLast10,
    xgAgainstLast10: t.xgAgainstLast10,
    domesticGfLast10: t.domesticGfLast10,
    domesticGaLast10: t.domesticGaLast10,
    domesticPlayed: t.domesticPlayed,
    ucl2yGf: t.ucl2yGf,
    ucl2yGa: t.ucl2yGa,
    ucl2ySeasons: t.ucl2ySeasons,
  };
}

/** Build live attack/defense ratings for the UI (same function as the engine). */
export function ratingsForTeams(teams: Team[]): Map<string, TeamRatings> {
  const built = buildRatings(teams.map(toTeamInput));
  return new Map(built.map((r) => [r.id, r]));
}
