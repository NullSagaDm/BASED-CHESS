import { Chess, type Move } from "chess.js";
import type { Difficulty, GameResult } from "@based-chess/shared";
import { prisma } from "../db.js";
import { activeStatus, asDifficulty, autoClosedStatus, completedStatus, readMoves, type StoredMove } from "../domain.js";
import { buildGameIntegrityHash } from "./integrityService.js";
import { ensureSeason } from "./seasonService.js";
import { recomputeUserStats } from "./statsService.js";
import { chooseBotMove } from "./chessBot.js";

const INACTIVITY_LIMIT_MS = 10 * 60 * 1000;
const BOT_DELAY_MIN_MS = 2_000;
const BOT_DELAY_MAX_MS = 3_000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomBotDelayMs() {
  return BOT_DELAY_MIN_MS + Math.floor(Math.random() * (BOT_DELAY_MAX_MS - BOT_DELAY_MIN_MS + 1));
}

function storedMoveFromChessMove(move: Move, ply: number, fenAfter: string): StoredMove {
  return {
    ply,
    side: move.color,
    san: move.san,
    from: move.from,
    to: move.to,
    promotion: move.promotion,
    fenAfter
  };
}

async function replaceGameMoves(gameId: string, moves: StoredMove[]) {
  await prisma.$transaction([
    prisma.gameMove.deleteMany({ where: { gameId } }),
    prisma.gameMove.createMany({
      data: moves.map((move) => ({
        gameId,
        ply: move.ply,
        side: move.side,
        san: move.san,
        from: move.from,
        to: move.to,
        promotion: move.promotion,
        fenAfter: move.fenAfter
      }))
    })
  ]);
}

export function resultFromGameOver(chess: Chess, lastMoveSide?: "w" | "b"): GameResult {
  if (chess.isCheckmate()) {
    const winningSide = lastMoveSide ?? (chess.turn() === "b" ? "w" : "b");
    return winningSide === "w" ? "win" : "loss";
  }
  return "draw";
}

export function isInactive(lastMoveAt: Date, now = new Date()) {
  return now.getTime() - lastMoveAt.getTime() >= INACTIVITY_LIMIT_MS;
}

export async function closeInactiveGames(now = new Date()) {
  const cutoff = new Date(now.getTime() - INACTIVITY_LIMIT_MS);
  const staleGames = await prisma.game.findMany({
    where: {
      status: activeStatus,
      lastMoveAt: { lte: cutoff }
    },
    select: { id: true, startedAt: true }
  });

  for (const game of staleGames) {
    await prisma.game.update({
      where: { id: game.id },
      data: {
        status: autoClosedStatus,
        completedAt: now,
        durationSeconds: Math.max(0, Math.floor((now.getTime() - game.startedAt.getTime()) / 1000))
      }
    });
  }

  return staleGames.length;
}

export async function startGame(input: { userId: string; walletAddress: string; difficulty: Difficulty }) {
  const chess = new Chess();
  const season = await ensureSeason();
  return prisma.game.create({
    data: {
      userId: input.userId,
      walletAddress: input.walletAddress,
      opponentType: "bot",
      difficulty: input.difficulty,
      status: activeStatus,
      fen: chess.fen(),
      pgn: chess.pgn(),
      seasonId: season.id
    },
    include: { season: true, mintedNft: true }
  });
}

export async function getOwnedGame(gameId: string, userId: string) {
  return prisma.game.findFirst({
    where: { id: gameId, userId },
    include: { season: true, mintedNft: true }
  });
}

async function persistCompletedGame(gameId: string, result: GameResult, chess: Chess, moves: StoredMove[], startedAt: Date) {
  const completedAt = new Date();
  const durationSeconds = Math.max(1, Math.floor((completedAt.getTime() - startedAt.getTime()) / 1000));
  const userMoveCount = moves.filter((move) => move.side === "w").length;
  const updateData = {
    status: completedStatus,
    result,
    fen: chess.fen(),
    pgn: chess.pgn(),
    movesJson: JSON.stringify(moves),
    userMoveCount,
    plyCount: moves.length,
    lastMoveAt: completedAt,
    completedAt,
    durationSeconds
  };

  const updated = await prisma.game.update({
    where: { id: gameId },
    data: updateData,
    include: { season: true, mintedNft: true }
  });

  await replaceGameMoves(gameId, moves);
  const integrityHash = buildGameIntegrityHash(updated);
  const withHash = await prisma.game.update({
    where: { id: gameId },
    data: { integrityHash },
    include: { season: true, mintedNft: true }
  });
  await recomputeUserStats(withHash.userId);
  return withHash;
}

export async function makeUserMove(input: {
  gameId: string;
  userId: string;
  from: string;
  to: string;
  promotion?: string;
}) {
  await closeInactiveGames();
  const game = await getOwnedGame(input.gameId, input.userId);
  if (!game) throw new Error("Game not found");
  if (game.status !== activeStatus) throw new Error("Game is not active");
  if (isInactive(game.lastMoveAt)) {
    await closeInactiveGames();
    throw new Error("Game was closed due to inactivity");
  }

  const difficulty = asDifficulty(game.difficulty);
  const chess = new Chess(game.fen);
  if (chess.turn() !== "w") throw new Error("It is not the user's turn");

  const moves = readMoves(game.movesJson);
  const userMove = chess.move({
    from: input.from,
    to: input.to,
    promotion: input.promotion ?? "q"
  });
  if (!userMove) throw new Error("Illegal move");

  moves.push(storedMoveFromChessMove(userMove, moves.length + 1, chess.fen()));

  if (chess.isGameOver()) {
    return persistCompletedGame(game.id, resultFromGameOver(chess, userMove.color), chess, moves, game.startedAt);
  }

  await sleep(randomBotDelayMs());
  const botMove = chooseBotMove(chess, difficulty);
  if (!botMove) {
    return persistCompletedGame(game.id, "win", chess, moves, game.startedAt);
  }
  const appliedBotMove = chess.move({ from: botMove.from, to: botMove.to, promotion: botMove.promotion });
  moves.push(storedMoveFromChessMove(appliedBotMove, moves.length + 1, chess.fen()));

  if (chess.isGameOver()) {
    return persistCompletedGame(game.id, resultFromGameOver(chess, appliedBotMove.color), chess, moves, game.startedAt);
  }

  return prisma.game.update({
    where: { id: game.id },
    data: {
      fen: chess.fen(),
      pgn: chess.pgn(),
      movesJson: JSON.stringify(moves),
      userMoveCount: moves.filter((move) => move.side === "w").length,
      plyCount: moves.length,
      lastMoveAt: new Date()
    },
    include: { season: true, mintedNft: true }
  }).then(async (updated) => {
    await replaceGameMoves(game.id, moves);
    return updated;
  });
}

export async function heartbeatGame(gameId: string, userId: string) {
  await closeInactiveGames();
  const game = await getOwnedGame(gameId, userId);
  if (!game) throw new Error("Game not found");
  return game;
}
