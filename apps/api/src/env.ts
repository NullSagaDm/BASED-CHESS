import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_HOST: z.string().default("127.0.0.1"),
  API_PORT: z.coerce.number().default(8787),
  WEB_ORIGIN: z.string().default("http://127.0.0.1:5173"),
  DATABASE_URL: z.string().default("file:./dev.db"),
  JWT_SECRET: z.string().min(24).default("dev-only-change-this-secret-before-deploying"),
  SIWE_DOMAIN: z.string().default("127.0.0.1:5173"),
  SIWE_URI: z.string().default("http://127.0.0.1:5173"),
  BASE_CHAIN_ID: z.coerce.number().default(84532),
  BASE_RPC_URL: z.string().url().default("https://sepolia.base.org"),
  RESULT_NFT_CONTRACT_ADDRESS: z.string().default("0x0000000000000000000000000000000000000000"),
  MINT_SIGNER_PRIVATE_KEY: z.string().optional(),
  PUBLIC_API_URL: z.string().url().default("http://127.0.0.1:8787"),
  SEASON_ZERO_START: z.string().default("2026-01-05T00:00:00.000Z"),
  ENABLE_DEV_AUTH: z.coerce.boolean().default(false)
});

export const env = envSchema.parse(process.env);
