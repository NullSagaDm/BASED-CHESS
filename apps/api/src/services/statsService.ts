import type { Difficulty } from "@based-chess/shared";
import { DIFFICULTIES, getTitleForXp, xpForResult } from "@based-chess/shared";
import { prisma } from "../db.js";
import { completedStatus } from "../domain.js";

export async function recomputeUserStats(userId: string) {
  const [games, mintedCount] = await Promise.all([
    prisma.game.findMany({
      where: { userId, status: completedStatus, result: { in: ["win", "loss", "draw"] } },
      orderBy: { completedAt: "asc" }
    }),
    prisma.mintedNft.count({ where: { userId } })
  ]);

  let wins = 0;
  let losses = 0;
  let draws = 0;
  let xp = 0;
  let streak = 0;
  let bestStreak = 0;

  for (const game of games) {
    if (game.result === "win") {
      wins += 1;
      xp += xpForResult(game.difficulty as Difficulty, "win");
      streak += 1;
      bestStreak = Math.max(bestStreak, streak);
    } else if (game.result === "loss") {
      losses += 1;
      xp += xpForResult(game.difficulty as Difficulty, "loss");
      streak = 0;
    } else if (game.result === "draw") {
      draws += 1;
      xp += xpForResult(game.difficulty as Difficulty, "draw");
      streak = 0;
    }
  }

  return prisma.userStats.upsert({
    where: { userId },
    update: {
      totalGames: games.length,
      wins,
      losses,
      draws,
      xp,
      bestStreak,
      mintedNfts: mintedCount
    },
    create: {
      userId,
      totalGames: games.length,
      wins,
      losses,
      draws,
      xp,
      bestStreak,
      mintedNfts: mintedCount
    }
  });
}

export async function getProfile(userId: string) {
  const [stats, games, mintedNfts] = await Promise.all([
    recomputeUserStats(userId),
    prisma.game.findMany({
      where: { userId, status: completedStatus, result: { in: ["win", "loss", "draw"] } },
      orderBy: { completedAt: "desc" },
      include: { season: true, mintedNft: true }
    }),
    prisma.mintedNft.findMany({
      where: { userId },
      orderBy: { mintedAt: "desc" },
      include: { season: true }
    })
  ]);

  const winRateByDifficulty = Object.fromEntries(
    DIFFICULTIES.map((difficulty) => {
      const difficultyGames = games.filter((game) => game.difficulty === difficulty);
      const wins = difficultyGames.filter((game) => game.result === "win").length;
      const rate = difficultyGames.length === 0 ? 0 : Math.round((wins / difficultyGames.length) * 100);
      return [difficulty, { wins, games: difficultyGames.length, rate }];
    })
  );

  return {
    totalGames: stats.totalGames,
    wins: stats.wins,
    losses: stats.losses,
    draws: stats.draws,
    xp: stats.xp,
    accountTitle: getTitleForXp(stats.xp),
    mintedNfts: stats.mintedNfts,
    bestStreak: stats.bestStreak,
    winRateByDifficulty,
    history: games.slice(0, 20).map((game) => ({
      id: game.id,
      difficulty: game.difficulty,
      result: game.result,
      moveCount: game.userMoveCount,
      durationSeconds: game.durationSeconds,
      season: game.season.label,
      completedAt: game.completedAt?.toISOString() ?? null,
      minted: Boolean(game.mintedNft)
    })),
    collection: mintedNfts.map((nft) => ({
      id: nft.id,
      gameId: nft.gameId,
      result: nft.result,
      difficulty: nft.difficulty,
      rarity: nft.rarity,
      tokenId: nft.tokenId,
      txHash: nft.txHash,
      imageUrl: nft.imageUrl,
      tokenUri: nft.tokenUri,
      season: nft.season.label,
      mintedAt: nft.mintedAt.toISOString()
    }))
  };
}
