/**
 * P1 / P3 — path probabilities must sum to slot counts.
 * League phase: knockout=24, R16=16, QF=8, SF=4, Final=2, Trophy=1
 * Knockout-from-QF: QF=8, SF=4, Final=2, Trophy=1
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
const TOLERANCE = 0.02;

describe("probability sums", () => {
  it("path probs sum to slot counts; trophy ≈ 100%", () => {
    const bracket = loadBracket(ROOT);
    const league =
      bracket.stage === "league_phase" || bracket.ties.length === 0;

    const out = runEngine({
      demo: true,
      seed: 42,
      root: ROOT,
      reason: "unit test — probability sum gate",
      iterations: league ? 1_500 : 5_000,
    });

    const { stage } = out.tournament;
    expect(sumStage(stage, "pTrophy")).toBeGreaterThan(1 - TOLERANCE);
    expect(sumStage(stage, "pTrophy")).toBeLessThan(1 + TOLERANCE);
    expect(sumStage(stage, "pFinal")).toBeGreaterThan(2 - 0.08);
    expect(sumStage(stage, "pFinal")).toBeLessThan(2 + 0.08);
    expect(sumStage(stage, "pSemi")).toBeGreaterThan(4 - 0.08);
    expect(sumStage(stage, "pSemi")).toBeLessThan(4 + 0.08);
    expect(sumStage(stage, "pQuarter")).toBeGreaterThan(8 - 0.1);
    expect(sumStage(stage, "pQuarter")).toBeLessThan(8 + 0.1);

    if (league) {
      const r16 = stage.reduce((a, s) => a + (s.pR16 ?? 0), 0);
      const ko = stage.reduce((a, s) => a + (s.pKnockout ?? 0), 0);
      expect(r16).toBeGreaterThan(16 - 0.1);
      expect(r16).toBeLessThan(16 + 0.1);
      expect(ko).toBeGreaterThan(24 - 0.1);
      expect(ko).toBeLessThan(24 + 0.1);
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
  });

  it("demo mode is deterministic for the same seed", () => {
    const bracket = loadBracket(ROOT);
    const league =
      bracket.stage === "league_phase" || bracket.ties.length === 0;
    const iters = league ? 600 : 2_000;

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
