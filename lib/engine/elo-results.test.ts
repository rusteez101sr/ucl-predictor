import { describe, expect, it } from "vitest";
import { applyResultsToElo } from "./ratings";
import type { TeamInput } from "./types";

const base = (id: string, elo: number): TeamInput => ({
  id,
  name: id,
  uefaCoefficient: 100,
  elo,
  gfLast10: 10,
  gaLast10: 10,
});

describe("applyResultsToElo", () => {
  it("raises winner Elo after a result", () => {
    const teams = [base("a", 1500), base("b", 1500)];
    const next = applyResultsToElo(teams, [
      { homeId: "a", awayId: "b", homeGoals: 2, awayGoals: 0, date: "2026-01-01" },
    ]);
    expect(next.find((t) => t.id === "a")!.elo).toBeGreaterThan(1500);
    expect(next.find((t) => t.id === "b")!.elo).toBeLessThan(1500);
    // Original untouched
    expect(teams.find((t) => t.id === "a")!.elo).toBe(1500);
  });
});
