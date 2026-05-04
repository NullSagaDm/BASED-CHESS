import { randomBytes } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { createPublicClient, http, type Hex } from "viem";
import { base, baseSepolia } from "viem/chains";
import { parseSiweMessage } from "viem/siwe";
import { z } from "zod";
import { prisma } from "../db.js";
import { normalizeAddress } from "../domain.js";
import { env } from "../env.js";
import { findOrCreateUserByWallet } from "../services/userService.js";

const verifyBodySchema = z.object({
  address: z.string().min(10),
  message: z.string().min(20),
  signature: z.string().startsWith("0x")
});

export async function authRoutes(app: FastifyInstance) {
  const publicClient = createPublicClient({
    chain: env.BASE_CHAIN_ID === 8453 ? base : baseSepolia,
    transport: http(env.BASE_RPC_URL)
  });

  app.get("/auth/nonce", async () => {
    const nonce = randomBytes(16).toString("hex");
    await prisma.authNonce.create({
      data: {
        nonce,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      }
    });
    return { nonce };
  });

  app.post("/auth/verify", async (request, reply) => {
    const body = verifyBodySchema.parse(request.body);
    const fields = parseSiweMessage(body.message);
    if (!fields.nonce) return reply.code(400).send({ error: "SIWE nonce missing" });

    const nonce = await prisma.authNonce.findUnique({ where: { nonce: fields.nonce } });
    if (!nonce || nonce.usedAt || nonce.expiresAt <= new Date()) {
      return reply.code(400).send({ error: "Invalid or reused nonce" });
    }

    const valid = await publicClient.verifySiweMessage({
      address: body.address as `0x${string}`,
      message: body.message,
      signature: body.signature as Hex,
      domain: env.SIWE_DOMAIN,
      nonce: fields.nonce
    });
    if (!valid) return reply.code(401).send({ error: "Invalid SIWE signature" });

    await prisma.authNonce.update({
      where: { nonce: fields.nonce },
      data: { usedAt: new Date() }
    });

    const user = await findOrCreateUserByWallet(body.address);
    const address = normalizeAddress(body.address);
    const token = app.jwt.sign({ sub: user.id, address }, { expiresIn: "7d" });
    return { token, user: { id: user.id, address } };
  });

  app.post("/auth/dev", async (request, reply) => {
    if (!env.ENABLE_DEV_AUTH || env.NODE_ENV === "production") {
      return reply.code(404).send({ error: "Dev auth is disabled" });
    }

    const body = z.object({ address: z.string().optional() }).parse(request.body ?? {});
    const address = normalizeAddress(body.address ?? "0x0000000000000000000000000000000000000bcd");
    const user = await findOrCreateUserByWallet(address);
    const token = app.jwt.sign({ sub: user.id, address, dev: true }, { expiresIn: "12h" });
    return { token, user: { id: user.id, address, dev: true } };
  });
}
