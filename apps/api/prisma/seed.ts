import { Chess } from "chess.js";
import { prisma } from "../src/db.js";
import { buildGameIntegrityHash } from "../src/services/integrityService.js";
import { ensureSeason } from "../src/services/seasonService.js";
import { findOrCreateUserByWallet } from "../src/services/userService.js";
import { recomputeUserStats } from "../src/services/statsService.js";

const season = await ensureSeason();
const chess = new Chess();
const users = await Promise.all([
  findOrCreateUserByWallet("0x0000000000000000000000000000000000000bcd"),
  findOrCreateUserByWallet("0x1111111111111111111111111111111111111111")
]);

for (const [index, user] of users.entries()) {
  const completedAt = new Date(Date.now() - (index + 1) * 60 * 60 * 1000);
  const game = await prisma.game.create({
    data: {
      userId: user.id,
      walletAddress: user.primaryWallet,
      difficulty: index === 0 ? "medium" : "easy",
      status: "completed",
      result: "win",
      fen: chess.fen(),
      pgn: "",
      movesJson: "[]",
      userMoveCount: index === 0 ? 22 : 30,
      plyCount: index === 0 ? 43 : 59,
      startedAt: new Date(completedAt.getTime() - 210_000),
      lastMoveAt: completedAt,
      completedAt,
      durationSeconds: index === 0 ? 210 : 320,
      seasonId: season.id
    }
  });
  await prisma.game.update({
    where: { id: game.id },
    data: { integrityHash: buildGameIntegrityHash({ ...game, completedAt }) }
  });
  await recomputeUserStats(user.id);
}

console.log("Seeded Based Chess demo data.");
await prisma.$disconnect();
