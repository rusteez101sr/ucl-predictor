/**
 * P1 / P3 — probabilities that form a partition must sum to ~100%.
 * If this fails, the engine is wrong — do not weaken the assertion.
 *
 * Reach probabilities (pQuarter / pSemi / pFinal) sum to the number of
 * slots at that stage (8 / 4 / 2). pTrophy partitions the title (sum = 1).
 */

import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { runEngine, sumStage } from "./index";
import { simulateMatch } from "./poisson";
import { buildRatings } from "./ratings";
import { makeRng } from "./rng";
import type { TeamInput } from "./types";

const ROOT = process.cwd();
const TOLERANCE = 0.005; // ±0.5pp

describe("probability sums", () => {
  it("P(trophy) sums to ~100% across teams", () => {
    const out = runEngine({
      demo: true,
      seed: 42,
      root: ROOT,
      reason: "unit test — probability sum gate",
      iterations: 5_000,
    });

    const { stage } = out.tournament;
    const trophySum = sumStage(stage, "pTrophy");
    expect(trophySum).toBeGreaterThan(1 - TOLERANCE);
    expect(trophySum).toBeLessThan(1 + TOLERANCE);

    // Reach slots: 8 QF / 4 SF / 2 finalists
    expect(sumStage(stage, "pFinal")).toBeGreaterThan(2 - 0.02);
    expect(sumStage(stage, "pFinal")).toBeLessThan(2 + 0.02);
    expect(sumStage(stage, "pSemi")).toBeGreaterThan(4 - 0.02);
    expect(sumStage(stage, "pSemi")).toBeLessThan(4 + 0.02);
    expect(sumStage(stage, "pQuarter")).toBeCloseTo(8, 5);
  });

  it("match P(home)+P(draw)+P(away) ≈ 100%; scorelines & O/U present", () => {
    const raw = JSON.parse(
      readFileSync(join(ROOT, "data/teams.json"), "utf8")
    );
    const teams = raw.teams as TeamInput[];
    const ratings = buildRatings(teams);
    const rng = makeRng(true, 7);
    const m = simulateMatch(ratings[0], ratings[1], rng, 8_000);
    const sum = m.pHome + m.pDraw + m.pAway;
    expect(sum).toBeGreaterThan(1 - TOLERANCE);
    expect(sum).toBeLessThan(1 + TOLERANCE);
    expect(m.topScorelines.length).toBe(5);
    expect(m.over25 + m.under25).toBeCloseTo(1, 5);
    expect(m.btts).toBeGreaterThan(0);
    expect(m.btts).toBeLessThan(1);
  });

  it("demo mode is deterministic for the same seed", () => {
    const a = runEngine({
      demo: true,
      seed: 99,
      root: ROOT,
      reason: "determinism A",
      iterations: 2_000,
    });
    const b = runEngine({
      demo: true,
      seed: 99,
      root: ROOT,
      reason: "determinism B",
      iterations: 2_000,
    });
    expect(a.tournament.stage.map((s) => s.pTrophy)).toEqual(
      b.tournament.stage.map((s) => s.pTrophy)
    );
  });
});
