import { describe, expect, it } from "vitest";
import { domesticWeightForCoverage } from "./ratings";

describe("domesticWeightForCoverage", () => {
  it("zeros domestic when coverage is tiny (Bundesliga-only bias guard)", () => {
    // 4/36 ≈ 0.11 < floor 0.15
    expect(domesticWeightForCoverage(4 / 36)).toBe(0);
  });

  it("ramps toward full weight as coverage grows", () => {
    expect(domesticWeightForCoverage(0.5)).toBe(0.35);
    expect(domesticWeightForCoverage(0.3)).toBeGreaterThan(0);
    expect(domesticWeightForCoverage(0.3)).toBeLessThan(0.35);
  });
});
