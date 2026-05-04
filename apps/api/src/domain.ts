import type { Difficulty, GameResult, Rarity } from "@based-chess/shared";
import { difficultyLabels, rarityLabels } from "@based-chess/shared";

export const activeStatus = "active";
export const completedStatus = "completed";
export const autoClosedStatus = "auto_closed";

export type StoredMove = {
  ply: number;
  side: "w" | "b";
  san: string;
  from: string;
  to: string;
  promotion?: string;
  fenAfter: string;
};

export type SerializedGame = {
  id: string;
  difficulty: Difficulty;
  difficultyLabel: string;
  status: string;
  result: GameResult | null;
  fen: string;
  pgn: string | null;
  moves: StoredMove[];
  userMoveCount: number;
  plyCount: number;
  durationSeconds: number | null;
  startedAt: string;
  lastMoveAt: string;
  completedAt: string | null;
  season: {
    label: string;
    startsAt: string;
    endsAt: string;
  };
  mint: {
    eligible: boolean;
    minted: boolean;
  };
};

export function normalizeAddress(address: string) {
  return address.toLowerCase();
}

export function asDifficulty(value: string): Difficulty {
  if (value === "easy" || value === "medium" || value === "hard" || value === "very-hard") return value;
  throw new Error(`Unknown difficulty: ${value}`);
}

export function asResult(value: string | null): GameResult | null {
  if (value === "win" || value === "loss" || value === "draw") return value;
  return null;
}

export function asRarity(value: string): Rarity {
  if (value === "common" || value === "rare" || value === "epic" || value === "legendary") return value;
  throw new Error(`Unknown rarity: ${value}`);
}

export function readMoves(movesJson: string): StoredMove[] {
  try {
    return JSON.parse(movesJson) as StoredMove[];
  } catch {
    return [];
  }
}

export function serializeGame(game: {
  id: string;
  difficulty: string;
  status: string;
  result: string | null;
  fen: string;
  pgn: string | null;
  movesJson: string;
  userMoveCount: number;
  plyCount: number;
  durationSeconds: number | null;
  startedAt: Date;
  lastMoveAt: Date;
  completedAt: Date | null;
  season: { label: string; startsAt: Date; endsAt: Date };
  mintedNft?: unknown | null;
}): SerializedGame {
  const difficulty = asDifficulty(game.difficulty);
  const result = asResult(game.result);
  const minted = Boolean(game.mintedNft);
  return {
    id: game.id,
    difficulty,
    difficultyLabel: difficultyLabels[difficulty],
    status: game.status,
    result,
    fen: game.fen,
    pgn: game.pgn,
    moves: readMoves(game.movesJson),
    userMoveCount: game.userMoveCount,
    plyCount: game.plyCount,
    durationSeconds: game.durationSeconds,
    startedAt: game.startedAt.toISOString(),
    lastMoveAt: game.lastMoveAt.toISOString(),
    completedAt: game.completedAt?.toISOString() ?? null,
    season: {
      label: game.season.label,
      startsAt: game.season.startsAt.toISOString(),
      endsAt: game.season.endsAt.toISOString()
    },
    mint: {
      eligible: game.status === completedStatus && result !== null && !minted,
      minted
    }
  };
}

export function compactWallet(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function titleCaseRarity(rarity: Rarity) {
  return rarityLabels[rarity];
}
