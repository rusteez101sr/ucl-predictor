/**
 * P1 / P3 — probabilities that form a partition must sum correctly.
 * If this fails, the engine is wrong — do not weaken the assertion.
 *
 * Knockout mode: pTrophy=1, pFinal=2, pSemi=4, pQuarter=8
 * League phase:  pTrophy=1, pFinal=2, pSemi=16 (R16), pQuarter=24 (KO phase)
 */

import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { loadBracket, runEngine, sumStage } from "./index";
import { simulateMatch } from "./poisson";
import { buildRatings } from "./ratings";
import { makeRng } from "./rng";
import type { TeamInput } from "./types";

const ROOT = process.cwd();
const TOLERANCE = 0.01; // ±1pp — league phase has more Monte Carlo noise

describe("probability sums", () => {
  it("P(trophy) sums to ~100% across teams", () => {
    const bracket = loadBracket(ROOT);
    const league =
      bracket.stage === "league_phase" || bracket.ties.length === 0;

    const out = runEngine({
      demo: true,
      seed: 42,
      root: ROOT,
      reason: "unit test — probability sum gate",
      iterations: league ? 2_000 : 5_000,
    });

    const { stage } = out.tournament;
    const trophySum = sumStage(stage, "pTrophy");
    expect(trophySum).toBeGreaterThan(1 - TOLERANCE);
    expect(trophySum).toBeLessThan(1 + TOLERANCE);

    expect(sumStage(stage, "pFinal")).toBeGreaterThan(2 - 0.05);
    expect(sumStage(stage, "pFinal")).toBeLessThan(2 + 0.05);

    if (league) {
      expect(sumStage(stage, "pSemi")).toBeGreaterThan(16 - 0.1);
      expect(sumStage(stage, "pSemi")).toBeLessThan(16 + 0.1);
      expect(sumStage(stage, "pQuarter")).toBeGreaterThan(24 - 0.1);
      expect(sumStage(stage, "pQuarter")).toBeLessThan(24 + 0.1);
    } else {
      expect(sumStage(stage, "pSemi")).toBeGreaterThan(4 - 0.05);
      expect(sumStage(stage, "pSemi")).toBeLessThan(4 + 0.05);
      expect(sumStage(stage, "pQuarter")).toBeCloseTo(8, 5);
    }
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
    expect(sum).toBeGreaterThan(1 - 0.005);
    expect(sum).toBeLessThan(1 + 0.005);
    expect(m.topScorelines.length).toBe(5);
    expect(m.over25 + m.under25).toBeCloseTo(1, 5);
    expect(m.btts).toBeGreaterThan(0);
    expect(m.btts).toBeLessThan(1);
  });

  it("demo mode is deterministic for the same seed", () => {
    const bracket = loadBracket(ROOT);
    const league =
      bracket.stage === "league_phase" || bracket.ties.length === 0;
    const iters = league ? 800 : 2_000;

    const a = runEngine({
      demo: true,
      seed: 99,
      root: ROOT,
      reason: "determinism A",
      iterations: iters,
    });
    const b = runEngine({
      demo: true,
      seed: 99,
      root: ROOT,
      reason: "determinism B",
      iterations: iters,
    });
    expect(a.tournament.stage.map((s) => s.pTrophy)).toEqual(
      b.tournament.stage.map((s) => s.pTrophy)
    );
  });
});
