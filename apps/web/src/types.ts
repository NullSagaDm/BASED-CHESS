import type { Difficulty, GameResult, Rarity, RarityArtwork } from "@based-chess/shared";

export type StoredMove = {
  ply: number;
  side: "w" | "b";
  san: string;
  from: string;
  to: string;
  promotion?: string;
  fenAfter: string;
};

export type ApiGame = {
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

export type Analysis = {
  summary: string;
  turningPoint: string;
  strongMoment: string;
  notableMistake: string;
  explanation: string;
};

export type GameResponse = {
  game: ApiGame;
  analysis: Analysis | null;
};

export type Profile = {
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  xp: number;
  accountTitle: string;
  mintedNfts: number;
  bestStreak: number;
  winRateByDifficulty: Record<Difficulty, { wins: number; games: number; rate: number }>;
  history: Array<{
    id: string;
    difficulty: Difficulty;
    result: GameResult;
    moveCount: number;
    durationSeconds: number | null;
    season: string;
    completedAt: string | null;
    minted: boolean;
  }>;
  collection: Array<{
    id: string;
    gameId: string;
    result: GameResult;
    difficulty: Difficulty;
    rarity: Rarity;
    tokenId: string | null;
    txHash: string;
    imageUrl: string;
    tokenUri: string;
    season: string;
    mintedAt: string;
  }>;
};

export type MeResponse = {
  user: { id: string; address: string };
  season: { label: string; startsAt: string; endsAt: string };
  profile: Profile;
};

export type LeaderboardResponse = {
  difficulty: Difficulty;
  metric: "most-wins" | "fastest-wins" | "lowest-move-count";
  scope: "all-time" | "seasonal";
  season: { label: string; startsAt: string; endsAt: string } | null;
  rows: Array<{
    rank: number;
    userId: string;
    walletAddress: string;
    displayWallet: string;
    wins: number;
    fastestSeconds: number | null;
    lowestMoves: number | null;
    reachedAt: string;
  }>;
};

export type MintPreview = {
  gameId: string;
  eligible: boolean;
  tokenUri: string;
  imageUrl: string;
  rarity: Rarity;
  previewSvg: string;
  artwork: RarityArtwork & { imageUrl: string };
  attributes: {
    game_id: string;
    result: GameResult;
    difficulty: Difficulty;
    rarity: Rarity;
    artwork_template: string;
    artwork_image: string;
    move_count: number;
    duration_seconds: number;
    season: string;
    played_at: string;
    opponent_type: "bot";
  };
};
