import { describe, expect, it } from "vitest";
import { getSeasonWindow } from "./seasons.js";

describe("season windows", () => {
  it("uses exact two-week UTC windows", () => {
    expect(getSeasonWindow(new Date("2026-01-05T00:00:00.000Z")).label).toBe("Season 1");
    expect(getSeasonWindow(new Date("2026-01-18T23:59:59.999Z")).label).toBe("Season 1");
    expect(getSeasonWindow(new Date("2026-01-19T00:00:00.000Z")).label).toBe("Season 2");
  });
});
