import { Chess, type Move } from "chess.js";
import type { Difficulty } from "@based-chess/shared";

const pieceValues: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 0
};

function randomItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function applyMove(chess: Chess, move: Move) {
  chess.move({ from: move.from, to: move.to, promotion: move.promotion });
}

function evaluate(chess: Chess) {
  if (chess.isCheckmate()) {
    return chess.turn() === "b" ? -100_000 : 100_000;
  }
  if (chess.isDraw() || chess.isStalemate() || chess.isInsufficientMaterial()) return -50;

  let score = 0;
  for (const row of chess.board()) {
    for (const piece of row) {
      if (!piece) continue;
      const value = pieceValues[piece.type] ?? 0;
      score += piece.color === "b" ? value : -value;
    }
  }

  const mobility = chess.moves().length;
  score += chess.turn() === "b" ? mobility * 2 : -mobility * 2;
  return score;
}

function moveScore(move: Move) {
  let score = 0;
  if (move.captured) score += pieceValues[move.captured] ?? 0;
  if (move.promotion) score += pieceValues[move.promotion] ?? 0;
  if (move.san.includes("+")) score += 40;
  if (move.san.includes("#")) score += 100_000;
  return score;
}

function orderedMoves(chess: Chess, limit: number) {
  return chess
    .moves({ verbose: true })
    .sort((a, b) => moveScore(b) - moveScore(a))
    .slice(0, limit);
}

function minimax(chess: Chess, depth: number, alpha: number, beta: number, maximizing: boolean, nodeLimit: { value: number }): number {
  nodeLimit.value -= 1;
  if (depth === 0 || chess.isGameOver() || nodeLimit.value <= 0) return evaluate(chess);

  const moves = orderedMoves(chess, depth >= 3 ? 24 : 32);
  if (maximizing) {
    let best = -Infinity;
    for (const move of moves) {
      applyMove(chess, move);
      best = Math.max(best, minimax(chess, depth - 1, alpha, beta, false, nodeLimit));
      chess.undo();
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  }

  let best = Infinity;
  for (const move of moves) {
    applyMove(chess, move);
    best = Math.min(best, minimax(chess, depth - 1, alpha, beta, true, nodeLimit));
    chess.undo();
    beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }
  return best;
}

function chooseGreedyMove(chess: Chess, noise = 0) {
  const moves = chess.moves({ verbose: true });
  const scored = moves
    .map((move) => ({ move, score: moveScore(move) + Math.random() * noise }))
    .sort((a, b) => b.score - a.score);
  return scored[0]?.move ?? randomItem(moves);
}

function chooseMinimaxMove(chess: Chess, depth: number, nodeBudget: number) {
  const moves = orderedMoves(chess, depth >= 3 ? 28 : 36);
  let bestMove = moves[0];
  let bestScore = -Infinity;
  const budget = { value: nodeBudget };

  for (const move of moves) {
    applyMove(chess, move);
    const score = minimax(chess, depth - 1, -Infinity, Infinity, false, budget);
    chess.undo();
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
    if (budget.value <= 0) break;
  }

  return bestMove;
}

export function chooseBotMove(chess: Chess, difficulty: Difficulty) {
  const legalMoves = chess.moves({ verbose: true });
  if (legalMoves.length === 0) return null;

  if (difficulty === "easy") {
    const captures = legalMoves.filter((move) => move.captured);
    if (captures.length > 0 && Math.random() < 0.25) return randomItem(captures);
    return randomItem(legalMoves);
  }

  if (difficulty === "medium") {
    if (Math.random() < 0.25) return randomItem(legalMoves);
    return chooseGreedyMove(chess, 90);
  }

  if (difficulty === "hard") {
    return chooseMinimaxMove(chess, 2, 1_500);
  }

  return chooseMinimaxMove(chess, 3, 6_000);
}
