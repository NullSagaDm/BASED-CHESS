import type { FastifyInstance } from "fastify";
import { requireAuth } from "../auth.js";
import { closeInactiveGames } from "../services/gameService.js";
import { getCurrentSeason } from "../services/seasonService.js";
import { getProfile } from "../services/statsService.js";

export async function meRoutes(app: FastifyInstance) {
  app.get("/me", { preHandler: requireAuth }, async (request) => {
    await closeInactiveGames();
    const profile = await getProfile(request.authUser!.sub);
    const season = await getCurrentSeason();
    return {
      user: {
        id: request.authUser!.sub,
        address: request.authUser!.address
      },
      season: {
        label: season.label,
        startsAt: season.startsAt.toISOString(),
        endsAt: season.endsAt.toISOString()
      },
      profile
    };
  });
}
