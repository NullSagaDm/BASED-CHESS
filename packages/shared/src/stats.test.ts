import { describe, expect, it } from "vitest";
import { getTitleForXp, xpForResult } from "./stats.js";

describe("XP progression", () => {
  it("awards one-fifth win XP for losses", () => {
    expect(xpForResult("easy", "loss")).toBe(0.2);
    expect(xpForResult("very-hard", "loss")).toBe(4);
  });

  it("does not award XP for draws", () => {
    expect(xpForResult("hard", "draw")).toBe(0);
  });

  it("keeps title thresholds based on total XP", () => {
    expect(getTitleForXp(24.9)).toBe("Rookie");
    expect(getTitleForXp(25)).toBe("Tactical Knight");
  });
});
