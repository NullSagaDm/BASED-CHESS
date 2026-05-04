import type { Difficulty, GameResult, Rarity } from "./levels.js";
import { difficultyLabels, rarityByDifficulty, rarityLabels, resultLabel } from "./levels.js";

export type ResultNftAttributes = {
  game_id: string;
  result: GameResult;
  difficulty: Difficulty;
  rarity: Rarity;
  move_count: number;
  duration_seconds: number;
  season: string;
  played_at: string;
  opponent_type: "bot";
};

export type NftVisualTheme = {
  accent: string;
  background: string;
  motif: string;
};

export type RarityArtwork = {
  key: "commonArtwork" | "rareArtwork" | "epicArtwork" | "legendaryArtwork";
  rarity: Rarity;
  fileName: string;
  publicPath: string;
};

export const commonArtwork: RarityArtwork = {
  key: "commonArtwork",
  rarity: "common",
  fileName: "common-artwork.jpg",
  publicPath: "/rarity-artwork/common-artwork.jpg"
};

export const rareArtwork: RarityArtwork = {
  key: "rareArtwork",
  rarity: "rare",
  fileName: "rare-artwork.jpg",
  publicPath: "/rarity-artwork/rare-artwork.jpg"
};

export const epicArtwork: RarityArtwork = {
  key: "epicArtwork",
  rarity: "epic",
  fileName: "epic-artwork.jpg",
  publicPath: "/rarity-artwork/epic-artwork.jpg"
};

export const legendaryArtwork: RarityArtwork = {
  key: "legendaryArtwork",
  rarity: "legendary",
  fileName: "legendary-artwork.jpg",
  publicPath: "/rarity-artwork/legendary-artwork.jpg"
};

export const artworkByRarity: Record<Rarity, RarityArtwork> = {
  common: commonArtwork,
  rare: rareArtwork,
  epic: epicArtwork,
  legendary: legendaryArtwork
};

export function artworkForDifficulty(difficulty: Difficulty) {
  return artworkByRarity[rarityByDifficulty[difficulty]];
}

export const rarityThemes: Record<Rarity, NftVisualTheme> = {
  common: {
    accent: "#88a7ff",
    background: "soft geometric chess motif",
    motif: "Clean diagonal grid with subtle pawn silhouettes"
  },
  rare: {
    accent: "#1e8fff",
    background: "knight-inspired tactical motif",
    motif: "Layered blue vectors with a focused knight mark"
  },
  epic: {
    accent: "#6b5cff",
    background: "fortress and rook power motif",
    motif: "Deep architectural panels framing a rook tower"
  },
  legendary: {
    accent: "#f0c862",
    background: "king-centered Base collectible motif",
    motif: "Prestige blue field with a central chess king"
  }
};

export function buildNftName(gameNumber: number, attrs: ResultNftAttributes) {
  return `Based Chess ${resultLabel(attrs.result)} #${gameNumber}`;
}

export function buildNftDescription(attrs: ResultNftAttributes) {
  return `${resultLabel(attrs.result)} on ${difficultyLabels[attrs.difficulty]} in ${attrs.move_count} moves over ${attrs.duration_seconds} seconds during ${attrs.season}. Rarity: ${rarityLabels[attrs.rarity]}.`;
}

export function attributesForGame(input: Omit<ResultNftAttributes, "rarity" | "opponent_type">): ResultNftAttributes {
  return {
    ...input,
    rarity: rarityByDifficulty[input.difficulty],
    opponent_type: "bot"
  };
}

export function borderForResult(result: GameResult) {
  if (result === "win") return "#17c964";
  if (result === "loss") return "#ef4444";
  return "#0052ff";
}
