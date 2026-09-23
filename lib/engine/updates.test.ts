import { describe, expect, it } from "vitest";
import {
  MOVE_THRESHOLD_PP,
  diffProbabilities,
  type ProbSnapshot,
} from "./updates";

function stub(stage: ProbSnapshot["tournament"]["stage"]): ProbSnapshot {
  return {
    timestamp: "2026-01-01T00:00:00Z",
    reason: "stub",
    matches: [],
    tournament: { stage, tieAdvance: {}, iterations: 100, seed: 1 },
  };
}

describe("diffProbabilities", () => {
  it("emits entries only for moves > 2pp", () => {
    const prev = stub([
      { teamId: "rma", pQuarter: 1, pSemi: 0.5, pFinal: 0.3, pTrophy: 0.2 },
      { teamId: "bay", pQuarter: 1, pSemi: 0.5, pFinal: 0.3, pTrophy: 0.2 },
    ]);
    const next = stub([
      { teamId: "rma", pQuarter: 1, pSemi: 0.5, pFinal: 0.3, pTrophy: 0.25 },
      { teamId: "bay", pQuarter: 1, pSemi: 0.5, pFinal: 0.3, pTrophy: 0.205 },
    ]);
    const moves = diffProbabilities(prev, {
      ...next,
      timestamp: "2026-01-02T00:00:00Z",
      reason: "availability: key CB out",
    });
    expect(MOVE_THRESHOLD_PP).toBe(2);
    expect(moves).toHaveLength(1);
    expect(moves[0].teamId).toBe("rma");
    expect(moves[0].deltaPp).toBe(5);
    expect(moves[0].metric).toBe("pTrophy");
  });
});
