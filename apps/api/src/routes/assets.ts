import { readFile } from "node:fs/promises";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { rarityByDifficulty } from "@based-chess/shared";
import { prisma } from "../db.js";
import { asDifficulty, asResult } from "../domain.js";
import { buildResultSvg, getRarityArtworkByFileName, getRarityArtworkFilePath } from "../services/artService.js";
import { buildMetadata, buildNftSvgForGame } from "../services/nftService.js";
import { buildShareText, buildTwitterIntent } from "../services/shareService.js";

async function publicGame(gameId: string) {
  return prisma.game.findUnique({
    where: { id: gameId },
    include: { season: true, mintedNft: true }
  });
}

export async function assetRoutes(app: FastifyInstance) {
  app.get("/rarity-artwork/:fileName", async (request, reply) => {
    const { fileName } = z.object({ fileName: z.string() }).parse(request.params);
    const artwork = getRarityArtworkByFileName(fileName);
    if (!artwork) return reply.code(404).send({ error: "Artwork not found" });
    const image = await readFile(getRarityArtworkFilePath(artwork.fileName));
    reply.header("content-type", "image/jpeg");
    reply.header("cache-control", "public, max-age=31536000, immutable");
    return reply.send(image);
  });

  app.get("/metadata/:gameId.json", async (request, reply) => {
    const { gameId } = z.object({ gameId: z.string() }).parse(request.params);
    const game = await publicGame(gameId);
    if (!game) return reply.code(404).send({ error: "Game not found" });
    if (game.mintedNft?.metadataJson) {
      try {
        const stored = JSON.parse(game.mintedNft.metadataJson);
        if (stored.duration_seconds !== undefined && stored.move_count !== undefined && stored.game_id !== undefined) {
          return stored;
        }
      } catch {
        app.log.warn({ gameId }, "Stored minted NFT metadata is invalid JSON; rebuilding from game record");
      }
    }
    return buildMetadata(game);
  });

  app.get("/nft-images/:gameId.svg", async (request, reply) => {
    const { gameId } = z.object({ gameId: z.string() }).parse(request.params);
    const game = await publicGame(gameId);
    if (!game) return reply.code(404).send({ error: "Game not found" });
    reply.header("content-type", "image/svg+xml; charset=utf-8");
    return buildNftSvgForGame(game);
  });

  app.get("/share-cards/:gameId.svg", async (request, reply) => {
    const { gameId } = z.object({ gameId: z.string() }).parse(request.params);
    const game = await publicGame(gameId);
    if (!game || !game.completedAt || game.durationSeconds === null) return reply.code(404).send({ error: "Game not found" });
    const result = asResult(game.result);
    if (!result) return reply.code(400).send({ error: "Game is not completed" });
    const difficulty = asDifficulty(game.difficulty);
    const svg = buildResultSvg({
      result,
      difficulty,
      rarity: rarityByDifficulty[difficulty],
      moveCount: game.userMoveCount,
      durationSeconds: game.durationSeconds,
      season: game.season.label,
      playedAt: game.completedAt.toISOString(),
      variant: "share"
    });
    reply.header("content-type", "image/svg+xml; charset=utf-8");
    return svg;
  });

  app.get("/share/:gameId", async (request, reply) => {
    const { gameId } = z.object({ gameId: z.string() }).parse(request.params);
    const game = await publicGame(gameId);
    if (!game || !game.completedAt || game.durationSeconds === null) return reply.code(404).send({ error: "Game not found" });
    const result = asResult(game.result);
    if (!result) return reply.code(400).send({ error: "Game is not completed" });
    const difficulty = asDifficulty(game.difficulty);
    const text = buildShareText({
      result,
      difficulty,
      moveCount: game.userMoveCount,
      season: game.season.label
    });
    return {
      text,
      imageUrl: `/share-cards/${gameId}.svg`,
      twitterUrl: buildTwitterIntent(text)
    };
  });
}
