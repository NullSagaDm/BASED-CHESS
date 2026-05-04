import { createHmac } from "node:crypto";
import type { Game } from "@prisma/client";
import { env } from "../env.js";

export function buildGameIntegrityHash(game: Pick<Game, "id" | "userId" | "walletAddress" | "difficulty" | "result" | "userMoveCount" | "durationSeconds" | "seasonId" | "completedAt">) {
  const payload = [
    game.id,
    game.userId,
    game.walletAddress,
    game.difficulty,
    game.result,
    game.userMoveCount,
    game.durationSeconds,
    game.seasonId,
    game.completedAt?.toISOString()
  ].join("|");

  return createHmac("sha256", env.JWT_SECRET).update(payload).digest("hex");
}

export function verifyGameIntegrity(game: Game) {
  if (!game.integrityHash) return false;
  return buildGameIntegrityHash(game) === game.integrityHash;
}
