import type { Difficulty, GameResult } from "@based-chess/shared";
import { difficultyLabels } from "@based-chess/shared";
import type { StoredMove } from "../domain.js";

export function buildPostGameAnalysis(input: {
  result: GameResult;
  difficulty: Difficulty;
  moveCount: number;
  durationSeconds: number;
  moves: StoredMove[];
}) {
  const { result, difficulty, moveCount, durationSeconds, moves } = input;
  const lastUserMove = [...moves].reverse().find((move) => move.side === "w");
  const strongMoment =
    moves.find((move) => move.side === "w" && (move.san.includes("+") || move.san.includes("x"))) ?? lastUserMove;

  const pace =
    durationSeconds < 180 ? "fast tempo" : durationSeconds < 420 ? "steady tempo" : "patient tempo";
  const summary =
    result === "win"
      ? `You converted a ${difficultyLabels[difficulty]} win in ${moveCount} moves with a ${pace}.`
      : result === "draw"
        ? `You split the point against ${difficultyLabels[difficulty]} in ${moveCount} moves with a ${pace}.`
        : `You lasted ${moveCount} moves against ${difficultyLabels[difficulty]} with a ${pace}.`;

  const turningPoint =
    result === "win"
      ? strongMoment
        ? `${strongMoment.san} gave your position the clearest push.`
        : "Your clean development kept the bot from finding counterplay."
      : result === "draw"
        ? "Neither side found a clean finishing route, so the game settled into a draw."
      : lastUserMove
        ? `After ${lastUserMove.san}, the bot found enough pressure to close the game.`
        : "The bot built pressure before you could establish a stable plan.";

  const notableMistake =
    result === "loss"
      ? "A calmer king-safety move or a forcing trade may have slowed the attack."
      : result === "draw"
        ? "Look for one forcing plan earlier; a single tempo can turn a draw into pressure."
      : moveCount > 35
        ? "The win took a little extra time, so simplifying earlier may have helped."
        : "No major issue stood out in this lightweight review.";

  return {
    summary,
    turningPoint,
    strongMoment: strongMoment ? `${strongMoment.san} was your strongest visible moment.` : "Your opening setup stayed solid.",
    notableMistake,
    explanation: "This MVP analysis uses position events, move timing, and result context instead of deep engine search."
  };
}
