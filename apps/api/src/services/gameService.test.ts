import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import { isInactive, resultFromGameOver } from "./gameService.js";

describe("game inactivity", () => {
  it("does not close games before ten minutes", () => {
    const lastMoveAt = new Date("2026-05-02T12:00:00.000Z");
    expect(isInactive(lastMoveAt, new Date("2026-05-02T12:09:59.999Z"))).toBe(false);
  });

  it("closes games at exactly ten minutes", () => {
    const lastMoveAt = new Date("2026-05-02T12:00:00.000Z");
    expect(isInactive(lastMoveAt, new Date("2026-05-02T12:10:00.000Z"))).toBe(true);
  });
});

describe("game result calculation", () => {
  it("records a user win when white delivers checkmate", () => {
    const chess = new Chess();
    for (const move of ["e4", "e5", "Qh5", "Nc6", "Bc4", "Nf6", "Qxf7#"]) {
      chess.move(move);
    }

    expect(chess.isCheckmate()).toBe(true);
    expect(resultFromGameOver(chess, "w")).toBe("win");
  });

  it("records a user loss when black delivers checkmate", () => {
    const chess = new Chess();
    for (const move of ["f3", "e5", "g4", "Qh4#"]) {
      chess.move(move);
    }

    expect(chess.isCheckmate()).toBe(true);
    expect(resultFromGameOver(chess, "b")).toBe("loss");
  });

  it("records stalemate as a draw", () => {
    const chess = new Chess("7k/5K2/6Q1/8/8/8/8/8 b - - 0 1");

    expect(chess.isStalemate()).toBe(true);
    expect(chess.isGameOver()).toBe(true);
    expect(resultFromGameOver(chess)).toBe("draw");
  });
});
