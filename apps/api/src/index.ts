import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import Fastify from "fastify";
import { env } from "./env.js";
import { prisma } from "./db.js";
import { assetRoutes } from "./routes/assets.js";
import { authRoutes } from "./routes/auth.js";
import { gameRoutes } from "./routes/games.js";
import { leaderboardRoutes } from "./routes/leaderboards.js";
import { meRoutes } from "./routes/me.js";
import { mintRoutes } from "./routes/mints.js";
import { closeInactiveGames } from "./services/gameService.js";
import { getCurrentSeason } from "./services/seasonService.js";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: [env.WEB_ORIGIN, "http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true
});
await app.register(jwt, { secret: env.JWT_SECRET });

app.get("/health", async () => {
  const season = await getCurrentSeason();
  return {
    ok: true,
    season: {
      label: season.label,
      startsAt: season.startsAt.toISOString(),
      endsAt: season.endsAt.toISOString()
    }
  };
});

await app.register(authRoutes);
await app.register(meRoutes);
await app.register(gameRoutes);
await app.register(leaderboardRoutes);
await app.register(mintRoutes);
await app.register(assetRoutes);

if (env.NODE_ENV !== "test") {
  setInterval(() => {
    closeInactiveGames().catch((error) => app.log.error(error));
  }, 60_000).unref();
}

try {
  await app.listen({ host: env.API_HOST, port: env.API_PORT });
} catch (error) {
  app.log.error(error);
  await prisma.$disconnect();
  process.exit(1);
}
