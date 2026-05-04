import type { Difficulty, GameResult } from "./levels.js";
import { xpByDifficulty } from "./levels.js";

export const accountTitles = [
  "Rookie",
  "Tactical Knight",
  "Base Master",
  "Base Grandmaster",
  "Base God"
] as const;

export type AccountTitle = (typeof accountTitles)[number];

export function getTitleForXp(xp: number): AccountTitle {
  if (xp >= 500) return "Base God";
  if (xp >= 250) return "Base Grandmaster";
  if (xp >= 100) return "Base Master";
  if (xp >= 25) return "Tactical Knight";
  return "Rookie";
}

export function xpForWin(difficulty: Difficulty) {
  return xpByDifficulty[difficulty];
}

export function xpForLoss(difficulty: Difficulty) {
  return xpByDifficulty[difficulty] / 5;
}

export function xpForResult(difficulty: Difficulty, result: GameResult) {
  if (result === "win") return xpForWin(difficulty);
  if (result === "loss") return xpForLoss(difficulty);
  return 0;
}

export function formatXp(xp: number) {
  return Number.isInteger(xp) ? xp.toString() : xp.toFixed(1);
}
