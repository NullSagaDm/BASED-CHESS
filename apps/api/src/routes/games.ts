import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { isDifficulty } from "@based-chess/shared";
import { requireAuth } from "../auth.js";
import { serializeGame } from "../domain.js";
import { buildPostGameAnalysis } from "../services/analysisService.js";
import { closeInactiveGames, getOwnedGame, heartbeatGame, makeUserMove, startGame } from "../services/gameService.js";

const startSchema = z.object({
  difficulty: z.string().refine(isDifficulty, "Invalid difficulty")
});

const moveSchema = z.object({
  from: z.string().length(2),
  to: z.string().length(2),
  promotion: z.string().optional()
});

function attachAnalysis(serialized: ReturnType<typeof serializeGame>) {
  if (serialized.status !== "completed" || !serialized.result || serialized.durationSeconds === null) {
    return { game: serialized, analysis: null };
  }
  return {
    game: serialized,
    analysis: buildPostGameAnalysis({
      result: serialized.result,
      difficulty: serialized.difficulty,
      moveCount: serialized.userMoveCount,
      durationSeconds: serialized.durationSeconds,
      moves: serialized.moves
    })
  };
}

export async function gameRoutes(app: FastifyInstance) {
  app.post("/games", { preHandler: requireAuth }, async (request) => {
    await closeInactiveGames();
    const body = startSchema.parse(request.body);
    const game = await startGame({
      userId: request.authUser!.sub,
      walletAddress: request.authUser!.address,
      difficulty: body.difficulty
    });
    return attachAnalysis(serializeGame(game));
  });

  app.get("/games/:id", { preHandler: requireAuth }, async (request, reply) => {
    await closeInactiveGames();
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const game = await getOwnedGame(id, request.authUser!.sub);
    if (!game) return reply.code(404).send({ error: "Game not found" });
    return attachAnalysis(serializeGame(game));
  });

  app.post("/games/:id/move", { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { id } = z.object({ id: z.string() }).parse(request.params);
      const body = moveSchema.parse(request.body);
      const game = await makeUserMove({
        gameId: id,
        userId: request.authUser!.sub,
        ...body
      });
      return attachAnalysis(serializeGame(game));
    } catch (error) {
      return reply.code(400).send({ error: error instanceof Error ? error.message : "Move failed" });
    }
  });

  app.post("/games/:id/heartbeat", { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { id } = z.object({ id: z.string() }).parse(request.params);
      const game = await heartbeatGame(id, request.authUser!.sub);
      return { game: serializeGame(game) };
    } catch (error) {
      return reply.code(400).send({ error: error instanceof Error ? error.message : "Heartbeat failed" });
    }
  });
}
