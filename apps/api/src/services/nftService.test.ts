import { describe, expect, it } from "vitest";
import { buildMetadata } from "./nftService.js";

describe("NFT metadata", () => {
  it("includes match-specific move count, duration, and game id from the completed game", () => {
    const metadata = buildMetadata({
      id: "game-123",
      result: "win",
      difficulty: "hard",
      userMoveCount: 34,
      durationSeconds: 894,
      completedAt: new Date("2026-05-03T12:00:00.000Z"),
      season: { label: "Season 9" }
    } as Parameters<typeof buildMetadata>[0]);

    expect(metadata.game_id).toBe("game-123");
    expect(metadata.move_count).toBe(34);
    expect(metadata.duration_seconds).toBe(894);
    expect(metadata.opponent_type).toBe("bot");
    expect(metadata.properties).toMatchObject({
      game_id: "game-123",
      move_count: 34,
      duration_seconds: 894
    });
    expect(metadata.attributes).toEqual(
      expect.arrayContaining([
        { trait_type: "game_id", value: "game-123" },
        { trait_type: "move_count", value: 34 },
        { trait_type: "duration_seconds", value: 894 }
      ])
    );
    expect(metadata).not.toHaveProperty("duration");
  });

  it("includes draw as a first-class NFT result", () => {
    const metadata = buildMetadata({
      id: "game-draw",
      result: "draw",
      difficulty: "medium",
      userMoveCount: 40,
      durationSeconds: 720,
      completedAt: new Date("2026-05-03T12:30:00.000Z"),
      season: { label: "Season 9" }
    } as Parameters<typeof buildMetadata>[0]);

    expect(metadata.result).toBe("draw");
    expect(metadata.properties).toMatchObject({
      game_id: "game-draw",
      result: "draw",
      move_count: 40,
      duration_seconds: 720,
      opponent_type: "bot"
    });
    expect(metadata.attributes).toEqual(expect.arrayContaining([{ trait_type: "result", value: "draw" }]));
  });
});
