import type { Difficulty } from "@based-chess/shared";
import { prisma } from "../db.js";
import { compactWallet, completedStatus } from "../domain.js";
import { getCurrentSeason } from "./seasonService.js";

export type LeaderboardMetric = "most-wins" | "fastest-wins" | "lowest-move-count";
export type LeaderboardScope = "all-time" | "seasonal";

export async function getLeaderboard(input: {
  difficulty: Difficulty;
  metric: LeaderboardMetric;
  scope: LeaderboardScope;
}) {
  const season = input.scope === "seasonal" ? await getCurrentSeason() : null;
  const games = await prisma.game.findMany({
    where: {
      status: completedStatus,
      result: "win",
      difficulty: input.difficulty,
      ...(season ? { seasonId: season.id } : {})
    },
    orderBy: { completedAt: "asc" },
    include: { user: true }
  });

  const byUser = new Map<
    string,
    {
      walletAddress: string;
      wins: number;
      fastestSeconds: number;
      fastestReachedAt: Date;
      lowestMoves: number;
      lowestMovesReachedAt: Date;
      reachedWinsAt: Date;
    }
  >();

  for (const game of games) {
    if (!game.completedAt || game.durationSeconds === null) continue;
    const current = byUser.get(game.userId) ?? {
      walletAddress: game.walletAddress,
      wins: 0,
      fastestSeconds: Number.POSITIVE_INFINITY,
      fastestReachedAt: game.completedAt,
      lowestMoves: Number.POSITIVE_INFINITY,
      lowestMovesReachedAt: game.completedAt,
      reachedWinsAt: game.completedAt
    };

    current.wins += 1;
    current.reachedWinsAt = game.completedAt;

    if (game.durationSeconds < current.fastestSeconds) {
      current.fastestSeconds = game.durationSeconds;
      current.fastestReachedAt = game.completedAt;
    }

    if (game.userMoveCount < current.lowestMoves) {
      current.lowestMoves = game.userMoveCount;
      current.lowestMovesReachedAt = game.completedAt;
    }

    byUser.set(game.userId, current);
  }

  const rows = [...byUser.entries()].map(([userId, row]) => ({ userId, ...row }));

  const sorted = rows.sort((a, b) => {
    if (input.metric === "most-wins") {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return a.reachedWinsAt.getTime() - b.reachedWinsAt.getTime();
    }
    if (input.metric === "fastest-wins") {
      if (a.fastestSeconds !== b.fastestSeconds) return a.fastestSeconds - b.fastestSeconds;
      return a.fastestReachedAt.getTime() - b.fastestReachedAt.getTime();
    }
    if (a.lowestMoves !== b.lowestMoves) return a.lowestMoves - b.lowestMoves;
    return a.lowestMovesReachedAt.getTime() - b.lowestMovesReachedAt.getTime();
  });

  return {
    difficulty: input.difficulty,
    metric: input.metric,
    scope: input.scope,
    season: season
      ? {
          label: season.label,
          startsAt: season.startsAt.toISOString(),
          endsAt: season.endsAt.toISOString()
        }
      : null,
    rows: sorted.slice(0, 50).map((row, index) => ({
      rank: index + 1,
      userId: row.userId,
      walletAddress: row.walletAddress,
      displayWallet: compactWallet(row.walletAddress),
      wins: row.wins,
      fastestSeconds: Number.isFinite(row.fastestSeconds) ? row.fastestSeconds : null,
      lowestMoves: Number.isFinite(row.lowestMoves) ? row.lowestMoves : null,
      reachedAt:
        input.metric === "most-wins"
          ? row.reachedWinsAt.toISOString()
          : input.metric === "fastest-wins"
            ? row.fastestReachedAt.toISOString()
            : row.lowestMovesReachedAt.toISOString()
    }))
  };
}
