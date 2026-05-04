import type { FastifyReply, FastifyRequest } from "fastify";

export type AuthUser = {
  sub: string;
  address: string;
};

declare module "fastify" {
  interface FastifyRequest {
    authUser?: AuthUser;
  }
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    const payload = await request.jwtVerify<AuthUser>();
    request.authUser = payload;
  } catch {
    return reply.code(401).send({ error: "Authentication required" });
  }
}
