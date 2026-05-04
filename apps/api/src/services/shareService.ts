import type { Difficulty, GameResult } from "@based-chess/shared";
import { difficultyLabels } from "@based-chess/shared";

export function buildShareText(input: {
  result: GameResult;
  difficulty: Difficulty;
  moveCount: number;
  season: string;
}) {
  if (input.result === "win") {
    return `I beat the Based Chess bot on ${difficultyLabels[input.difficulty]} in ${input.moveCount} moves. ${input.season}.`;
  }
  if (input.result === "draw") {
    return `I drew the Based Chess bot on ${difficultyLabels[input.difficulty]} in ${input.moveCount} moves. ${input.season}.`;
  }
  if (input.difficulty === "very-hard") {
    return `I survived ${input.moveCount} moves against Very Hard and minted the result on Base. ${input.season}.`;
  }
  return `I battled the Based Chess bot on ${difficultyLabels[input.difficulty]} for ${input.moveCount} moves. ${input.season}.`;
}

export function buildTwitterIntent(text: string, url?: string) {
  const params = new URLSearchParams({ text });
  if (url) params.set("url", url);
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}
