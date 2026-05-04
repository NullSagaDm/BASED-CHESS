import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { isDifficulty } from "@based-chess/shared";
import { getLeaderboard, type LeaderboardMetric, type LeaderboardScope } from "../services/leaderboardService.js";

const querySchema = z.object({
  difficulty: z.string().refine(isDifficulty).default("easy"),
  scope: z.enum(["all-time", "seasonal"]).default("seasonal"),
  metric: z.enum(["most-wins", "fastest-wins", "lowest-move-count"]).default("most-wins")
});

export async function leaderboardRoutes(app: FastifyInstance) {
  app.get("/leaderboards", async (request) => {
    const query = querySchema.parse(request.query);
    return getLeaderboard({
      difficulty: query.difficulty,
      scope: query.scope as LeaderboardScope,
      metric: query.metric as LeaderboardMetric
    });
  });
}
