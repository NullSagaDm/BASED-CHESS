import { describe, expect, it } from "vitest";
import { buildResultSvg } from "./artService.js";

describe("NFT card rendering", () => {
  it("only renders move count and duration as dynamic visible text", () => {
    const svg = buildResultSvg({
      result: "loss",
      difficulty: "easy",
      rarity: "common",
      moveCount: 27,
      durationSeconds: 894,
      season: "Season 9",
      playedAt: "2026-05-03T12:00:00.000Z",
      variant: "nft"
    });

    expect(svg).toContain(">27<");
    expect(svg).toContain(">14:54<");
    expect(svg).not.toContain(">LOSS<");
    expect(svg).not.toContain(">EASY<");
    expect(svg).not.toContain(">COMMON<");
    expect(svg).not.toContain(">Season 9<");
  });

  it("uses the blue result border for draw NFTs", () => {
    const svg = buildResultSvg({
      result: "draw",
      difficulty: "medium",
      rarity: "rare",
      moveCount: 40,
      durationSeconds: 720,
      season: "Season 9",
      playedAt: "2026-05-03T12:00:00.000Z",
      variant: "nft"
    });

    expect(svg).toContain('stroke="#0052ff"');
    expect(svg).toContain(">40<");
    expect(svg).toContain(">12:00<");
  });
});
