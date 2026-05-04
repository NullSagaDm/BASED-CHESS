export const DIFFICULTIES = ["easy", "medium", "hard", "very-hard"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const RESULTS = ["win", "loss", "draw"] as const;
export type GameResult = (typeof RESULTS)[number];

export const RARITIES = ["common", "rare", "epic", "legendary"] as const;
export type Rarity = (typeof RARITIES)[number];

export const difficultyLabels: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  "very-hard": "Very Hard"
};

export const difficultyColors: Record<Difficulty, string> = {
  easy: "#16a34a",
  medium: "#0052ff",
  hard: "#dc2626",
  "very-hard": "#111827"
};

export const difficultyOrder: Record<Difficulty, number> = {
  easy: 0,
  medium: 1,
  hard: 2,
  "very-hard": 3
};

export const rarityByDifficulty: Record<Difficulty, Rarity> = {
  easy: "common",
  medium: "rare",
  hard: "epic",
  "very-hard": "legendary"
};

export const rarityLabels: Record<Rarity, string> = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary"
};

export const xpByDifficulty: Record<Difficulty, number> = {
  easy: 1,
  medium: 5,
  hard: 10,
  "very-hard": 20
};

export function isDifficulty(value: string): value is Difficulty {
  return (DIFFICULTIES as readonly string[]).includes(value);
}

export function resultLabel(result: GameResult) {
  if (result === "win") return "Win";
  if (result === "loss") return "Loss";
  return "Draw";
}
