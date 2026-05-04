import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { difficultyEnum, rarityByDifficulty, rarityEnum, resultEnum } from "@based-chess/shared";
import { requireAuth } from "../auth.js";
import { asDifficulty, asResult } from "../domain.js";
import { env } from "../env.js";
import { buildMintPreview, gameIdHash, getMintableGame, prepareMint, recordMint } from "../services/nftService.js";

export async function mintRoutes(app: FastifyInstance) {
  app.get("/mints/eligibility/:gameId", { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { gameId } = z.object({ gameId: z.string() }).parse(request.params);
      const game = await getMintableGame(gameId, request.authUser!.sub);
      return buildMintPreview(game);
    } catch (error) {
      return reply.code(400).send({ eligible: false, error: error instanceof Error ? error.message : "Not eligible" });
    }
  });

  app.post("/mints/prepare", { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { gameId } = z.object({ gameId: z.string() }).parse(request.body);
      const game = await getMintableGame(gameId, request.authUser!.sub);
      const auth = await prepareMint(gameId, request.authUser!.sub, request.authUser!.address);
      const result = asResult(game.result);
      const difficulty = asDifficulty(game.difficulty);
      const rarity = rarityByDifficulty[difficulty];
      if (!result || game.durationSeconds === null || !game.completedAt) throw new Error("Game is not mint-ready");
      return {
        contractAddress: env.RESULT_NFT_CONTRACT_ADDRESS,
        to: request.authUser!.address,
        gameIdHash: gameIdHash(gameId),
        tokenUri: auth.tokenUri,
        data: {
          result: resultEnum[result],
          difficulty: difficultyEnum[difficulty],
          rarity: rarityEnum[rarity],
          moveCount: game.userMoveCount,
          durationSeconds: game.durationSeconds,
          seasonHash: gameIdHash(game.season.label),
          playedAt: Math.floor(game.completedAt.getTime() / 1000).toString(),
          deadline: Math.floor(auth.deadline.getTime() / 1000).toString()
        },
        signature: auth.signature
      };
    } catch (error) {
      return reply.code(400).send({ error: error instanceof Error ? error.message : "Mint preparation failed" });
    }
  });

  app.post("/mints/record", { preHandler: requireAuth }, async (request, reply) => {
    try {
      const body = z
        .object({
          gameId: z.string(),
          txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash"),
          tokenId: z.string().optional()
        })
        .parse(request.body);
      const minted = await recordMint({
        ...body,
        userId: request.authUser!.sub,
        walletAddress: request.authUser!.address
      });
      return minted;
    } catch (error) {
      return reply.code(400).send({ error: error instanceof Error ? error.message : "Mint recording failed" });
    }
  });
}
