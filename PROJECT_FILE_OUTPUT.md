# Based Chess Full Project Output

This document lists every repository file in the handoff package. Binary assets are included in the folder/archive and listed by path rather than inlined.

## `.env.example`

````text
# Shared
# Development can use SQLite with file:./dev.db. Production should use a managed
# database URL and production domains/contract addresses.
NODE_ENV=development
SEASON_ZERO_START=2026-01-05T00:00:00.000Z

# API
API_PORT=8787
API_HOST=127.0.0.1
WEB_ORIGIN=http://127.0.0.1:5173
DATABASE_URL=file:./dev.db
JWT_SECRET=replace-with-a-long-random-secret-at-least-32-chars
SIWE_DOMAIN=127.0.0.1:5173
SIWE_URI=http://127.0.0.1:5173
BASE_CHAIN_ID=84532
BASE_RPC_URL=https://sepolia.base.org
MINT_SIGNER_PRIVATE_KEY=0x0000000000000000000000000000000000000000000000000000000000000000
RESULT_NFT_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
PUBLIC_API_URL=http://127.0.0.1:8787
ENABLE_DEV_AUTH=false

# Web
VITE_API_URL=http://127.0.0.1:8787
VITE_BASE_CHAIN=baseSepolia
VITE_RESULT_NFT_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
VITE_ENABLE_DEV_AUTH=false
````

## `.github/workflows/ci.yml`

````yaml
name: CI

on:
  push:
    branches: ["main"]
  pull_request:
    branches: ["main"]

jobs:
  app:
    name: Typecheck, test, and build app
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma client
        run: npm run db:generate

      - name: Typecheck
        run: npm run typecheck

      - name: Test
        run: npm run test

      - name: Build
        run: npm run build

  contracts:
    name: Build contracts
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: contracts
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Foundry
        uses: foundry-rs/foundry-toolchain@v1

      - name: Build
        run: forge build
````

## `.gitignore`

````text
node_modules
dist
build
.env
.env.local
.DS_Store
coverage
*.log
apps/api/prisma/dev.db
apps/api/prisma/dev.db-journal
contracts/out
contracts/cache
contracts/broadcast
````

## `apps/api/assets/rarity/common-artwork.jpg`

Binary asset included in repository package. Size: 192666 bytes.

## `apps/api/assets/rarity/epic-artwork.jpg`

Binary asset included in repository package. Size: 242737 bytes.

## `apps/api/assets/rarity/legendary-artwork.jpg`

Binary asset included in repository package. Size: 261696 bytes.

## `apps/api/assets/rarity/rare-artwork.jpg`

Binary asset included in repository package. Size: 227926 bytes.

## `apps/api/package.json`

````json
{
  "name": "@based-chess/api",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev --name init",
    "db:deploy": "prisma migrate deploy",
    "db:seed": "tsx prisma/seed.ts",
    "job:close-inactive": "tsx src/jobs/closeInactiveGames.ts"
  },
  "dependencies": {
    "@based-chess/shared": "0.1.0",
    "@fastify/cors": "^11.0.1",
    "@fastify/jwt": "^10.0.0",
    "@prisma/client": "^6.7.0",
    "chess.js": "^1.2.0",
    "dotenv": "^16.5.0",
    "fastify": "^5.3.2",
    "nanoid": "^5.1.5",
    "viem": "^2.28.1",
    "zod": "^3.24.3"
  },
  "devDependencies": {
    "@types/node": "^22.15.3",
    "prisma": "^6.7.0",
    "tsx": "^4.19.4",
    "vitest": "^3.1.2"
  }
}
````

## `apps/api/prisma/migrations/0001_init/migration.sql`

````sql
CREATE TABLE "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "primaryWallet" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "User_primaryWallet_key" ON "User"("primaryWallet");

CREATE TABLE "WalletIdentity" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "walletAddress" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WalletIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "WalletIdentity_walletAddress_key" ON "WalletIdentity"("walletAddress");
CREATE INDEX "WalletIdentity_userId_idx" ON "WalletIdentity"("userId");

CREATE TABLE "AuthNonce" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "nonce" TEXT NOT NULL,
  "usedAt" DATETIME,
  "expiresAt" DATETIME NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "AuthNonce_nonce_key" ON "AuthNonce"("nonce");

CREATE TABLE "Season" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "index" INTEGER NOT NULL,
  "label" TEXT NOT NULL,
  "startsAt" DATETIME NOT NULL,
  "endsAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "Season_index_key" ON "Season"("index");
CREATE UNIQUE INDEX "Season_label_key" ON "Season"("label");

CREATE TABLE "Game" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "walletAddress" TEXT NOT NULL,
  "opponentType" TEXT NOT NULL DEFAULT 'bot',
  "difficulty" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "result" TEXT,
  "fen" TEXT NOT NULL,
  "pgn" TEXT,
  "movesJson" TEXT NOT NULL DEFAULT '[]',
  "userMoveCount" INTEGER NOT NULL DEFAULT 0,
  "plyCount" INTEGER NOT NULL DEFAULT 0,
  "durationSeconds" INTEGER,
  "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastMoveAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" DATETIME,
  "seasonId" TEXT NOT NULL,
  "integrityHash" TEXT,
  CONSTRAINT "Game_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Game_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "Game_userId_startedAt_idx" ON "Game"("userId", "startedAt");
CREATE INDEX "Game_difficulty_status_result_idx" ON "Game"("difficulty", "status", "result");
CREATE INDEX "Game_seasonId_difficulty_result_idx" ON "Game"("seasonId", "difficulty", "result");
CREATE INDEX "Game_lastMoveAt_status_idx" ON "Game"("lastMoveAt", "status");

CREATE TABLE "GameMove" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "gameId" TEXT NOT NULL,
  "ply" INTEGER NOT NULL,
  "side" TEXT NOT NULL,
  "san" TEXT NOT NULL,
  "from" TEXT NOT NULL,
  "to" TEXT NOT NULL,
  "promotion" TEXT,
  "fenAfter" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GameMove_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "GameMove_gameId_ply_key" ON "GameMove"("gameId", "ply");
CREATE INDEX "GameMove_gameId_idx" ON "GameMove"("gameId");

CREATE TABLE "MintAuthorization" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "gameId" TEXT NOT NULL,
  "walletAddress" TEXT NOT NULL,
  "gameIdHash" TEXT NOT NULL,
  "tokenUri" TEXT NOT NULL,
  "deadline" DATETIME NOT NULL,
  "signature" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MintAuthorization_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "MintAuthorization_gameId_key" ON "MintAuthorization"("gameId");
CREATE UNIQUE INDEX "MintAuthorization_gameIdHash_key" ON "MintAuthorization"("gameIdHash");

CREATE TABLE "MintedNft" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "gameId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "walletAddress" TEXT NOT NULL,
  "seasonId" TEXT NOT NULL,
  "result" TEXT NOT NULL,
  "difficulty" TEXT NOT NULL,
  "rarity" TEXT NOT NULL,
  "tokenId" TEXT,
  "txHash" TEXT NOT NULL,
  "tokenUri" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "metadataJson" TEXT NOT NULL,
  "mintedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MintedNft_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MintedNft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MintedNft_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "MintedNft_gameId_key" ON "MintedNft"("gameId");
CREATE UNIQUE INDEX "MintedNft_txHash_key" ON "MintedNft"("txHash");
CREATE INDEX "MintedNft_userId_mintedAt_idx" ON "MintedNft"("userId", "mintedAt");
CREATE INDEX "MintedNft_seasonId_difficulty_idx" ON "MintedNft"("seasonId", "difficulty");

CREATE TABLE "UserStats" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "totalGames" INTEGER NOT NULL DEFAULT 0,
  "wins" INTEGER NOT NULL DEFAULT 0,
  "losses" INTEGER NOT NULL DEFAULT 0,
  "xp" INTEGER NOT NULL DEFAULT 0,
  "bestStreak" INTEGER NOT NULL DEFAULT 0,
  "mintedNfts" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "UserStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "UserStats_userId_key" ON "UserStats"("userId");
````

## `apps/api/prisma/migrations/0002_loss_xp_float/migration.sql`

````sql
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_UserStats" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "totalGames" INTEGER NOT NULL DEFAULT 0,
  "wins" INTEGER NOT NULL DEFAULT 0,
  "losses" INTEGER NOT NULL DEFAULT 0,
  "xp" REAL NOT NULL DEFAULT 0,
  "bestStreak" INTEGER NOT NULL DEFAULT 0,
  "mintedNfts" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "UserStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_UserStats" ("id", "userId", "totalGames", "wins", "losses", "xp", "bestStreak", "mintedNfts", "updatedAt")
SELECT "id", "userId", "totalGames", "wins", "losses", "xp", "bestStreak", "mintedNfts", "updatedAt" FROM "UserStats";

DROP TABLE "UserStats";
ALTER TABLE "new_UserStats" RENAME TO "UserStats";
CREATE UNIQUE INDEX "UserStats_userId_key" ON "UserStats"("userId");

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
````

## `apps/api/prisma/migrations/0003_draw_results/migration.sql`

````sql
ALTER TABLE "UserStats" ADD COLUMN "draws" INTEGER NOT NULL DEFAULT 0;
````

## `apps/api/prisma/migrations/migration_lock.toml`

````toml
# Please do not edit this file manually.
# It should be added in your version-control system.
provider = "sqlite"
````

## `apps/api/prisma/schema.prisma`

````text
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id             String           @id @default(cuid())
  primaryWallet  String           @unique
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt
  wallets        WalletIdentity[]
  games          Game[]
  mintedNfts     MintedNft[]
  stats          UserStats?
}

model WalletIdentity {
  id            String   @id @default(cuid())
  walletAddress String   @unique
  userId        String
  createdAt     DateTime @default(now())
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model AuthNonce {
  id        String    @id @default(cuid())
  nonce     String    @unique
  usedAt    DateTime?
  expiresAt DateTime
  createdAt DateTime  @default(now())
}

model Season {
  id        String      @id @default(cuid())
  index     Int         @unique
  label     String      @unique
  startsAt  DateTime
  endsAt    DateTime
  games     Game[]
  mintedNfts MintedNft[]
}

model Game {
  id              String               @id @default(cuid())
  userId          String
  walletAddress   String
  opponentType    String               @default("bot")
  difficulty      String
  status          String               @default("active")
  result          String?
  fen             String
  pgn             String?
  movesJson       String               @default("[]")
  userMoveCount   Int                  @default(0)
  plyCount        Int                  @default(0)
  durationSeconds Int?
  startedAt       DateTime             @default(now())
  lastMoveAt      DateTime             @default(now())
  completedAt     DateTime?
  seasonId        String
  integrityHash   String?
  user            User                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  season          Season               @relation(fields: [seasonId], references: [id])
  moves           GameMove[]
  mintAuth        MintAuthorization?
  mintedNft       MintedNft?

  @@index([userId, startedAt])
  @@index([difficulty, status, result])
  @@index([seasonId, difficulty, result])
  @@index([lastMoveAt, status])
}

model GameMove {
  id        String   @id @default(cuid())
  gameId    String
  ply       Int
  side      String
  san       String
  from      String
  to        String
  promotion String?
  fenAfter  String
  createdAt DateTime @default(now())
  game      Game     @relation(fields: [gameId], references: [id], onDelete: Cascade)

  @@unique([gameId, ply])
  @@index([gameId])
}

model MintAuthorization {
  id            String   @id @default(cuid())
  gameId        String   @unique
  walletAddress String
  gameIdHash    String   @unique
  tokenUri      String
  deadline      DateTime
  signature     String
  createdAt     DateTime @default(now())
  game          Game     @relation(fields: [gameId], references: [id], onDelete: Cascade)
}

model MintedNft {
  id            String   @id @default(cuid())
  gameId        String   @unique
  userId        String
  walletAddress String
  seasonId      String
  result        String
  difficulty    String
  rarity        String
  tokenId       String?
  txHash        String   @unique
  tokenUri      String
  imageUrl      String
  metadataJson  String
  mintedAt      DateTime @default(now())
  game          Game     @relation(fields: [gameId], references: [id], onDelete: Cascade)
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  season        Season   @relation(fields: [seasonId], references: [id])

  @@index([userId, mintedAt])
  @@index([seasonId, difficulty])
}

model UserStats {
  id          String   @id @default(cuid())
  userId      String   @unique
  totalGames  Int      @default(0)
  wins        Int      @default(0)
  losses      Int      @default(0)
  draws       Int      @default(0)
  xp          Float    @default(0)
  bestStreak  Int      @default(0)
  mintedNfts  Int      @default(0)
  updatedAt   DateTime @updatedAt
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
````

## `apps/api/prisma/seed.ts`

````ts
import { Chess } from "chess.js";
import { prisma } from "../src/db.js";
import { buildGameIntegrityHash } from "../src/services/integrityService.js";
import { ensureSeason } from "../src/services/seasonService.js";
import { findOrCreateUserByWallet } from "../src/services/userService.js";
import { recomputeUserStats } from "../src/services/statsService.js";

const season = await ensureSeason();
const chess = new Chess();
const users = await Promise.all([
  findOrCreateUserByWallet("0x0000000000000000000000000000000000000bcd"),
  findOrCreateUserByWallet("0x1111111111111111111111111111111111111111")
]);

for (const [index, user] of users.entries()) {
  const completedAt = new Date(Date.now() - (index + 1) * 60 * 60 * 1000);
  const game = await prisma.game.create({
    data: {
      userId: user.id,
      walletAddress: user.primaryWallet,
      difficulty: index === 0 ? "medium" : "easy",
      status: "completed",
      result: "win",
      fen: chess.fen(),
      pgn: "",
      movesJson: "[]",
      userMoveCount: index === 0 ? 22 : 30,
      plyCount: index === 0 ? 43 : 59,
      startedAt: new Date(completedAt.getTime() - 210_000),
      lastMoveAt: completedAt,
      completedAt,
      durationSeconds: index === 0 ? 210 : 320,
      seasonId: season.id
    }
  });
  await prisma.game.update({
    where: { id: game.id },
    data: { integrityHash: buildGameIntegrityHash({ ...game, completedAt }) }
  });
  await recomputeUserStats(user.id);
}

console.log("Seeded Based Chess demo data.");
await prisma.$disconnect();
````

## `apps/api/src/auth.ts`

````ts
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
````

## `apps/api/src/db.ts`

````ts
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
````

## `apps/api/src/domain.ts`

````ts
import type { Difficulty, GameResult, Rarity } from "@based-chess/shared";
import { difficultyLabels, rarityLabels } from "@based-chess/shared";

export const activeStatus = "active";
export const completedStatus = "completed";
export const autoClosedStatus = "auto_closed";

export type StoredMove = {
  ply: number;
  side: "w" | "b";
  san: string;
  from: string;
  to: string;
  promotion?: string;
  fenAfter: string;
};

export type SerializedGame = {
  id: string;
  difficulty: Difficulty;
  difficultyLabel: string;
  status: string;
  result: GameResult | null;
  fen: string;
  pgn: string | null;
  moves: StoredMove[];
  userMoveCount: number;
  plyCount: number;
  durationSeconds: number | null;
  startedAt: string;
  lastMoveAt: string;
  completedAt: string | null;
  season: {
    label: string;
    startsAt: string;
    endsAt: string;
  };
  mint: {
    eligible: boolean;
    minted: boolean;
  };
};

export function normalizeAddress(address: string) {
  return address.toLowerCase();
}

export function asDifficulty(value: string): Difficulty {
  if (value === "easy" || value === "medium" || value === "hard" || value === "very-hard") return value;
  throw new Error(`Unknown difficulty: ${value}`);
}

export function asResult(value: string | null): GameResult | null {
  if (value === "win" || value === "loss" || value === "draw") return value;
  return null;
}

export function asRarity(value: string): Rarity {
  if (value === "common" || value === "rare" || value === "epic" || value === "legendary") return value;
  throw new Error(`Unknown rarity: ${value}`);
}

export function readMoves(movesJson: string): StoredMove[] {
  try {
    return JSON.parse(movesJson) as StoredMove[];
  } catch {
    return [];
  }
}

export function serializeGame(game: {
  id: string;
  difficulty: string;
  status: string;
  result: string | null;
  fen: string;
  pgn: string | null;
  movesJson: string;
  userMoveCount: number;
  plyCount: number;
  durationSeconds: number | null;
  startedAt: Date;
  lastMoveAt: Date;
  completedAt: Date | null;
  season: { label: string; startsAt: Date; endsAt: Date };
  mintedNft?: unknown | null;
}): SerializedGame {
  const difficulty = asDifficulty(game.difficulty);
  const result = asResult(game.result);
  const minted = Boolean(game.mintedNft);
  return {
    id: game.id,
    difficulty,
    difficultyLabel: difficultyLabels[difficulty],
    status: game.status,
    result,
    fen: game.fen,
    pgn: game.pgn,
    moves: readMoves(game.movesJson),
    userMoveCount: game.userMoveCount,
    plyCount: game.plyCount,
    durationSeconds: game.durationSeconds,
    startedAt: game.startedAt.toISOString(),
    lastMoveAt: game.lastMoveAt.toISOString(),
    completedAt: game.completedAt?.toISOString() ?? null,
    season: {
      label: game.season.label,
      startsAt: game.season.startsAt.toISOString(),
      endsAt: game.season.endsAt.toISOString()
    },
    mint: {
      eligible: game.status === completedStatus && result !== null && !minted,
      minted
    }
  };
}

export function compactWallet(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function titleCaseRarity(rarity: Rarity) {
  return rarityLabels[rarity];
}
````

## `apps/api/src/env.ts`

````ts
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
````

## `apps/api/src/index.ts`

````ts
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
````

## `apps/api/src/jobs/closeInactiveGames.ts`

````ts
import { prisma } from "../db.js";
import { closeInactiveGames } from "../services/gameService.js";

const closed = await closeInactiveGames();
console.log(`Closed ${closed} inactive game(s).`);
await prisma.$disconnect();
````

## `apps/api/src/routes/assets.ts`

````ts
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
````

## `apps/api/src/routes/auth.ts`

````ts
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
````

## `apps/api/src/routes/games.ts`

````ts
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
````

## `apps/api/src/routes/leaderboards.ts`

````ts
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
````

## `apps/api/src/routes/me.ts`

````ts
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
````

## `apps/api/src/routes/mints.ts`

````ts
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
````

## `apps/api/src/services/analysisService.ts`

````ts
import type { Difficulty, GameResult } from "@based-chess/shared";
import { difficultyLabels } from "@based-chess/shared";
import type { StoredMove } from "../domain.js";

export function buildPostGameAnalysis(input: {
  result: GameResult;
  difficulty: Difficulty;
  moveCount: number;
  durationSeconds: number;
  moves: StoredMove[];
}) {
  const { result, difficulty, moveCount, durationSeconds, moves } = input;
  const lastUserMove = [...moves].reverse().find((move) => move.side === "w");
  const strongMoment =
    moves.find((move) => move.side === "w" && (move.san.includes("+") || move.san.includes("x"))) ?? lastUserMove;

  const pace =
    durationSeconds < 180 ? "fast tempo" : durationSeconds < 420 ? "steady tempo" : "patient tempo";
  const summary =
    result === "win"
      ? `You converted a ${difficultyLabels[difficulty]} win in ${moveCount} moves with a ${pace}.`
      : result === "draw"
        ? `You split the point against ${difficultyLabels[difficulty]} in ${moveCount} moves with a ${pace}.`
        : `You lasted ${moveCount} moves against ${difficultyLabels[difficulty]} with a ${pace}.`;

  const turningPoint =
    result === "win"
      ? strongMoment
        ? `${strongMoment.san} gave your position the clearest push.`
        : "Your clean development kept the bot from finding counterplay."
      : result === "draw"
        ? "Neither side found a clean finishing route, so the game settled into a draw."
      : lastUserMove
        ? `After ${lastUserMove.san}, the bot found enough pressure to close the game.`
        : "The bot built pressure before you could establish a stable plan.";

  const notableMistake =
    result === "loss"
      ? "A calmer king-safety move or a forcing trade may have slowed the attack."
      : result === "draw"
        ? "Look for one forcing plan earlier; a single tempo can turn a draw into pressure."
      : moveCount > 35
        ? "The win took a little extra time, so simplifying earlier may have helped."
        : "No major issue stood out in this lightweight review.";

  return {
    summary,
    turningPoint,
    strongMoment: strongMoment ? `${strongMoment.san} was your strongest visible moment.` : "Your opening setup stayed solid.",
    notableMistake,
    explanation: "This MVP analysis uses position events, move timing, and result context instead of deep engine search."
  };
}
````

## `apps/api/src/services/artService.test.ts`

````ts
import { describe, expect, it } from "vitest";
import { buildResultSvg } from "./artService.js";

describe("NFT card rendering", () => {
  it("only renders move count and duration as dynamic visible text", () => {
    const svg = buildResultSvg({
      result: "loss",
      difficulty: "easy",
      rarity: "common",
      moveCount: 27,
      durationSeconds: 894,
      season: "Season 9",
      playedAt: "2026-05-03T12:00:00.000Z",
      variant: "nft"
    });

    expect(svg).toContain(">27<");
    expect(svg).toContain(">14:54<");
    expect(svg).not.toContain(">LOSS<");
    expect(svg).not.toContain(">EASY<");
    expect(svg).not.toContain(">COMMON<");
    expect(svg).not.toContain(">Season 9<");
  });

  it("uses the blue result border for draw NFTs", () => {
    const svg = buildResultSvg({
      result: "draw",
      difficulty: "medium",
      rarity: "rare",
      moveCount: 40,
      durationSeconds: 720,
      season: "Season 9",
      playedAt: "2026-05-03T12:00:00.000Z",
      variant: "nft"
    });

    expect(svg).toContain('stroke="#0052ff"');
    expect(svg).toContain(">40<");
    expect(svg).toContain(">12:00<");
  });
});
````

## `apps/api/src/services/artService.ts`

````ts
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { Difficulty, GameResult, Rarity, RarityArtwork } from "@based-chess/shared";
import {
  artworkByRarity,
  borderForResult,
  rarityLabels,
  resultLabel
} from "@based-chess/shared";

const ARTWORK_WIDTH = 854;
const ARTWORK_HEIGHT = 1280;
const artworkCache = new Map<Rarity, string>();

type ValueSlot = {
  x: number;
  y: number;
  fontSize: number;
  anchor?: "start" | "middle" | "end";
  fill?: string;
};

type TemplateOverlayConfig = {
  moves: ValueSlot;
  duration: ValueSlot;
};

const defaultTemplateOverlay: TemplateOverlayConfig = {
  moves: { x: 315, y: 1098, fontSize: 34, anchor: "start", fill: "#fff8e7" },
  duration: { x: 365, y: 1156, fontSize: 34, anchor: "start", fill: "#fff8e7" }
};

const templateOverlayByRarity: Record<Rarity, TemplateOverlayConfig> = {
  common: defaultTemplateOverlay,
  rare: defaultTemplateOverlay,
  epic: defaultTemplateOverlay,
  legendary: {
    ...defaultTemplateOverlay,
    moves: { x: 315, y: 1097, fontSize: 34, anchor: "start", fill: "#fff8e7" },
    duration: { x: 365, y: 1156, fontSize: 34, anchor: "start", fill: "#fff8e7" }
  }
};

function escapeXml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function durationLabel(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function getRarityArtworkFilePath(fileName: string) {
  return fileURLToPath(new URL(`../../assets/rarity/${fileName}`, import.meta.url));
}

export function getRarityArtworkByFileName(fileName: string): RarityArtwork | null {
  return Object.values(artworkByRarity).find((asset) => asset.fileName === fileName) ?? null;
}

function artworkDataUri(rarity: Rarity) {
  const cached = artworkCache.get(rarity);
  if (cached) return cached;
  const artwork = artworkByRarity[rarity];
  const encoded = readFileSync(getRarityArtworkFilePath(artwork.fileName)).toString("base64");
  const dataUri = `data:image/jpeg;base64,${encoded}`;
  artworkCache.set(rarity, dataUri);
  return dataUri;
}

export function buildResultSvg(input: {
  result: GameResult;
  difficulty: Difficulty;
  rarity: Rarity;
  moveCount: number;
  durationSeconds: number;
  season: string;
  playedAt: string;
  variant: "nft" | "share";
}) {
  const border = borderForResult(input.result);
  const artwork = artworkByRarity[input.rarity];
  const artworkUri = artworkDataUri(input.rarity);
  const slots = templateOverlayByRarity[input.rarity];
  const result = resultLabel(input.result).toUpperCase();
  const rarity = rarityLabels[input.rarity].toUpperCase();
  const duration = durationLabel(input.durationSeconds);

  const text = (slot: ValueSlot, value: string, weight = 900) =>
    `<text x="${slot.x}" y="${slot.y}"${slot.anchor ? ` text-anchor="${slot.anchor}"` : ""} font-size="${slot.fontSize}" font-weight="${weight}" fill="${slot.fill ?? "#ffffff"}">${escapeXml(value)}</text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${ARTWORK_WIDTH}" height="${ARTWORK_HEIGHT}" viewBox="0 0 ${ARTWORK_WIDTH} ${ARTWORK_HEIGHT}" role="img" aria-label="Based Chess ${escapeXml(result)} ${escapeXml(rarity)} NFT">
  <defs>
    <filter id="textShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#000814" flood-opacity=".9"/>
    </filter>
  </defs>
  <image href="${artworkUri}" x="0" y="0" width="${ARTWORK_WIDTH}" height="${ARTWORK_HEIGHT}" preserveAspectRatio="xMidYMid slice"/>
  <rect x="9" y="9" width="836" height="1262" rx="10" fill="none" stroke="${border}" stroke-width="14"/>
  <g font-family="Inter, Arial, sans-serif" filter="url(#textShadow)">
    ${text(slots.moves, input.moveCount.toString())}
    ${text(slots.duration, duration)}
  </g>
  <metadata>${escapeXml(JSON.stringify({ artwork: artwork.key, template: artwork.fileName, playedAt: new Date(input.playedAt).toISOString(), variant: input.variant }))}</metadata>
</svg>`;
}
````

## `apps/api/src/services/chessBot.ts`

````ts
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
````

## `apps/api/src/services/gameService.test.ts`

````ts
import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import { isInactive, resultFromGameOver } from "./gameService.js";

describe("game inactivity", () => {
  it("does not close games before ten minutes", () => {
    const lastMoveAt = new Date("2026-05-02T12:00:00.000Z");
    expect(isInactive(lastMoveAt, new Date("2026-05-02T12:09:59.999Z"))).toBe(false);
  });

  it("closes games at exactly ten minutes", () => {
    const lastMoveAt = new Date("2026-05-02T12:00:00.000Z");
    expect(isInactive(lastMoveAt, new Date("2026-05-02T12:10:00.000Z"))).toBe(true);
  });
});

describe("game result calculation", () => {
  it("records a user win when white delivers checkmate", () => {
    const chess = new Chess();
    for (const move of ["e4", "e5", "Qh5", "Nc6", "Bc4", "Nf6", "Qxf7#"]) {
      chess.move(move);
    }

    expect(chess.isCheckmate()).toBe(true);
    expect(resultFromGameOver(chess, "w")).toBe("win");
  });

  it("records a user loss when black delivers checkmate", () => {
    const chess = new Chess();
    for (const move of ["f3", "e5", "g4", "Qh4#"]) {
      chess.move(move);
    }

    expect(chess.isCheckmate()).toBe(true);
    expect(resultFromGameOver(chess, "b")).toBe("loss");
  });

  it("records stalemate as a draw", () => {
    const chess = new Chess("7k/5K2/6Q1/8/8/8/8/8 b - - 0 1");

    expect(chess.isStalemate()).toBe(true);
    expect(chess.isGameOver()).toBe(true);
    expect(resultFromGameOver(chess)).toBe("draw");
  });
});
````

## `apps/api/src/services/gameService.ts`

````ts
import { Chess, type Move } from "chess.js";
import type { Difficulty, GameResult } from "@based-chess/shared";
import { prisma } from "../db.js";
import { activeStatus, asDifficulty, autoClosedStatus, completedStatus, readMoves, type StoredMove } from "../domain.js";
import { buildGameIntegrityHash } from "./integrityService.js";
import { ensureSeason } from "./seasonService.js";
import { recomputeUserStats } from "./statsService.js";
import { chooseBotMove } from "./chessBot.js";

const INACTIVITY_LIMIT_MS = 10 * 60 * 1000;
const BOT_DELAY_MIN_MS = 3_000;
const BOT_DELAY_MAX_MS = 7_000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomBotDelayMs() {
  return BOT_DELAY_MIN_MS + Math.floor(Math.random() * (BOT_DELAY_MAX_MS - BOT_DELAY_MIN_MS + 1));
}

function storedMoveFromChessMove(move: Move, ply: number, fenAfter: string): StoredMove {
  return {
    ply,
    side: move.color,
    san: move.san,
    from: move.from,
    to: move.to,
    promotion: move.promotion,
    fenAfter
  };
}

async function replaceGameMoves(gameId: string, moves: StoredMove[]) {
  await prisma.$transaction([
    prisma.gameMove.deleteMany({ where: { gameId } }),
    prisma.gameMove.createMany({
      data: moves.map((move) => ({
        gameId,
        ply: move.ply,
        side: move.side,
        san: move.san,
        from: move.from,
        to: move.to,
        promotion: move.promotion,
        fenAfter: move.fenAfter
      }))
    })
  ]);
}

export function resultFromGameOver(chess: Chess, lastMoveSide?: "w" | "b"): GameResult {
  if (chess.isCheckmate()) {
    const winningSide = lastMoveSide ?? (chess.turn() === "b" ? "w" : "b");
    return winningSide === "w" ? "win" : "loss";
  }
  return "draw";
}

export function isInactive(lastMoveAt: Date, now = new Date()) {
  return now.getTime() - lastMoveAt.getTime() >= INACTIVITY_LIMIT_MS;
}

export async function closeInactiveGames(now = new Date()) {
  const cutoff = new Date(now.getTime() - INACTIVITY_LIMIT_MS);
  const staleGames = await prisma.game.findMany({
    where: {
      status: activeStatus,
      lastMoveAt: { lte: cutoff }
    },
    select: { id: true, startedAt: true }
  });

  for (const game of staleGames) {
    await prisma.game.update({
      where: { id: game.id },
      data: {
        status: autoClosedStatus,
        completedAt: now,
        durationSeconds: Math.max(0, Math.floor((now.getTime() - game.startedAt.getTime()) / 1000))
      }
    });
  }

  return staleGames.length;
}

export async function startGame(input: { userId: string; walletAddress: string; difficulty: Difficulty }) {
  const chess = new Chess();
  const season = await ensureSeason();
  return prisma.game.create({
    data: {
      userId: input.userId,
      walletAddress: input.walletAddress,
      opponentType: "bot",
      difficulty: input.difficulty,
      status: activeStatus,
      fen: chess.fen(),
      pgn: chess.pgn(),
      seasonId: season.id
    },
    include: { season: true, mintedNft: true }
  });
}

export async function getOwnedGame(gameId: string, userId: string) {
  return prisma.game.findFirst({
    where: { id: gameId, userId },
    include: { season: true, mintedNft: true }
  });
}

async function persistCompletedGame(gameId: string, result: GameResult, chess: Chess, moves: StoredMove[], startedAt: Date) {
  const completedAt = new Date();
  const durationSeconds = Math.max(1, Math.floor((completedAt.getTime() - startedAt.getTime()) / 1000));
  const userMoveCount = moves.filter((move) => move.side === "w").length;
  const updateData = {
    status: completedStatus,
    result,
    fen: chess.fen(),
    pgn: chess.pgn(),
    movesJson: JSON.stringify(moves),
    userMoveCount,
    plyCount: moves.length,
    lastMoveAt: completedAt,
    completedAt,
    durationSeconds
  };

  const updated = await prisma.game.update({
    where: { id: gameId },
    data: updateData,
    include: { season: true, mintedNft: true }
  });

  await replaceGameMoves(gameId, moves);
  const integrityHash = buildGameIntegrityHash(updated);
  const withHash = await prisma.game.update({
    where: { id: gameId },
    data: { integrityHash },
    include: { season: true, mintedNft: true }
  });
  await recomputeUserStats(withHash.userId);
  return withHash;
}

export async function makeUserMove(input: {
  gameId: string;
  userId: string;
  from: string;
  to: string;
  promotion?: string;
}) {
  await closeInactiveGames();
  const game = await getOwnedGame(input.gameId, input.userId);
  if (!game) throw new Error("Game not found");
  if (game.status !== activeStatus) throw new Error("Game is not active");
  if (isInactive(game.lastMoveAt)) {
    await closeInactiveGames();
    throw new Error("Game was closed due to inactivity");
  }

  const difficulty = asDifficulty(game.difficulty);
  const chess = new Chess(game.fen);
  if (chess.turn() !== "w") throw new Error("It is not the user's turn");

  const moves = readMoves(game.movesJson);
  const userMove = chess.move({
    from: input.from,
    to: input.to,
    promotion: input.promotion ?? "q"
  });
  if (!userMove) throw new Error("Illegal move");

  moves.push(storedMoveFromChessMove(userMove, moves.length + 1, chess.fen()));

  if (chess.isGameOver()) {
    return persistCompletedGame(game.id, resultFromGameOver(chess, userMove.color), chess, moves, game.startedAt);
  }

  await sleep(randomBotDelayMs());
  const botMove = chooseBotMove(chess, difficulty);
  if (!botMove) {
    return persistCompletedGame(game.id, "win", chess, moves, game.startedAt);
  }
  const appliedBotMove = chess.move({ from: botMove.from, to: botMove.to, promotion: botMove.promotion });
  moves.push(storedMoveFromChessMove(appliedBotMove, moves.length + 1, chess.fen()));

  if (chess.isGameOver()) {
    return persistCompletedGame(game.id, resultFromGameOver(chess, appliedBotMove.color), chess, moves, game.startedAt);
  }

  return prisma.game.update({
    where: { id: game.id },
    data: {
      fen: chess.fen(),
      pgn: chess.pgn(),
      movesJson: JSON.stringify(moves),
      userMoveCount: moves.filter((move) => move.side === "w").length,
      plyCount: moves.length,
      lastMoveAt: new Date()
    },
    include: { season: true, mintedNft: true }
  }).then(async (updated) => {
    await replaceGameMoves(game.id, moves);
    return updated;
  });
}

export async function heartbeatGame(gameId: string, userId: string) {
  await closeInactiveGames();
  const game = await getOwnedGame(gameId, userId);
  if (!game) throw new Error("Game not found");
  return game;
}
````

## `apps/api/src/services/integrityService.ts`

````ts
import { createHmac } from "node:crypto";
import type { Game } from "@prisma/client";
import { env } from "../env.js";

export function buildGameIntegrityHash(game: Pick<Game, "id" | "userId" | "walletAddress" | "difficulty" | "result" | "userMoveCount" | "durationSeconds" | "seasonId" | "completedAt">) {
  const payload = [
    game.id,
    game.userId,
    game.walletAddress,
    game.difficulty,
    game.result,
    game.userMoveCount,
    game.durationSeconds,
    game.seasonId,
    game.completedAt?.toISOString()
  ].join("|");

  return createHmac("sha256", env.JWT_SECRET).update(payload).digest("hex");
}

export function verifyGameIntegrity(game: Game) {
  if (!game.integrityHash) return false;
  return buildGameIntegrityHash(game) === game.integrityHash;
}
````

## `apps/api/src/services/leaderboardService.ts`

````ts
import type { Difficulty } from "@based-chess/shared";
import { prisma } from "../db.js";
import { compactWallet, completedStatus } from "../domain.js";
import { getCurrentSeason } from "./seasonService.js";

export type LeaderboardMetric = "most-wins" | "fastest-wins" | "lowest-move-count";
export type LeaderboardScope = "all-time" | "seasonal";

export async function getLeaderboard(input: {
  difficulty: Difficulty;
  metric: LeaderboardMetric;
  scope: LeaderboardScope;
}) {
  const season = input.scope === "seasonal" ? await getCurrentSeason() : null;
  const games = await prisma.game.findMany({
    where: {
      status: completedStatus,
      result: "win",
      difficulty: input.difficulty,
      ...(season ? { seasonId: season.id } : {})
    },
    orderBy: { completedAt: "asc" },
    include: { user: true }
  });

  const byUser = new Map<
    string,
    {
      walletAddress: string;
      wins: number;
      fastestSeconds: number;
      fastestReachedAt: Date;
      lowestMoves: number;
      lowestMovesReachedAt: Date;
      reachedWinsAt: Date;
    }
  >();

  for (const game of games) {
    if (!game.completedAt || game.durationSeconds === null) continue;
    const current = byUser.get(game.userId) ?? {
      walletAddress: game.walletAddress,
      wins: 0,
      fastestSeconds: Number.POSITIVE_INFINITY,
      fastestReachedAt: game.completedAt,
      lowestMoves: Number.POSITIVE_INFINITY,
      lowestMovesReachedAt: game.completedAt,
      reachedWinsAt: game.completedAt
    };

    current.wins += 1;
    current.reachedWinsAt = game.completedAt;

    if (game.durationSeconds < current.fastestSeconds) {
      current.fastestSeconds = game.durationSeconds;
      current.fastestReachedAt = game.completedAt;
    }

    if (game.userMoveCount < current.lowestMoves) {
      current.lowestMoves = game.userMoveCount;
      current.lowestMovesReachedAt = game.completedAt;
    }

    byUser.set(game.userId, current);
  }

  const rows = [...byUser.entries()].map(([userId, row]) => ({ userId, ...row }));

  const sorted = rows.sort((a, b) => {
    if (input.metric === "most-wins") {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return a.reachedWinsAt.getTime() - b.reachedWinsAt.getTime();
    }
    if (input.metric === "fastest-wins") {
      if (a.fastestSeconds !== b.fastestSeconds) return a.fastestSeconds - b.fastestSeconds;
      return a.fastestReachedAt.getTime() - b.fastestReachedAt.getTime();
    }
    if (a.lowestMoves !== b.lowestMoves) return a.lowestMoves - b.lowestMoves;
    return a.lowestMovesReachedAt.getTime() - b.lowestMovesReachedAt.getTime();
  });

  return {
    difficulty: input.difficulty,
    metric: input.metric,
    scope: input.scope,
    season: season
      ? {
          label: season.label,
          startsAt: season.startsAt.toISOString(),
          endsAt: season.endsAt.toISOString()
        }
      : null,
    rows: sorted.slice(0, 50).map((row, index) => ({
      rank: index + 1,
      userId: row.userId,
      walletAddress: row.walletAddress,
      displayWallet: compactWallet(row.walletAddress),
      wins: row.wins,
      fastestSeconds: Number.isFinite(row.fastestSeconds) ? row.fastestSeconds : null,
      lowestMoves: Number.isFinite(row.lowestMoves) ? row.lowestMoves : null,
      reachedAt:
        input.metric === "most-wins"
          ? row.reachedWinsAt.toISOString()
          : input.metric === "fastest-wins"
            ? row.fastestReachedAt.toISOString()
            : row.lowestMovesReachedAt.toISOString()
    }))
  };
}
````

## `apps/api/src/services/nftService.test.ts`

````ts
import { describe, expect, it } from "vitest";
import { buildMetadata } from "./nftService.js";

describe("NFT metadata", () => {
  it("includes match-specific move count, duration, and game id from the completed game", () => {
    const metadata = buildMetadata({
      id: "game-123",
      result: "win",
      difficulty: "hard",
      userMoveCount: 34,
      durationSeconds: 894,
      completedAt: new Date("2026-05-03T12:00:00.000Z"),
      season: { label: "Season 9" }
    } as Parameters<typeof buildMetadata>[0]);

    expect(metadata.game_id).toBe("game-123");
    expect(metadata.move_count).toBe(34);
    expect(metadata.duration_seconds).toBe(894);
    expect(metadata.opponent_type).toBe("bot");
    expect(metadata.properties).toMatchObject({
      game_id: "game-123",
      move_count: 34,
      duration_seconds: 894
    });
    expect(metadata.attributes).toEqual(
      expect.arrayContaining([
        { trait_type: "game_id", value: "game-123" },
        { trait_type: "move_count", value: 34 },
        { trait_type: "duration_seconds", value: 894 }
      ])
    );
    expect(metadata).not.toHaveProperty("duration");
  });

  it("includes draw as a first-class NFT result", () => {
    const metadata = buildMetadata({
      id: "game-draw",
      result: "draw",
      difficulty: "medium",
      userMoveCount: 40,
      durationSeconds: 720,
      completedAt: new Date("2026-05-03T12:30:00.000Z"),
      season: { label: "Season 9" }
    } as Parameters<typeof buildMetadata>[0]);

    expect(metadata.result).toBe("draw");
    expect(metadata.properties).toMatchObject({
      game_id: "game-draw",
      result: "draw",
      move_count: 40,
      duration_seconds: 720,
      opponent_type: "bot"
    });
    expect(metadata.attributes).toEqual(expect.arrayContaining([{ trait_type: "result", value: "draw" }]));
  });
});
````

## `apps/api/src/services/nftService.ts`

````ts
import type { Game } from "@prisma/client";
import {
  artworkByRarity,
  attributesForGame,
  difficultyEnum,
  rarityByDifficulty,
  rarityEnum,
  resultEnum,
  resultNftAbi
} from "@based-chess/shared";
import { privateKeyToAccount } from "viem/accounts";
import { createPublicClient, getAddress, http, keccak256, parseEventLogs, toBytes, type Address, type Hex } from "viem";
import { base, baseSepolia } from "viem/chains";
import { prisma } from "../db.js";
import { asDifficulty, asResult, asRarity, completedStatus, readMoves } from "../domain.js";
import { env } from "../env.js";
import { verifyGameIntegrity } from "./integrityService.js";
import { buildResultSvg } from "./artService.js";
import { recomputeUserStats } from "./statsService.js";

const mintPublicClient = createPublicClient({
  chain: env.BASE_CHAIN_ID === 8453 ? base : baseSepolia,
  transport: http(env.BASE_RPC_URL)
});

export function gameIdHash(gameId: string) {
  return keccak256(toBytes(gameId));
}

export function buildTokenUri(gameId: string) {
  return `${env.PUBLIC_API_URL}/metadata/${gameId}.json`;
}

export function buildImageUrl(gameId: string) {
  return `${env.PUBLIC_API_URL}/nft-images/${gameId}.svg`;
}

export function buildArtworkUrl(rarity: string) {
  const artwork = artworkByRarity[asRarity(rarity)];
  return `${env.PUBLIC_API_URL}${artwork.publicPath}`;
}

export async function getMintableGame(gameId: string, userId?: string) {
  const game = await prisma.game.findFirst({
    where: {
      id: gameId,
      ...(userId ? { userId } : {})
    },
    include: { season: true, mintedNft: true }
  });

  if (!game) throw new Error("Game not found");
  if (game.status !== completedStatus || !game.result) throw new Error("Only completed games can mint");
  if (game.mintedNft) throw new Error("NFT already minted for this game");
  if (!verifyGameIntegrity(game)) throw new Error("Game integrity check failed");
  return game;
}

export function buildMetadata(game: Game & { season: { label: string } }) {
  const result = asResult(game.result);
  if (!result || game.durationSeconds === null || !game.completedAt) throw new Error("Game is not metadata-ready");
  const difficulty = asDifficulty(game.difficulty);
  const attrs = attributesForGame({
    game_id: game.id,
    result,
    difficulty,
    move_count: game.userMoveCount,
    duration_seconds: game.durationSeconds,
    season: game.season.label,
    played_at: game.completedAt.toISOString()
  });
  const artwork = artworkByRarity[attrs.rarity];
  const artworkImage = buildArtworkUrl(attrs.rarity);

  return {
    name: `Based Chess ${result.toUpperCase()} ${game.id.slice(0, 8)}`,
    description: `A Based Chess ${result} against the bot on ${game.season.label}.`,
    image: buildImageUrl(game.id),
    game_id: attrs.game_id,
    result: attrs.result,
    difficulty: attrs.difficulty,
    rarity: attrs.rarity,
    move_count: attrs.move_count,
    duration_seconds: attrs.duration_seconds,
    season: attrs.season,
    played_at: attrs.played_at,
    opponent_type: attrs.opponent_type,
    artwork_template: artwork.key,
    artwork_image: artworkImage,
    external_url: `${env.WEB_ORIGIN}/games/${game.id}`,
    attributes: [
      { trait_type: "game_id", value: attrs.game_id },
      { trait_type: "result", value: attrs.result },
      { trait_type: "difficulty", value: attrs.difficulty },
      { trait_type: "rarity", value: attrs.rarity },
      { trait_type: "artwork_template", value: artwork.key },
      { trait_type: "move_count", value: attrs.move_count },
      { trait_type: "duration_seconds", value: attrs.duration_seconds },
      { trait_type: "season", value: attrs.season },
      { trait_type: "played_at", value: attrs.played_at },
      { trait_type: "opponent_type", value: attrs.opponent_type }
    ],
    properties: {
      ...attrs,
      artwork_template: artwork.key,
      artwork_image: artworkImage
    }
  };
}

export function buildNftSvgForGame(game: Game & { season: { label: string } }) {
  const result = asResult(game.result);
  if (!result || game.durationSeconds === null || !game.completedAt) throw new Error("Game is not renderable");
  const difficulty = asDifficulty(game.difficulty);
  const rarity = rarityByDifficulty[difficulty];

  return buildResultSvg({
    result,
    difficulty,
    rarity,
    moveCount: game.userMoveCount,
    durationSeconds: game.durationSeconds,
    season: game.season.label,
    playedAt: game.completedAt.toISOString(),
    variant: "nft"
  });
}

export function getMintSigner() {
  const key = env.MINT_SIGNER_PRIVATE_KEY;
  if (!key || /^0x0+$/.test(key)) {
    throw new Error("MINT_SIGNER_PRIVATE_KEY is not configured");
  }
  return privateKeyToAccount(key as Hex);
}

export async function prepareMint(gameId: string, userId: string, walletAddress: string) {
  const game = await getMintableGame(gameId, userId);
  const result = asResult(game.result);
  if (!result || game.durationSeconds === null || !game.completedAt) throw new Error("Game is not mint-ready");

  const existing = await prisma.mintAuthorization.findUnique({ where: { gameId } });
  if (existing && existing.deadline > new Date()) return existing;

  const difficulty = asDifficulty(game.difficulty);
  const rarity = rarityByDifficulty[difficulty];
  const deadline = new Date(Date.now() + 15 * 60 * 1000);
  const hash = gameIdHash(game.id);
  const tokenUri = buildTokenUri(game.id);
  const seasonHash = keccak256(toBytes(game.season.label));
  const signer = getMintSigner();

  const data = {
    result: resultEnum[result],
    difficulty: difficultyEnum[difficulty],
    rarity: rarityEnum[rarity],
    moveCount: game.userMoveCount,
    durationSeconds: game.durationSeconds,
    seasonHash,
    playedAt: BigInt(Math.floor(game.completedAt.getTime() / 1000)),
    deadline: BigInt(Math.floor(deadline.getTime() / 1000))
  } as const;

  const signature = await signer.signTypedData({
    domain: {
      name: "BasedChessResults",
      version: "1",
      chainId: env.BASE_CHAIN_ID,
      verifyingContract: env.RESULT_NFT_CONTRACT_ADDRESS as Address
    },
    types: {
      MintData: [
        { name: "result", type: "uint8" },
        { name: "difficulty", type: "uint8" },
        { name: "rarity", type: "uint8" },
        { name: "moveCount", type: "uint16" },
        { name: "durationSeconds", type: "uint32" },
        { name: "seasonHash", type: "bytes32" },
        { name: "playedAt", type: "uint64" },
        { name: "deadline", type: "uint64" }
      ],
      MintAuthorization: [
        { name: "to", type: "address" },
        { name: "gameIdHash", type: "bytes32" },
        { name: "tokenUriHash", type: "bytes32" },
        { name: "data", type: "MintData" }
      ]
    },
    primaryType: "MintAuthorization",
    message: {
      to: walletAddress as Address,
      gameIdHash: hash,
      tokenUriHash: keccak256(toBytes(tokenUri)),
      data
    }
  });

  return prisma.mintAuthorization.upsert({
    where: { gameId },
    update: {
      walletAddress,
      gameIdHash: hash,
      tokenUri,
      deadline,
      signature
    },
    create: {
      gameId,
      walletAddress,
      gameIdHash: hash,
      tokenUri,
      deadline,
      signature
    }
  });
}

export async function recordMint(input: {
  gameId: string;
  userId: string;
  walletAddress: string;
  txHash: string;
  tokenId?: string;
}) {
  const game = await prisma.game.findFirst({
    where: { id: input.gameId, userId: input.userId },
    include: { season: true, mintedNft: true }
  });
  if (!game) throw new Error("Game not found");
  if (game.mintedNft) return game.mintedNft;
  if (game.status !== completedStatus || !game.result || !verifyGameIntegrity(game)) {
    throw new Error("Game is not eligible for mint recording");
  }

  const difficulty = asDifficulty(game.difficulty);
  const rarity = rarityByDifficulty[difficulty];
  const tokenUri = buildTokenUri(game.id);
  const receipt = await mintPublicClient.waitForTransactionReceipt({
    hash: input.txHash as Hex,
    confirmations: 1,
    timeout: 60_000
  });
  const contractAddress = getAddress(env.RESULT_NFT_CONTRACT_ADDRESS as Address);
  if (receipt.status !== "success") throw new Error("Mint transaction did not succeed");
  if (!receipt.to || getAddress(receipt.to) !== contractAddress) {
    throw new Error("Mint transaction was not sent to the result NFT contract");
  }

  const logs = parseEventLogs({
    abi: resultNftAbi,
    logs: receipt.logs,
    eventName: "ResultMinted"
  });
  const result = asResult(game.result);
  const expectedGameIdHash = gameIdHash(game.id);
  const expectedSeasonHash = keccak256(toBytes(game.season.label));
  const event = logs.find((log) => {
    if (getAddress(log.address) !== contractAddress) return false;
    return (
      getAddress(log.args.to) === getAddress(input.walletAddress as Address) &&
      log.args.gameIdHash === expectedGameIdHash &&
      log.args.tokenUri === tokenUri &&
      log.args.result === resultEnum[result!] &&
      log.args.difficulty === difficultyEnum[difficulty] &&
      log.args.rarity === rarityEnum[rarity] &&
      log.args.moveCount === game.userMoveCount &&
      log.args.durationSeconds === game.durationSeconds &&
      log.args.seasonHash === expectedSeasonHash &&
      log.args.playedAt === BigInt(Math.floor(game.completedAt!.getTime() / 1000))
    );
  });
  if (!event) throw new Error("Mint transaction does not match the completed game");
  if (input.tokenId && input.tokenId !== event.args.tokenId.toString()) {
    throw new Error("Minted token id does not match transaction receipt");
  }

  const metadata = buildMetadata(game);
  const minted = await prisma.mintedNft.create({
    data: {
      gameId: game.id,
      userId: game.userId,
      walletAddress: input.walletAddress,
      seasonId: game.seasonId,
      result: game.result,
      difficulty: game.difficulty,
      rarity,
      tokenId: event.args.tokenId.toString(),
      txHash: input.txHash,
      tokenUri,
      imageUrl: buildImageUrl(game.id),
      metadataJson: JSON.stringify(metadata)
    }
  });

  await recomputeUserStats(game.userId);
  return minted;
}

export function buildMintPreview(game: Game & { season: { label: string } }) {
  const metadata = buildMetadata(game);
  const result = asResult(game.result);
  if (!result || !game.completedAt || game.durationSeconds === null) throw new Error("Game is not previewable");
  const difficulty = asDifficulty(game.difficulty);
  const rarity = asRarity(rarityByDifficulty[difficulty]);
  const artwork = artworkByRarity[rarity];
  return {
    gameId: game.id,
    eligible: true,
    tokenUri: buildTokenUri(game.id),
    imageUrl: buildImageUrl(game.id),
    attributes: metadata.properties,
    rarity,
    metadata,
    artwork: {
      ...artwork,
      imageUrl: buildArtworkUrl(rarity)
    },
    previewSvg: buildNftSvgForGame(game),
    moves: readMoves(game.movesJson)
  };
}
````

## `apps/api/src/services/seasonService.ts`

````ts
import { getSeasonWindow } from "@based-chess/shared";
import { prisma } from "../db.js";
import { env } from "../env.js";

export async function ensureSeason(at = new Date()) {
  const window = getSeasonWindow(at, env.SEASON_ZERO_START);
  return prisma.season.upsert({
    where: { index: window.index },
    update: {
      label: window.label,
      startsAt: new Date(window.startsAt),
      endsAt: new Date(window.endsAt)
    },
    create: {
      index: window.index,
      label: window.label,
      startsAt: new Date(window.startsAt),
      endsAt: new Date(window.endsAt)
    }
  });
}

export async function getCurrentSeason() {
  return ensureSeason(new Date());
}
````

## `apps/api/src/services/shareService.ts`

````ts
import type { Difficulty, GameResult } from "@based-chess/shared";
import { difficultyLabels } from "@based-chess/shared";

export function buildShareText(input: {
  result: GameResult;
  difficulty: Difficulty;
  moveCount: number;
  season: string;
}) {
  if (input.result === "win") {
    return `I beat the Based Chess bot on ${difficultyLabels[input.difficulty]} in ${input.moveCount} moves. ${input.season}.`;
  }
  if (input.result === "draw") {
    return `I drew the Based Chess bot on ${difficultyLabels[input.difficulty]} in ${input.moveCount} moves. ${input.season}.`;
  }
  if (input.difficulty === "very-hard") {
    return `I survived ${input.moveCount} moves against Very Hard and minted the result on Base. ${input.season}.`;
  }
  return `I battled the Based Chess bot on ${difficultyLabels[input.difficulty]} for ${input.moveCount} moves. ${input.season}.`;
}

export function buildTwitterIntent(text: string, url?: string) {
  const params = new URLSearchParams({ text });
  if (url) params.set("url", url);
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}
````

## `apps/api/src/services/statsService.ts`

````ts
import type { Difficulty } from "@based-chess/shared";
import { DIFFICULTIES, getTitleForXp, xpForResult } from "@based-chess/shared";
import { prisma } from "../db.js";
import { completedStatus } from "../domain.js";

export async function recomputeUserStats(userId: string) {
  const [games, mintedCount] = await Promise.all([
    prisma.game.findMany({
      where: { userId, status: completedStatus, result: { in: ["win", "loss", "draw"] } },
      orderBy: { completedAt: "asc" }
    }),
    prisma.mintedNft.count({ where: { userId } })
  ]);

  let wins = 0;
  let losses = 0;
  let draws = 0;
  let xp = 0;
  let streak = 0;
  let bestStreak = 0;

  for (const game of games) {
    if (game.result === "win") {
      wins += 1;
      xp += xpForResult(game.difficulty as Difficulty, "win");
      streak += 1;
      bestStreak = Math.max(bestStreak, streak);
    } else if (game.result === "loss") {
      losses += 1;
      xp += xpForResult(game.difficulty as Difficulty, "loss");
      streak = 0;
    } else if (game.result === "draw") {
      draws += 1;
      xp += xpForResult(game.difficulty as Difficulty, "draw");
      streak = 0;
    }
  }

  return prisma.userStats.upsert({
    where: { userId },
    update: {
      totalGames: games.length,
      wins,
      losses,
      draws,
      xp,
      bestStreak,
      mintedNfts: mintedCount
    },
    create: {
      userId,
      totalGames: games.length,
      wins,
      losses,
      draws,
      xp,
      bestStreak,
      mintedNfts: mintedCount
    }
  });
}

export async function getProfile(userId: string) {
  const [stats, games, mintedNfts] = await Promise.all([
    recomputeUserStats(userId),
    prisma.game.findMany({
      where: { userId, status: completedStatus, result: { in: ["win", "loss", "draw"] } },
      orderBy: { completedAt: "desc" },
      include: { season: true, mintedNft: true }
    }),
    prisma.mintedNft.findMany({
      where: { userId },
      orderBy: { mintedAt: "desc" },
      include: { season: true }
    })
  ]);

  const winRateByDifficulty = Object.fromEntries(
    DIFFICULTIES.map((difficulty) => {
      const difficultyGames = games.filter((game) => game.difficulty === difficulty);
      const wins = difficultyGames.filter((game) => game.result === "win").length;
      const rate = difficultyGames.length === 0 ? 0 : Math.round((wins / difficultyGames.length) * 100);
      return [difficulty, { wins, games: difficultyGames.length, rate }];
    })
  );

  return {
    totalGames: stats.totalGames,
    wins: stats.wins,
    losses: stats.losses,
    draws: stats.draws,
    xp: stats.xp,
    accountTitle: getTitleForXp(stats.xp),
    mintedNfts: stats.mintedNfts,
    bestStreak: stats.bestStreak,
    winRateByDifficulty,
    history: games.slice(0, 20).map((game) => ({
      id: game.id,
      difficulty: game.difficulty,
      result: game.result,
      moveCount: game.userMoveCount,
      durationSeconds: game.durationSeconds,
      season: game.season.label,
      completedAt: game.completedAt?.toISOString() ?? null,
      minted: Boolean(game.mintedNft)
    })),
    collection: mintedNfts.map((nft) => ({
      id: nft.id,
      gameId: nft.gameId,
      result: nft.result,
      difficulty: nft.difficulty,
      rarity: nft.rarity,
      tokenId: nft.tokenId,
      txHash: nft.txHash,
      imageUrl: nft.imageUrl,
      tokenUri: nft.tokenUri,
      season: nft.season.label,
      mintedAt: nft.mintedAt.toISOString()
    }))
  };
}
````

## `apps/api/src/services/userService.ts`

````ts
import { prisma } from "../db.js";
import { normalizeAddress } from "../domain.js";

export async function findOrCreateUserByWallet(address: string) {
  const walletAddress = normalizeAddress(address);
  const wallet = await prisma.walletIdentity.findUnique({
    where: { walletAddress },
    include: { user: true }
  });

  if (wallet) return wallet.user;

  return prisma.user.create({
    data: {
      primaryWallet: walletAddress,
      wallets: {
        create: { walletAddress }
      },
      stats: {
        create: {}
      }
    }
  });
}
````

## `apps/api/tsconfig.json`

````json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["ES2022"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "noEmit": false,
    "outDir": "dist",
    "rootDir": "src",
    "types": ["node"]
  },
  "include": ["src"],
  "exclude": ["src/**/*.test.ts"]
}
````

## `apps/web/index.html`

````html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#0052ff" />
    <meta name="application-name" content="Based Chess" />
    <title>Based Chess</title>
    <link rel="icon" type="image/jpeg" href="/brand/based-chess-logo.jpg" />
    <link rel="manifest" href="/site.webmanifest" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800;900&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
````

## `apps/web/package.json`

````json
{
  "name": "@based-chess/web",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc -p tsconfig.json && vite build",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "preview": "vite preview --host 127.0.0.1"
  },
  "dependencies": {
    "@base-org/account": "^2.1.1",
    "@based-chess/shared": "0.1.0",
    "@tanstack/react-query": "^5.74.7",
    "chess.js": "^1.2.0",
    "lucide-react": "^0.507.0",
    "react": "^18.3.1",
    "react-chessboard": "^4.7.3",
    "react-dom": "^18.3.1",
    "viem": "^2.28.1",
    "wagmi": "^2.15.3"
  },
  "devDependencies": {
    "@types/react": "^18.3.20",
    "@types/react-dom": "^18.3.6",
    "@vitejs/plugin-react": "^4.4.1",
    "vite": "^6.3.4"
  }
}
````

## `apps/web/public/brand/based-chess-logo.jpg`

Binary asset included in repository package. Size: 41345 bytes.

## `apps/web/public/site.webmanifest`

````text
{
  "name": "Based Chess",
  "short_name": "Based Chess",
  "description": "A mobile-first Base App chess mini app.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f6f9ff",
  "theme_color": "#0052ff",
  "icons": [
    {
      "src": "/brand/based-chess-logo.jpg",
      "sizes": "1254x1181",
      "type": "image/jpeg",
      "purpose": "any"
    }
  ]
}
````

## `apps/web/src/api/client.ts`

````ts
import type { Difficulty } from "@based-chess/shared";
import { env } from "../config/env";
import type { GameResponse, LeaderboardResponse, MeResponse, MintPreview } from "../types";

let authToken = window.localStorage.getItem("based-chess-token");

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) window.localStorage.setItem("based-chess-token", token);
  else window.localStorage.removeItem("based-chess-token");
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${env.apiUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
      ...init.headers
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error ?? "Request failed");
  }
  return data as T;
}

export const api = {
  token: () => authToken,
  nonce: () => request<{ nonce: string }>("/auth/nonce"),
  verify: (body: { address: string; message: string; signature: string }) =>
    request<{ token: string; user: { id: string; address: string } }>("/auth/verify", {
      method: "POST",
      body: JSON.stringify(body)
    }),
  devAuth: () =>
    request<{ token: string; user: { id: string; address: string; dev: true } }>("/auth/dev", {
      method: "POST",
      body: JSON.stringify({})
    }),
  me: () => request<MeResponse>("/me"),
  startGame: (difficulty: Difficulty) =>
    request<GameResponse>("/games", {
      method: "POST",
      body: JSON.stringify({ difficulty })
    }),
  game: (gameId: string) => request<GameResponse>(`/games/${gameId}`),
  move: (gameId: string, move: { from: string; to: string; promotion?: string }) =>
    request<GameResponse>(`/games/${gameId}/move`, {
      method: "POST",
      body: JSON.stringify(move)
    }),
  leaderboard: (params: { difficulty: Difficulty; scope: string; metric: string }) =>
    request<LeaderboardResponse>(
      `/leaderboards?${new URLSearchParams({
        difficulty: params.difficulty,
        scope: params.scope,
        metric: params.metric
      }).toString()}`
    ),
  mintPreview: (gameId: string) => request<MintPreview>(`/mints/eligibility/${gameId}`),
  prepareMint: (gameId: string) =>
    request<{
      contractAddress: `0x${string}`;
      to: `0x${string}`;
      gameIdHash: `0x${string}`;
      tokenUri: string;
      data: {
        result: number;
        difficulty: number;
        rarity: number;
        moveCount: number;
        durationSeconds: number;
        seasonHash: `0x${string}`;
        playedAt: string;
        deadline: string;
      };
      signature: `0x${string}`;
    }>("/mints/prepare", {
      method: "POST",
      body: JSON.stringify({ gameId })
    }),
  recordMint: (body: { gameId: string; txHash: string; tokenId?: string }) =>
    request("/mints/record", {
      method: "POST",
      body: JSON.stringify(body)
    }),
  share: (gameId: string) => request<{ text: string; imageUrl: string; twitterUrl: string }>(`/share/${gameId}`)
};
````

## `apps/web/src/App.tsx`

````tsx
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { Chessboard } from "react-chessboard";
import { Chess, type Square as ChessSquare } from "chess.js";
import { createSiweMessage } from "viem/siwe";
import { parseEventLogs } from "viem";
import { useAccount, useConnect, useDisconnect, usePublicClient, useSignMessage, useWriteContract } from "wagmi";
import {
  Award,
  BarChart3,
  Castle,
  Check,
  ChevronRight,
  Clock,
  Crown,
  Flame,
  Gamepad2,
  Gem,
  Home,
  Medal,
  Shield,
  Swords,
  Trophy,
  User,
  Wallet,
  X
} from "lucide-react";
import {
  DIFFICULTIES,
  difficultyColors,
  difficultyLabels,
  formatXp,
  rarityLabels,
  resultLabel,
  resultNftAbi,
  type Difficulty,
  type GameResult,
  type Rarity
} from "@based-chess/shared";
import { api, setAuthToken } from "./api/client";
import { chain } from "./config/wagmi";
import { env } from "./config/env";
import type { Analysis, ApiGame, LeaderboardResponse, MeResponse, MintPreview, Profile } from "./types";
import { absoluteApiUrl, compactAddress, formatDuration } from "./utils/format";

type Tab = "home" | "play" | "leaderboards" | "profile";

const metricLabels = {
  "most-wins": "Most Wins",
  "fastest-wins": "Fastest Wins",
  "lowest-move-count": "Lowest Moves"
} as const;

const resultFilterLabels = {
  all: "All",
  win: "Win",
  loss: "Loss",
  draw: "Draw"
} as const;

const titleLadder = [
  { title: "Rookie", range: "0-24 XP" },
  { title: "Tactical Knight", range: "25-99 XP" },
  { title: "Base Master", range: "100-249 XP" },
  { title: "Base Grandmaster", range: "250-499 XP" },
  { title: "Base God", range: "500+ XP" }
] as const;

const brandLogoSrc = "/brand/based-chess-logo.jpg";

function useBoardWidth() {
  const [width, setWidth] = useState(() => Math.min(window.innerWidth - 32, 430));
  useEffect(() => {
    const onResize = () => setWidth(Math.min(window.innerWidth - 32, 430));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return width;
}

function useDisplayedDuration(game: ApiGame) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (game.status !== "active") return;
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, [game.id, game.status]);

  if (game.durationSeconds !== null) return game.durationSeconds;
  return Math.max(0, Math.floor((now - new Date(game.startedAt).getTime()) / 1_000));
}

function formatSeasonCountdown(endsAt: string, now: number) {
  const remainingMs = new Date(endsAt).getTime() - now;
  if (!Number.isFinite(remainingMs)) return "Season end unavailable";
  if (remainingMs <= 0) return "Season ended";

  const totalMinutes = Math.ceil(remainingMs / 60_000);
  const days = Math.floor(totalMinutes / 1_440);
  const hours = Math.floor((totalMinutes % 1_440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `Season ends in ${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `Season ends in ${hours}h ${minutes}m`;
  return `Season ends in ${minutes}m`;
}

function useSeasonCountdown(endsAt?: string) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!endsAt) return;
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(interval);
  }, [endsAt]);

  return endsAt ? formatSeasonCountdown(endsAt, now) : null;
}

function RoyalPiece({
  kind,
  color,
  squareWidth
}: {
  kind: "king" | "queen";
  color: "white" | "black";
  squareWidth: number;
}) {
  const light = color === "white";
  const fill = light ? "#f8fbff" : "#111827";
  const stroke = light ? "#0b1426" : "#f8fbff";
  const accent = light ? "#dbe8ff" : "#23345f";

  return (
    <svg width={squareWidth} height={squareWidth} viewBox="0 0 100 100" aria-hidden="true" className="royal-piece">
      {kind === "king" ? (
        <>
          <path d="M50 9 V27 M41 18 H59" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
          <circle cx="50" cy="35" r="9" fill={fill} stroke={stroke} strokeWidth="4" />
          <path
            d="M36 47 C29 53 27 65 34 72 H66 C73 65 71 53 64 47 C59 53 41 53 36 47Z"
            fill={fill}
            stroke={stroke}
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path d="M33 72 H67 L72 83 H28 Z" fill={accent} stroke={stroke} strokeWidth="4" strokeLinejoin="round" />
          <path d="M24 87 H76" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="28" cy="24" r="5" fill={fill} stroke={stroke} strokeWidth="3" />
          <circle cx="42" cy="16" r="5" fill={fill} stroke={stroke} strokeWidth="3" />
          <circle cx="58" cy="16" r="5" fill={fill} stroke={stroke} strokeWidth="3" />
          <circle cx="72" cy="24" r="5" fill={fill} stroke={stroke} strokeWidth="3" />
          <path
            d="M27 32 L37 54 L44 30 L50 56 L56 30 L63 54 L73 32 L66 66 H34 Z"
            fill={fill}
            stroke={stroke}
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path d="M34 66 H66 L71 82 H29 Z" fill={accent} stroke={stroke} strokeWidth="4" strokeLinejoin="round" />
          <path d="M24 87 H76" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

const customRoyalPieces = {
  wK: ({ squareWidth }: { squareWidth: number }) => <RoyalPiece kind="king" color="white" squareWidth={squareWidth} />,
  bK: ({ squareWidth }: { squareWidth: number }) => <RoyalPiece kind="king" color="black" squareWidth={squareWidth} />,
  wQ: ({ squareWidth }: { squareWidth: number }) => <RoyalPiece kind="queen" color="white" squareWidth={squareWidth} />,
  bQ: ({ squareWidth }: { squareWidth: number }) => <RoyalPiece kind="queen" color="black" squareWidth={squareWidth} />
};

function findCheckedKingSquare(fen: string) {
  const chess = new Chess(fen);
  if (!chess.isCheck()) return null;
  const checkedColor = chess.turn();
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];

  for (const [rankIndex, rank] of chess.board().entries()) {
    for (const [fileIndex, piece] of rank.entries()) {
      if (piece?.type === "k" && piece.color === checkedColor) {
        return {
          square: `${files[fileIndex]}${8 - rankIndex}`,
          color: checkedColor
        };
      }
    }
  }

  return null;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ConnectScreen({ onAuthed }: { onAuthed: () => void }) {
  const { connectors, connectAsync, isPending } = useConnect();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const [error, setError] = useState<string | null>(null);

  async function signIn(connectorId: string) {
    setError(null);
    const connector = connectors.find((item) => item.uid === connectorId || item.id === connectorId);
    if (!connector) return;
    try {
      const connection = await connectAsync({ connector, chainId: chain.id });
      const address = connection.accounts[0];
      const { nonce } = await api.nonce();
      const message = createSiweMessage({
        address,
        chainId: chain.id,
        domain: window.location.host,
        nonce,
        uri: window.location.origin,
        version: "1",
        statement: "Sign in to play Based Chess."
      });
      const signature = await signMessageAsync({ message });
      const session = await api.verify({ address, message, signature });
      setAuthToken(session.token);
      onAuthed();
    } catch (event) {
      disconnect();
      setError(event instanceof Error ? event.message : "Wallet sign-in failed");
    }
  }

  async function devAuth() {
    setError(null);
    try {
      const session = await api.devAuth();
      setAuthToken(session.token);
      onAuthed();
    } catch (event) {
      setError(event instanceof Error ? event.message : "Temporary login failed");
    }
  }

  return (
    <main className="shell connect-shell">
      <section className="brand-panel">
        <img className="brand-logo brand-logo-large" src={brandLogoSrc} alt="Based Chess knight logo" />
        <p className="eyebrow">Base App chess</p>
        <h1>Based Chess</h1>
        <p className="lead">Play the bot, climb clean leaderboards, and mint one result NFT per completed game.</p>
      </section>
      <section className="surface auth-panel">
        <h2>Connect wallet</h2>
        <div className="connector-list">
          {connectors.map((connector) => (
            <button className="primary-button" key={connector.uid} disabled={isPending} onClick={() => signIn(connector.uid)}>
              <Wallet size={18} />
              {connector.name}
              <ChevronRight size={18} />
            </button>
          ))}
          {env.enableDevAuth ? (
            <button className="ghost-button" disabled={isPending} onClick={devAuth}>
              <Shield size={18} />
              Temporary local access
            </button>
          ) : null}
        </div>
        {error ? <p className="error-text">{error}</p> : null}
      </section>
    </main>
  );
}

function DifficultyGrid({ onStart, busy }: { onStart: (difficulty: Difficulty) => void; busy: boolean }) {
  const icons = {
    easy: Shield,
    medium: Swords,
    hard: Castle,
    "very-hard": Crown
  };

  return (
    <div className="difficulty-grid">
      {DIFFICULTIES.map((difficulty) => {
        const Icon = icons[difficulty];
        return (
          <button
            className={`difficulty-card ${difficulty}`}
            key={difficulty}
            style={{ "--difficulty-color": difficultyColors[difficulty] } as CSSProperties}
            disabled={busy}
            onClick={() => onStart(difficulty)}
          >
            <Icon size={22} />
            <span>{difficultyLabels[difficulty]}</span>
            <small>{difficulty === "easy" ? "Common" : difficulty === "medium" ? "Rare" : difficulty === "hard" ? "Epic" : "Legendary"}</small>
          </button>
        );
      })}
    </div>
  );
}

function HomeScreen({
  me,
  onStart,
  busy
}: {
  me: MeResponse;
  onStart: (difficulty: Difficulty) => void;
  busy: boolean;
}) {
  const [showTitleLadder, setShowTitleLadder] = useState(false);

  return (
    <div className="screen">
      <button className="hero-band tier-button" type="button" onClick={() => setShowTitleLadder(true)}>
        <div>
          <p className="eyebrow">{me.season.label}</p>
          <h2>{me.profile.accountTitle}</h2>
          <p>XP {formatXp(me.profile.xp)} Â· {compactAddress(me.user.address)}</p>
        </div>
        <div className="rank-orb">
          <Crown size={28} />
        </div>
      </button>

      {showTitleLadder ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Account title progression">
          <section className="bottom-sheet">
            <div className="section-title">
              <h3>Title Ladder</h3>
              <button className="icon-button" type="button" aria-label="Close title ladder" onClick={() => setShowTitleLadder(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="ladder-list">
              {titleLadder.map((item) => (
                <div className={item.title === me.profile.accountTitle ? "active" : ""} key={item.title}>
                  <span>{item.title}</span>
                  <strong>{item.range}</strong>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      <section className="stats-grid">
        <Stat label="Games" value={me.profile.totalGames} />
        <Stat label="Wins" value={me.profile.wins} />
        <Stat label="Losses" value={me.profile.losses} />
        <Stat label="Draws" value={me.profile.draws} />
        <Stat label="NFTs" value={me.profile.mintedNfts} />
      </section>

      <section className="surface">
        <div className="section-title">
          <h3>Choose difficulty</h3>
          <Gamepad2 size={18} />
        </div>
        <DifficultyGrid onStart={onStart} busy={busy} />
      </section>

      <section className="surface">
        <div className="section-title">
          <h3>Recent games</h3>
          <Clock size={18} />
        </div>
        <div className="history-list">
          {me.profile.history.length === 0 ? <p className="muted">No completed games yet.</p> : null}
          {me.profile.history.slice(0, 4).map((game) => (
            <div className="history-row" key={game.id}>
              <span className={`result-pill ${game.result}`}>{resultLabel(game.result)}</span>
              <div>
                <strong className="difficulty-label" style={{ "--difficulty-color": difficultyColors[game.difficulty] } as CSSProperties}>
                  {difficultyLabels[game.difficulty]}
                </strong>
                <small>
                  {game.moveCount} moves Â· {formatDuration(game.durationSeconds)}
                </small>
              </div>
              {game.minted ? <Gem size={18} /> : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function GameScreen({
  game,
  analysis,
  onMove,
  moveBusy,
  onBack,
  onRefreshProfile
}: {
  game: ApiGame;
  analysis: Analysis | null;
  onMove: (move: { from: string; to: string; promotion?: string }) => Promise<void>;
  moveBusy: boolean;
  onBack: () => void;
  onRefreshProfile: () => void;
}) {
  const boardWidth = useBoardWidth();
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalTargets, setLegalTargets] = useState<string[]>([]);
  const [captureTargets, setCaptureTargets] = useState<string[]>([]);
  const [moveFeedback, setMoveFeedback] = useState<{ id: number; text: string } | null>(null);
  const [optimisticFen, setOptimisticFen] = useState<string | null>(null);
  const displayFen = optimisticFen ?? game.fen;
  const displayedDuration = useDisplayedDuration(game);
  const checkedKing = useMemo(() => findCheckedKingSquare(displayFen), [displayFen]);

  useEffect(() => {
    setSelectedSquare(null);
    setLegalTargets([]);
    setCaptureTargets([]);
    setOptimisticFen(null);
  }, [game.fen, game.status]);

  useEffect(() => {
    if (!moveBusy) setOptimisticFen(null);
  }, [moveBusy]);

  useEffect(() => {
    if (!moveFeedback) return;
    const timeout = window.setTimeout(() => setMoveFeedback(null), 5_000);
    return () => window.clearTimeout(timeout);
  }, [moveFeedback]);

  function showInvalidMoveFeedback() {
    setMoveFeedback({ id: Date.now(), text: "That move is not allowed." });
  }

  function isOwnPiece(piece?: string) {
    return Boolean(piece?.startsWith("w"));
  }

  function legalMovesFor(square: string) {
    const chess = new Chess(displayFen);
    if (chess.turn() !== "w") return [];
    return chess.moves({ square: square as ChessSquare, verbose: true });
  }

  function selectPiece(square: string) {
    if (game.status !== "active" || moveBusy) return;
    const chess = new Chess(displayFen);
    const moves = legalMovesFor(square);
    setSelectedSquare(square);
    setLegalTargets(moves.map((move) => move.to));
    setCaptureTargets(
      moves
        .filter((move) => {
          const targetPiece = chess.get(move.to as ChessSquare);
          return Boolean(move.captured && targetPiece?.color === "b");
        })
        .map((move) => move.to)
    );
  }

  function clearSelection() {
    setSelectedSquare(null);
    setLegalTargets([]);
    setCaptureTargets([]);
  }

  function isLegalMove(sourceSquare: string, targetSquare: string) {
    return legalMovesFor(sourceSquare).some((move) => move.to === targetSquare);
  }

  function previewUserMove(sourceSquare: string, targetSquare: string) {
    const chess = new Chess(displayFen);
    chess.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
    return chess.fen();
  }

  function requestMove(sourceSquare: string, targetSquare: string) {
    if (game.status !== "active" || moveBusy) return false;
    if (!isLegalMove(sourceSquare, targetSquare)) {
      showInvalidMoveFeedback();
      clearSelection();
      return false;
    }

    clearSelection();
    setOptimisticFen(previewUserMove(sourceSquare, targetSquare));
    onMove({ from: sourceSquare, to: targetSquare, promotion: "q" });
    return true;
  }

  function onPieceDrop(sourceSquare: string, targetSquare: string) {
    return requestMove(sourceSquare, targetSquare);
  }

  function onPieceClick(piece: string, square: string) {
    if (isOwnPiece(piece)) selectPiece(square);
  }

  function onSquareClick(square: string, piece?: string) {
    if (game.status !== "active" || moveBusy) return;
    if (!selectedSquare) {
      if (isOwnPiece(piece)) selectPiece(square);
      return;
    }
    if (square === selectedSquare) {
      clearSelection();
      return;
    }
    if (isOwnPiece(piece)) {
      selectPiece(square);
      return;
    }
    requestMove(selectedSquare, square);
  }

  const customSquareStyles = useMemo(() => {
    const styles: Record<string, CSSProperties> = {};
    const captureTargetSet = new Set(captureTargets);
    if (selectedSquare) {
      styles[selectedSquare] = {
        ...styles[selectedSquare],
        boxShadow: "inset 0 0 0 4px rgba(0, 82, 255, .78)"
      };
    }
    for (const target of legalTargets.filter((target) => !captureTargetSet.has(target))) {
      styles[target] = {
        ...styles[target],
        background:
          "radial-gradient(circle at center, rgba(0, 82, 255, .42) 0 18%, transparent 20%), linear-gradient(135deg, rgba(255,255,255,.12), rgba(255,255,255,.12))"
      };
    }
    for (const target of captureTargets) {
      styles[target] = {
        ...styles[target],
        background:
          "radial-gradient(circle at center, rgba(239, 68, 68, .78) 0 34%, rgba(239, 68, 68, .30) 36%, rgba(239, 68, 68, .18) 100%)",
        boxShadow: "inset 0 0 0 4px rgba(239, 68, 68, .82)"
      };
    }
    if (checkedKing) {
      styles[checkedKing.square] = {
        ...styles[checkedKing.square],
        background:
          "radial-gradient(circle at center, rgba(255, 236, 153, .92) 0 36%, rgba(239, 68, 68, .36) 38%, rgba(239, 68, 68, .22) 100%)",
        boxShadow: "inset 0 0 0 5px rgba(220, 38, 38, .9)"
      };
    }
    return styles;
  }, [captureTargets, checkedKing, legalTargets, selectedSquare]);

  return (
    <div className="screen game-screen">
      <section className="game-topline">
        <button className="icon-button" onClick={onBack} aria-label="Close game">
          <X size={18} />
        </button>
        <div>
          <strong className="difficulty-label" style={{ "--difficulty-color": difficultyColors[game.difficulty] } as CSSProperties}>
            {difficultyLabels[game.difficulty]}
          </strong>
          <span>{game.season.label}</span>
        </div>
        <span className={`status-dot ${game.status}`}>{game.status.replace("_", " ")}</span>
      </section>

      <div className="board-frame" style={{ width: boardWidth }}>
        <Chessboard
          id="BasedChessBoard"
          boardWidth={boardWidth}
          position={displayFen}
          onPieceDrop={onPieceDrop}
          onPieceClick={onPieceClick}
          onPieceDragBegin={onPieceClick}
          onPieceDragEnd={clearSelection}
          onSquareClick={onSquareClick}
          boardOrientation="white"
          customPieces={customRoyalPieces}
          customSquareStyles={customSquareStyles}
          customBoardStyle={{ borderRadius: 8, boxShadow: "0 18px 44px rgba(0, 20, 80, .18)" }}
          customDarkSquareStyle={{ backgroundColor: "#7da2f7" }}
          customLightSquareStyle={{ backgroundColor: "#f5f8ff" }}
        />
      </div>

      {moveFeedback ? <div className="move-feedback">{moveFeedback.text}</div> : null}
      {checkedKing ? (
        <div className="check-strip">
          Check: {checkedKing.color === "w" ? "White" : "Black"} king is under attack
        </div>
      ) : null}
      {moveBusy && game.status === "active" ? <div className="thinking-strip">Bot thinking...</div> : null}

      <section className="stats-grid two">
        <Stat label="Moves" value={game.userMoveCount} />
        <Stat label="Duration" value={formatDuration(displayedDuration)} />
      </section>

      {game.status !== "active" ? (
        <ResultPanel game={game} analysis={analysis} onRefreshProfile={onRefreshProfile} />
      ) : null}
    </div>
  );
}

function ResultPanel({
  game,
  analysis,
  onRefreshProfile
}: {
  game: ApiGame;
  analysis: Analysis | null;
  onRefreshProfile: () => void;
}) {
  const [share, setShare] = useState<{ text: string; imageUrl: string; twitterUrl: string } | null>(null);
  const resultText = game.result ? resultLabel(game.result) : "Closed";

  useEffect(() => {
    if (game.status === "completed") {
      api.share(game.id).then(setShare).catch(() => setShare(null));
    }
  }, [game.id, game.status]);

  return (
    <>
      <section className={`result-band ${game.result ?? "neutral"}`}>
        <p className="eyebrow">Result</p>
        <h2>{resultText}</h2>
        <p>
          <span className="difficulty-inline" style={{ "--difficulty-color": difficultyColors[game.difficulty] } as CSSProperties}>
            {difficultyLabels[game.difficulty]}
          </span>{" "}
          Â· Moves: {game.userMoveCount} Â· Duration: {formatDuration(game.durationSeconds)}
        </p>
      </section>

      {analysis ? (
        <section className="surface">
          <div className="section-title">
            <h3>Analysis</h3>
            <BarChart3 size={18} />
          </div>
          <div className="analysis-list">
            <p>{analysis.summary}</p>
            <p>{analysis.turningPoint}</p>
            <p>{analysis.strongMoment}</p>
            <p>{analysis.notableMistake}</p>
          </div>
        </section>
      ) : null}

      {share ? (
        <section className="surface">
          <div className="section-title">
            <h3>Share card</h3>
            <Flame size={18} />
          </div>
          <img className="share-card" alt="Based Chess share card" src={absoluteApiUrl(share.imageUrl)} />
          <a className="primary-button centered" href={share.twitterUrl} target="_blank" rel="noreferrer">
            Share to X
          </a>
        </section>
      ) : null}

      {game.mint.eligible ? <MintPanel game={game} onMinted={onRefreshProfile} /> : null}
      {game.mint.minted ? (
        <section className="success-strip">
          <Check size={18} />
          Result NFT minted
        </section>
      ) : null}
    </>
  );
}

function MintPanel({ game, onMinted }: { game: ApiGame; onMinted: () => void }) {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [preview, setPreview] = useState<MintPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.mintPreview(game.id).then(setPreview).catch((event) => setError(event instanceof Error ? event.message : "Mint preview unavailable"));
  }, [game.id]);

  async function mint() {
    setBusy(true);
    setError(null);
    try {
      const prepared = await api.prepareMint(game.id);
      if (/^0x0+$/.test(prepared.contractAddress)) {
        throw new Error("Deploy the NFT contract and set VITE_RESULT_NFT_CONTRACT_ADDRESS before minting.");
      }
      const hash = await writeContractAsync({
        address: prepared.contractAddress,
        abi: resultNftAbi,
        functionName: "mintResult",
        args: [
          prepared.to,
          prepared.gameIdHash,
          prepared.tokenUri,
          {
            ...prepared.data,
            playedAt: BigInt(prepared.data.playedAt),
            deadline: BigInt(prepared.data.deadline)
          },
          prepared.signature
        ]
      });
      const receipt = publicClient ? await publicClient.waitForTransactionReceipt({ hash }) : null;
      const logs = receipt
        ? parseEventLogs({ abi: resultNftAbi, logs: receipt.logs, eventName: "ResultMinted" })
        : [];
      const tokenId = logs[0]?.args.tokenId?.toString();
      await api.recordMint({ gameId: game.id, txHash: hash, tokenId });
      onMinted();
    } catch (event) {
      setError(event instanceof Error ? event.message : "Mint failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="surface">
      <div className="section-title">
        <h3>NFT preview</h3>
        <Gem size={18} />
      </div>
      {preview ? (
        <>
          <img className="nft-preview" alt="Based Chess result NFT preview" src={preview.imageUrl} />
          <div className="nft-detail-grid">
            <Stat label="Result" value={resultLabel(preview.attributes.result)} />
            <Stat label="Difficulty" value={difficultyLabels[preview.attributes.difficulty]} />
            <Stat label="Rarity" value={rarityLabels[preview.attributes.rarity]} />
            <Stat label="Moves" value={preview.attributes.move_count} />
            <Stat label="Duration" value={formatDuration(preview.attributes.duration_seconds)} />
            <Stat label="Season" value={preview.attributes.season} />
          </div>
        </>
      ) : (
        <p className="muted">Loading preview...</p>
      )}
      <button className="primary-button centered" disabled={busy || !preview} onClick={mint}>
        <Gem size={18} />
        {busy ? "Minting..." : "Confirm mint"}
      </button>
      {error ? <p className="error-text">{error}</p> : null}
    </section>
  );
}

function LeaderboardsScreen({ season }: { season: MeResponse["season"] | null }) {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [scope, setScope] = useState<"seasonal" | "all-time">("seasonal");
  const [metric, setMetric] = useState<keyof typeof metricLabels>("most-wins");
  const [board, setBoard] = useState<LeaderboardResponse | null>(null);
  const countdown = useSeasonCountdown(season?.endsAt);

  useEffect(() => {
    api.leaderboard({ difficulty, scope, metric }).then(setBoard).catch(() => setBoard(null));
  }, [difficulty, scope, metric]);

  return (
    <div className="screen">
      <section className="surface">
        <div className="section-title">
          <h3>Leaderboards</h3>
          <Trophy size={18} />
        </div>
        {countdown ? (
          <div className="season-countdown">
            <Clock size={16} />
            <span>{countdown}</span>
          </div>
        ) : null}
        <Segmented
          values={DIFFICULTIES}
          value={difficulty}
          onChange={(next) => setDifficulty(next as Difficulty)}
          labels={difficultyLabels}
          colorByValue={difficultyColors}
        />
        <Segmented values={["seasonal", "all-time"]} value={scope} onChange={(next) => setScope(next as "seasonal" | "all-time")} />
        <Segmented values={Object.keys(metricLabels)} value={metric} onChange={(next) => setMetric(next as keyof typeof metricLabels)} labels={metricLabels} />
      </section>

      <section className="leaderboard-list" style={{ "--difficulty-color": difficultyColors[difficulty] } as CSSProperties}>
        {board?.rows.length === 0 ? <p className="muted empty">No wins recorded here yet.</p> : null}
        {board?.rows.map((row) => (
          <div className="leaderboard-row" key={row.userId}>
            <span className="rank">#{row.rank}</span>
            <div>
              <strong>{row.displayWallet}</strong>
              <small>
                {metric === "most-wins"
                  ? `${row.wins} wins`
                  : metric === "fastest-wins"
                    ? `${formatDuration(row.fastestSeconds)} fastest`
                    : `${row.lowestMoves} moves`}
              </small>
            </div>
            <Medal size={20} />
          </div>
        ))}
      </section>
    </div>
  );
}

function Segmented<T extends string>({
  values,
  value,
  onChange,
  labels,
  colorByValue
}: {
  values: readonly T[] | string[];
  value: string;
  onChange: (value: string) => void;
  labels?: Partial<Record<string, string>>;
  colorByValue?: Partial<Record<string, string>>;
}) {
  return (
    <div className="segmented">
      {values.map((item) => (
        <button
          key={item}
          className={value === item ? "active" : ""}
          style={colorByValue?.[item] ? ({ "--segment-color": colorByValue[item] } as CSSProperties) : undefined}
          onClick={() => onChange(item)}
        >
          {labels?.[item] ?? item.replaceAll("-", " ")}
        </button>
      ))}
    </div>
  );
}

function ProfileScreen({ profile }: { profile: Profile }) {
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "all">("all");
  const [resultFilter, setResultFilter] = useState<GameResult | "all">("all");
  const [sort, setSort] = useState<"date" | "rarity">("date");

  const collection = useMemo(() => {
    const rarityWeight: Record<Rarity, number> = { common: 1, rare: 2, epic: 3, legendary: 4 };
    return profile.collection
      .filter((item) => difficultyFilter === "all" || item.difficulty === difficultyFilter)
      .filter((item) => resultFilter === "all" || item.result === resultFilter)
      .sort((a, b) =>
        sort === "date"
          ? new Date(b.mintedAt).getTime() - new Date(a.mintedAt).getTime()
          : rarityWeight[b.rarity] - rarityWeight[a.rarity]
      );
  }, [difficultyFilter, profile.collection, resultFilter, sort]);

  return (
    <div className="screen">
      <section className="surface profile-head">
        <div className="section-title">
          <h3>{profile.accountTitle}</h3>
          <User size={18} />
        </div>
        <div className="stats-grid tight">
          <Stat label="Games" value={profile.totalGames} />
          <Stat label="Wins" value={profile.wins} />
          <Stat label="Losses" value={profile.losses} />
          <Stat label="Draws" value={profile.draws} />
          <Stat label="Win rate" value={profile.totalGames ? `${Math.round((profile.wins / profile.totalGames) * 100)}%` : "0%"} />
          <Stat label="Streak" value={profile.bestStreak} />
        </div>
      </section>

      <section className="surface">
        <div className="section-title">
          <h3>Win rate</h3>
          <Award size={18} />
        </div>
        <div className="rate-list">
          {DIFFICULTIES.map((difficulty) => (
            <div key={difficulty}>
              <span className="difficulty-label" style={{ "--difficulty-color": difficultyColors[difficulty] } as CSSProperties}>
                {difficultyLabels[difficulty]}
              </span>
              <strong>{profile.winRateByDifficulty[difficulty].rate}%</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="surface">
        <div className="section-title">
          <h3>Trophy gallery</h3>
          <Gem size={18} />
        </div>
        <Segmented
          values={["all", ...DIFFICULTIES]}
          value={difficultyFilter}
          onChange={(next) => setDifficultyFilter(next as Difficulty | "all")}
          labels={{ all: "All", ...difficultyLabels }}
          colorByValue={difficultyColors}
        />
        <Segmented
          values={["all", "win", "loss", "draw"]}
          value={resultFilter}
          onChange={(next) => setResultFilter(next as GameResult | "all")}
          labels={resultFilterLabels}
        />
        <Segmented values={["date", "rarity"]} value={sort} onChange={(next) => setSort(next as "date" | "rarity")} />
      </section>

      <section className="gallery-grid">
        {collection.length === 0 ? <p className="muted empty">No minted NFTs match these filters.</p> : null}
        {collection.map((item) => (
          <article className="nft-tile" key={item.id}>
            <img alt={`${resultLabel(item.result)} NFT`} src={item.imageUrl} />
            <strong>{rarityLabels[item.rarity]}</strong>
            <small className="difficulty-label" style={{ "--difficulty-color": difficultyColors[item.difficulty] } as CSSProperties}>
              {difficultyLabels[item.difficulty]} Â· {resultLabel(item.result)}
            </small>
          </article>
        ))}
      </section>
    </div>
  );
}

function App() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>("home");
  const [me, setMe] = useState<MeResponse | null>(null);
  const [activeGame, setActiveGame] = useState<ApiGame | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasSession = authed && (isConnected || env.enableDevAuth);

  const loadMe = useCallback(async () => {
    if (!api.token()) return;
    const next = await api.me();
    if (address && next.user.address.toLowerCase() !== address.toLowerCase()) {
      setAuthToken(null);
      setAuthed(false);
      setMe(null);
      setActiveGame(null);
      return;
    }
    setMe(next);
  }, [address]);

  useEffect(() => {
    if (!isConnected && !env.enableDevAuth) {
      setAuthToken(null);
      setAuthed(false);
      setMe(null);
      setActiveGame(null);
      return;
    }
    if (api.token()) setAuthed(true);
  }, [isConnected]);

  useEffect(() => {
    if (hasSession) loadMe().catch(() => setAuthed(false));
  }, [hasSession, loadMe]);

  useEffect(() => {
    if (!error) return;
    const timeout = window.setTimeout(() => setError(null), 5_000);
    return () => window.clearTimeout(timeout);
  }, [error]);

  async function start(difficulty: Difficulty) {
    setBusy(true);
    setError(null);
    try {
      const response = await api.startGame(difficulty);
      setActiveGame(response.game);
      setAnalysis(response.analysis);
      setTab("play");
    } catch (event) {
      setError(event instanceof Error ? event.message : "Could not start game");
    } finally {
      setBusy(false);
    }
  }

  async function move(moveInput: { from: string; to: string; promotion?: string }) {
    if (!activeGame) return;
    setBusy(true);
    try {
      const response = await api.move(activeGame.id, moveInput);
      setActiveGame(response.game);
      setAnalysis(response.analysis);
      if (response.game.status === "completed") await loadMe();
    } catch (event) {
      const message = event instanceof Error ? event.message : "Illegal move";
      setError(message.toLowerCase().includes("illegal") ? "That move is not allowed." : message);
    } finally {
      setBusy(false);
    }
  }

  function signOut() {
    setAuthToken(null);
    setAuthed(false);
    setMe(null);
    setActiveGame(null);
    disconnect();
  }

  if (!hasSession) return <ConnectScreen onAuthed={() => setAuthed(true)} />;

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="header-brand">
          <img className="brand-logo header-logo" src={brandLogoSrc} alt="" aria-hidden="true" />
          <div>
            <p className="eyebrow">Based Chess</p>
            <strong>{me?.season.label ?? "Season"}</strong>
          </div>
        </div>
        <button className="wallet-chip" onClick={signOut}>
          <Wallet size={16} />
          {address && isConnected ? compactAddress(address) : me?.user.address ? compactAddress(me.user.address) : "Wallet"}
        </button>
      </header>

      {error ? (
        <button className="toast" onClick={() => setError(null)}>
          {error}
        </button>
      ) : null}

      {tab === "play" && activeGame ? (
        <GameScreen
          game={activeGame}
          analysis={analysis}
          moveBusy={busy}
          onMove={move}
          onBack={() => setTab("home")}
          onRefreshProfile={loadMe}
        />
      ) : tab === "leaderboards" ? (
        <LeaderboardsScreen season={me?.season ?? null} />
      ) : tab === "profile" && me ? (
        <ProfileScreen profile={me.profile} />
      ) : me ? (
        <HomeScreen me={me} onStart={start} busy={busy} />
      ) : (
        <div className="screen">
          <p className="muted">Loading...</p>
        </div>
      )}

      <nav className="bottom-nav">
        <button className={tab === "home" ? "active" : ""} onClick={() => setTab("home")}>
          <Home size={19} />
          Home
        </button>
        <button className={tab === "play" ? "active" : ""} onClick={() => setTab(activeGame ? "play" : "home")}>
          <Gamepad2 size={19} />
          Play
        </button>
        <button className={tab === "leaderboards" ? "active" : ""} onClick={() => setTab("leaderboards")}>
          <Trophy size={19} />
          Boards
        </button>
        <button className={tab === "profile" ? "active" : ""} onClick={() => setTab("profile")}>
          <User size={19} />
          Profile
        </button>
      </nav>
    </main>
  );
}

export default App;
````

## `apps/web/src/config/env.ts`

````ts
export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8787",
  baseChain: (import.meta.env.VITE_BASE_CHAIN ?? "baseSepolia") as "base" | "baseSepolia",
  resultNftContractAddress:
    import.meta.env.VITE_RESULT_NFT_CONTRACT_ADDRESS ?? "0x0000000000000000000000000000000000000000",
  enableDevAuth: import.meta.env.VITE_ENABLE_DEV_AUTH === "true"
};
````

## `apps/web/src/config/wagmi.ts`

````ts
import { QueryClient } from "@tanstack/react-query";
import { base, baseSepolia } from "viem/chains";
import { createConfig, createStorage, http } from "wagmi";
import { baseAccount, injected } from "wagmi/connectors";
import { env } from "./env";

export const chain = env.baseChain === "base" ? base : baseSepolia;

export const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    baseAccount({
      appName: "Based Chess"
    }),
    injected()
  ],
  storage: createStorage({ storage: window.localStorage }),
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http()
  }
});

export const queryClient = new QueryClient();

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
````

## `apps/web/src/main.tsx`

````tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { queryClient, wagmiConfig } from "./config/wagmi";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
````

## `apps/web/src/styles.css`

````css
:root {
  color: #0b1426;
  background: #f5f8ff;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  --blue: #0052ff;
  --ink: #0b1426;
  --muted: #66708a;
  --line: #dce6fb;
  --surface: rgba(255, 255, 255, 0.86);
  --green: #17c964;
  --red: #ef4444;
  --gold: #d6a82f;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  background:
    linear-gradient(180deg, rgba(0, 82, 255, .12), rgba(255, 255, 255, 0) 260px),
    #f5f8ff;
}

button,
a {
  -webkit-tap-highlight-color: transparent;
}

button {
  font: inherit;
}

.shell,
.app-shell {
  width: min(100%, 480px);
  min-height: 100vh;
  margin: 0 auto;
}

.connect-shell {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 16px;
  padding: 20px;
}

.brand-panel {
  min-height: 330px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 28px;
  color: var(--ink);
  border-radius: 8px;
  background:
    radial-gradient(circle at 72% 20%, rgba(0, 82, 255, .14), transparent 28%),
    linear-gradient(145deg, #ffffff, #eaf2ff 78%);
  box-shadow: 0 24px 60px rgba(0, 82, 255, .16);
  text-align: center;
}

.rank-orb {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: white;
  color: var(--blue);
  font-weight: 900;
  font-size: 34px;
  margin-bottom: 34px;
}

.brand-logo {
  display: block;
  flex: 0 0 auto;
  object-fit: contain;
}

.brand-logo-large {
  width: 128px;
  height: auto;
}

.brand-panel h1 {
  margin: 0;
  font-size: 44px;
  line-height: 1;
  letter-spacing: 0;
}

.lead {
  margin: 14px 0 0;
  color: var(--muted);
  line-height: 1.5;
  max-width: 310px;
}

.eyebrow {
  margin: 0 0 8px;
  color: var(--blue);
  text-transform: uppercase;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0;
}

.brand-panel .eyebrow {
  color: var(--blue);
}

.surface {
  background: var(--surface);
  border: 1px solid rgba(190, 207, 245, .82);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 16px 36px rgba(10, 35, 88, .08);
}

.auth-panel h2,
.section-title h3 {
  margin: 0;
}

.connector-list,
.screen,
.history-list,
.analysis-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.primary-button,
.ghost-button,
.danger-button {
  min-height: 48px;
  width: 100%;
  border: 0;
  border-radius: 8px;
  padding: 0 16px;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  text-decoration: none;
  font-weight: 850;
  cursor: pointer;
}

.primary-button {
  color: white;
  background: var(--blue);
}

.primary-button.centered {
  justify-content: center;
}

.ghost-button {
  color: var(--ink);
  background: #edf3ff;
}

.ghost-button.centered {
  justify-content: center;
}

.danger-button {
  color: white;
  background: #c83232;
  justify-content: center;
}

.primary-button:disabled,
.ghost-button:disabled,
.danger-button:disabled {
  opacity: .62;
}

.error-text {
  margin: 10px 0 0;
  color: #bd2b2b;
  font-size: 13px;
  font-weight: 700;
}

.muted {
  color: var(--muted);
  margin: 0;
}

.app-shell {
  padding: calc(12px + env(safe-area-inset-top)) 12px calc(84px + env(safe-area-inset-bottom));
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 2px 14px;
  background: linear-gradient(180deg, #f5f8ff 72%, rgba(245, 248, 255, 0));
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-logo {
  width: 42px;
  height: auto;
}

.wallet-chip,
.icon-button {
  border: 1px solid var(--line);
  color: var(--ink);
  background: white;
  border-radius: 999px;
  min-height: 38px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
}

.icon-button {
  width: 38px;
  padding: 0;
  justify-content: center;
}

.screen {
  padding: 2px 0 16px;
}

.hero-band,
.result-band {
  border-radius: 8px;
  min-height: 164px;
  padding: 20px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  color: white;
  background:
    linear-gradient(135deg, rgba(0, 82, 255, .96), rgba(9, 22, 54, .98)),
    #0052ff;
}

.tier-button {
  width: 100%;
  border: 0;
  text-align: left;
  cursor: pointer;
}

.hero-band h2,
.result-band h2 {
  margin: 0;
  font-size: 38px;
  letter-spacing: 0;
}

.hero-band p,
.result-band p {
  margin: 8px 0 0;
  color: rgba(255, 255, 255, .76);
}

.rank-orb {
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(72px, 1fr));
  gap: 8px;
}

.stats-grid.tight {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.stats-grid.two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.stat {
  min-height: 74px;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 10px;
  background: white;
}

.stat span,
.history-row small,
.leaderboard-row small,
.nft-tile small,
.game-topline span {
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
}

.stat strong {
  display: block;
  margin-top: 8px;
  font-size: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.difficulty-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.difficulty-card {
  min-height: 110px;
  border: 1px solid color-mix(in srgb, var(--difficulty-color, var(--blue)) 38%, var(--line));
  border-radius: 8px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--difficulty-color, var(--blue)) 9%, white), white 72%);
  color: var(--ink);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  padding: 14px;
  text-align: left;
  font-weight: 900;
}

.difficulty-card svg,
.difficulty-label,
.difficulty-inline {
  color: var(--difficulty-color, var(--blue));
}

.difficulty-card small {
  color: var(--muted);
  font-weight: 800;
}

.history-row,
.leaderboard-row {
  min-height: 64px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: white;
}

.history-row strong,
.leaderboard-row strong {
  display: block;
}

.result-pill,
.status-dot {
  border-radius: 999px;
  padding: 6px 9px;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
}

.result-pill.win,
.result-band.win {
  background: linear-gradient(135deg, #0f9f56, #093821);
  color: white;
}

.result-pill.loss,
.result-band.loss {
  background: linear-gradient(135deg, #da3b3b, #371010);
  color: white;
}

.result-pill.draw,
.result-band.draw {
  background: linear-gradient(135deg, #0052ff, #102a68);
  color: white;
}

.result-band.neutral {
  background: linear-gradient(135deg, #64748b, #1f2937);
  color: white;
}

.season-countdown {
  min-height: 40px;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  border: 1px solid rgba(0, 82, 255, .18);
  border-radius: 8px;
  padding: 0 12px;
  background: linear-gradient(135deg, rgba(0, 82, 255, .1), rgba(255, 255, 255, .9));
  color: var(--blue);
  font-size: 13px;
  font-weight: 900;
}

.game-topline {
  display: grid;
  grid-template-columns: 44px 1fr auto;
  align-items: center;
  gap: 10px;
}

.board-frame {
  align-self: center;
  aspect-ratio: 1;
}

.move-feedback,
.check-strip,
.thinking-strip {
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  padding: 0 14px;
  font-size: 14px;
  font-weight: 900;
}

.move-feedback {
  color: #8f1d1d;
  background: #fff0f0;
  border: 1px solid #ffc7c7;
}

.check-strip {
  color: #8a3412;
  background: #fff4d6;
  border: 1px solid #ffd782;
}

.thinking-strip {
  color: #17407f;
  background: #e9f1ff;
  border: 1px solid #cfe0ff;
}

.status-dot.active {
  color: #064e3b;
  background: #dffcec;
}

.status-dot.completed {
  color: #173166;
  background: #e7efff;
}

.analysis-list p {
  margin: 0;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line);
  color: #26324d;
  line-height: 1.45;
}

.analysis-list p:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.share-card,
.nft-preview {
  width: 100%;
  display: block;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: white;
}

.nft-preview {
  max-height: 520px;
  object-fit: contain;
}

.nft-detail-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.success-strip {
  min-height: 50px;
  border-radius: 8px;
  background: #e5fbea;
  color: #0c6b3c;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 900;
}

.segmented {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 6px;
}

.segmented button {
  min-height: 38px;
  white-space: nowrap;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: white;
  color: var(--muted);
  padding: 0 12px;
  font-size: 13px;
  font-weight: 850;
  text-transform: capitalize;
}

.segmented button.active {
  color: white;
  background: var(--segment-color, var(--blue));
  border-color: var(--segment-color, var(--blue));
}

.leaderboard-list,
.gallery-grid {
  display: grid;
  gap: 10px;
}

.rank {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #e9f0ff;
  color: var(--difficulty-color, var(--blue));
  font-weight: 900;
}

.leaderboard-row {
  border-left: 4px solid var(--difficulty-color, var(--blue));
}

.empty {
  padding: 18px;
  text-align: center;
}

.profile-head {
  background:
    linear-gradient(135deg, rgba(255, 255, 255, .9), rgba(234, 242, 255, .9)),
    white;
}

.rate-list {
  display: grid;
  gap: 10px;
}

.rate-list div {
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--line);
}

.rate-list div:last-child {
  border-bottom: 0;
}

.gallery-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.nft-tile {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: white;
  padding: 10px;
}

.nft-tile img {
  width: 100%;
  aspect-ratio: 3 / 4;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid var(--line);
}

.nft-tile strong {
  display: block;
  margin-top: 8px;
}

.royal-piece {
  display: block;
  pointer-events: none;
  filter: drop-shadow(0 5px 5px rgba(0, 14, 48, .22));
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 12px 12px calc(12px + env(safe-area-inset-bottom));
  background: rgba(5, 15, 35, .42);
}

.bottom-sheet {
  width: min(100%, 456px);
  border: 1px solid var(--line);
  border-radius: 8px;
  background: white;
  padding: 16px;
  box-shadow: 0 24px 70px rgba(0, 20, 70, .28);
}

.ladder-list {
  display: grid;
  gap: 8px;
}

.ladder-list div {
  min-height: 54px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #f8fbff;
}

.ladder-list div.active {
  color: white;
  background: var(--blue);
  border-color: var(--blue);
}

.ladder-list span,
.ladder-list strong {
  font-size: 14px;
}

.bottom-nav {
  position: fixed;
  left: 50%;
  bottom: 0;
  z-index: 40;
  width: min(100%, 480px);
  transform: translateX(-50%);
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  padding: 10px 10px calc(10px + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, .92);
  border-top: 1px solid var(--line);
  backdrop-filter: blur(18px);
}

.bottom-nav button {
  min-height: 54px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 850;
}

.bottom-nav button.active {
  color: var(--blue);
  background: #eaf1ff;
}

.toast {
  position: fixed;
  left: 50%;
  top: calc(12px + env(safe-area-inset-top));
  transform: translateX(-50%);
  z-index: 60;
  width: min(calc(100% - 24px), 456px);
  border: 1px solid #ffc2c2;
  border-radius: 8px;
  background: white;
  color: #a31d1d;
  padding: 12px 14px;
  box-shadow: 0 16px 38px rgba(93, 22, 22, .15);
  font-weight: 800;
  text-align: left;
}

@media (min-width: 481px) {
  body {
    background:
      linear-gradient(90deg, rgba(0, 82, 255, .08), rgba(240, 200, 98, .08)),
      #eef4ff;
  }

  .app-shell {
    border-left: 1px solid var(--line);
    border-right: 1px solid var(--line);
    background: #f5f8ff;
  }
}
````

## `apps/web/src/types.ts`

````ts
import type { Difficulty, GameResult, Rarity, RarityArtwork } from "@based-chess/shared";

export type StoredMove = {
  ply: number;
  side: "w" | "b";
  san: string;
  from: string;
  to: string;
  promotion?: string;
  fenAfter: string;
};

export type ApiGame = {
  id: string;
  difficulty: Difficulty;
  difficultyLabel: string;
  status: string;
  result: GameResult | null;
  fen: string;
  pgn: string | null;
  moves: StoredMove[];
  userMoveCount: number;
  plyCount: number;
  durationSeconds: number | null;
  startedAt: string;
  lastMoveAt: string;
  completedAt: string | null;
  season: {
    label: string;
    startsAt: string;
    endsAt: string;
  };
  mint: {
    eligible: boolean;
    minted: boolean;
  };
};

export type Analysis = {
  summary: string;
  turningPoint: string;
  strongMoment: string;
  notableMistake: string;
  explanation: string;
};

export type GameResponse = {
  game: ApiGame;
  analysis: Analysis | null;
};

export type Profile = {
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  xp: number;
  accountTitle: string;
  mintedNfts: number;
  bestStreak: number;
  winRateByDifficulty: Record<Difficulty, { wins: number; games: number; rate: number }>;
  history: Array<{
    id: string;
    difficulty: Difficulty;
    result: GameResult;
    moveCount: number;
    durationSeconds: number | null;
    season: string;
    completedAt: string | null;
    minted: boolean;
  }>;
  collection: Array<{
    id: string;
    gameId: string;
    result: GameResult;
    difficulty: Difficulty;
    rarity: Rarity;
    tokenId: string | null;
    txHash: string;
    imageUrl: string;
    tokenUri: string;
    season: string;
    mintedAt: string;
  }>;
};

export type MeResponse = {
  user: { id: string; address: string };
  season: { label: string; startsAt: string; endsAt: string };
  profile: Profile;
};

export type LeaderboardResponse = {
  difficulty: Difficulty;
  metric: "most-wins" | "fastest-wins" | "lowest-move-count";
  scope: "all-time" | "seasonal";
  season: { label: string; startsAt: string; endsAt: string } | null;
  rows: Array<{
    rank: number;
    userId: string;
    walletAddress: string;
    displayWallet: string;
    wins: number;
    fastestSeconds: number | null;
    lowestMoves: number | null;
    reachedAt: string;
  }>;
};

export type MintPreview = {
  gameId: string;
  eligible: boolean;
  tokenUri: string;
  imageUrl: string;
  rarity: Rarity;
  previewSvg: string;
  artwork: RarityArtwork & { imageUrl: string };
  attributes: {
    game_id: string;
    result: GameResult;
    difficulty: Difficulty;
    rarity: Rarity;
    artwork_template: string;
    artwork_image: string;
    move_count: number;
    duration_seconds: number;
    season: string;
    played_at: string;
    opponent_type: "bot";
  };
};
````

## `apps/web/src/utils/format.ts`

````ts
export function compactAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatDuration(seconds: number | null | undefined) {
  if (seconds == null) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function absoluteApiUrl(path: string) {
  if (path.startsWith("http")) return path;
  return `${import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8787"}${path}`;
}
````

## `apps/web/tsconfig.json`

````json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "noEmit": true,
    "types": ["vite/client"]
  },
  "include": ["src"]
}
````

## `apps/web/vite.config.ts`

````ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  }
});
````

## `contracts/foundry.toml`

````toml
[profile.default]
src = "src"
out = "out"
libs = ["../node_modules", "lib"]
solc_version = "0.8.28"
optimizer = true
optimizer_runs = 200
via_ir = true

[rpc_endpoints]
base = "${BASE_RPC_URL}"
base_sepolia = "${BASE_SEPOLIA_RPC_URL}"
````

## `contracts/remappings.txt`

````text
@openzeppelin/contracts/=../node_modules/@openzeppelin/contracts/
````

## `contracts/script/DeployBasedChessResults.s.sol`

````solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script} from "forge-std/Script.sol";
import {BasedChessResults} from "../src/BasedChessResults.sol";

contract DeployBasedChessResults is Script {
    function run() external returns (BasedChessResults deployed) {
        address owner = vm.envAddress("CONTRACT_OWNER");
        address mintSigner = vm.envAddress("MINT_SIGNER_ADDRESS");

        vm.startBroadcast();
        deployed = new BasedChessResults(owner, mintSigner);
        vm.stopBroadcast();
    }
}
````

## `contracts/src/BasedChessResults.sol`

````solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ERC721URIStorage, ERC721} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract BasedChessResults is ERC721URIStorage, EIP712, Ownable, ReentrancyGuard {
    enum Result {
        Win,
        Loss,
        Draw
    }

    enum Difficulty {
        Easy,
        Medium,
        Hard,
        VeryHard
    }

    enum Rarity {
        Common,
        Rare,
        Epic,
        Legendary
    }

    struct MintData {
        uint8 result;
        uint8 difficulty;
        uint8 rarity;
        uint16 moveCount;
        uint32 durationSeconds;
        bytes32 seasonHash;
        uint64 playedAt;
        uint64 deadline;
    }

    bytes32 public constant MINT_DATA_TYPEHASH = keccak256(
        "MintData(uint8 result,uint8 difficulty,uint8 rarity,uint16 moveCount,uint32 durationSeconds,bytes32 seasonHash,uint64 playedAt,uint64 deadline)"
    );
    bytes32 public constant MINT_AUTHORIZATION_TYPEHASH = keccak256(
        "MintAuthorization(address to,bytes32 gameIdHash,bytes32 tokenUriHash,MintData data)MintData(uint8 result,uint8 difficulty,uint8 rarity,uint16 moveCount,uint32 durationSeconds,bytes32 seasonHash,uint64 playedAt,uint64 deadline)"
    );

    address public mintSigner;
    uint256 public nextTokenId = 1;

    mapping(bytes32 gameIdHash => uint256 tokenId) public tokenByGameIdHash;
    mapping(uint256 tokenId => bytes32 gameIdHash) public gameIdHashByToken;

    error GameAlreadyMinted(bytes32 gameIdHash);
    error InvalidMintSignature();
    error MintExpired();
    error RecipientMustMint();
    error InvalidMintSigner();

    event MintSignerUpdated(address indexed signer);
    event ResultMinted(
        address indexed to,
        bytes32 indexed gameIdHash,
        uint256 indexed tokenId,
        uint8 result,
        uint8 difficulty,
        uint8 rarity,
        uint16 moveCount,
        uint32 durationSeconds,
        bytes32 seasonHash,
        uint64 playedAt,
        string tokenUri
    );

    constructor(address initialOwner, address initialMintSigner)
        ERC721("Based Chess Results", "BCHESS")
        EIP712("BasedChessResults", "1")
        Ownable(initialOwner)
    {
        if (initialMintSigner == address(0)) revert InvalidMintSigner();
        mintSigner = initialMintSigner;
        emit MintSignerUpdated(initialMintSigner);
    }

    function setMintSigner(address newMintSigner) external onlyOwner {
        if (newMintSigner == address(0)) revert InvalidMintSigner();
        mintSigner = newMintSigner;
        emit MintSignerUpdated(newMintSigner);
    }

    function mintResult(address to, bytes32 gameIdHash, string calldata tokenUri, MintData calldata data, bytes calldata signature)
        external
        nonReentrant
        returns (uint256 tokenId)
    {
        if (block.timestamp > data.deadline) revert MintExpired();
        if (to != msg.sender) revert RecipientMustMint();
        if (tokenByGameIdHash[gameIdHash] != 0) revert GameAlreadyMinted(gameIdHash);

        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    MINT_AUTHORIZATION_TYPEHASH,
                    to,
                    gameIdHash,
                    keccak256(bytes(tokenUri)),
                    _hashMintData(data)
                )
            )
        );

        if (ECDSA.recover(digest, signature) != mintSigner) revert InvalidMintSignature();

        tokenId = nextTokenId;
        nextTokenId += 1;
        tokenByGameIdHash[gameIdHash] = tokenId;
        gameIdHashByToken[tokenId] = gameIdHash;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenUri);

        emit ResultMinted(
            to,
            gameIdHash,
            tokenId,
            data.result,
            data.difficulty,
            data.rarity,
            data.moveCount,
            data.durationSeconds,
            data.seasonHash,
            data.playedAt,
            tokenUri
        );
    }

    function hasMintedGame(bytes32 gameIdHash) external view returns (bool) {
        return tokenByGameIdHash[gameIdHash] != 0;
    }

    function _hashMintData(MintData calldata data) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(
                MINT_DATA_TYPEHASH,
                data.result,
                data.difficulty,
                data.rarity,
                data.moveCount,
                data.durationSeconds,
                data.seasonHash,
                data.playedAt,
                data.deadline
            )
        );
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
````

## `package.json`

````json
{
  "name": "based-chess",
  "version": "0.1.0",
  "private": true,
  "description": "Mobile-first Base App chess mini app with wallet auth, bot play, leaderboards, and result NFTs.",
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "npm run build:shared && npm-run-all --parallel dev:api dev:web",
    "dev:api": "npm --workspace @based-chess/api run dev",
    "dev:web": "npm --workspace @based-chess/web run dev",
    "build": "npm-run-all build:shared build:api build:web",
    "build:shared": "npm --workspace @based-chess/shared run build",
    "build:api": "npm --workspace @based-chess/api run build",
    "build:web": "npm --workspace @based-chess/web run build",
    "typecheck": "npm run build:shared && npm-run-all typecheck:shared typecheck:api typecheck:web",
    "typecheck:shared": "npm --workspace @based-chess/shared run typecheck",
    "typecheck:api": "npm --workspace @based-chess/api run typecheck",
    "typecheck:web": "npm --workspace @based-chess/web run typecheck",
    "db:generate": "npm --workspace @based-chess/api run db:generate",
    "db:migrate": "npm --workspace @based-chess/api run db:migrate",
    "db:seed": "npm --workspace @based-chess/api run db:seed",
    "job:close-inactive": "npm --workspace @based-chess/api run job:close-inactive",
    "test": "npm-run-all test:shared test:api",
    "test:shared": "npm --workspace @based-chess/shared run test",
    "test:api": "npm --workspace @based-chess/api run test"
  },
  "devDependencies": {
    "@openzeppelin/contracts": "^5.2.0",
    "npm-run-all": "^4.1.5",
    "typescript": "^5.8.3"
  },
  "engines": {
    "node": ">=20.18"
  }
}
````

## `package-lock.json`

````json
{
  "name": "based-chess",
  "version": "0.1.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "based-chess",
      "version": "0.1.0",
      "workspaces": [
        "apps/*",
        "packages/*"
      ],
      "devDependencies": {
        "@openzeppelin/contracts": "^5.2.0",
        "npm-run-all": "^4.1.5",
        "typescript": "^5.8.3"
      },
      "engines": {
        "node": ">=20.18"
      }
    },
    "apps/api": {
      "name": "@based-chess/api",
      "version": "0.1.0",
      "dependencies": {
        "@based-chess/shared": "0.1.0",
        "@fastify/cors": "^11.0.1",
        "@fastify/jwt": "^10.0.0",
        "@prisma/client": "^6.7.0",
        "chess.js": "^1.2.0",
        "dotenv": "^16.5.0",
        "fastify": "^5.3.2",
        "nanoid": "^5.1.5",
        "viem": "^2.28.1",
        "zod": "^3.24.3"
      },
      "devDependencies": {
        "@types/node": "^22.15.3",
        "prisma": "^6.7.0",
        "tsx": "^4.19.4",
        "vitest": "^3.1.2"
      }
    },
    "apps/web": {
      "name": "@based-chess/web",
      "version": "0.1.0",
      "dependencies": {
        "@base-org/account": "^2.1.1",
        "@based-chess/shared": "0.1.0",
        "@tanstack/react-query": "^5.74.7",
        "chess.js": "^1.2.0",
        "lucide-react": "^0.507.0",
        "react": "^18.3.1",
        "react-chessboard": "^4.7.3",
        "react-dom": "^18.3.1",
        "viem": "^2.28.1",
        "wagmi": "^2.15.3"
      },
      "devDependencies": {
        "@types/react": "^18.3.20",
        "@types/react-dom": "^18.3.6",
        "@vitejs/plugin-react": "^4.4.1",
        "vite": "^6.3.4"
      }
    },
    "node_modules/@adraffy/ens-normalize": {
      "version": "1.11.1",
      "resolved": "https://registry.npmjs.org/@adraffy/ens-normalize/-/ens-normalize-1.11.1.tgz",
      "integrity": "sha512-nhCBV3quEgesuf7c7KYfperqSS14T8bYuvJ8PcLJp6znkZpFc0AuW4qBtr8eKVyPPe/8RSr7sglCWPU5eaxwKQ==",
      "license": "MIT"
    },
    "node_modules/@babel/code-frame": {
      "version": "7.29.0",
      "resolved": "https://registry.npmjs.org/@babel/code-frame/-/code-frame-7.29.0.tgz",
      "integrity": "sha512-9NhCeYjq9+3uxgdtp20LSiJXJvN0FeCtNGpJxuMFZ1Kv3cWUNb6DOhJwUvcVCzKGR66cw4njwM6hrJLqgOwbcw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-validator-identifier": "^7.28.5",
        "js-tokens": "^4.0.0",
        "picocolors": "^1.1.1"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/compat-data": {
      "version": "7.29.3",
      "resolved": "https://registry.npmjs.org/@babel/compat-data/-/compat-data-7.29.3.tgz",
      "integrity": "sha512-LIVqM46zQWZhj17qA8wb4nW/ixr2y1Nw+r1etiAWgRM6U1IqP+LNhL1yg440jYZR72jCWcWbLWzIosH+uP1fqg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/core": {
      "version": "7.29.0",
      "resolved": "https://registry.npmjs.org/@babel/core/-/core-7.29.0.tgz",
      "integrity": "sha512-CGOfOJqWjg2qW/Mb6zNsDm+u5vFQ8DxXfbM09z69p5Z6+mE1ikP2jUXw+j42Pf1XTYED2Rni5f95npYeuwMDQA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/code-frame": "^7.29.0",
        "@babel/generator": "^7.29.0",
        "@babel/helper-compilation-targets": "^7.28.6",
        "@babel/helper-module-transforms": "^7.28.6",
        "@babel/helpers": "^7.28.6",
        "@babel/parser": "^7.29.0",
        "@babel/template": "^7.28.6",
        "@babel/traverse": "^7.29.0",
        "@babel/types": "^7.29.0",
        "@jridgewell/remapping": "^2.3.5",
        "convert-source-map": "^2.0.0",
        "debug": "^4.1.0",
        "gensync": "^1.0.0-beta.2",
        "json5": "^2.2.3",
        "semver": "^6.3.1"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/babel"
      }
    },
    "node_modules/@babel/core/node_modules/semver": {
      "version": "6.3.1",
      "resolved": "https://registry.npmjs.org/semver/-/semver-6.3.1.tgz",
      "integrity": "sha512-BR7VvDCVHO+q2xBEWskxS6DJE1qRnb7DxzUrogb71CWoSficBxYsiAGd+Kl0mmq/MprG9yArRkyrQxTO6XjMzA==",
      "dev": true,
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      }
    },
    "node_modules/@babel/generator": {
      "version": "7.29.1",
      "resolved": "https://registry.npmjs.org/@babel/generator/-/generator-7.29.1.tgz",
      "integrity": "sha512-qsaF+9Qcm2Qv8SRIMMscAvG4O3lJ0F1GuMo5HR/Bp02LopNgnZBC/EkbevHFeGs4ls/oPz9v+Bsmzbkbe+0dUw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/parser": "^7.29.0",
        "@babel/types": "^7.29.0",
        "@jridgewell/gen-mapping": "^0.3.12",
        "@jridgewell/trace-mapping": "^0.3.28",
        "jsesc": "^3.0.2"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-compilation-targets": {
      "version": "7.28.6",
      "resolved": "https://registry.npmjs.org/@babel/helper-compilation-targets/-/helper-compilation-targets-7.28.6.tgz",
      "integrity": "sha512-JYtls3hqi15fcx5GaSNL7SCTJ2MNmjrkHXg4FSpOA/grxK8KwyZ5bubHsCq8FXCkua6xhuaaBit+3b7+VZRfcA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/compat-data": "^7.28.6",
        "@babel/helper-validator-option": "^7.27.1",
        "browserslist": "^4.24.0",
        "lru-cache": "^5.1.1",
        "semver": "^6.3.1"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-compilation-targets/node_modules/semver": {
      "version": "6.3.1",
      "resolved": "https://registry.npmjs.org/semver/-/semver-6.3.1.tgz",
      "integrity": "sha512-BR7VvDCVHO+q2xBEWskxS6DJE1qRnb7DxzUrogb71CWoSficBxYsiAGd+Kl0mmq/MprG9yArRkyrQxTO6XjMzA==",
      "dev": true,
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      }
    },
    "node_modules/@babel/helper-globals": {
      "version": "7.28.0",
      "resolved": "https://registry.npmjs.org/@babel/helper-globals/-/helper-globals-7.28.0.tgz",
      "integrity": "sha512-+W6cISkXFa1jXsDEdYA8HeevQT/FULhxzR99pxphltZcVaugps53THCeiWA8SguxxpSp3gKPiuYfSWopkLQ4hw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-module-imports": {
      "version": "7.28.6",
      "resolved": "https://registry.npmjs.org/@babel/helper-module-imports/-/helper-module-imports-7.28.6.tgz",
      "integrity": "sha512-l5XkZK7r7wa9LucGw9LwZyyCUscb4x37JWTPz7swwFE/0FMQAGpiWUZn8u9DzkSBWEcK25jmvubfpw2dnAMdbw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/traverse": "^7.28.6",
        "@babel/types": "^7.28.6"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-module-transforms": {
      "version": "7.28.6",
      "resolved": "https://registry.npmjs.org/@babel/helper-module-transforms/-/helper-module-transforms-7.28.6.tgz",
      "integrity": "sha512-67oXFAYr2cDLDVGLXTEABjdBJZ6drElUSI7WKp70NrpyISso3plG9SAGEF6y7zbha/wOzUByWWTJvEDVNIUGcA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-module-imports": "^7.28.6",
        "@babel/helper-validator-identifier": "^7.28.5",
        "@babel/traverse": "^7.28.6"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0"
      }
    },
    "node_modules/@babel/helper-plugin-utils": {
      "version": "7.28.6",
      "resolved": "https://registry.npmjs.org/@babel/helper-plugin-utils/-/helper-plugin-utils-7.28.6.tgz",
      "integrity": "sha512-S9gzZ/bz83GRysI7gAD4wPT/AI3uCnY+9xn+Mx/KPs2JwHJIz1W8PZkg2cqyt3RNOBM8ejcXhV6y8Og7ly/Dug==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-string-parser": {
      "version": "7.27.1",
      "resolved": "https://registry.npmjs.org/@babel/helper-string-parser/-/helper-string-parser-7.27.1.tgz",
      "integrity": "sha512-qMlSxKbpRlAridDExk92nSobyDdpPijUq2DW6oDnUqd0iOGxmQjyqhMIihI9+zv4LPyZdRje2cavWPbCbWm3eA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-validator-identifier": {
      "version": "7.28.5",
      "resolved": "https://registry.npmjs.org/@babel/helper-validator-identifier/-/helper-validator-identifier-7.28.5.tgz",
      "integrity": "sha512-qSs4ifwzKJSV39ucNjsvc6WVHs6b7S03sOh2OcHF9UHfVPqWWALUsNUVzhSBiItjRZoLHx7nIarVjqKVusUZ1Q==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-validator-option": {
      "version": "7.27.1",
      "resolved": "https://registry.npmjs.org/@babel/helper-validator-option/-/helper-validator-option-7.27.1.tgz",
      "integrity": "sha512-YvjJow9FxbhFFKDSuFnVCe2WxXk1zWc22fFePVNEaWJEu8IrZVlda6N0uHwzZrUM1il7NC9Mlp4MaJYbYd9JSg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helpers": {
      "version": "7.29.2",
      "resolved": "https://registry.npmjs.org/@babel/helpers/-/helpers-7.29.2.tgz",
      "integrity": "sha512-HoGuUs4sCZNezVEKdVcwqmZN8GoHirLUcLaYVNBK2J0DadGtdcqgr3BCbvH8+XUo4NGjNl3VOtSjEKNzqfFgKw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/template": "^7.28.6",
        "@babel/types": "^7.29.0"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/parser": {
      "version": "7.29.3",
      "resolved": "https://registry.npmjs.org/@babel/parser/-/parser-7.29.3.tgz",
      "integrity": "sha512-b3ctpQwp+PROvU/cttc4OYl4MzfJUWy6FZg+PMXfzmt/+39iHVF0sDfqay8TQM3JA2EUOyKcFZt75jWriQijsA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/types": "^7.29.0"
      },
      "bin": {
        "parser": "bin/babel-parser.js"
      },
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/@babel/plugin-transform-react-jsx-self": {
      "version": "7.27.1",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-react-jsx-self/-/plugin-transform-react-jsx-self-7.27.1.tgz",
      "integrity": "sha512-6UzkCs+ejGdZ5mFFC/OCUrv028ab2fp1znZmCZjAOBKiBK2jXD1O+BPSfX8X2qjJ75fZBMSnQn3Rq2mrBJK2mw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.27.1"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-react-jsx-source": {
      "version": "7.27.1",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-react-jsx-source/-/plugin-transform-react-jsx-source-7.27.1.tgz",
      "integrity": "sha512-zbwoTsBruTeKB9hSq73ha66iFeJHuaFkUbwvqElnygoNbj/jHRsSeokowZFN3CZ64IvEqcmmkVe89OPXc7ldAw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.27.1"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/runtime": {
      "version": "7.29.2",
      "resolved": "https://registry.npmjs.org/@babel/runtime/-/runtime-7.29.2.tgz",
      "integrity": "sha512-JiDShH45zKHWyGe4ZNVRrCjBz8Nh9TMmZG1kh4QTK8hCBTWBi8Da+i7s1fJw7/lYpM4ccepSNfqzZ/QvABBi5g==",
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/template": {
      "version": "7.28.6",
      "resolved": "https://registry.npmjs.org/@babel/template/-/template-7.28.6.tgz",
      "integrity": "sha512-YA6Ma2KsCdGb+WC6UpBVFJGXL58MDA6oyONbjyF/+5sBgxY/dwkhLogbMT2GXXyU84/IhRw/2D1Os1B/giz+BQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/code-frame": "^7.28.6",
        "@babel/parser": "^7.28.6",
        "@babel/types": "^7.28.6"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/traverse": {
      "version": "7.29.0",
      "resolved": "https://registry.npmjs.org/@babel/traverse/-/traverse-7.29.0.tgz",
      "integrity": "sha512-4HPiQr0X7+waHfyXPZpWPfWL/J7dcN1mx9gL6WdQVMbPnF3+ZhSMs8tCxN7oHddJE9fhNE7+lxdnlyemKfJRuA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/code-frame": "^7.29.0",
        "@babel/generator": "^7.29.0",
        "@babel/helper-globals": "^7.28.0",
        "@babel/parser": "^7.29.0",
        "@babel/template": "^7.28.6",
        "@babel/types": "^7.29.0",
        "debug": "^4.3.1"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/types": {
      "version": "7.29.0",
      "resolved": "https://registry.npmjs.org/@babel/types/-/types-7.29.0.tgz",
      "integrity": "sha512-LwdZHpScM4Qz8Xw2iKSzS+cfglZzJGvofQICy7W7v4caru4EaAmyUuO6BGrbyQ2mYV11W0U8j5mBhd14dd3B0A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-string-parser": "^7.27.1",
        "@babel/helper-validator-identifier": "^7.28.5"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@base-org/account": {
      "version": "2.5.5",
      "resolved": "https://registry.npmjs.org/@base-org/account/-/account-2.5.5.tgz",
      "integrity": "sha512-WKXygJv/fAE4TcmkGW0ibfYEiZKrhxFlTjkrv8KIdRQ5AiQADfSVhcscWeYVeNMvsVtwS8dzpGEQcmqhpvePnw==",
      "license": "Apache-2.0",
      "dependencies": {
        "@coinbase/cdp-sdk": "^1.0.0",
        "brotli-wasm": "^3.0.0",
        "clsx": "1.2.1",
        "eventemitter3": "5.0.1",
        "idb-keyval": "6.2.1",
        "ox": "0.6.9",
        "preact": "10.24.2",
        "viem": "^2.31.7",
        "zustand": "5.0.3"
      },
      "engines": {
        "node": ">=20"
      }
    },
    "node_modules/@based-chess/api": {
      "resolved": "apps/api",
      "link": true
    },
    "node_modules/@based-chess/shared": {
      "resolved": "packages/shared",
      "link": true
    },
    "node_modules/@based-chess/web": {
      "resolved": "apps/web",
      "link": true
    },
    "node_modules/@coinbase/cdp-sdk": {
      "version": "1.48.2",
      "resolved": "https://registry.npmjs.org/@coinbase/cdp-sdk/-/cdp-sdk-1.48.2.tgz",
      "integrity": "sha512-phsHxF9q4CvF8H1b//aepxy8J/pdORT+btdqv7wbQ1YOi44QYfenima15N8Ok9lZE/XqY81BebsaBkyjqBJgig==",
      "license": "MIT",
      "dependencies": {
        "@solana-program/system": "^0.10.0",
        "@solana-program/token": "^0.9.0",
        "@solana/kit": "^5.5.1",
        "abitype": "1.0.6",
        "axios": "1.13.6",
        "axios-retry": "^4.5.0",
        "jose": "^6.2.0",
        "md5": "^2.3.0",
        "uncrypto": "^0.1.3",
        "viem": "^2.47.0",
        "zod": "^3.25.76"
      }
    },
    "node_modules/@coinbase/wallet-sdk": {
      "version": "4.3.6",
      "resolved": "https://registry.npmjs.org/@coinbase/wallet-sdk/-/wallet-sdk-4.3.6.tgz",
      "integrity": "sha512-4q8BNG1ViL4mSAAvPAtpwlOs1gpC+67eQtgIwNvT3xyeyFFd+guwkc8bcX5rTmQhXpqnhzC4f0obACbP9CqMSA==",
      "license": "Apache-2.0",
      "dependencies": {
        "@noble/hashes": "1.4.0",
        "clsx": "1.2.1",
        "eventemitter3": "5.0.1",
        "idb-keyval": "6.2.1",
        "ox": "0.6.9",
        "preact": "10.24.2",
        "viem": "^2.27.2",
        "zustand": "5.0.3"
      }
    },
    "node_modules/@coinbase/wallet-sdk/node_modules/@noble/hashes": {
      "version": "1.4.0",
      "resolved": "https://registry.npmjs.org/@noble/hashes/-/hashes-1.4.0.tgz",
      "integrity": "sha512-V1JJ1WTRUqHHrOSh597hURcMqVKVGL/ea3kv0gSnEdsEZ0/+VyPghM1lMNGc00z7CIQorSvbKpuJkxvuHbvdbg==",
      "license": "MIT",
      "engines": {
        "node": ">= 16"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@ecies/ciphers": {
      "version": "0.2.6",
      "resolved": "https://registry.npmjs.org/@ecies/ciphers/-/ciphers-0.2.6.tgz",
      "integrity": "sha512-patgsRPKGkhhoBjETV4XxD0En4ui5fbX0hzayqI3M8tvNMGUoUvmyYAIWwlxBc1KX5cturfqByYdj5bYGRpN9g==",
      "license": "MIT",
      "engines": {
        "bun": ">=1",
        "deno": ">=2.7.10",
        "node": ">=16"
      },
      "peerDependencies": {
        "@noble/ciphers": "^1.0.0"
      }
    },
    "node_modules/@esbuild/aix-ppc64": {
      "version": "0.27.7",
      "resolved": "https://registry.npmjs.org/@esbuild/aix-ppc64/-/aix-ppc64-0.27.7.tgz",
      "integrity": "sha512-EKX3Qwmhz1eMdEJokhALr0YiD0lhQNwDqkPYyPhiSwKrh7/4KRjQc04sZ8db+5DVVnZ1LmbNDI1uAMPEUBnQPg==",
      "cpu": [
        "ppc64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "aix"
      ],
      "peer": true,
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/android-arm": {
      "version": "0.27.7",
      "resolved": "https://registry.npmjs.org/@esbuild/android-arm/-/android-arm-0.27.7.tgz",
      "integrity": "sha512-jbPXvB4Yj2yBV7HUfE2KHe4GJX51QplCN1pGbYjvsyCZbQmies29EoJbkEc+vYuU5o45AfQn37vZlyXy4YJ8RQ==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "peer": true,
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/android-arm64": {
      "version": "0.27.7",
      "resolved": "https://registry.npmjs.org/@esbuild/android-arm64/-/android-arm64-0.27.7.tgz",
      "integrity": "sha512-62dPZHpIXzvChfvfLJow3q5dDtiNMkwiRzPylSCfriLvZeq0a1bWChrGx/BbUbPwOrsWKMn8idSllklzBy+dgQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "peer": true,
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/android-x64": {
      "version": "0.27.7",
      "resolved": "https://registry.npmjs.org/@esbuild/android-x64/-/android-x64-0.27.7.tgz",
      "integrity": "sha512-x5VpMODneVDb70PYV2VQOmIUUiBtY3D3mPBG8NxVk5CogneYhkR7MmM3yR/uMdITLrC1ml/NV1rj4bMJuy9MCg==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "peer": true,
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/darwin-arm64": {
      "version": "0.27.7",
      "resolved": "https://registry.npmjs.org/@esbuild/darwin-arm64/-/darwin-arm64-0.27.7.tgz",
      "integrity": "sha512-5lckdqeuBPlKUwvoCXIgI2D9/ABmPq3Rdp7IfL70393YgaASt7tbju3Ac+ePVi3KDH6N2RqePfHnXkaDtY9fkw==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "peer": true,
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/darwin-x64": {
      "version": "0.27.7",
      "resolved": "https://registry.npmjs.org/@esbuild/darwin-x64/-/darwin-x64-0.27.7.tgz",
      "integrity": "sha512-rYnXrKcXuT7Z+WL5K980jVFdvVKhCHhUwid+dDYQpH+qu+TefcomiMAJpIiC2EM3Rjtq0sO3StMV/+3w3MyyqQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "peer": true,
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/freebsd-arm64": {
      "version": "0.27.7",
      "resolved": "https://registry.npmjs.org/@esbuild/freebsd-arm64/-/freebsd-arm64-0.27.7.tgz",
      "integrity": "sha512-B48PqeCsEgOtzME2GbNM2roU29AMTuOIN91dsMO30t+Ydis3z/3Ngoj5hhnsOSSwNzS+6JppqWsuhTp6E82l2w==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ],
      "peer": true,
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/freebsd-x64": {
      "version": "0.27.7",
      "resolved": "https://registry.npmjs.org/@esbuild/freebsd-x64/-/freebsd-x64-0.27.7.tgz",
      "integrity": "sha512-jOBDK5XEjA4m5IJK3bpAQF9/Lelu/Z9ZcdhTRLf4cajlB+8VEhFFRjWgfy3M1O4rO2GQ/b2dLwCUGpiF/eATNQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ],
      "peer": true,
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-arm": {
      "version": "0.27.7",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-arm/-/linux-arm-0.27.7.tgz",
      "integrity": "sha512-RkT/YXYBTSULo3+af8Ib0ykH8u2MBh57o7q/DAs3lTJlyVQkgQvlrPTnjIzzRPQyavxtPtfg0EopvDyIt0j1rA==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "peer": true,
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-arm64": {
      "version": "0.27.7",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-arm64/-/linux-arm64-0.27.7.tgz",
      "integrity": "sha512-RZPHBoxXuNnPQO9rvjh5jdkRmVizktkT7TCDkDmQ0W2SwHInKCAV95GRuvdSvA7w4VMwfCjUiPwDi0ZO6Nfe9A==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "peer": true,
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-ia32": {
      "version": "0.27.7",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-ia32/-/linux-ia32-0.27.7.tgz",
      "integrity": "sha512-GA48aKNkyQDbd3KtkplYWT102C5sn/EZTY4XROkxONgruHPU72l+gW+FfF8tf2cFjeHaRbWpOYa/uRBz/Xq1Pg==",
      "cpu": [
        "ia32"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "peer": true,
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-loong64": {
      "version": "0.27.7",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-loong64/-/linux-loong64-0.27.7.tgz",
      "integrity": "sha512-a4POruNM2oWsD4WKvBSEKGIiWQF8fZOAsycHOt6JBpZ+JN2n2JH9WAv56SOyu9X5IqAjqSIPTaJkqN8F7XOQ5Q==",
      "cpu": [
        "loong64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "peer": true,
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-mips64el": {
      "version": "0.27.7",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-mips64el/-/linux-mips64el-0.27.7.tgz",
      "integrity": "sha512-KabT5I6StirGfIz0FMgl1I+R1H73Gp0ofL9A3nG3i/cYFJzKHhouBV5VWK1CSgKvVaG4q1RNpCTR2LuTVB3fIw==",
      "cpu": [
        "mips64el"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "peer": true,
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-ppc64": {
      "version": "0.27.7",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-ppc64/-/linux-ppc64-0.27.7.tgz",
      "integrity": "sha512-gRsL4x6wsGHGRqhtI+ifpN/vpOFTQtnbsupUF5R5YTAg+y/lKelYR1hXbnBdzDjGbMYjVJLJTd2OFmMewAgwlQ==",
      "cpu": [
        "ppc64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "peer": true,
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-riscv64": {
      "version": "0.27.7",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-riscv64/-/linux-riscv64-0.27.7.tgz",
      "integrity": "sha512-hL25LbxO1QOngGzu2U5xeXtxXcW+/GvMN3ejANqXkxZ/opySAZMrc+9LY/WyjAan41unrR3YrmtTsUpwT66InQ==",
      "cpu": [
        "riscv64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "peer": true,
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-s390x": {
      "version": "0.27.7",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-s390x/-/linux-s390x-0.27.7.tgz",
      "integrity": "sha512-2k8go8Ycu1Kb46vEelhu1vqEP+UeRVj2zY1pSuPdgvbd5ykAw82Lrro28vXUrRmzEsUV0NzCf54yARIK8r0fdw==",
      "cpu": [
        "s390x"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "peer": true,
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-x64": {
      "version": "0.27.7",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-x64/-/linux-x64-0.27.7.tgz",
      "integrity": "sha512-hzznmADPt+OmsYzw1EE33ccA+HPdIqiCRq7cQeL1Jlq2gb1+OyWBkMCrYGBJ+sxVzve2ZJEVeePbLM2iEIZSxA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "peer": true,
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/netbsd-arm64": {
      "version": "0.27.7",
      "resolved": "https://registry.npmjs.org/@esbuild/netbsd-arm64/-/netbsd-arm64-0.27.7.tgz",
      "integrity": "sha512-b6pqtrQdigZBwZxAn1UpazEisvwaIDvdbMbmrly7cDTMFnw/+3lVxxCTGOrkPVnsYIosJJXAsILG9XcQS+Yu6w==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "netbsd"
      ],
      "peer": true,
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/netbsd-x64": {
      "version": "0.27.7",
      "resolved": "https://registry.npmjs.org/@esbuild/netbsd-x64/-/netbsd-x64-0.27.7.tgz",
      "integrity": "sha512-OfatkLojr6U+WN5EDYuoQhtM+1xco+/6FSzJJnuWiUw5eVcicbyK3dq5EeV/QHT1uy6GoDhGbFpprUiHUYggrw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "netbsd"
      ],
      "peer": true,
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/openbsd-arm64": {
      "version": "0.27.7",
      "resolved": "https://registry.npmjs.org/@esbuild/openbsd-arm64/-/openbsd-arm64-0.27.7.tgz",
      "integrity": "sha512-AFuojMQTxAz75Fo8idVcqoQWEHIXFRbOc1TrVcFSgCZtQfSdc1RXgB3tjOn/krRHENUB4j00bfGjyl2mJrU37A==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "openbsd"
      ],
      "peer": true,
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/openbsd-x64": {
      "version": "0.27.7",
      "resolved": "https://registry.npmjs.org/@esbuild/openbsd-x64/-/openbsd-x64-0.27.7.tgz",
      "integrity": "sha512-+A1NJmfM8WNDv5CLVQYJ5PshuRm/4cI6WMZRg1by1GwPIQPCTs1GLEUHwiiQGT5zDdyLiRM/l1G0Pv54gvtKIg==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "openbsd"
      ],
      "peer": true,
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/openharmony-arm64": {
      "version": "0.27.7",
      "resolved": "https://registry.npmjs.org/@esbuild/openharmony-arm64/-/openharmony-arm64-0.27.7.tgz",
      "integrity": "sha512-+KrvYb/C8zA9CU/g0sR6w2RBw7IGc5J2BPnc3dYc5VJxHCSF1yNMxTV5LQ7GuKteQXZtspjFbiuW5/dOj7H4Yw==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "openharmony"
      ],
      "peer": true,
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/sunos-x64": {
      "version": "0.27.7",
      "resolved": "https://registry.npmjs.org/@esbuild/sunos-x64/-/sunos-x64-0.27.7.tgz",
      "integrity": "sha512-ikktIhFBzQNt/QDyOL580ti9+5mL/YZeUPKU2ivGtGjdTYoqz6jObj6nOMfhASpS4GU4Q/Clh1QtxWAvcYKamA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "sunos"
      ],
      "peer": true,
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/win32-arm64": {
      "version": "0.27.7",
      "resolved": "https://registry.npmjs.org/@esbuild/win32-arm64/-/win32-arm64-0.27.7.tgz",
      "integrity": "sha512-7yRhbHvPqSpRUV7Q20VuDwbjW5kIMwTHpptuUzV+AA46kiPze5Z7qgt6CLCK3pWFrHeNfDd1VKgyP4O+ng17CA==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "peer": true,
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/win32-ia32": {
      "version": "0.27.7",
      "resolved": "https://registry.npmjs.org/@esbuild/win32-ia32/-/win32-ia32-0.27.7.tgz",
      "integrity": "sha512-SmwKXe6VHIyZYbBLJrhOoCJRB/Z1tckzmgTLfFYOfpMAx63BJEaL9ExI8x7v0oAO3Zh6D/Oi1gVxEYr5oUCFhw==",
      "cpu": [
        "ia32"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "peer": true,
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/win32-x64": {
      "version": "0.27.7",
      "resolved": "https://registry.npmjs.org/@esbuild/win32-x64/-/win32-x64-0.27.7.tgz",
      "integrity": "sha512-56hiAJPhwQ1R4i+21FVF7V8kSD5zZTdHcVuRFMW0hn753vVfQN8xlx4uOPT4xoGH0Z/oVATuR82AiqSTDIpaHg==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "peer": true,
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@ethereumjs/common": {
      "version": "3.2.0",
      "resolved": "https://registry.npmjs.org/@ethereumjs/common/-/common-3.2.0.tgz",
      "integrity": "sha512-pksvzI0VyLgmuEF2FA/JR/4/y6hcPq8OUail3/AvycBaW1d5VSauOZzqGvJ3RTmR4MU35lWE8KseKOsEhrFRBA==",
      "license": "MIT",
      "dependencies": {
        "@ethereumjs/util": "^8.1.0",
        "crc-32": "^1.2.0"
      }
    },
    "node_modules/@ethereumjs/rlp": {
      "version": "4.0.1",
      "resolved": "https://registry.npmjs.org/@ethereumjs/rlp/-/rlp-4.0.1.tgz",
      "integrity": "sha512-tqsQiBQDQdmPWE1xkkBq4rlSW5QZpLOUJ5RJh2/9fug+q9tnUhuZoVLk7s0scUIKTOzEtR72DFBXI4WiZcMpvw==",
      "license": "MPL-2.0",
      "bin": {
        "rlp": "bin/rlp"
      },
      "engines": {
        "node": ">=14"
      }
    },
    "node_modules/@ethereumjs/tx": {
      "version": "4.2.0",
      "resolved": "https://registry.npmjs.org/@ethereumjs/tx/-/tx-4.2.0.tgz",
      "integrity": "sha512-1nc6VO4jtFd172BbSnTnDQVr9IYBFl1y4xPzZdtkrkKIncBCkdbgfdRV+MiTkJYAtTxvV12GRZLqBFT1PNK6Yw==",
      "license": "MPL-2.0",
      "dependencies": {
        "@ethereumjs/common": "^3.2.0",
        "@ethereumjs/rlp": "^4.0.1",
        "@ethereumjs/util": "^8.1.0",
        "ethereum-cryptography": "^2.0.0"
      },
      "engines": {
        "node": ">=14"
      }
    },
    "node_modules/@ethereumjs/util": {
      "version": "8.1.0",
      "resolved": "https://registry.npmjs.org/@ethereumjs/util/-/util-8.1.0.tgz",
      "integrity": "sha512-zQ0IqbdX8FZ9aw11vP+dZkKDkS+kgIvQPHnSAXzP9pLu+Rfu3D3XEeLbicvoXJTYnhZiPmsZUxgdzXwNKxRPbA==",
      "license": "MPL-2.0",
      "dependencies": {
        "@ethereumjs/rlp": "^4.0.1",
        "ethereum-cryptography": "^2.0.0",
        "micro-ftch": "^0.3.1"
      },
      "engines": {
        "node": ">=14"
      }
    },
    "node_modules/@fastify/ajv-compiler": {
      "version": "4.0.5",
      "resolved": "https://registry.npmjs.org/@fastify/ajv-compiler/-/ajv-compiler-4.0.5.tgz",
      "integrity": "sha512-KoWKW+MhvfTRWL4qrhUwAAZoaChluo0m0vbiJlGMt2GXvL4LVPQEjt8kSpHI3IBq5Rez8fg+XeH3cneztq+C7A==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/fastify"
        },
        {
          "type": "opencollective",
          "url": "https://opencollective.com/fastify"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "ajv": "^8.12.0",
        "ajv-formats": "^3.0.1",
        "fast-uri": "^3.0.0"
      }
    },
    "node_modules/@fastify/cors": {
      "version": "11.2.0",
      "resolved": "https://registry.npmjs.org/@fastify/cors/-/cors-11.2.0.tgz",
      "integrity": "sha512-LbLHBuSAdGdSFZYTLVA3+Ch2t+sA6nq3Ejc6XLAKiQ6ViS2qFnvicpj0htsx03FyYeLs04HfRNBsz/a8SvbcUw==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/fastify"
        },
        {
          "type": "opencollective",
          "url": "https://opencollective.com/fastify"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "fastify-plugin": "^5.0.0",
        "toad-cache": "^3.7.0"
      }
    },
    "node_modules/@fastify/error": {
      "version": "4.2.0",
      "resolved": "https://registry.npmjs.org/@fastify/error/-/error-4.2.0.tgz",
      "integrity": "sha512-RSo3sVDXfHskiBZKBPRgnQTtIqpi/7zhJOEmAxCiBcM7d0uwdGdxLlsCaLzGs8v8NnxIRlfG0N51p5yFaOentQ==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/fastify"
        },
        {
          "type": "opencollective",
          "url": "https://opencollective.com/fastify"
        }
      ],
      "license": "MIT"
    },
    "node_modules/@fastify/fast-json-stringify-compiler": {
      "version": "5.0.3",
      "resolved": "https://registry.npmjs.org/@fastify/fast-json-stringify-compiler/-/fast-json-stringify-compiler-5.0.3.tgz",
      "integrity": "sha512-uik7yYHkLr6fxd8hJSZ8c+xF4WafPK+XzneQDPU+D10r5X19GW8lJcom2YijX2+qtFF1ENJlHXKFM9ouXNJYgQ==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/fastify"
        },
        {
          "type": "opencollective",
          "url": "https://opencollective.com/fastify"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "fast-json-stringify": "^6.0.0"
      }
    },
    "node_modules/@fastify/forwarded": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/@fastify/forwarded/-/forwarded-3.0.1.tgz",
      "integrity": "sha512-JqDochHFqXs3C3Ml3gOY58zM7OqO9ENqPo0UqAjAjH8L01fRZqwX9iLeX34//kiJubF7r2ZQHtBRU36vONbLlw==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/fastify"
        },
        {
          "type": "opencollective",
          "url": "https://opencollective.com/fastify"
        }
      ],
      "license": "MIT"
    },
    "node_modules/@fastify/jwt": {
      "version": "10.0.0",
      "resolved": "https://registry.npmjs.org/@fastify/jwt/-/jwt-10.0.0.tgz",
      "integrity": "sha512-2Qka3NiyNNcsfejMUvyzot1T4UYIzzcbkFGDdVyrl344fRZ/WkD6VFXOoXhxe2Pzf3LpJNkoSxUM4Ru4DVgkYA==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/fastify"
        },
        {
          "type": "opencollective",
          "url": "https://opencollective.com/fastify"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "@fastify/error": "^4.2.0",
        "@lukeed/ms": "^2.0.2",
        "fast-jwt": "^6.0.2",
        "fastify-plugin": "^5.0.1",
        "steed": "^1.1.3"
      }
    },
    "node_modules/@fastify/merge-json-schemas": {
      "version": "0.2.1",
      "resolved": "https://registry.npmjs.org/@fastify/merge-json-schemas/-/merge-json-schemas-0.2.1.tgz",
      "integrity": "sha512-OA3KGBCy6KtIvLf8DINC5880o5iBlDX4SxzLQS8HorJAbqluzLRn80UXU0bxZn7UOFhFgpRJDasfwn9nG4FG4A==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/fastify"
        },
        {
          "type": "opencollective",
          "url": "https://opencollective.com/fastify"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "dequal": "^2.0.3"
      }
    },
    "node_modules/@fastify/proxy-addr": {
      "version": "5.1.0",
      "resolved": "https://registry.npmjs.org/@fastify/proxy-addr/-/proxy-addr-5.1.0.tgz",
      "integrity": "sha512-INS+6gh91cLUjB+PVHfu1UqcB76Sqtpyp7bnL+FYojhjygvOPA9ctiD/JDKsyD9Xgu4hUhCSJBPig/w7duNajw==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/fastify"
        },
        {
          "type": "opencollective",
          "url": "https://opencollective.com/fastify"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "@fastify/forwarded": "^3.0.0",
        "ipaddr.js": "^2.1.0"
      }
    },
    "node_modules/@gemini-wallet/core": {
      "version": "0.3.2",
      "resolved": "https://registry.npmjs.org/@gemini-wallet/core/-/core-0.3.2.tgz",
      "integrity": "sha512-Z4aHi3ECFf5oWYWM3F1rW83GJfB9OvhBYPTmb5q+VyK3uvzvS48lwo+jwh2eOoCRWEuT/crpb9Vwp2QaS5JqgQ==",
      "license": "MIT",
      "dependencies": {
        "@metamask/rpc-errors": "7.0.2",
        "eventemitter3": "5.0.1"
      },
      "peerDependencies": {
        "viem": ">=2.0.0"
      }
    },
    "node_modules/@jridgewell/gen-mapping": {
      "version": "0.3.13",
      "resolved": "https://registry.npmjs.org/@jridgewell/gen-mapping/-/gen-mapping-0.3.13.tgz",
      "integrity": "sha512-2kkt/7niJ6MgEPxF0bYdQ6etZaA+fQvDcLKckhy1yIQOzaoKjBBjSj63/aLVjYE3qhRt5dvM+uUyfCg6UKCBbA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/sourcemap-codec": "^1.5.0",
        "@jridgewell/trace-mapping": "^0.3.24"
      }
    },
    "node_modules/@jridgewell/remapping": {
      "version": "2.3.5",
      "resolved": "https://registry.npmjs.org/@jridgewell/remapping/-/remapping-2.3.5.tgz",
      "integrity": "sha512-LI9u/+laYG4Ds1TDKSJW2YPrIlcVYOwi2fUC6xB43lueCjgxV4lffOCZCtYFiH6TNOX+tQKXx97T4IKHbhyHEQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/gen-mapping": "^0.3.5",
        "@jridgewell/trace-mapping": "^0.3.24"
      }
    },
    "node_modules/@jridgewell/resolve-uri": {
      "version": "3.1.2",
      "resolved": "https://registry.npmjs.org/@jridgewell/resolve-uri/-/resolve-uri-3.1.2.tgz",
      "integrity": "sha512-bRISgCIjP20/tbWSPWMEi54QVPRZExkuD9lJL+UIxUKtwVJA8wW1Trb1jMs1RFXo1CBTNZ/5hpC9QvmKWdopKw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/@jridgewell/sourcemap-codec": {
      "version": "1.5.5",
      "resolved": "https://registry.npmjs.org/@jridgewell/sourcemap-codec/-/sourcemap-codec-1.5.5.tgz",
      "integrity": "sha512-cYQ9310grqxueWbl+WuIUIaiUaDcj7WOq5fVhEljNVgRfOUhY9fy2zTvfoqWsnebh8Sl70VScFbICvJnLKB0Og==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@jridgewell/trace-mapping": {
      "version": "0.3.31",
      "resolved": "https://registry.npmjs.org/@jridgewell/trace-mapping/-/trace-mapping-0.3.31.tgz",
      "integrity": "sha512-zzNR+SdQSDJzc8joaeP8QQoCQr8NuYx2dIIytl1QeBEZHJ9uW6hebsrYgbz8hJwUQao3TWCMtmfV8Nu1twOLAw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/resolve-uri": "^3.1.0",
        "@jridgewell/sourcemap-codec": "^1.4.14"
      }
    },
    "node_modules/@lit-labs/ssr-dom-shim": {
      "version": "1.5.1",
      "resolved": "https://registry.npmjs.org/@lit-labs/ssr-dom-shim/-/ssr-dom-shim-1.5.1.tgz",
      "integrity": "sha512-Aou5UdlSpr5whQe8AA/bZG0jMj96CoJIWbGfZ91qieWu5AWUMKw8VR/pAkQkJYvBNhmCcWnZlyyk5oze8JIqYA==",
      "license": "BSD-3-Clause"
    },
    "node_modules/@lit/reactive-element": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/@lit/reactive-element/-/reactive-element-2.1.2.tgz",
      "integrity": "sha512-pbCDiVMnne1lYUIaYNN5wrwQXDtHaYtg7YEFPeW+hws6U47WeFvISGUWekPGKWOP1ygrs0ef0o1VJMk1exos5A==",
      "license": "BSD-3-Clause",
      "dependencies": {
        "@lit-labs/ssr-dom-shim": "^1.5.0"
      }
    },
    "node_modules/@lukeed/ms": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/@lukeed/ms/-/ms-2.0.2.tgz",
      "integrity": "sha512-9I2Zn6+NJLfaGoz9jN3lpwDgAYvfGeNYdbAIjJOqzs4Tpc+VU3Jqq4IofSUBKajiDS8k9fZIg18/z13mpk1bsA==",
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/@metamask/eth-json-rpc-provider": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/@metamask/eth-json-rpc-provider/-/eth-json-rpc-provider-1.0.1.tgz",
      "integrity": "sha512-whiUMPlAOrVGmX8aKYVPvlKyG4CpQXiNNyt74vE1xb5sPvmx5oA7B/kOi/JdBvhGQq97U1/AVdXEdk2zkP8qyA==",
      "dependencies": {
        "@metamask/json-rpc-engine": "^7.0.0",
        "@metamask/safe-event-emitter": "^3.0.0",
        "@metamask/utils": "^5.0.1"
      },
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/@metamask/eth-json-rpc-provider/node_modules/@metamask/json-rpc-engine": {
      "version": "7.3.3",
      "resolved": "https://registry.npmjs.org/@metamask/json-rpc-engine/-/json-rpc-engine-7.3.3.tgz",
      "integrity": "sha512-dwZPq8wx9yV3IX2caLi9q9xZBw2XeIoYqdyihDDDpuHVCEiqadJLwqM3zy+uwf6F1QYQ65A8aOMQg1Uw7LMLNg==",
      "license": "ISC",
      "dependencies": {
        "@metamask/rpc-errors": "^6.2.1",
        "@metamask/safe-event-emitter": "^3.0.0",
        "@metamask/utils": "^8.3.0"
      },
      "engines": {
        "node": ">=16.0.0"
      }
    },
    "node_modules/@metamask/eth-json-rpc-provider/node_modules/@metamask/json-rpc-engine/node_modules/@metamask/utils": {
      "version": "8.5.0",
      "resolved": "https://registry.npmjs.org/@metamask/utils/-/utils-8.5.0.tgz",
      "integrity": "sha512-I6bkduevXb72TIM9q2LRO63JSsF9EXduh3sBr9oybNX2hNNpr/j1tEjXrsG0Uabm4MJ1xkGAQEMwifvKZIkyxQ==",
      "license": "ISC",
      "dependencies": {
        "@ethereumjs/tx": "^4.2.0",
        "@metamask/superstruct": "^3.0.0",
        "@noble/hashes": "^1.3.1",
        "@scure/base": "^1.1.3",
        "@types/debug": "^4.1.7",
        "debug": "^4.3.4",
        "pony-cause": "^2.1.10",
        "semver": "^7.5.4",
        "uuid": "^9.0.1"
      },
      "engines": {
        "node": ">=16.0.0"
      }
    },
    "node_modules/@metamask/eth-json-rpc-provider/node_modules/@metamask/rpc-errors": {
      "version": "6.4.0",
      "resolved": "https://registry.npmjs.org/@metamask/rpc-errors/-/rpc-errors-6.4.0.tgz",
      "integrity": "sha512-1ugFO1UoirU2esS3juZanS/Fo8C8XYocCuBpfZI5N7ECtoG+zu0wF+uWZASik6CkO6w9n/Iebt4iI4pT0vptpg==",
      "license": "MIT",
      "dependencies": {
        "@metamask/utils": "^9.0.0",
        "fast-safe-stringify": "^2.0.6"
      },
      "engines": {
        "node": ">=16.0.0"
      }
    },
    "node_modules/@metamask/eth-json-rpc-provider/node_modules/@metamask/rpc-errors/node_modules/@metamask/utils": {
      "version": "9.3.0",
      "resolved": "https://registry.npmjs.org/@metamask/utils/-/utils-9.3.0.tgz",
      "integrity": "sha512-w8CVbdkDrVXFJbfBSlDfafDR6BAkpDmv1bC1UJVCoVny5tW2RKAdn9i68Xf7asYT4TnUhl/hN4zfUiKQq9II4g==",
      "license": "ISC",
      "dependencies": {
        "@ethereumjs/tx": "^4.2.0",
        "@metamask/superstruct": "^3.1.0",
        "@noble/hashes": "^1.3.1",
        "@scure/base": "^1.1.3",
        "@types/debug": "^4.1.7",
        "debug": "^4.3.4",
        "pony-cause": "^2.1.10",
        "semver": "^7.5.4",
        "uuid": "^9.0.1"
      },
      "engines": {
        "node": ">=16.0.0"
      }
    },
    "node_modules/@metamask/eth-json-rpc-provider/node_modules/@metamask/utils": {
      "version": "5.0.2",
      "resolved": "https://registry.npmjs.org/@metamask/utils/-/utils-5.0.2.tgz",
      "integrity": "sha512-yfmE79bRQtnMzarnKfX7AEJBwFTxvTyw3nBQlu/5rmGXrjAeAMltoGxO62TFurxrQAFMNa/fEjIHNvungZp0+g==",
      "license": "ISC",
      "dependencies": {
        "@ethereumjs/tx": "^4.1.2",
        "@types/debug": "^4.1.7",
        "debug": "^4.3.4",
        "semver": "^7.3.8",
        "superstruct": "^1.0.3"
      },
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/@metamask/eth-json-rpc-provider/node_modules/semver": {
      "version": "7.7.4",
      "resolved": "https://registry.npmjs.org/semver/-/semver-7.7.4.tgz",
      "integrity": "sha512-vFKC2IEtQnVhpT78h1Yp8wzwrf8CM+MzKMHGJZfBtzhZNycRFnXsHk6E5TxIkkMsgNS7mdX3AGB7x2QM2di4lA==",
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/@metamask/eth-json-rpc-provider/node_modules/uuid": {
      "version": "9.0.1",
      "resolved": "https://registry.npmjs.org/uuid/-/uuid-9.0.1.tgz",
      "integrity": "sha512-b+1eJOlsR9K8HJpow9Ok3fiWOWSIcIzXodvv0rQjVoOVNpWMpxf1wZNpt4y9h10odCNrqnYp1OBzRktckBe3sA==",
      "deprecated": "uuid@10 and below is no longer supported.  For ESM codebases, update to uuid@latest.  For CommonJS codebases, use uuid@11 (but be aware this version will likely be deprecated in 2028).",
      "funding": [
        "https://github.com/sponsors/broofa",
        "https://github.com/sponsors/ctavan"
      ],
      "license": "MIT",
      "bin": {
        "uuid": "dist/bin/uuid"
      }
    },
    "node_modules/@metamask/json-rpc-engine": {
      "version": "8.0.2",
      "resolved": "https://registry.npmjs.org/@metamask/json-rpc-engine/-/json-rpc-engine-8.0.2.tgz",
      "integrity": "sha512-IoQPmql8q7ABLruW7i4EYVHWUbF74yrp63bRuXV5Zf9BQwcn5H9Ww1eLtROYvI1bUXwOiHZ6qT5CWTrDc/t/AA==",
      "license": "ISC",
      "dependencies": {
        "@metamask/rpc-errors": "^6.2.1",
        "@metamask/safe-event-emitter": "^3.0.0",
        "@metamask/utils": "^8.3.0"
      },
      "engines": {
        "node": ">=16.0.0"
      }
    },
    "node_modules/@metamask/json-rpc-engine/node_modules/@metamask/rpc-errors": {
      "version": "6.4.0",
      "resolved": "https://registry.npmjs.org/@metamask/rpc-errors/-/rpc-errors-6.4.0.tgz",
      "integrity": "sha512-1ugFO1UoirU2esS3juZanS/Fo8C8XYocCuBpfZI5N7ECtoG+zu0wF+uWZASik6CkO6w9n/Iebt4iI4pT0vptpg==",
      "license": "MIT",
      "dependencies": {
        "@metamask/utils": "^9.0.0",
        "fast-safe-stringify": "^2.0.6"
      },
      "engines": {
        "node": ">=16.0.0"
      }
    },
    "node_modules/@metamask/json-rpc-engine/node_modules/@metamask/rpc-errors/node_modules/@metamask/utils": {
      "version": "9.3.0",
      "resolved": "https://registry.npmjs.org/@metamask/utils/-/utils-9.3.0.tgz",
      "integrity": "sha512-w8CVbdkDrVXFJbfBSlDfafDR6BAkpDmv1bC1UJVCoVny5tW2RKAdn9i68Xf7asYT4TnUhl/hN4zfUiKQq9II4g==",
      "license": "ISC",
      "dependencies": {
        "@ethereumjs/tx": "^4.2.0",
        "@metamask/superstruct": "^3.1.0",
        "@noble/hashes": "^1.3.1",
        "@scure/base": "^1.1.3",
        "@types/debug": "^4.1.7",
        "debug": "^4.3.4",
        "pony-cause": "^2.1.10",
        "semver": "^7.5.4",
        "uuid": "^9.0.1"
      },
      "engines": {
        "node": ">=16.0.0"
      }
    },
    "node_modules/@metamask/json-rpc-engine/node_modules/@metamask/utils": {
      "version": "8.5.0",
      "resolved": "https://registry.npmjs.org/@metamask/utils/-/utils-8.5.0.tgz",
      "integrity": "sha512-I6bkduevXb72TIM9q2LRO63JSsF9EXduh3sBr9oybNX2hNNpr/j1tEjXrsG0Uabm4MJ1xkGAQEMwifvKZIkyxQ==",
      "license": "ISC",
      "dependencies": {
        "@ethereumjs/tx": "^4.2.0",
        "@metamask/superstruct": "^3.0.0",
        "@noble/hashes": "^1.3.1",
        "@scure/base": "^1.1.3",
        "@types/debug": "^4.1.7",
        "debug": "^4.3.4",
        "pony-cause": "^2.1.10",
        "semver": "^7.5.4",
        "uuid": "^9.0.1"
      },
      "engines": {
        "node": ">=16.0.0"
      }
    },
    "node_modules/@metamask/json-rpc-engine/node_modules/semver": {
      "version": "7.7.4",
      "resolved": "https://registry.npmjs.org/semver/-/semver-7.7.4.tgz",
      "integrity": "sha512-vFKC2IEtQnVhpT78h1Yp8wzwrf8CM+MzKMHGJZfBtzhZNycRFnXsHk6E5TxIkkMsgNS7mdX3AGB7x2QM2di4lA==",
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/@metamask/json-rpc-engine/node_modules/uuid": {
      "version": "9.0.1",
      "resolved": "https://registry.npmjs.org/uuid/-/uuid-9.0.1.tgz",
      "integrity": "sha512-b+1eJOlsR9K8HJpow9Ok3fiWOWSIcIzXodvv0rQjVoOVNpWMpxf1wZNpt4y9h10odCNrqnYp1OBzRktckBe3sA==",
      "deprecated": "uuid@10 and below is no longer supported.  For ESM codebases, update to uuid@latest.  For CommonJS codebases, use uuid@11 (but be aware this version will likely be deprecated in 2028).",
      "funding": [
        "https://github.com/sponsors/broofa",
        "https://github.com/sponsors/ctavan"
      ],
      "license": "MIT",
      "bin": {
        "uuid": "dist/bin/uuid"
      }
    },
    "node_modules/@metamask/json-rpc-middleware-stream": {
      "version": "7.0.2",
      "resolved": "https://registry.npmjs.org/@metamask/json-rpc-middleware-stream/-/json-rpc-middleware-stream-7.0.2.tgz",
      "integrity": "sha512-yUdzsJK04Ev98Ck4D7lmRNQ8FPioXYhEUZOMS01LXW8qTvPGiRVXmVltj2p4wrLkh0vW7u6nv0mNl5xzC5Qmfg==",
      "license": "ISC",
      "dependencies": {
        "@metamask/json-rpc-engine": "^8.0.2",
        "@metamask/safe-event-emitter": "^3.0.0",
        "@metamask/utils": "^8.3.0",
        "readable-stream": "^3.6.2"
      },
      "engines": {
        "node": ">=16.0.0"
      }
    },
    "node_modules/@metamask/json-rpc-middleware-stream/node_modules/@metamask/utils": {
      "version": "8.5.0",
      "resolved": "https://registry.npmjs.org/@metamask/utils/-/utils-8.5.0.tgz",
      "integrity": "sha512-I6bkduevXb72TIM9q2LRO63JSsF9EXduh3sBr9oybNX2hNNpr/j1tEjXrsG0Uabm4MJ1xkGAQEMwifvKZIkyxQ==",
      "license": "ISC",
      "dependencies": {
        "@ethereumjs/tx": "^4.2.0",
        "@metamask/superstruct": "^3.0.0",
        "@noble/hashes": "^1.3.1",
        "@scure/base": "^1.1.3",
        "@types/debug": "^4.1.7",
        "debug": "^4.3.4",
        "pony-cause": "^2.1.10",
        "semver": "^7.5.4",
        "uuid": "^9.0.1"
      },
      "engines": {
        "node": ">=16.0.0"
      }
    },
    "node_modules/@metamask/json-rpc-middleware-stream/node_modules/semver": {
      "version": "7.7.4",
      "resolved": "https://registry.npmjs.org/semver/-/semver-7.7.4.tgz",
      "integrity": "sha512-vFKC2IEtQnVhpT78h1Yp8wzwrf8CM+MzKMHGJZfBtzhZNycRFnXsHk6E5TxIkkMsgNS7mdX3AGB7x2QM2di4lA==",
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/@metamask/json-rpc-middleware-stream/node_modules/uuid": {
      "version": "9.0.1",
      "resolved": "https://registry.npmjs.org/uuid/-/uuid-9.0.1.tgz",
      "integrity": "sha512-b+1eJOlsR9K8HJpow9Ok3fiWOWSIcIzXodvv0rQjVoOVNpWMpxf1wZNpt4y9h10odCNrqnYp1OBzRktckBe3sA==",
      "deprecated": "uuid@10 and below is no longer supported.  For ESM codebases, update to uuid@latest.  For CommonJS codebases, use uuid@11 (but be aware this version will likely be deprecated in 2028).",
      "funding": [
        "https://github.com/sponsors/broofa",
        "https://github.com/sponsors/ctavan"
      ],
      "license": "MIT",
      "bin": {
        "uuid": "dist/bin/uuid"
      }
    },
    "node_modules/@metamask/object-multiplex": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/@metamask/object-multiplex/-/object-multiplex-2.1.0.tgz",
      "integrity": "sha512-4vKIiv0DQxljcXwfpnbsXcfa5glMj5Zg9mqn4xpIWqkv6uJ2ma5/GtUfLFSxhlxnR8asRMv8dDmWya1Tc1sDFA==",
      "license": "ISC",
      "dependencies": {
        "once": "^1.4.0",
        "readable-stream": "^3.6.2"
      },
      "engines": {
        "node": "^16.20 || ^18.16 || >=20"
      }
    },
    "node_modules/@metamask/onboarding": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/@metamask/onboarding/-/onboarding-1.0.1.tgz",
      "integrity": "sha512-FqHhAsCI+Vacx2qa5mAFcWNSrTcVGMNjzxVgaX8ECSny/BJ9/vgXP9V7WF/8vb9DltPeQkxr+Fnfmm6GHfmdTQ==",
      "license": "MIT",
      "dependencies": {
        "bowser": "^2.9.0"
      }
    },
    "node_modules/@metamask/providers": {
      "version": "16.1.0",
      "resolved": "https://registry.npmjs.org/@metamask/providers/-/providers-16.1.0.tgz",
      "integrity": "sha512-znVCvux30+3SaUwcUGaSf+pUckzT5ukPRpcBmy+muBLC0yaWnBcvDqGfcsw6CBIenUdFrVoAFa8B6jsuCY/a+g==",
      "license": "MIT",
      "dependencies": {
        "@metamask/json-rpc-engine": "^8.0.1",
        "@metamask/json-rpc-middleware-stream": "^7.0.1",
        "@metamask/object-multiplex": "^2.0.0",
        "@metamask/rpc-errors": "^6.2.1",
        "@metamask/safe-event-emitter": "^3.1.1",
        "@metamask/utils": "^8.3.0",
        "detect-browser": "^5.2.0",
        "extension-port-stream": "^3.0.0",
        "fast-deep-equal": "^3.1.3",
        "is-stream": "^2.0.0",
        "readable-stream": "^3.6.2",
        "webextension-polyfill": "^0.10.0"
      },
      "engines": {
        "node": "^18.18 || >=20"
      }
    },
    "node_modules/@metamask/providers/node_modules/@metamask/rpc-errors": {
      "version": "6.4.0",
      "resolved": "https://registry.npmjs.org/@metamask/rpc-errors/-/rpc-errors-6.4.0.tgz",
      "integrity": "sha512-1ugFO1UoirU2esS3juZanS/Fo8C8XYocCuBpfZI5N7ECtoG+zu0wF+uWZASik6CkO6w9n/Iebt4iI4pT0vptpg==",
      "license": "MIT",
      "dependencies": {
        "@metamask/utils": "^9.0.0",
        "fast-safe-stringify": "^2.0.6"
      },
      "engines": {
        "node": ">=16.0.0"
      }
    },
    "node_modules/@metamask/providers/node_modules/@metamask/rpc-errors/node_modules/@metamask/utils": {
      "version": "9.3.0",
      "resolved": "https://registry.npmjs.org/@metamask/utils/-/utils-9.3.0.tgz",
      "integrity": "sha512-w8CVbdkDrVXFJbfBSlDfafDR6BAkpDmv1bC1UJVCoVny5tW2RKAdn9i68Xf7asYT4TnUhl/hN4zfUiKQq9II4g==",
      "license": "ISC",
      "dependencies": {
        "@ethereumjs/tx": "^4.2.0",
        "@metamask/superstruct": "^3.1.0",
        "@noble/hashes": "^1.3.1",
        "@scure/base": "^1.1.3",
        "@types/debug": "^4.1.7",
        "debug": "^4.3.4",
        "pony-cause": "^2.1.10",
        "semver": "^7.5.4",
        "uuid": "^9.0.1"
      },
      "engines": {
        "node": ">=16.0.0"
      }
    },
    "node_modules/@metamask/providers/node_modules/@metamask/utils": {
      "version": "8.5.0",
      "resolved": "https://registry.npmjs.org/@metamask/utils/-/utils-8.5.0.tgz",
      "integrity": "sha512-I6bkduevXb72TIM9q2LRO63JSsF9EXduh3sBr9oybNX2hNNpr/j1tEjXrsG0Uabm4MJ1xkGAQEMwifvKZIkyxQ==",
      "license": "ISC",
      "dependencies": {
        "@ethereumjs/tx": "^4.2.0",
        "@metamask/superstruct": "^3.0.0",
        "@noble/hashes": "^1.3.1",
        "@scure/base": "^1.1.3",
        "@types/debug": "^4.1.7",
        "debug": "^4.3.4",
        "pony-cause": "^2.1.10",
        "semver": "^7.5.4",
        "uuid": "^9.0.1"
      },
      "engines": {
        "node": ">=16.0.0"
      }
    },
    "node_modules/@metamask/providers/node_modules/semver": {
      "version": "7.7.4",
      "resolved": "https://registry.npmjs.org/semver/-/semver-7.7.4.tgz",
      "integrity": "sha512-vFKC2IEtQnVhpT78h1Yp8wzwrf8CM+MzKMHGJZfBtzhZNycRFnXsHk6E5TxIkkMsgNS7mdX3AGB7x2QM2di4lA==",
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/@metamask/providers/node_modules/uuid": {
      "version": "9.0.1",
      "resolved": "https://registry.npmjs.org/uuid/-/uuid-9.0.1.tgz",
      "integrity": "sha512-b+1eJOlsR9K8HJpow9Ok3fiWOWSIcIzXodvv0rQjVoOVNpWMpxf1wZNpt4y9h10odCNrqnYp1OBzRktckBe3sA==",
      "deprecated": "uuid@10 and below is no longer supported.  For ESM codebases, update to uuid@latest.  For CommonJS codebases, use uuid@11 (but be aware this version will likely be deprecated in 2028).",
      "funding": [
        "https://github.com/sponsors/broofa",
        "https://github.com/sponsors/ctavan"
      ],
      "license": "MIT",
      "bin": {
        "uuid": "dist/bin/uuid"
      }
    },
    "node_modules/@metamask/rpc-errors": {
      "version": "7.0.2",
      "resolved": "https://registry.npmjs.org/@metamask/rpc-errors/-/rpc-errors-7.0.2.tgz",
      "integrity": "sha512-YYYHsVYd46XwY2QZzpGeU4PSdRhHdxnzkB8piWGvJW2xbikZ3R+epAYEL4q/K8bh9JPTucsUdwRFnACor1aOYw==",
      "license": "MIT",
      "dependencies": {
        "@metamask/utils": "^11.0.1",
        "fast-safe-stringify": "^2.0.6"
      },
      "engines": {
        "node": "^18.20 || ^20.17 || >=22"
      }
    },
    "node_modules/@metamask/safe-event-emitter": {
      "version": "3.1.2",
      "resolved": "https://registry.npmjs.org/@metamask/safe-event-emitter/-/safe-event-emitter-3.1.2.tgz",
      "integrity": "sha512-5yb2gMI1BDm0JybZezeoX/3XhPDOtTbcFvpTXM9kxsoZjPZFh4XciqRbpD6N86HYZqWDhEaKUDuOyR0sQHEjMA==",
      "license": "ISC",
      "engines": {
        "node": ">=12.0.0"
      }
    },
    "node_modules/@metamask/sdk": {
      "version": "0.33.1",
      "resolved": "https://registry.npmjs.org/@metamask/sdk/-/sdk-0.33.1.tgz",
      "integrity": "sha512-1mcOQVGr9rSrVcbKPNVzbZ8eCl1K0FATsYH3WJ/MH4WcZDWGECWrXJPNMZoEAkLxWiMe8jOQBumg2pmcDa9zpQ==",
      "deprecated": "No longer maintained, superseded by https://docs.metamask.io/metamask-connect",
      "dependencies": {
        "@babel/runtime": "^7.26.0",
        "@metamask/onboarding": "^1.0.1",
        "@metamask/providers": "16.1.0",
        "@metamask/sdk-analytics": "0.0.5",
        "@metamask/sdk-communication-layer": "0.33.1",
        "@metamask/sdk-install-modal-web": "0.32.1",
        "@paulmillr/qr": "^0.2.1",
        "bowser": "^2.9.0",
        "cross-fetch": "^4.0.0",
        "debug": "4.3.4",
        "eciesjs": "^0.4.11",
        "eth-rpc-errors": "^4.0.3",
        "eventemitter2": "^6.4.9",
        "obj-multiplex": "^1.0.0",
        "pump": "^3.0.0",
        "readable-stream": "^3.6.2",
        "socket.io-client": "^4.5.1",
        "tslib": "^2.6.0",
        "util": "^0.12.4",
        "uuid": "^8.3.2"
      }
    },
    "node_modules/@metamask/sdk-analytics": {
      "version": "0.0.5",
      "resolved": "https://registry.npmjs.org/@metamask/sdk-analytics/-/sdk-analytics-0.0.5.tgz",
      "integrity": "sha512-fDah+keS1RjSUlC8GmYXvx6Y26s3Ax1U9hGpWb6GSY5SAdmTSIqp2CvYy6yW0WgLhnYhW+6xERuD0eVqV63QIQ==",
      "deprecated": "No longer maintained, superseded by @metamask/connect-analytics",
      "license": "MIT",
      "dependencies": {
        "openapi-fetch": "^0.13.5"
      }
    },
    "node_modules/@metamask/sdk-communication-layer": {
      "version": "0.33.1",
      "resolved": "https://registry.npmjs.org/@metamask/sdk-communication-layer/-/sdk-communication-layer-0.33.1.tgz",
      "integrity": "sha512-0bI9hkysxcfbZ/lk0T2+aKVo1j0ynQVTuB3sJ5ssPWlz+Z3VwveCkP1O7EVu1tsVVCb0YV5WxK9zmURu2FIiaA==",
      "deprecated": "No longer maintained, superseded by https://docs.metamask.io/metamask-connect",
      "dependencies": {
        "@metamask/sdk-analytics": "0.0.5",
        "bufferutil": "^4.0.8",
        "date-fns": "^2.29.3",
        "debug": "4.3.4",
        "utf-8-validate": "^5.0.2",
        "uuid": "^8.3.2"
      },
      "peerDependencies": {
        "cross-fetch": "^4.0.0",
        "eciesjs": "*",
        "eventemitter2": "^6.4.9",
        "readable-stream": "^3.6.2",
        "socket.io-client": "^4.5.1"
      }
    },
    "node_modules/@metamask/sdk-communication-layer/node_modules/debug": {
      "version": "4.3.4",
      "resolved": "https://registry.npmjs.org/debug/-/debug-4.3.4.tgz",
      "integrity": "sha512-PRWFHuSU3eDtQJPvnNY7Jcket1j0t5OuOsFzPPzsekD52Zl8qUfFIPEiswXqIvHWGVHOgX+7G/vCNNhehwxfkQ==",
      "license": "MIT",
      "dependencies": {
        "ms": "2.1.2"
      },
      "engines": {
        "node": ">=6.0"
      },
      "peerDependenciesMeta": {
        "supports-color": {
          "optional": true
        }
      }
    },
    "node_modules/@metamask/sdk-communication-layer/node_modules/ms": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/ms/-/ms-2.1.2.tgz",
      "integrity": "sha512-sGkPx+VjMtmA6MX27oA4FBFELFCZZ4S4XqeGOXCv68tT+jb3vk/RyaKWP0PTKyWtmLSM0b+adUTEvbs1PEaH2w==",
      "license": "MIT"
    },
    "node_modules/@metamask/sdk-install-modal-web": {
      "version": "0.32.1",
      "resolved": "https://registry.npmjs.org/@metamask/sdk-install-modal-web/-/sdk-install-modal-web-0.32.1.tgz",
      "integrity": "sha512-MGmAo6qSjf1tuYXhCu2EZLftq+DSt5Z7fsIKr2P+lDgdTPWgLfZB1tJKzNcwKKOdf6q9Qmmxn7lJuI/gq5LrKw==",
      "deprecated": "No longer maintained, superseded by https://docs.metamask.io/metamask-connect",
      "dependencies": {
        "@paulmillr/qr": "^0.2.1"
      }
    },
    "node_modules/@metamask/sdk/node_modules/debug": {
      "version": "4.3.4",
      "resolved": "https://registry.npmjs.org/debug/-/debug-4.3.4.tgz",
      "integrity": "sha512-PRWFHuSU3eDtQJPvnNY7Jcket1j0t5OuOsFzPPzsekD52Zl8qUfFIPEiswXqIvHWGVHOgX+7G/vCNNhehwxfkQ==",
      "license": "MIT",
      "dependencies": {
        "ms": "2.1.2"
      },
      "engines": {
        "node": ">=6.0"
      },
      "peerDependenciesMeta": {
        "supports-color": {
          "optional": true
        }
      }
    },
    "node_modules/@metamask/sdk/node_modules/ms": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/ms/-/ms-2.1.2.tgz",
      "integrity": "sha512-sGkPx+VjMtmA6MX27oA4FBFELFCZZ4S4XqeGOXCv68tT+jb3vk/RyaKWP0PTKyWtmLSM0b+adUTEvbs1PEaH2w==",
      "license": "MIT"
    },
    "node_modules/@metamask/superstruct": {
      "version": "3.2.1",
      "resolved": "https://registry.npmjs.org/@metamask/superstruct/-/superstruct-3.2.1.tgz",
      "integrity": "sha512-fLgJnDOXFmuVlB38rUN5SmU7hAFQcCjrg3Vrxz67KTY7YHFnSNEKvX4avmEBdOI0yTCxZjwMCFEqsC8k2+Wd3g==",
      "license": "MIT",
      "engines": {
        "node": ">=16.0.0"
      }
    },
    "node_modules/@metamask/utils": {
      "version": "11.11.0",
      "resolved": "https://registry.npmjs.org/@metamask/utils/-/utils-11.11.0.tgz",
      "integrity": "sha512-0nF2CWjWQr/m0Y2t2lJnBTU1/CZPPTvKvcESLplyWe/tyeb8zFOi/FeneDmaFnML6LYRIGZU6f+xR0jKAIUZfw==",
      "license": "ISC",
      "dependencies": {
        "@ethereumjs/tx": "^4.2.0",
        "@metamask/superstruct": "^3.1.0",
        "@noble/hashes": "^1.3.1",
        "@scure/base": "^1.1.3",
        "@types/debug": "^4.1.7",
        "@types/lodash": "^4.17.20",
        "debug": "^4.3.4",
        "lodash": "^4.17.21",
        "pony-cause": "^2.1.10",
        "semver": "^7.5.4",
        "uuid": "^9.0.1"
      },
      "engines": {
        "node": "^18.18 || ^20.14 || >=22"
      }
    },
    "node_modules/@metamask/utils/node_modules/semver": {
      "version": "7.7.4",
      "resolved": "https://registry.npmjs.org/semver/-/semver-7.7.4.tgz",
      "integrity": "sha512-vFKC2IEtQnVhpT78h1Yp8wzwrf8CM+MzKMHGJZfBtzhZNycRFnXsHk6E5TxIkkMsgNS7mdX3AGB7x2QM2di4lA==",
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/@metamask/utils/node_modules/uuid": {
      "version": "9.0.1",
      "resolved": "https://registry.npmjs.org/uuid/-/uuid-9.0.1.tgz",
      "integrity": "sha512-b+1eJOlsR9K8HJpow9Ok3fiWOWSIcIzXodvv0rQjVoOVNpWMpxf1wZNpt4y9h10odCNrqnYp1OBzRktckBe3sA==",
      "deprecated": "uuid@10 and below is no longer supported.  For ESM codebases, update to uuid@latest.  For CommonJS codebases, use uuid@11 (but be aware this version will likely be deprecated in 2028).",
      "funding": [
        "https://github.com/sponsors/broofa",
        "https://github.com/sponsors/ctavan"
      ],
      "license": "MIT",
      "bin": {
        "uuid": "dist/bin/uuid"
      }
    },
    "node_modules/@noble/ciphers": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/@noble/ciphers/-/ciphers-1.2.1.tgz",
      "integrity": "sha512-rONPWMC7PeExE077uLE4oqWrZ1IvAfz3oH9LibVAcVCopJiA9R62uavnbEzdkVmJYI6M6Zgkbeb07+tWjlq2XA==",
      "license": "MIT",
      "engines": {
        "node": "^14.21.3 || >=16"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@noble/curves": {
      "version": "1.9.7",
      "resolved": "https://registry.npmjs.org/@noble/curves/-/curves-1.9.7.tgz",
      "integrity": "sha512-gbKGcRUYIjA3/zCCNaWDciTMFI0dCkvou3TL8Zmy5Nc7sJ47a0jtOeZoTaMxkuqRo9cRhjOdZJXegxYE5FN/xw==",
      "license": "MIT",
      "dependencies": {
        "@noble/hashes": "1.8.0"
      },
      "engines": {
        "node": "^14.21.3 || >=16"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@noble/hashes": {
      "version": "1.8.0",
      "resolved": "https://registry.npmjs.org/@noble/hashes/-/hashes-1.8.0.tgz",
      "integrity": "sha512-jCs9ldd7NwzpgXDIf6P3+NrHh9/sD6CQdxHyjQI+h/6rDNo88ypBxxz45UDuZHz9r3tNz7N/VInSVoVdtXEI4A==",
      "license": "MIT",
      "engines": {
        "node": "^14.21.3 || >=16"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@openzeppelin/contracts": {
      "version": "5.6.1",
      "resolved": "https://registry.npmjs.org/@openzeppelin/contracts/-/contracts-5.6.1.tgz",
      "integrity": "sha512-Ly6SlsVJ3mj+b18W3R8gNufB7dTICT105fJhodGAGgyC2oqnBAhqSiNDJ8V8DLY05cCz81GLI0CU5vNYA1EC/w==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@paulmillr/qr": {
      "version": "0.2.1",
      "resolved": "https://registry.npmjs.org/@paulmillr/qr/-/qr-0.2.1.tgz",
      "integrity": "sha512-IHnV6A+zxU7XwmKFinmYjUcwlyK9+xkG3/s9KcQhI9BjQKycrJ1JRO+FbNYPwZiPKW3je/DR0k7w8/gLa5eaxQ==",
      "deprecated": "The package is now available as \"qr\": npm install qr",
      "license": "(MIT OR Apache-2.0)",
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@pinojs/redact": {
      "version": "0.4.0",
      "resolved": "https://registry.npmjs.org/@pinojs/redact/-/redact-0.4.0.tgz",
      "integrity": "sha512-k2ENnmBugE/rzQfEcdWHcCY+/FM3VLzH9cYEsbdsoqrvzAKRhUZeRNhAZvB8OitQJ1TBed3yqWtdjzS6wJKBwg==",
      "license": "MIT"
    },
    "node_modules/@prisma/client": {
      "version": "6.19.3",
      "resolved": "https://registry.npmjs.org/@prisma/client/-/client-6.19.3.tgz",
      "integrity": "sha512-mKq3jQFhjvko5LTJFHGilsuQs+W+T3Gm451NzuTDGQxwCzwXHYnIu2zGkRoW+Exq3Rob7yp2MfzSrdIiZVhrBg==",
      "hasInstallScript": true,
      "license": "Apache-2.0",
      "engines": {
        "node": ">=18.18"
      },
      "peerDependencies": {
        "prisma": "*",
        "typescript": ">=5.1.0"
      },
      "peerDependenciesMeta": {
        "prisma": {
          "optional": true
        },
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@prisma/config": {
      "version": "6.19.3",
      "resolved": "https://registry.npmjs.org/@prisma/config/-/config-6.19.3.tgz",
      "integrity": "sha512-CBPT44BjlQxEt8kiMEauji2WHTDoVBOKl7UlewXmUgBPnr/oPRZC3psci5chJnYmH0ivEIog2OU9PGWoki3DLQ==",
      "devOptional": true,
      "license": "Apache-2.0",
      "dependencies": {
        "c12": "3.1.0",
        "deepmerge-ts": "7.1.5",
        "effect": "3.21.0",
        "empathic": "2.0.0"
      }
    },
    "node_modules/@prisma/debug": {
      "version": "6.19.3",
      "resolved": "https://registry.npmjs.org/@prisma/debug/-/debug-6.19.3.tgz",
      "integrity": "sha512-ljkJ+SgpXNktLG0Q/n4JGYCkKf0f8oYLyjImS2I8e2q2WCfdRRtWER062ZV/ixaNP2M2VKlWXVJiGzZaUgbKZw==",
      "devOptional": true,
      "license": "Apache-2.0"
    },
    "node_modules/@prisma/engines": {
      "version": "6.19.3",
      "resolved": "https://registry.npmjs.org/@prisma/engines/-/engines-6.19.3.tgz",
      "integrity": "sha512-RSYxtlYFl5pJ8ZePgMv0lZ9IzVCOdTPOegrs2qcbAEFrBI1G33h6wyC9kjQvo0DnYEhEVY0X4LsuFHXLKQk88g==",
      "devOptional": true,
      "hasInstallScript": true,
      "license": "Apache-2.0",
      "dependencies": {
        "@prisma/debug": "6.19.3",
        "@prisma/engines-version": "7.1.1-3.c2990dca591cba766e3b7ef5d9e8a84796e47ab7",
        "@prisma/fetch-engine": "6.19.3",
        "@prisma/get-platform": "6.19.3"
      }
    },
    "node_modules/@prisma/engines-version": {
      "version": "7.1.1-3.c2990dca591cba766e3b7ef5d9e8a84796e47ab7",
      "resolved": "https://registry.npmjs.org/@prisma/engines-version/-/engines-version-7.1.1-3.c2990dca591cba766e3b7ef5d9e8a84796e47ab7.tgz",
      "integrity": "sha512-03bgb1VD5gvuumNf+7fVGBzfpJPjmqV423l/WxsWk2cNQ42JD0/SsFBPhN6z8iAvdHs07/7ei77SKu7aZfq8bA==",
      "devOptional": true,
      "license": "Apache-2.0"
    },
    "node_modules/@prisma/fetch-engine": {
      "version": "6.19.3",
      "resolved": "https://registry.npmjs.org/@prisma/fetch-engine/-/fetch-engine-6.19.3.tgz",
      "integrity": "sha512-tKtl/qco9Nt7LU5iKhpultD8O4vMCZcU2CHjNTnRrL1QvSUr5W/GcyFPjNL87GtRrwBc7ubXXD9xy4EvLvt8JA==",
      "devOptional": true,
      "license": "Apache-2.0",
      "dependencies": {
        "@prisma/debug": "6.19.3",
        "@prisma/engines-version": "7.1.1-3.c2990dca591cba766e3b7ef5d9e8a84796e47ab7",
        "@prisma/get-platform": "6.19.3"
      }
    },
    "node_modules/@prisma/get-platform": {
      "version": "6.19.3",
      "resolved": "https://registry.npmjs.org/@prisma/get-platform/-/get-platform-6.19.3.tgz",
      "integrity": "sha512-xFj1VcJ1N3MKooOQAGO0W5tsd0W2QzIvW7DD7c/8H14Zmp4jseeWAITm+w2LLoLrlhoHdPPh0NMZ8mfL6puoHA==",
      "devOptional": true,
      "license": "Apache-2.0",
      "dependencies": {
        "@prisma/debug": "6.19.3"
      }
    },
    "node_modules/@react-dnd/asap": {
      "version": "5.0.2",
      "resolved": "https://registry.npmjs.org/@react-dnd/asap/-/asap-5.0.2.tgz",
      "integrity": "sha512-WLyfoHvxhs0V9U+GTsGilGgf2QsPl6ZZ44fnv0/b8T3nQyvzxidxsg/ZltbWssbsRDlYW8UKSQMTGotuTotZ6A==",
      "license": "MIT"
    },
    "node_modules/@react-dnd/invariant": {
      "version": "4.0.2",
      "resolved": "https://registry.npmjs.org/@react-dnd/invariant/-/invariant-4.0.2.tgz",
      "integrity": "sha512-xKCTqAK/FFauOM9Ta2pswIyT3D8AQlfrYdOi/toTPEhqCuAs1v5tcJ3Y08Izh1cJ5Jchwy9SeAXmMg6zrKs2iw==",
      "license": "MIT"
    },
    "node_modules/@react-dnd/shallowequal": {
      "version": "4.0.2",
      "resolved": "https://registry.npmjs.org/@react-dnd/shallowequal/-/shallowequal-4.0.2.tgz",
      "integrity": "sha512-/RVXdLvJxLg4QKvMoM5WlwNR9ViO9z8B/qPcc+C0Sa/teJY7QG7kJ441DwzOjMYEY7GmU4dj5EcGHIkKZiQZCA==",
      "license": "MIT"
    },
    "node_modules/@reown/appkit": {
      "version": "1.7.8",
      "resolved": "https://registry.npmjs.org/@reown/appkit/-/appkit-1.7.8.tgz",
      "integrity": "sha512-51kTleozhA618T1UvMghkhKfaPcc9JlKwLJ5uV+riHyvSoWPKPRIa5A6M1Wano5puNyW0s3fwywhyqTHSilkaA==",
      "license": "Apache-2.0",
      "dependencies": {
        "@reown/appkit-common": "1.7.8",
        "@reown/appkit-controllers": "1.7.8",
        "@reown/appkit-pay": "1.7.8",
        "@reown/appkit-polyfills": "1.7.8",
        "@reown/appkit-scaffold-ui": "1.7.8",
        "@reown/appkit-ui": "1.7.8",
        "@reown/appkit-utils": "1.7.8",
        "@reown/appkit-wallet": "1.7.8",
        "@walletconnect/types": "2.21.0",
        "@walletconnect/universal-provider": "2.21.0",
        "bs58": "6.0.0",
        "valtio": "1.13.2",
        "viem": ">=2.29.0"
      }
    },
    "node_modules/@reown/appkit-common": {
      "version": "1.7.8",
      "resolved": "https://registry.npmjs.org/@reown/appkit-common/-/appkit-common-1.7.8.tgz",
      "integrity": "sha512-ridIhc/x6JOp7KbDdwGKY4zwf8/iK8EYBl+HtWrruutSLwZyVi5P8WaZa+8iajL6LcDcDF7LoyLwMTym7SRuwQ==",
      "license": "Apache-2.0",
      "dependencies": {
        "big.js": "6.2.2",
        "dayjs": "1.11.13",
        "viem": ">=2.29.0"
      }
    },
    "node_modules/@reown/appkit-controllers": {
      "version": "1.7.8",
      "resolved": "https://registry.npmjs.org/@reown/appkit-controllers/-/appkit-controllers-1.7.8.tgz",
      "integrity": "sha512-IdXlJlivrlj6m63VsGLsjtPHHsTWvKGVzWIP1fXZHVqmK+rZCBDjCi9j267Rb9/nYRGHWBtlFQhO8dK35WfeDA==",
      "license": "Apache-2.0",
      "dependencies": {
        "@reown/appkit-common": "1.7.8",
        "@reown/appkit-wallet": "1.7.8",
        "@walletconnect/universal-provider": "2.21.0",
        "valtio": "1.13.2",
        "viem": ">=2.29.0"
      }
    },
    "node_modules/@reown/appkit-controllers/node_modules/@noble/curves": {
      "version": "1.8.1",
      "resolved": "https://registry.npmjs.org/@noble/curves/-/curves-1.8.1.tgz",
      "integrity": "sha512-warwspo+UYUPep0Q+vtdVB4Ugn8GGQj8iyB3gnRWsztmUHTI3S1nhdiWNsPUGL0vud7JlRRk1XEu7Lq1KGTnMQ==",
      "license": "MIT",
      "dependencies": {
        "@noble/hashes": "1.7.1"
      },
      "engines": {
        "node": "^14.21.3 || >=16"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@reown/appkit-controllers/node_modules/@noble/hashes": {
      "version": "1.7.1",
      "resolved": "https://registry.npmjs.org/@noble/hashes/-/hashes-1.7.1.tgz",
      "integrity": "sha512-B8XBPsn4vT/KJAGqDzbwztd+6Yte3P4V7iafm24bxgDe/mlRuK6xmWPuCNrKt2vDafZ8MfJLlchDG/vYafQEjQ==",
      "license": "MIT",
      "engines": {
        "node": "^14.21.3 || >=16"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@reown/appkit-controllers/node_modules/@scure/bip32": {
      "version": "1.6.2",
      "resolved": "https://registry.npmjs.org/@scure/bip32/-/bip32-1.6.2.tgz",
      "integrity": "sha512-t96EPDMbtGgtb7onKKqxRLfE5g05k7uHnHRM2xdE6BP/ZmxaLtPek4J4KfVn/90IQNrU1IOAqMgiDtUdtbe3nw==",
      "license": "MIT",
      "dependencies": {
        "@noble/curves": "~1.8.1",
        "@noble/hashes": "~1.7.1",
        "@scure/base": "~1.2.2"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@reown/appkit-controllers/node_modules/@scure/bip39": {
      "version": "1.5.4",
      "resolved": "https://registry.npmjs.org/@scure/bip39/-/bip39-1.5.4.tgz",
      "integrity": "sha512-TFM4ni0vKvCfBpohoh+/lY05i9gRbSwXWngAsF4CABQxoaOHijxuaZ2R6cStDQ5CHtHO9aGJTr4ksVJASRRyMA==",
      "license": "MIT",
      "dependencies": {
        "@noble/hashes": "~1.7.1",
        "@scure/base": "~1.2.4"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@reown/appkit-controllers/node_modules/@walletconnect/core": {
      "version": "2.21.0",
      "resolved": "https://registry.npmjs.org/@walletconnect/core/-/core-2.21.0.tgz",
      "integrity": "sha512-o6R7Ua4myxR8aRUAJ1z3gT9nM+jd2B2mfamu6arzy1Cc6vi10fIwFWb6vg3bC8xJ6o9H3n/cN5TOW3aA9Y1XVw==",
      "license": "Apache-2.0",
      "dependencies": {
        "@walletconnect/heartbeat": "1.2.2",
        "@walletconnect/jsonrpc-provider": "1.0.14",
        "@walletconnect/jsonrpc-types": "1.0.4",
        "@walletconnect/jsonrpc-utils": "1.0.8",
        "@walletconnect/jsonrpc-ws-connection": "1.0.16",
        "@walletconnect/keyvaluestorage": "1.1.1",
        "@walletconnect/logger": "2.1.2",
        "@walletconnect/relay-api": "1.0.11",
        "@walletconnect/relay-auth": "1.1.0",
        "@walletconnect/safe-json": "1.0.2",
        "@walletconnect/time": "1.0.2",
        "@walletconnect/types": "2.21.0",
        "@walletconnect/utils": "2.21.0",
        "@walletconnect/window-getters": "1.0.1",
        "es-toolkit": "1.33.0",
        "events": "3.3.0",
        "uint8arrays": "3.1.0"
      },
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@reown/appkit-controllers/node_modules/@walletconnect/keyvaluestorage": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@walletconnect/keyvaluestorage/-/keyvaluestorage-1.1.1.tgz",
      "integrity": "sha512-V7ZQq2+mSxAq7MrRqDxanTzu2RcElfK1PfNYiaVnJgJ7Q7G7hTVwF8voIBx92qsRyGHZihrwNPHuZd1aKkd0rA==",
      "license": "MIT",
      "dependencies": {
        "@walletconnect/safe-json": "^1.0.1",
        "idb-keyval": "^6.2.1",
        "unstorage": "^1.9.0"
      },
      "peerDependencies": {
        "@react-native-async-storage/async-storage": "1.x"
      },
      "peerDependenciesMeta": {
        "@react-native-async-storage/async-storage": {
          "optional": true
        }
      }
    },
    "node_modules/@reown/appkit-controllers/node_modules/@walletconnect/sign-client": {
      "version": "2.21.0",
      "resolved": "https://registry.npmjs.org/@walletconnect/sign-client/-/sign-client-2.21.0.tgz",
      "integrity": "sha512-z7h+PeLa5Au2R591d/8ZlziE0stJvdzP9jNFzFolf2RG/OiXulgFKum8PrIyXy+Rg2q95U9nRVUF9fWcn78yBA==",
      "deprecated": "Reliability and performance improvements. See: https://github.com/WalletConnect/walletconnect-monorepo/releases",
      "license": "Apache-2.0",
      "dependencies": {
        "@walletconnect/core": "2.21.0",
        "@walletconnect/events": "1.0.1",
        "@walletconnect/heartbeat": "1.2.2",
        "@walletconnect/jsonrpc-utils": "1.0.8",
        "@walletconnect/logger": "2.1.2",
        "@walletconnect/time": "1.0.2",
        "@walletconnect/types": "2.21.0",
        "@walletconnect/utils": "2.21.0",
        "events": "3.3.0"
      }
    },
    "node_modules/@reown/appkit-controllers/node_modules/@walletconnect/types": {
      "version": "2.21.0",
      "resolved": "https://registry.npmjs.org/@walletconnect/types/-/types-2.21.0.tgz",
      "integrity": "sha512-ll+9upzqt95ZBWcfkOszXZkfnpbJJ2CmxMfGgE5GmhdxxxCcO5bGhXkI+x8OpiS555RJ/v/sXJYMSOLkmu4fFw==",
      "license": "Apache-2.0",
      "dependencies": {
        "@walletconnect/events": "1.0.1",
        "@walletconnect/heartbeat": "1.2.2",
        "@walletconnect/jsonrpc-types": "1.0.4",
        "@walletconnect/keyvaluestorage": "1.1.1",
        "@walletconnect/logger": "2.1.2",
        "events": "3.3.0"
      }
    },
    "node_modules/@reown/appkit-controllers/node_modules/@walletconnect/universal-provider": {
      "version": "2.21.0",
      "resolved": "https://registry.npmjs.org/@walletconnect/universal-provider/-/universal-provider-2.21.0.tgz",
      "integrity": "sha512-mtUQvewt+X0VBQay/xOJBvxsB3Xsm1lTwFjZ6WUwSOTR1X+FNb71hSApnV5kbsdDIpYPXeQUbGt2se1n5E5UBg==",
      "deprecated": "Reliability and performance improvements. See: https://github.com/WalletConnect/walletconnect-monorepo/releases",
      "license": "Apache-2.0",
      "dependencies": {
        "@walletconnect/events": "1.0.1",
        "@walletconnect/jsonrpc-http-connection": "1.0.8",
        "@walletconnect/jsonrpc-provider": "1.0.14",
        "@walletconnect/jsonrpc-types": "1.0.4",
        "@walletconnect/jsonrpc-utils": "1.0.8",
        "@walletconnect/keyvaluestorage": "1.1.1",
        "@walletconnect/logger": "2.1.2",
        "@walletconnect/sign-client": "2.21.0",
        "@walletconnect/types": "2.21.0",
        "@walletconnect/utils": "2.21.0",
        "es-toolkit": "1.33.0",
        "events": "3.3.0"
      }
    },
    "node_modules/@reown/appkit-controllers/node_modules/@walletconnect/utils": {
      "version": "2.21.0",
      "resolved": "https://registry.npmjs.org/@walletconnect/utils/-/utils-2.21.0.tgz",
      "integrity": "sha512-zfHLiUoBrQ8rP57HTPXW7rQMnYxYI4gT9yTACxVW6LhIFROTF6/ytm5SKNoIvi4a5nX5dfXG4D9XwQUCu8Ilig==",
      "license": "Apache-2.0",
      "dependencies": {
        "@noble/ciphers": "1.2.1",
        "@noble/curves": "1.8.1",
        "@noble/hashes": "1.7.1",
        "@walletconnect/jsonrpc-utils": "1.0.8",
        "@walletconnect/keyvaluestorage": "1.1.1",
        "@walletconnect/relay-api": "1.0.11",
        "@walletconnect/relay-auth": "1.1.0",
        "@walletconnect/safe-json": "1.0.2",
        "@walletconnect/time": "1.0.2",
        "@walletconnect/types": "2.21.0",
        "@walletconnect/window-getters": "1.0.1",
        "@walletconnect/window-metadata": "1.0.1",
        "bs58": "6.0.0",
        "detect-browser": "5.3.0",
        "query-string": "7.1.3",
        "uint8arrays": "3.1.0",
        "viem": "2.23.2"
      }
    },
    "node_modules/@reown/appkit-controllers/node_modules/@walletconnect/utils/node_modules/viem": {
      "version": "2.23.2",
      "resolved": "https://registry.npmjs.org/viem/-/viem-2.23.2.tgz",
      "integrity": "sha512-NVmW/E0c5crMOtbEAqMF0e3NmvQykFXhLOc/CkLIXOlzHSA6KXVz3CYVmaKqBF8/xtjsjHAGjdJN3Ru1kFJLaA==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/wevm"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "@noble/curves": "1.8.1",
        "@noble/hashes": "1.7.1",
        "@scure/bip32": "1.6.2",
        "@scure/bip39": "1.5.4",
        "abitype": "1.0.8",
        "isows": "1.0.6",
        "ox": "0.6.7",
        "ws": "8.18.0"
      },
      "peerDependencies": {
        "typescript": ">=5.0.4"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@reown/appkit-controllers/node_modules/abitype": {
      "version": "1.0.8",
      "resolved": "https://registry.npmjs.org/abitype/-/abitype-1.0.8.tgz",
      "integrity": "sha512-ZeiI6h3GnW06uYDLx0etQtX/p8E24UaHHBj57RSjK7YBFe7iuVn07EDpOeP451D06sF27VOz9JJPlIKJmXgkEg==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/wevm"
      },
      "peerDependencies": {
        "typescript": ">=5.0.4",
        "zod": "^3 >=3.22.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        },
        "zod": {
          "optional": true
        }
      }
    },
    "node_modules/@reown/appkit-controllers/node_modules/chokidar": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/chokidar/-/chokidar-5.0.0.tgz",
      "integrity": "sha512-TQMmc3w+5AxjpL8iIiwebF73dRDF4fBIieAqGn9RGCWaEVwQ6Fb2cGe31Yns0RRIzii5goJ1Y7xbMwo1TxMplw==",
      "license": "MIT",
      "dependencies": {
        "readdirp": "^5.0.0"
      },
      "engines": {
        "node": ">= 20.19.0"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@reown/appkit-controllers/node_modules/isows": {
      "version": "1.0.6",
      "resolved": "https://registry.npmjs.org/isows/-/isows-1.0.6.tgz",
      "integrity": "sha512-lPHCayd40oW98/I0uvgaHKWCSvkzY27LjWLbtzOm64yQ+G3Q5npjjbdppU65iZXkK1Zt+kH9pfegli0AYfwYYw==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/wevm"
        }
      ],
      "license": "MIT",
      "peerDependencies": {
        "ws": "*"
      }
    },
    "node_modules/@reown/appkit-controllers/node_modules/lru-cache": {
      "version": "11.3.5",
      "resolved": "https://registry.npmjs.org/lru-cache/-/lru-cache-11.3.5.tgz",
      "integrity": "sha512-NxVFwLAnrd9i7KUBxC4DrUhmgjzOs+1Qm50D3oF1/oL+r1NpZ4gA7xvG0/zJ8evR7zIKn4vLf7qTNduWFtCrRw==",
      "license": "BlueOak-1.0.0",
      "engines": {
        "node": "20 || >=22"
      }
    },
    "node_modules/@reown/appkit-controllers/node_modules/ox": {
      "version": "0.6.7",
      "resolved": "https://registry.npmjs.org/ox/-/ox-0.6.7.tgz",
      "integrity": "sha512-17Gk/eFsFRAZ80p5eKqv89a57uXjd3NgIf1CaXojATPBuujVc/fQSVhBeAU9JCRB+k7J50WQAyWTxK19T9GgbA==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/wevm"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "@adraffy/ens-normalize": "^1.10.1",
        "@noble/curves": "^1.6.0",
        "@noble/hashes": "^1.5.0",
        "@scure/bip32": "^1.5.0",
        "@scure/bip39": "^1.4.0",
        "abitype": "^1.0.6",
        "eventemitter3": "5.0.1"
      },
      "peerDependencies": {
        "typescript": ">=5.4.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@reown/appkit-controllers/node_modules/readdirp": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/readdirp/-/readdirp-5.0.0.tgz",
      "integrity": "sha512-9u/XQ1pvrQtYyMpZe7DXKv2p5CNvyVwzUB6uhLAnQwHMSgKMBR62lc7AHljaeteeHXn11XTAaLLUVZYVZyuRBQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 20.19.0"
      },
      "funding": {
        "type": "individual",
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@reown/appkit-controllers/node_modules/unstorage": {
      "version": "1.17.5",
      "resolved": "https://registry.npmjs.org/unstorage/-/unstorage-1.17.5.tgz",
      "integrity": "sha512-0i3iqvRfx29hkNntHyQvJTpf5W9dQ9ZadSoRU8+xVlhVtT7jAX57fazYO9EHvcRCfBCyi5YRya7XCDOsbTgkPg==",
      "license": "MIT",
      "dependencies": {
        "anymatch": "^3.1.3",
        "chokidar": "^5.0.0",
        "destr": "^2.0.5",
        "h3": "^1.15.10",
        "lru-cache": "^11.2.7",
        "node-fetch-native": "^1.6.7",
        "ofetch": "^1.5.1",
        "ufo": "^1.6.3"
      },
      "peerDependencies": {
        "@azure/app-configuration": "^1.8.0",
        "@azure/cosmos": "^4.2.0",
        "@azure/data-tables": "^13.3.0",
        "@azure/identity": "^4.6.0",
        "@azure/keyvault-secrets": "^4.9.0",
        "@azure/storage-blob": "^12.26.0",
        "@capacitor/preferences": "^6 || ^7 || ^8",
        "@deno/kv": ">=0.9.0",
        "@netlify/blobs": "^6.5.0 || ^7.0.0 || ^8.1.0 || ^9.0.0 || ^10.0.0",
        "@planetscale/database": "^1.19.0",
        "@upstash/redis": "^1.34.3",
        "@vercel/blob": ">=0.27.1",
        "@vercel/functions": "^2.2.12 || ^3.0.0",
        "@vercel/kv": "^1 || ^2 || ^3",
        "aws4fetch": "^1.0.20",
        "db0": ">=0.2.1",
        "idb-keyval": "^6.2.1",
        "ioredis": "^5.4.2",
        "uploadthing": "^7.4.4"
      },
      "peerDependenciesMeta": {
        "@azure/app-configuration": {
          "optional": true
        },
        "@azure/cosmos": {
          "optional": true
        },
        "@azure/data-tables": {
          "optional": true
        },
        "@azure/identity": {
          "optional": true
        },
        "@azure/keyvault-secrets": {
          "optional": true
        },
        "@azure/storage-blob": {
          "optional": true
        },
        "@capacitor/preferences": {
          "optional": true
        },
        "@deno/kv": {
          "optional": true
        },
        "@netlify/blobs": {
          "optional": true
        },
        "@planetscale/database": {
          "optional": true
        },
        "@upstash/redis": {
          "optional": true
        },
        "@vercel/blob": {
          "optional": true
        },
        "@vercel/functions": {
          "optional": true
        },
        "@vercel/kv": {
          "optional": true
        },
        "aws4fetch": {
          "optional": true
        },
        "db0": {
          "optional": true
        },
        "idb-keyval": {
          "optional": true
        },
        "ioredis": {
          "optional": true
        },
        "uploadthing": {
          "optional": true
        }
      }
    },
    "node_modules/@reown/appkit-controllers/node_modules/ws": {
      "version": "8.18.0",
      "resolved": "https://registry.npmjs.org/ws/-/ws-8.18.0.tgz",
      "integrity": "sha512-8VbfWfHLbbwu3+N6OKsOMpBdT4kXPDDB9cJk2bJ6mh9ucxdlnNvH1e+roYkKmN9Nxw2yjz7VzeO9oOz2zJ04Pw==",
      "license": "MIT",
      "engines": {
        "node": ">=10.0.0"
      },
      "peerDependencies": {
        "bufferutil": "^4.0.1",
        "utf-8-validate": ">=5.0.2"
      },
      "peerDependenciesMeta": {
        "bufferutil": {
          "optional": true
        },
        "utf-8-validate": {
          "optional": true
        }
      }
    },
    "node_modules/@reown/appkit-pay": {
      "version": "1.7.8",
      "resolved": "https://registry.npmjs.org/@reown/appkit-pay/-/appkit-pay-1.7.8.tgz",
      "integrity": "sha512-OSGQ+QJkXx0FEEjlpQqIhT8zGJKOoHzVnyy/0QFrl3WrQTjCzg0L6+i91Ad5Iy1zb6V5JjqtfIFpRVRWN4M3pw==",
      "license": "Apache-2.0",
      "dependencies": {
        "@reown/appkit-common": "1.7.8",
        "@reown/appkit-controllers": "1.7.8",
        "@reown/appkit-ui": "1.7.8",
        "@reown/appkit-utils": "1.7.8",
        "lit": "3.3.0",
        "valtio": "1.13.2"
      }
    },
    "node_modules/@reown/appkit-polyfills": {
      "version": "1.7.8",
      "resolved": "https://registry.npmjs.org/@reown/appkit-polyfills/-/appkit-polyfills-1.7.8.tgz",
      "integrity": "sha512-W/kq786dcHHAuJ3IV2prRLEgD/2iOey4ueMHf1sIFjhhCGMynMkhsOhQMUH0tzodPqUgAC494z4bpIDYjwWXaA==",
      "license": "Apache-2.0",
      "dependencies": {
        "buffer": "6.0.3"
      }
    },
    "node_modules/@reown/appkit-scaffold-ui": {
      "version": "1.7.8",
      "resolved": "https://registry.npmjs.org/@reown/appkit-scaffold-ui/-/appkit-scaffold-ui-1.7.8.tgz",
      "integrity": "sha512-RCeHhAwOrIgcvHwYlNWMcIDibdI91waaoEYBGw71inE0kDB8uZbE7tE6DAXJmDkvl0qPh+DqlC4QbJLF1FVYdQ==",
      "license": "Apache-2.0",
      "dependencies": {
        "@reown/appkit-common": "1.7.8",
        "@reown/appkit-controllers": "1.7.8",
        "@reown/appkit-ui": "1.7.8",
        "@reown/appkit-utils": "1.7.8",
        "@reown/appkit-wallet": "1.7.8",
        "lit": "3.3.0"
      }
    },
    "node_modules/@reown/appkit-ui": {
      "version": "1.7.8",
      "resolved": "https://registry.npmjs.org/@reown/appkit-ui/-/appkit-ui-1.7.8.tgz",
      "integrity": "sha512-1hjCKjf6FLMFzrulhl0Y9Vb9Fu4royE+SXCPSWh4VhZhWqlzUFc7kutnZKx8XZFVQH4pbBvY62SpRC93gqoHow==",
      "license": "Apache-2.0",
      "dependencies": {
        "@reown/appkit-common": "1.7.8",
        "@reown/appkit-controllers": "1.7.8",
        "@reown/appkit-wallet": "1.7.8",
        "lit": "3.3.0",
        "qrcode": "1.5.3"
      }
    },
    "node_modules/@reown/appkit-utils": {
      "version": "1.7.8",
      "resolved": "https://registry.npmjs.org/@reown/appkit-utils/-/appkit-utils-1.7.8.tgz",
      "integrity": "sha512-8X7UvmE8GiaoitCwNoB86pttHgQtzy4ryHZM9kQpvjQ0ULpiER44t1qpVLXNM4X35O0v18W0Dk60DnYRMH2WRw==",
      "license": "Apache-2.0",
      "dependencies": {
        "@reown/appkit-common": "1.7.8",
        "@reown/appkit-controllers": "1.7.8",
        "@reown/appkit-polyfills": "1.7.8",
        "@reown/appkit-wallet": "1.7.8",
        "@walletconnect/logger": "2.1.2",
        "@walletconnect/universal-provider": "2.21.0",
        "valtio": "1.13.2",
        "viem": ">=2.29.0"
      },
      "peerDependencies": {
        "valtio": "1.13.2"
      }
    },
    "node_modules/@reown/appkit-utils/node_modules/@noble/curves": {
      "version": "1.8.1",
      "resolved": "https://registry.npmjs.org/@noble/curves/-/curves-1.8.1.tgz",
      "integrity": "sha512-warwspo+UYUPep0Q+vtdVB4Ugn8GGQj8iyB3gnRWsztmUHTI3S1nhdiWNsPUGL0vud7JlRRk1XEu7Lq1KGTnMQ==",
      "license": "MIT",
      "dependencies": {
        "@noble/hashes": "1.7.1"
      },
      "engines": {
        "node": "^14.21.3 || >=16"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@reown/appkit-utils/node_modules/@noble/hashes": {
      "version": "1.7.1",
      "resolved": "https://registry.npmjs.org/@noble/hashes/-/hashes-1.7.1.tgz",
      "integrity": "sha512-B8XBPsn4vT/KJAGqDzbwztd+6Yte3P4V7iafm24bxgDe/mlRuK6xmWPuCNrKt2vDafZ8MfJLlchDG/vYafQEjQ==",
      "license": "MIT",
      "engines": {
        "node": "^14.21.3 || >=16"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@reown/appkit-utils/node_modules/@scure/bip32": {
      "version": "1.6.2",
      "resolved": "https://registry.npmjs.org/@scure/bip32/-/bip32-1.6.2.tgz",
      "integrity": "sha512-t96EPDMbtGgtb7onKKqxRLfE5g05k7uHnHRM2xdE6BP/ZmxaLtPek4J4KfVn/90IQNrU1IOAqMgiDtUdtbe3nw==",
      "license": "MIT",
      "dependencies": {
        "@noble/curves": "~1.8.1",
        "@noble/hashes": "~1.7.1",
        "@scure/base": "~1.2.2"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@reown/appkit-utils/node_modules/@scure/bip39": {
      "version": "1.5.4",
      "resolved": "https://registry.npmjs.org/@scure/bip39/-/bip39-1.5.4.tgz",
      "integrity": "sha512-TFM4ni0vKvCfBpohoh+/lY05i9gRbSwXWngAsF4CABQxoaOHijxuaZ2R6cStDQ5CHtHO9aGJTr4ksVJASRRyMA==",
      "license": "MIT",
      "dependencies": {
        "@noble/hashes": "~1.7.1",
        "@scure/base": "~1.2.4"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@reown/appkit-utils/node_modules/@walletconnect/core": {
      "version": "2.21.0",
      "resolved": "https://registry.npmjs.org/@walletconnect/core/-/core-2.21.0.tgz",
      "integrity": "sha512-o6R7Ua4myxR8aRUAJ1z3gT9nM+jd2B2mfamu6arzy1Cc6vi10fIwFWb6vg3bC8xJ6o9H3n/cN5TOW3aA9Y1XVw==",
      "license": "Apache-2.0",
      "dependencies": {
        "@walletconnect/heartbeat": "1.2.2",
        "@walletconnect/jsonrpc-provider": "1.0.14",
        "@walletconnect/jsonrpc-types": "1.0.4",
        "@walletconnect/jsonrpc-utils": "1.0.8",
        "@walletconnect/jsonrpc-ws-connection": "1.0.16",
        "@walletconnect/keyvaluestorage": "1.1.1",
        "@walletconnect/logger": "2.1.2",
        "@walletconnect/relay-api": "1.0.11",
        "@walletconnect/relay-auth": "1.1.0",
        "@walletconnect/safe-json": "1.0.2",
        "@walletconnect/time": "1.0.2",
        "@walletconnect/types": "2.21.0",
        "@walletconnect/utils": "2.21.0",
        "@walletconnect/window-getters": "1.0.1",
        "es-toolkit": "1.33.0",
        "events": "3.3.0",
        "uint8arrays": "3.1.0"
      },
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@reown/appkit-utils/node_modules/@walletconnect/keyvaluestorage": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@walletconnect/keyvaluestorage/-/keyvaluestorage-1.1.1.tgz",
      "integrity": "sha512-V7ZQq2+mSxAq7MrRqDxanTzu2RcElfK1PfNYiaVnJgJ7Q7G7hTVwF8voIBx92qsRyGHZihrwNPHuZd1aKkd0rA==",
      "license": "MIT",
      "dependencies": {
        "@walletconnect/safe-json": "^1.0.1",
        "idb-keyval": "^6.2.1",
        "unstorage": "^1.9.0"
      },
      "peerDependencies": {
        "@react-native-async-storage/async-storage": "1.x"
      },
      "peerDependenciesMeta": {
        "@react-native-async-storage/async-storage": {
          "optional": true
        }
      }
    },
    "node_modules/@reown/appkit-utils/node_modules/@walletconnect/sign-client": {
      "version": "2.21.0",
      "resolved": "https://registry.npmjs.org/@walletconnect/sign-client/-/sign-client-2.21.0.tgz",
      "integrity": "sha512-z7h+PeLa5Au2R591d/8ZlziE0stJvdzP9jNFzFolf2RG/OiXulgFKum8PrIyXy+Rg2q95U9nRVUF9fWcn78yBA==",
      "deprecated": "Reliability and performance improvements. See: https://github.com/WalletConnect/walletconnect-monorepo/releases",
      "license": "Apache-2.0",
      "dependencies": {
        "@walletconnect/core": "2.21.0",
        "@walletconnect/events": "1.0.1",
        "@walletconnect/heartbeat": "1.2.2",
        "@walletconnect/jsonrpc-utils": "1.0.8",
        "@walletconnect/logger": "2.1.2",
        "@walletconnect/time": "1.0.2",
        "@walletconnect/types": "2.21.0",
        "@walletconnect/utils": "2.21.0",
        "events": "3.3.0"
      }
    },
    "node_modules/@reown/appkit-utils/node_modules/@walletconnect/types": {
      "version": "2.21.0",
      "resolved": "https://registry.npmjs.org/@walletconnect/types/-/types-2.21.0.tgz",
      "integrity": "sha512-ll+9upzqt95ZBWcfkOszXZkfnpbJJ2CmxMfGgE5GmhdxxxCcO5bGhXkI+x8OpiS555RJ/v/sXJYMSOLkmu4fFw==",
      "license": "Apache-2.0",
      "dependencies": {
        "@walletconnect/events": "1.0.1",
        "@walletconnect/heartbeat": "1.2.2",
        "@walletconnect/jsonrpc-types": "1.0.4",
        "@walletconnect/keyvaluestorage": "1.1.1",
        "@walletconnect/logger": "2.1.2",
        "events": "3.3.0"
      }
    },
    "node_modules/@reown/appkit-utils/node_modules/@walletconnect/universal-provider": {
      "version": "2.21.0",
      "resolved": "https://registry.npmjs.org/@walletconnect/universal-provider/-/universal-provider-2.21.0.tgz",
      "integrity": "sha512-mtUQvewt+X0VBQay/xOJBvxsB3Xsm1lTwFjZ6WUwSOTR1X+FNb71hSApnV5kbsdDIpYPXeQUbGt2se1n5E5UBg==",
      "deprecated": "Reliability and performance improvements. See: https://github.com/WalletConnect/walletconnect-monorepo/releases",
      "license": "Apache-2.0",
      "dependencies": {
        "@walletconnect/events": "1.0.1",
        "@walletconnect/jsonrpc-http-connection": "1.0.8",
        "@walletconnect/jsonrpc-provider": "1.0.14",
        "@walletconnect/jsonrpc-types": "1.0.4",
        "@walletconnect/jsonrpc-utils": "1.0.8",
        "@walletconnect/keyvaluestorage": "1.1.1",
        "@walletconnect/logger": "2.1.2",
        "@walletconnect/sign-client": "2.21.0",
        "@walletconnect/types": "2.21.0",
        "@walletconnect/utils": "2.21.0",
        "es-toolkit": "1.33.0",
        "events": "3.3.0"
      }
    },
    "node_modules/@reown/appkit-utils/node_modules/@walletconnect/utils": {
      "version": "2.21.0",
      "resolved": "https://registry.npmjs.org/@walletconnect/utils/-/utils-2.21.0.tgz",
      "integrity": "sha512-zfHLiUoBrQ8rP57HTPXW7rQMnYxYI4gT9yTACxVW6LhIFROTF6/ytm5SKNoIvi4a5nX5dfXG4D9XwQUCu8Ilig==",
      "license": "Apache-2.0",
      "dependencies": {
        "@noble/ciphers": "1.2.1",
        "@noble/curves": "1.8.1",
        "@noble/hashes": "1.7.1",
        "@walletconnect/jsonrpc-utils": "1.0.8",
        "@walletconnect/keyvaluestorage": "1.1.1",
        "@walletconnect/relay-api": "1.0.11",
        "@walletconnect/relay-auth": "1.1.0",
        "@walletconnect/safe-json": "1.0.2",
        "@walletconnect/time": "1.0.2",
        "@walletconnect/types": "2.21.0",
        "@walletconnect/window-getters": "1.0.1",
        "@walletconnect/window-metadata": "1.0.1",
        "bs58": "6.0.0",
        "detect-browser": "5.3.0",
        "query-string": "7.1.3",
        "uint8arrays": "3.1.0",
        "viem": "2.23.2"
      }
    },
    "node_modules/@reown/appkit-utils/node_modules/@walletconnect/utils/node_modules/viem": {
      "version": "2.23.2",
      "resolved": "https://registry.npmjs.org/viem/-/viem-2.23.2.tgz",
      "integrity": "sha512-NVmW/E0c5crMOtbEAqMF0e3NmvQykFXhLOc/CkLIXOlzHSA6KXVz3CYVmaKqBF8/xtjsjHAGjdJN3Ru1kFJLaA==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/wevm"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "@noble/curves": "1.8.1",
        "@noble/hashes": "1.7.1",
        "@scure/bip32": "1.6.2",
        "@scure/bip39": "1.5.4",
        "abitype": "1.0.8",
        "isows": "1.0.6",
        "ox": "0.6.7",
        "ws": "8.18.0"
      },
      "peerDependencies": {
        "typescript": ">=5.0.4"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@reown/appkit-utils/node_modules/abitype": {
      "version": "1.0.8",
      "resolved": "https://registry.npmjs.org/abitype/-/abitype-1.0.8.tgz",
      "integrity": "sha512-ZeiI6h3GnW06uYDLx0etQtX/p8E24UaHHBj57RSjK7YBFe7iuVn07EDpOeP451D06sF27VOz9JJPlIKJmXgkEg==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/wevm"
      },
      "peerDependencies": {
        "typescript": ">=5.0.4",
        "zod": "^3 >=3.22.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        },
        "zod": {
          "optional": true
        }
      }
    },
    "node_modules/@reown/appkit-utils/node_modules/chokidar": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/chokidar/-/chokidar-5.0.0.tgz",
      "integrity": "sha512-TQMmc3w+5AxjpL8iIiwebF73dRDF4fBIieAqGn9RGCWaEVwQ6Fb2cGe31Yns0RRIzii5goJ1Y7xbMwo1TxMplw==",
      "license": "MIT",
      "dependencies": {
        "readdirp": "^5.0.0"
      },
      "engines": {
        "node": ">= 20.19.0"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@reown/appkit-utils/node_modules/isows": {
      "version": "1.0.6",
      "resolved": "https://registry.npmjs.org/isows/-/isows-1.0.6.tgz",
      "integrity": "sha512-lPHCayd40oW98/I0uvgaHKWCSvkzY27LjWLbtzOm64yQ+G3Q5npjjbdppU65iZXkK1Zt+kH9pfegli0AYfwYYw==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/wevm"
        }
      ],
      "license": "MIT",
      "peerDependencies": {
        "ws": "*"
      }
    },
    "node_modules/@reown/appkit-utils/node_modules/lru-cache": {
      "version": "11.3.5",
      "resolved": "https://registry.npmjs.org/lru-cache/-/lru-cache-11.3.5.tgz",
      "integrity": "sha512-NxVFwLAnrd9i7KUBxC4DrUhmgjzOs+1Qm50D3oF1/oL+r1NpZ4gA7xvG0/zJ8evR7zIKn4vLf7qTNduWFtCrRw==",
      "license": "BlueOak-1.0.0",
      "engines": {
        "node": "20 || >=22"
      }
    },
    "node_modules/@reown/appkit-utils/node_modules/ox": {
      "version": "0.6.7",
      "resolved": "https://registry.npmjs.org/ox/-/ox-0.6.7.tgz",
      "integrity": "sha512-17Gk/eFsFRAZ80p5eKqv89a57uXjd3NgIf1CaXojATPBuujVc/fQSVhBeAU9JCRB+k7J50WQAyWTxK19T9GgbA==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/wevm"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "@adraffy/ens-normalize": "^1.10.1",
        "@noble/curves": "^1.6.0",
        "@noble/hashes": "^1.5.0",
        "@scure/bip32": "^1.5.0",
        "@scure/bip39": "^1.4.0",
        "abitype": "^1.0.6",
        "eventemitter3": "5.0.1"
      },
      "peerDependencies": {
        "typescript": ">=5.4.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@reown/appkit-utils/node_modules/readdirp": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/readdirp/-/readdirp-5.0.0.tgz",
      "integrity": "sha512-9u/XQ1pvrQtYyMpZe7DXKv2p5CNvyVwzUB6uhLAnQwHMSgKMBR62lc7AHljaeteeHXn11XTAaLLUVZYVZyuRBQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 20.19.0"
      },
      "funding": {
        "type": "individual",
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@reown/appkit-utils/node_modules/unstorage": {
      "version": "1.17.5",
      "resolved": "https://registry.npmjs.org/unstorage/-/unstorage-1.17.5.tgz",
      "integrity": "sha512-0i3iqvRfx29hkNntHyQvJTpf5W9dQ9ZadSoRU8+xVlhVtT7jAX57fazYO9EHvcRCfBCyi5YRya7XCDOsbTgkPg==",
      "license": "MIT",
      "dependencies": {
        "anymatch": "^3.1.3",
        "chokidar": "^5.0.0",
        "destr": "^2.0.5",
        "h3": "^1.15.10",
        "lru-cache": "^11.2.7",
        "node-fetch-native": "^1.6.7",
        "ofetch": "^1.5.1",
        "ufo": "^1.6.3"
      },
      "peerDependencies": {
        "@azure/app-configuration": "^1.8.0",
        "@azure/cosmos": "^4.2.0",
        "@azure/data-tables": "^13.3.0",
        "@azure/identity": "^4.6.0",
        "@azure/keyvault-secrets": "^4.9.0",
        "@azure/storage-blob": "^12.26.0",
        "@capacitor/preferences": "^6 || ^7 || ^8",
        "@deno/kv": ">=0.9.0",
        "@netlify/blobs": "^6.5.0 || ^7.0.0 || ^8.1.0 || ^9.0.0 || ^10.0.0",
        "@planetscale/database": "^1.19.0",
        "@upstash/redis": "^1.34.3",
        "@vercel/blob": ">=0.27.1",
        "@vercel/functions": "^2.2.12 || ^3.0.0",
        "@vercel/kv": "^1 || ^2 || ^3",
        "aws4fetch": "^1.0.20",
        "db0": ">=0.2.1",
        "idb-keyval": "^6.2.1",
        "ioredis": "^5.4.2",
        "uploadthing": "^7.4.4"
      },
      "peerDependenciesMeta": {
        "@azure/app-configuration": {
          "optional": true
        },
        "@azure/cosmos": {
          "optional": true
        },
        "@azure/data-tables": {
          "optional": true
        },
        "@azure/identity": {
          "optional": true
        },
        "@azure/keyvault-secrets": {
          "optional": true
        },
        "@azure/storage-blob": {
          "optional": true
        },
        "@capacitor/preferences": {
          "optional": true
        },
        "@deno/kv": {
          "optional": true
        },
        "@netlify/blobs": {
          "optional": true
        },
        "@planetscale/database": {
          "optional": true
        },
        "@upstash/redis": {
          "optional": true
        },
        "@vercel/blob": {
          "optional": true
        },
        "@vercel/functions": {
          "optional": true
        },
        "@vercel/kv": {
          "optional": true
        },
        "aws4fetch": {
          "optional": true
        },
        "db0": {
          "optional": true
        },
        "idb-keyval": {
          "optional": true
        },
        "ioredis": {
          "optional": true
        },
        "uploadthing": {
          "optional": true
        }
      }
    },
    "node_modules/@reown/appkit-utils/node_modules/ws": {
      "version": "8.18.0",
      "resolved": "https://registry.npmjs.org/ws/-/ws-8.18.0.tgz",
      "integrity": "sha512-8VbfWfHLbbwu3+N6OKsOMpBdT4kXPDDB9cJk2bJ6mh9ucxdlnNvH1e+roYkKmN9Nxw2yjz7VzeO9oOz2zJ04Pw==",
      "license": "MIT",
      "engines": {
        "node": ">=10.0.0"
      },
      "peerDependencies": {
        "bufferutil": "^4.0.1",
        "utf-8-validate": ">=5.0.2"
      },
      "peerDependenciesMeta": {
        "bufferutil": {
          "optional": true
        },
        "utf-8-validate": {
          "optional": true
        }
      }
    },
    "node_modules/@reown/appkit-wallet": {
      "version": "1.7.8",
      "resolved": "https://registry.npmjs.org/@reown/appkit-wallet/-/appkit-wallet-1.7.8.tgz",
      "integrity": "sha512-kspz32EwHIOT/eg/ZQbFPxgXq0B/olDOj3YMu7gvLEFz4xyOFd/wgzxxAXkp5LbG4Cp++s/elh79rVNmVFdB9A==",
      "license": "Apache-2.0",
      "dependencies": {
        "@reown/appkit-common": "1.7.8",
        "@reown/appkit-polyfills": "1.7.8",
        "@walletconnect/logger": "2.1.2",
        "zod": "3.22.4"
      }
    },
    "node_modules/@reown/appkit-wallet/node_modules/zod": {
      "version": "3.22.4",
      "resolved": "https://registry.npmjs.org/zod/-/zod-3.22.4.tgz",
      "integrity": "sha512-iC+8Io04lddc+mVqQ9AZ7OQ2MrUKGN+oIQyq1vemgt46jwCwLfhq7/pwnBnNXXXZb8VTVLKwp9EDkx+ryxIWmg==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/colinhacks"
      }
    },
    "node_modules/@reown/appkit/node_modules/@noble/curves": {
      "version": "1.8.1",
      "resolved": "https://registry.npmjs.org/@noble/curves/-/curves-1.8.1.tgz",
      "integrity": "sha512-warwspo+UYUPep0Q+vtdVB4Ugn8GGQj8iyB3gnRWsztmUHTI3S1nhdiWNsPUGL0vud7JlRRk1XEu7Lq1KGTnMQ==",
      "license": "MIT",
      "dependencies": {
        "@noble/hashes": "1.7.1"
      },
      "engines": {
        "node": "^14.21.3 || >=16"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@reown/appkit/node_modules/@noble/hashes": {
      "version": "1.7.1",
      "resolved": "https://registry.npmjs.org/@noble/hashes/-/hashes-1.7.1.tgz",
      "integrity": "sha512-B8XBPsn4vT/KJAGqDzbwztd+6Yte3P4V7iafm24bxgDe/mlRuK6xmWPuCNrKt2vDafZ8MfJLlchDG/vYafQEjQ==",
      "license": "MIT",
      "engines": {
        "node": "^14.21.3 || >=16"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@reown/appkit/node_modules/@scure/bip32": {
      "version": "1.6.2",
      "resolved": "https://registry.npmjs.org/@scure/bip32/-/bip32-1.6.2.tgz",
      "integrity": "sha512-t96EPDMbtGgtb7onKKqxRLfE5g05k7uHnHRM2xdE6BP/ZmxaLtPek4J4KfVn/90IQNrU1IOAqMgiDtUdtbe3nw==",
      "license": "MIT",
      "dependencies": {
        "@noble/curves": "~1.8.1",
        "@noble/hashes": "~1.7.1",
        "@scure/base": "~1.2.2"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@reown/appkit/node_modules/@scure/bip39": {
      "version": "1.5.4",
      "resolved": "https://registry.npmjs.org/@scure/bip39/-/bip39-1.5.4.tgz",
      "integrity": "sha512-TFM4ni0vKvCfBpohoh+/lY05i9gRbSwXWngAsF4CABQxoaOHijxuaZ2R6cStDQ5CHtHO9aGJTr4ksVJASRRyMA==",
      "license": "MIT",
      "dependencies": {
        "@noble/hashes": "~1.7.1",
        "@scure/base": "~1.2.4"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@reown/appkit/node_modules/@walletconnect/core": {
      "version": "2.21.0",
      "resolved": "https://registry.npmjs.org/@walletconnect/core/-/core-2.21.0.tgz",
      "integrity": "sha512-o6R7Ua4myxR8aRUAJ1z3gT9nM+jd2B2mfamu6arzy1Cc6vi10fIwFWb6vg3bC8xJ6o9H3n/cN5TOW3aA9Y1XVw==",
      "license": "Apache-2.0",
      "dependencies": {
        "@walletconnect/heartbeat": "1.2.2",
        "@walletconnect/jsonrpc-provider": "1.0.14",
        "@walletconnect/jsonrpc-types": "1.0.4",
        "@walletconnect/jsonrpc-utils": "1.0.8",
        "@walletconnect/jsonrpc-ws-connection": "1.0.16",
        "@walletconnect/keyvaluestorage": "1.1.1",
        "@walletconnect/logger": "2.1.2",
        "@walletconnect/relay-api": "1.0.11",
        "@walletconnect/relay-auth": "1.1.0",
        "@walletconnect/safe-json": "1.0.2",
        "@walletconnect/time": "1.0.2",
        "@walletconnect/types": "2.21.0",
        "@walletconnect/utils": "2.21.0",
        "@walletconnect/window-getters": "1.0.1",
        "es-toolkit": "1.33.0",
        "events": "3.3.0",
        "uint8arrays": "3.1.0"
      },
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@reown/appkit/node_modules/@walletconnect/keyvaluestorage": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@walletconnect/keyvaluestorage/-/keyvaluestorage-1.1.1.tgz",
      "integrity": "sha512-V7ZQq2+mSxAq7MrRqDxanTzu2RcElfK1PfNYiaVnJgJ7Q7G7hTVwF8voIBx92qsRyGHZihrwNPHuZd1aKkd0rA==",
      "license": "MIT",
      "dependencies": {
        "@walletconnect/safe-json": "^1.0.1",
        "idb-keyval": "^6.2.1",
        "unstorage": "^1.9.0"
      },
      "peerDependencies": {
        "@react-native-async-storage/async-storage": "1.x"
      },
      "peerDependenciesMeta": {
        "@react-native-async-storage/async-storage": {
          "optional": true
        }
      }
    },
    "node_modules/@reown/appkit/node_modules/@walletconnect/sign-client": {
      "version": "2.21.0",
      "resolved": "https://registry.npmjs.org/@walletconnect/sign-client/-/sign-client-2.21.0.tgz",
      "integrity": "sha512-z7h+PeLa5Au2R591d/8ZlziE0stJvdzP9jNFzFolf2RG/OiXulgFKum8PrIyXy+Rg2q95U9nRVUF9fWcn78yBA==",
      "deprecated": "Reliability and performance improvements. See: https://github.com/WalletConnect/walletconnect-monorepo/releases",
      "license": "Apache-2.0",
      "dependencies": {
        "@walletconnect/core": "2.21.0",
        "@walletconnect/events": "1.0.1",
        "@walletconnect/heartbeat": "1.2.2",
        "@walletconnect/jsonrpc-utils": "1.0.8",
        "@walletconnect/logger": "2.1.2",
        "@walletconnect/time": "1.0.2",
        "@walletconnect/types": "2.21.0",
        "@walletconnect/utils": "2.21.0",
        "events": "3.3.0"
      }
    },
    "node_modules/@reown/appkit/node_modules/@walletconnect/types": {
      "version": "2.21.0",
      "resolved": "https://registry.npmjs.org/@walletconnect/types/-/types-2.21.0.tgz",
      "integrity": "sha512-ll+9upzqt95ZBWcfkOszXZkfnpbJJ2CmxMfGgE5GmhdxxxCcO5bGhXkI+x8OpiS555RJ/v/sXJYMSOLkmu4fFw==",
      "license": "Apache-2.0",
      "dependencies": {
        "@walletconnect/events": "1.0.1",
        "@walletconnect/heartbeat": "1.2.2",
        "@walletconnect/jsonrpc-types": "1.0.4",
        "@walletconnect/keyvaluestorage": "1.1.1",
        "@walletconnect/logger": "2.1.2",
        "events": "3.3.0"
      }
    },
    "node_modules/@reown/appkit/node_modules/@walletconnect/universal-provider": {
      "version": "2.21.0",
      "resolved": "https://registry.npmjs.org/@walletconnect/universal-provider/-/universal-provider-2.21.0.tgz",
      "integrity": "sha512-mtUQvewt+X0VBQay/xOJBvxsB3Xsm1lTwFjZ6WUwSOTR1X+FNb71hSApnV5kbsdDIpYPXeQUbGt2se1n5E5UBg==",
      "deprecated": "Reliability and performance improvements. See: https://github.com/WalletConnect/walletconnect-monorepo/releases",
      "license": "Apache-2.0",
      "dependencies": {
        "@walletconnect/events": "1.0.1",
        "@walletconnect/jsonrpc-http-connection": "1.0.8",
        "@walletconnect/jsonrpc-provider": "1.0.14",
        "@walletconnect/jsonrpc-types": "1.0.4",
        "@walletconnect/jsonrpc-utils": "1.0.8",
        "@walletconnect/keyvaluestorage": "1.1.1",
        "@walletconnect/logger": "2.1.2",
        "@walletconnect/sign-client": "2.21.0",
        "@walletconnect/types": "2.21.0",
        "@walletconnect/utils": "2.21.0",
        "es-toolkit": "1.33.0",
        "events": "3.3.0"
      }
    },
    "node_modules/@reown/appkit/node_modules/@walletconnect/utils": {
      "version": "2.21.0",
      "resolved": "https://registry.npmjs.org/@walletconnect/utils/-/utils-2.21.0.tgz",
      "integrity": "sha512-zfHLiUoBrQ8rP57HTPXW7rQMnYxYI4gT9yTACxVW6LhIFROTF6/ytm5SKNoIvi4a5nX5dfXG4D9XwQUCu8Ilig==",
      "license": "Apache-2.0",
      "dependencies": {
        "@noble/ciphers": "1.2.1",
        "@noble/curves": "1.8.1",
        "@noble/hashes": "1.7.1",
        "@walletconnect/jsonrpc-utils": "1.0.8",
        "@walletconnect/keyvaluestorage": "1.1.1",
        "@walletconnect/relay-api": "1.0.11",
        "@walletconnect/relay-auth": "1.1.0",
        "@walletconnect/safe-json": "1.0.2",
        "@walletconnect/time": "1.0.2",
        "@walletconnect/types": "2.21.0",
        "@walletconnect/window-getters": "1.0.1",
        "@walletconnect/window-metadata": "1.0.1",
        "bs58": "6.0.0",
        "detect-browser": "5.3.0",
        "query-string": "7.1.3",
        "uint8arrays": "3.1.0",
        "viem": "2.23.2"
      }
    },
    "node_modules/@reown/appkit/node_modules/@walletconnect/utils/node_modules/viem": {
      "version": "2.23.2",
      "resolved": "https://registry.npmjs.org/viem/-/viem-2.23.2.tgz",
      "integrity": "sha512-NVmW/E0c5crMOtbEAqMF0e3NmvQykFXhLOc/CkLIXOlzHSA6KXVz3CYVmaKqBF8/xtjsjHAGjdJN3Ru1kFJLaA==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/wevm"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "@noble/curves": "1.8.1",
        "@noble/hashes": "1.7.1",
        "@scure/bip32": "1.6.2",
        "@scure/bip39": "1.5.4",
        "abitype": "1.0.8",
        "isows": "1.0.6",
        "ox": "0.6.7",
        "ws": "8.18.0"
      },
      "peerDependencies": {
        "typescript": ">=5.0.4"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@reown/appkit/node_modules/abitype": {
      "version": "1.0.8",
      "resolved": "https://registry.npmjs.org/abitype/-/abitype-1.0.8.tgz",
      "integrity": "sha512-ZeiI6h3GnW06uYDLx0etQtX/p8E24UaHHBj57RSjK7YBFe7iuVn07EDpOeP451D06sF27VOz9JJPlIKJmXgkEg==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/wevm"
      },
      "peerDependencies": {
        "typescript": ">=5.0.4",
        "zod": "^3 >=3.22.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        },
        "zod": {
          "optional": true
        }
      }
    },
    "node_modules/@reown/appkit/node_modules/chokidar": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/chokidar/-/chokidar-5.0.0.tgz",
      "integrity": "sha512-TQMmc3w+5AxjpL8iIiwebF73dRDF4fBIieAqGn9RGCWaEVwQ6Fb2cGe31Yns0RRIzii5goJ1Y7xbMwo1TxMplw==",
      "license": "MIT",
      "dependencies": {
        "readdirp": "^5.0.0"
      },
      "engines": {
        "node": ">= 20.19.0"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@reown/appkit/node_modules/isows": {
      "version": "1.0.6",
      "resolved": "https://registry.npmjs.org/isows/-/isows-1.0.6.tgz",
      "integrity": "sha512-lPHCayd40oW98/I0uvgaHKWCSvkzY27LjWLbtzOm64yQ+G3Q5npjjbdppU65iZXkK1Zt+kH9pfegli0AYfwYYw==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/wevm"
        }
      ],
      "license": "MIT",
      "peerDependencies": {
        "ws": "*"
      }
    },
    "node_modules/@reown/appkit/node_modules/lru-cache": {
      "version": "11.3.5",
      "resolved": "https://registry.npmjs.org/lru-cache/-/lru-cache-11.3.5.tgz",
      "integrity": "sha512-NxVFwLAnrd9i7KUBxC4DrUhmgjzOs+1Qm50D3oF1/oL+r1NpZ4gA7xvG0/zJ8evR7zIKn4vLf7qTNduWFtCrRw==",
      "license": "BlueOak-1.0.0",
      "engines": {
        "node": "20 || >=22"
      }
    },
    "node_modules/@reown/appkit/node_modules/ox": {
      "version": "0.6.7",
      "resolved": "https://registry.npmjs.org/ox/-/ox-0.6.7.tgz",
      "integrity": "sha512-17Gk/eFsFRAZ80p5eKqv89a57uXjd3NgIf1CaXojATPBuujVc/fQSVhBeAU9JCRB+k7J50WQAyWTxK19T9GgbA==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/wevm"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "@adraffy/ens-normalize": "^1.10.1",
        "@noble/curves": "^1.6.0",
        "@noble/hashes": "^1.5.0",
        "@scure/bip32": "^1.5.0",
        "@scure/bip39": "^1.4.0",
        "abitype": "^1.0.6",
        "eventemitter3": "5.0.1"
      },
      "peerDependencies": {
        "typescript": ">=5.4.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@reown/appkit/node_modules/readdirp": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/readdirp/-/readdirp-5.0.0.tgz",
      "integrity": "sha512-9u/XQ1pvrQtYyMpZe7DXKv2p5CNvyVwzUB6uhLAnQwHMSgKMBR62lc7AHljaeteeHXn11XTAaLLUVZYVZyuRBQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 20.19.0"
      },
      "funding": {
        "type": "individual",
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@reown/appkit/node_modules/unstorage": {
      "version": "1.17.5",
      "resolved": "https://registry.npmjs.org/unstorage/-/unstorage-1.17.5.tgz",
      "integrity": "sha512-0i3iqvRfx29hkNntHyQvJTpf5W9dQ9ZadSoRU8+xVlhVtT7jAX57fazYO9EHvcRCfBCyi5YRya7XCDOsbTgkPg==",
      "license": "MIT",
      "dependencies": {
        "anymatch": "^3.1.3",
        "chokidar": "^5.0.0",
        "destr": "^2.0.5",
        "h3": "^1.15.10",
        "lru-cache": "^11.2.7",
        "node-fetch-native": "^1.6.7",
        "ofetch": "^1.5.1",
        "ufo": "^1.6.3"
      },
      "peerDependencies": {
        "@azure/app-configuration": "^1.8.0",
        "@azure/cosmos": "^4.2.0",
        "@azure/data-tables": "^13.3.0",
        "@azure/identity": "^4.6.0",
        "@azure/keyvault-secrets": "^4.9.0",
        "@azure/storage-blob": "^12.26.0",
        "@capacitor/preferences": "^6 || ^7 || ^8",
        "@deno/kv": ">=0.9.0",
        "@netlify/blobs": "^6.5.0 || ^7.0.0 || ^8.1.0 || ^9.0.0 || ^10.0.0",
        "@planetscale/database": "^1.19.0",
        "@upstash/redis": "^1.34.3",
        "@vercel/blob": ">=0.27.1",
        "@vercel/functions": "^2.2.12 || ^3.0.0",
        "@vercel/kv": "^1 || ^2 || ^3",
        "aws4fetch": "^1.0.20",
        "db0": ">=0.2.1",
        "idb-keyval": "^6.2.1",
        "ioredis": "^5.4.2",
        "uploadthing": "^7.4.4"
      },
      "peerDependenciesMeta": {
        "@azure/app-configuration": {
          "optional": true
        },
        "@azure/cosmos": {
          "optional": true
        },
        "@azure/data-tables": {
          "optional": true
        },
        "@azure/identity": {
          "optional": true
        },
        "@azure/keyvault-secrets": {
          "optional": true
        },
        "@azure/storage-blob": {
          "optional": true
        },
        "@capacitor/preferences": {
          "optional": true
        },
        "@deno/kv": {
          "optional": true
        },
        "@netlify/blobs": {
          "optional": true
        },
        "@planetscale/database": {
          "optional": true
        },
        "@upstash/redis": {
          "optional": true
        },
        "@vercel/blob": {
          "optional": true
        },
        "@vercel/functions": {
          "optional": true
        },
        "@vercel/kv": {
          "optional": true
        },
        "aws4fetch": {
          "optional": true
        },
        "db0": {
          "optional": true
        },
        "idb-keyval": {
          "optional": true
        },
        "ioredis": {
          "optional": true
        },
        "uploadthing": {
          "optional": true
        }
      }
    },
    "node_modules/@reown/appkit/node_modules/ws": {
      "version": "8.18.0",
      "resolved": "https://registry.npmjs.org/ws/-/ws-8.18.0.tgz",
      "integrity": "sha512-8VbfWfHLbbwu3+N6OKsOMpBdT4kXPDDB9cJk2bJ6mh9ucxdlnNvH1e+roYkKmN9Nxw2yjz7VzeO9oOz2zJ04Pw==",
      "license": "MIT",
      "engines": {
        "node": ">=10.0.0"
      },
      "peerDependencies": {
        "bufferutil": "^4.0.1",
        "utf-8-validate": ">=5.0.2"
      },
      "peerDependenciesMeta": {
        "bufferutil": {
          "optional": true
        },
        "utf-8-validate": {
          "optional": true
        }
      }
    },
    "node_modules/@rolldown/pluginutils": {
      "version": "1.0.0-beta.27",
      "resolved": "https://registry.npmjs.org/@rolldown/pluginutils/-/pluginutils-1.0.0-beta.27.tgz",
      "integrity": "sha512-+d0F4MKMCbeVUJwG96uQ4SgAznZNSq93I3V+9NHA4OpvqG8mRCpGdKmK8l/dl02h2CCDHwW2FqilnTyDcAnqjA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@rollup/rollup-android-arm-eabi": {
      "version": "4.60.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-android-arm-eabi/-/rollup-android-arm-eabi-4.60.2.tgz",
      "integrity": "sha512-dnlp69efPPg6Uaw2dVqzWRfAWRnYVb1XJ8CyyhIbZeaq4CA5/mLeZ1IEt9QqQxmbdvagjLIm2ZL8BxXv5lH4Yw==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ]
    },
    "node_modules/@rollup/rollup-android-arm64": {
      "version": "4.60.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-android-arm64/-/rollup-android-arm64-4.60.2.tgz",
      "integrity": "sha512-OqZTwDRDchGRHHm/hwLOL7uVPB9aUvI0am/eQuWMNyFHf5PSEQmyEeYYheA0EPPKUO/l0uigCp+iaTjoLjVoHg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ]
    },
    "node_modules/@rollup/rollup-darwin-arm64": {
      "version": "4.60.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-darwin-arm64/-/rollup-darwin-arm64-4.60.2.tgz",
      "integrity": "sha512-UwRE7CGpvSVEQS8gUMBe1uADWjNnVgP3Iusyda1nSRwNDCsRjnGc7w6El6WLQsXmZTbLZx9cecegumcitNfpmA==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ]
    },
    "node_modules/@rollup/rollup-darwin-x64": {
      "version": "4.60.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-darwin-x64/-/rollup-darwin-x64-4.60.2.tgz",
      "integrity": "sha512-gjEtURKLCC5VXm1I+2i1u9OhxFsKAQJKTVB8WvDAHF+oZlq0GTVFOlTlO1q3AlCTE/DF32c16ESvfgqR7343/g==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ]
    },
    "node_modules/@rollup/rollup-freebsd-arm64": {
      "version": "4.60.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-freebsd-arm64/-/rollup-freebsd-arm64-4.60.2.tgz",
      "integrity": "sha512-Bcl6CYDeAgE70cqZaMojOi/eK63h5Me97ZqAQoh77VPjMysA/4ORQBRGo3rRy45x4MzVlU9uZxs8Uwy7ZaKnBw==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ]
    },
    "node_modules/@rollup/rollup-freebsd-x64": {
      "version": "4.60.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-freebsd-x64/-/rollup-freebsd-x64-4.60.2.tgz",
      "integrity": "sha512-LU+TPda3mAE2QB0/Hp5VyeKJivpC6+tlOXd1VMoXV/YFMvk/MNk5iXeBfB4MQGRWyOYVJ01625vjkr0Az98OJQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ]
    },
    "node_modules/@rollup/rollup-linux-arm-gnueabihf": {
      "version": "4.60.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-arm-gnueabihf/-/rollup-linux-arm-gnueabihf-4.60.2.tgz",
      "integrity": "sha512-2QxQrM+KQ7DAW4o22j+XZ6RKdxjLD7BOWTP0Bv0tmjdyhXSsr2Ul1oJDQqh9Zf5qOwTuTc7Ek83mOFaKnodPjg==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-arm-musleabihf": {
      "version": "4.60.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-arm-musleabihf/-/rollup-linux-arm-musleabihf-4.60.2.tgz",
      "integrity": "sha512-TbziEu2DVsTEOPif2mKWkMeDMLoYjx95oESa9fkQQK7r/Orta0gnkcDpzwufEcAO2BLBsD7mZkXGFqEdMRRwfw==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-arm64-gnu": {
      "version": "4.60.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-arm64-gnu/-/rollup-linux-arm64-gnu-4.60.2.tgz",
      "integrity": "sha512-bO/rVDiDUuM2YfuCUwZ1t1cP+/yqjqz+Xf2VtkdppefuOFS2OSeAfgafaHNkFn0t02hEyXngZkxtGqXcXwO8Rg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-arm64-musl": {
      "version": "4.60.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-arm64-musl/-/rollup-linux-arm64-musl-4.60.2.tgz",
      "integrity": "sha512-hr26p7e93Rl0Za+JwW7EAnwAvKkehh12BU1Llm9Ykiibg4uIr2rbpxG9WCf56GuvidlTG9KiiQT/TXT1yAWxTA==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-loong64-gnu": {
      "version": "4.60.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-loong64-gnu/-/rollup-linux-loong64-gnu-4.60.2.tgz",
      "integrity": "sha512-pOjB/uSIyDt+ow3k/RcLvUAOGpysT2phDn7TTUB3n75SlIgZzM6NKAqlErPhoFU+npgY3/n+2HYIQVbF70P9/A==",
      "cpu": [
        "loong64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-loong64-musl": {
      "version": "4.60.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-loong64-musl/-/rollup-linux-loong64-musl-4.60.2.tgz",
      "integrity": "sha512-2/w+q8jszv9Ww1c+6uJT3OwqhdmGP2/4T17cu8WuwyUuuaCDDJ2ojdyYwZzCxx0GcsZBhzi3HmH+J5pZNXnd+Q==",
      "cpu": [
        "loong64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-ppc64-gnu": {
      "version": "4.60.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-ppc64-gnu/-/rollup-linux-ppc64-gnu-4.60.2.tgz",
      "integrity": "sha512-11+aL5vKheYgczxtPVVRhdptAM2H7fcDR5Gw4/bTcteuZBlH4oP9f5s9zYO9aGZvoGeBpqXI/9TZZihZ609wKw==",
      "cpu": [
        "ppc64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-ppc64-musl": {
      "version": "4.60.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-ppc64-musl/-/rollup-linux-ppc64-musl-4.60.2.tgz",
      "integrity": "sha512-i16fokAGK46IVZuV8LIIwMdtqhin9hfYkCh8pf8iC3QU3LpwL+1FSFGej+O7l3E/AoknL6Dclh2oTdnRMpTzFQ==",
      "cpu": [
        "ppc64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-riscv64-gnu": {
      "version": "4.60.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-riscv64-gnu/-/rollup-linux-riscv64-gnu-4.60.2.tgz",
      "integrity": "sha512-49FkKS6RGQoriDSK/6E2GkAsAuU5kETFCh7pG4yD/ylj9rKhTmO3elsnmBvRD4PgJPds5W2PkhC82aVwmUcJ7A==",
      "cpu": [
        "riscv64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-riscv64-musl": {
      "version": "4.60.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-riscv64-musl/-/rollup-linux-riscv64-musl-4.60.2.tgz",
      "integrity": "sha512-mjYNkHPfGpUR00DuM1ZZIgs64Hpf4bWcz9Z41+4Q+pgDx73UwWdAYyf6EG/lRFldmdHHzgrYyge5akFUW0D3mQ==",
      "cpu": [
        "riscv64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-s390x-gnu": {
      "version": "4.60.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-s390x-gnu/-/rollup-linux-s390x-gnu-4.60.2.tgz",
      "integrity": "sha512-ALyvJz965BQk8E9Al/JDKKDLH2kfKFLTGMlgkAbbYtZuJt9LU8DW3ZoDMCtQpXAltZxwBHevXz5u+gf0yA0YoA==",
      "cpu": [
        "s390x"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-x64-gnu": {
      "version": "4.60.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-x64-gnu/-/rollup-linux-x64-gnu-4.60.2.tgz",
      "integrity": "sha512-UQjrkIdWrKI626Du8lCQ6MJp/6V1LAo2bOK9OTu4mSn8GGXIkPXk/Vsp4bLHCd9Z9Iz2OTEaokUE90VweJgIYQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-x64-musl": {
      "version": "4.60.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-x64-musl/-/rollup-linux-x64-musl-4.60.2.tgz",
      "integrity": "sha512-bTsRGj6VlSdn/XD4CGyzMnzaBs9bsRxy79eTqTCBsA8TMIEky7qg48aPkvJvFe1HyzQ5oMZdg7AnVlWQSKLTnw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-openbsd-x64": {
      "version": "4.60.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-openbsd-x64/-/rollup-openbsd-x64-4.60.2.tgz",
      "integrity": "sha512-6d4Z3534xitaA1FcMWP7mQPq5zGwBmGbhphh2DwaA1aNIXUu3KTOfwrWpbwI4/Gr0uANo7NTtaykFyO2hPuFLg==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "openbsd"
      ]
    },
    "node_modules/@rollup/rollup-openharmony-arm64": {
      "version": "4.60.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-openharmony-arm64/-/rollup-openharmony-arm64-4.60.2.tgz",
      "integrity": "sha512-NetAg5iO2uN7eB8zE5qrZ3CSil+7IJt4WDFLcC75Ymywq1VZVD6qJ6EvNLjZ3rEm6gB7XW5JdT60c6MN35Z85Q==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "openharmony"
      ]
    },
    "node_modules/@rollup/rollup-win32-arm64-msvc": {
      "version": "4.60.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-win32-arm64-msvc/-/rollup-win32-arm64-msvc-4.60.2.tgz",
      "integrity": "sha512-NCYhOotpgWZ5kdxCZsv6Iudx0wX8980Q/oW4pNFNihpBKsDbEA1zpkfxJGC0yugsUuyDZ7gL37dbzwhR0VI7pQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ]
    },
    "node_modules/@rollup/rollup-win32-ia32-msvc": {
      "version": "4.60.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-win32-ia32-msvc/-/rollup-win32-ia32-msvc-4.60.2.tgz",
      "integrity": "sha512-RXsaOqXxfoUBQoOgvmmijVxJnW2IGB0eoMO7F8FAjaj0UTywUO/luSqimWBJn04WNgUkeNhh7fs7pESXajWmkg==",
      "cpu": [
        "ia32"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ]
    },
    "node_modules/@rollup/rollup-win32-x64-gnu": {
      "version": "4.60.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-win32-x64-gnu/-/rollup-win32-x64-gnu-4.60.2.tgz",
      "integrity": "sha512-qdAzEULD+/hzObedtmV6iBpdL5TIbKVztGiK7O3/KYSf+HIzU257+MX1EXJcyIiDbMAqmbwaufcYPvyRryeZtA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ]
    },
    "node_modules/@rollup/rollup-win32-x64-msvc": {
      "version": "4.60.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-win32-x64-msvc/-/rollup-win32-x64-msvc-4.60.2.tgz",
      "integrity": "sha512-Nd/SgG27WoA9e+/TdK74KnHz852TLa94ovOYySo/yMPuTmpckK/jIF2jSwS3g7ELSKXK13/cVdmg1Z/DaCWKxA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ]
    },
    "node_modules/@safe-global/safe-apps-provider": {
      "version": "0.18.6",
      "resolved": "https://registry.npmjs.org/@safe-global/safe-apps-provider/-/safe-apps-provider-0.18.6.tgz",
      "integrity": "sha512-4LhMmjPWlIO8TTDC2AwLk44XKXaK6hfBTWyljDm0HQ6TWlOEijVWNrt2s3OCVMSxlXAcEzYfqyu1daHZooTC2Q==",
      "license": "MIT",
      "dependencies": {
        "@safe-global/safe-apps-sdk": "^9.1.0",
        "events": "^3.3.0"
      }
    },
    "node_modules/@safe-global/safe-apps-sdk": {
      "version": "9.1.0",
      "resolved": "https://registry.npmjs.org/@safe-global/safe-apps-sdk/-/safe-apps-sdk-9.1.0.tgz",
      "integrity": "sha512-N5p/ulfnnA2Pi2M3YeWjULeWbjo7ei22JwU/IXnhoHzKq3pYCN6ynL9mJBOlvDVv892EgLPCWCOwQk/uBT2v0Q==",
      "license": "MIT",
      "dependencies": {
        "@safe-global/safe-gateway-typescript-sdk": "^3.5.3",
        "viem": "^2.1.1"
      }
    },
    "node_modules/@safe-global/safe-gateway-typescript-sdk": {
      "version": "3.23.1",
      "resolved": "https://registry.npmjs.org/@safe-global/safe-gateway-typescript-sdk/-/safe-gateway-typescript-sdk-3.23.1.tgz",
      "integrity": "sha512-6ORQfwtEJYpalCeVO21L4XXGSdbEMfyp2hEv6cP82afKXSwvse6d3sdelgaPWUxHIsFRkWvHDdzh8IyyKHZKxw==",
      "license": "MIT",
      "engines": {
        "node": ">=16"
      }
    },
    "node_modules/@scure/base": {
      "version": "1.2.6",
      "resolved": "https://registry.npmjs.org/@scure/base/-/base-1.2.6.tgz",
      "integrity": "sha512-g/nm5FgUa//MCj1gV09zTJTaM6KBAHqLN907YVQqf7zC49+DcO4B1so4ZX07Ef10Twr6nuqYEH9GEggFXA4Fmg==",
      "license": "MIT",
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@scure/bip32": {
      "version": "1.7.0",
      "resolved": "https://registry.npmjs.org/@scure/bip32/-/bip32-1.7.0.tgz",
      "integrity": "sha512-E4FFX/N3f4B80AKWp5dP6ow+flD1LQZo/w8UnLGYZO674jS6YnYeepycOOksv+vLPSpgN35wgKgy+ybfTb2SMw==",
      "license": "MIT",
      "dependencies": {
        "@noble/curves": "~1.9.0",
        "@noble/hashes": "~1.8.0",
        "@scure/base": "~1.2.5"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@scure/bip39": {
      "version": "1.6.0",
      "resolved": "https://registry.npmjs.org/@scure/bip39/-/bip39-1.6.0.tgz",
      "integrity": "sha512-+lF0BbLiJNwVlev4eKelw1WWLaiKXw7sSl8T6FvBlWkdX+94aGJ4o8XjUdlyhTCjd8c+B3KT3JfS8P0bLRNU6A==",
      "license": "MIT",
      "dependencies": {
        "@noble/hashes": "~1.8.0",
        "@scure/base": "~1.2.5"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@socket.io/component-emitter": {
      "version": "3.1.2",
      "resolved": "https://registry.npmjs.org/@socket.io/component-emitter/-/component-emitter-3.1.2.tgz",
      "integrity": "sha512-9BCxFwvbGg/RsZK9tjXd8s4UcwR0MWeFQ1XEKIQVVvAGJyINdrqKMcTRyLoK8Rse1GjzLV9cwjWV1olXRWEXVA==",
      "license": "MIT"
    },
    "node_modules/@solana-program/system": {
      "version": "0.10.0",
      "resolved": "https://registry.npmjs.org/@solana-program/system/-/system-0.10.0.tgz",
      "integrity": "sha512-Go+LOEZmqmNlfr+Gjy5ZWAdY5HbYzk2RBewD9QinEU/bBSzpFfzqDRT55JjFRBGJUvMgf3C2vfXEGT4i8DSI4g==",
      "license": "Apache-2.0",
      "peerDependencies": {
        "@solana/kit": "^5.0"
      }
    },
    "node_modules/@solana-program/token": {
      "version": "0.9.0",
      "resolved": "https://registry.npmjs.org/@solana-program/token/-/token-0.9.0.tgz",
      "integrity": "sha512-vnZxndd4ED4Fc56sw93cWZ2djEeeOFxtaPS8SPf5+a+JZjKA/EnKqzbE1y04FuMhIVrLERQ8uR8H2h72eZzlsA==",
      "license": "Apache-2.0",
      "peerDependencies": {
        "@solana/kit": "^5.0"
      }
    },
    "node_modules/@solana/accounts": {
      "version": "5.5.1",
      "resolved": "https://registry.npmjs.org/@solana/accounts/-/accounts-5.5.1.tgz",
      "integrity": "sha512-TfOY9xixg5rizABuLVuZ9XI2x2tmWUC/OoN556xwfDlhBHBjKfszicYYOyD6nbFmwTGYarCmyGIdteXxTXIdhQ==",
      "license": "MIT",
      "dependencies": {
        "@solana/addresses": "5.5.1",
        "@solana/codecs-core": "5.5.1",
        "@solana/codecs-strings": "5.5.1",
        "@solana/errors": "5.5.1",
        "@solana/rpc-spec": "5.5.1",
        "@solana/rpc-types": "5.5.1"
      },
      "engines": {
        "node": ">=20.18.0"
      },
      "peerDependencies": {
        "typescript": "^5.0.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@solana/addresses": {
      "version": "5.5.1",
      "resolved": "https://registry.npmjs.org/@solana/addresses/-/addresses-5.5.1.tgz",
      "integrity": "sha512-5xoah3Q9G30HQghu/9BiHLb5pzlPKRC3zydQDmE3O9H//WfayxTFppsUDCL6FjYUHqj/wzK6CWHySglc2RkpdA==",
      "license": "MIT",
      "dependencies": {
        "@solana/assertions": "5.5.1",
        "@solana/codecs-core": "5.5.1",
        "@solana/codecs-strings": "5.5.1",
        "@solana/errors": "5.5.1",
        "@solana/nominal-types": "5.5.1"
      },
      "engines": {
        "node": ">=20.18.0"
      },
      "peerDependencies": {
        "typescript": "^5.0.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@solana/assertions": {
      "version": "5.5.1",
      "resolved": "https://registry.npmjs.org/@solana/assertions/-/assertions-5.5.1.tgz",
      "integrity": "sha512-YTCSWAlGwSlVPnWtWLm3ukz81wH4j2YaCveK+TjpvUU88hTy6fmUqxi0+hvAMAe4zKXpJyj3Az7BrLJRxbIm4Q==",
      "license": "MIT",
      "dependencies": {
        "@solana/errors": "5.5.1"
      },
      "engines": {
        "node": ">=20.18.0"
      },
      "peerDependencies": {
        "typescript": "^5.0.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@solana/codecs": {
      "version": "5.5.1",
      "resolved": "https://registry.npmjs.org/@solana/codecs/-/codecs-5.5.1.tgz",
      "integrity": "sha512-Vea29nJub/bXjfzEV7ZZQ/PWr1pYLZo3z0qW0LQL37uKKVzVFRQlwetd7INk3YtTD3xm9WUYr7bCvYUk3uKy2g==",
      "license": "MIT",
      "dependencies": {
        "@solana/codecs-core": "5.5.1",
        "@solana/codecs-data-structures": "5.5.1",
        "@solana/codecs-numbers": "5.5.1",
        "@solana/codecs-strings": "5.5.1",
        "@solana/options": "5.5.1"
      },
      "engines": {
        "node": ">=20.18.0"
      },
      "peerDependencies": {
        "typescript": "^5.0.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@solana/codecs-core": {
      "version": "5.5.1",
      "resolved": "https://registry.npmjs.org/@solana/codecs-core/-/codecs-core-5.5.1.tgz",
      "integrity": "sha512-TgBt//bbKBct0t6/MpA8ElaOA3sa8eYVvR7LGslCZ84WiAwwjCY0lW/lOYsFHJQzwREMdUyuEyy5YWBKtdh8Rw==",
      "license": "MIT",
      "dependencies": {
        "@solana/errors": "5.5.1"
      },
      "engines": {
        "node": ">=20.18.0"
      },
      "peerDependencies": {
        "typescript": "^5.0.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@solana/codecs-data-structures": {
      "version": "5.5.1",
      "resolved": "https://registry.npmjs.org/@solana/codecs-data-structures/-/codecs-data-structures-5.5.1.tgz",
      "integrity": "sha512-97bJWGyUY9WvBz3mX1UV3YPWGDTez6btCfD0ip3UVEXJbItVuUiOkzcO5iFDUtQT5riKT6xC+Mzl+0nO76gd0w==",
      "license": "MIT",
      "dependencies": {
        "@solana/codecs-core": "5.5.1",
        "@solana/codecs-numbers": "5.5.1",
        "@solana/errors": "5.5.1"
      },
      "engines": {
        "node": ">=20.18.0"
      },
      "peerDependencies": {
        "typescript": "^5.0.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@solana/codecs-numbers": {
      "version": "5.5.1",
      "resolved": "https://registry.npmjs.org/@solana/codecs-numbers/-/codecs-numbers-5.5.1.tgz",
      "integrity": "sha512-rllMIZAHqmtvC0HO/dc/21wDuWaD0B8Ryv8o+YtsICQBuiL/0U4AGwH7Pi5GNFySYk0/crSuwfIqQFtmxNSPFw==",
      "license": "MIT",
      "dependencies": {
        "@solana/codecs-core": "5.5.1",
        "@solana/errors": "5.5.1"
      },
      "engines": {
        "node": ">=20.18.0"
      },
      "peerDependencies": {
        "typescript": "^5.0.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@solana/codecs-strings": {
      "version": "5.5.1",
      "resolved": "https://registry.npmjs.org/@solana/codecs-strings/-/codecs-strings-5.5.1.tgz",
      "integrity": "sha512-7klX4AhfHYA+uKKC/nxRGP2MntbYQCR3N6+v7bk1W/rSxYuhNmt+FN8aoThSZtWIKwN6BEyR1167ka8Co1+E7A==",
      "license": "MIT",
      "dependencies": {
        "@solana/codecs-core": "5.5.1",
        "@solana/codecs-numbers": "5.5.1",
        "@solana/errors": "5.5.1"
      },
      "engines": {
        "node": ">=20.18.0"
      },
      "peerDependencies": {
        "fastestsmallesttextencoderdecoder": "^1.0.22",
        "typescript": "^5.0.0"
      },
      "peerDependenciesMeta": {
        "fastestsmallesttextencoderdecoder": {
          "optional": true
        },
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@solana/errors": {
      "version": "5.5.1",
      "resolved": "https://registry.npmjs.org/@solana/errors/-/errors-5.5.1.tgz",
      "integrity": "sha512-vFO3p+S7HoyyrcAectnXbdsMfwUzY2zYFUc2DEe5BwpiE9J1IAxPBGjOWO6hL1bbYdBrlmjNx8DXCslqS+Kcmg==",
      "license": "MIT",
      "dependencies": {
        "chalk": "5.6.2",
        "commander": "14.0.2"
      },
      "bin": {
        "errors": "bin/cli.mjs"
      },
      "engines": {
        "node": ">=20.18.0"
      },
      "peerDependencies": {
        "typescript": "^5.0.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@solana/errors/node_modules/chalk": {
      "version": "5.6.2",
      "resolved": "https://registry.npmjs.org/chalk/-/chalk-5.6.2.tgz",
      "integrity": "sha512-7NzBL0rN6fMUW+f7A6Io4h40qQlG+xGmtMxfbnH/K7TAtt8JQWVQK+6g0UXKMeVJoyV5EkkNsErQ8pVD3bLHbA==",
      "license": "MIT",
      "engines": {
        "node": "^12.17.0 || ^14.13 || >=16.0.0"
      },
      "funding": {
        "url": "https://github.com/chalk/chalk?sponsor=1"
      }
    },
    "node_modules/@solana/fast-stable-stringify": {
      "version": "5.5.1",
      "resolved": "https://registry.npmjs.org/@solana/fast-stable-stringify/-/fast-stable-stringify-5.5.1.tgz",
      "integrity": "sha512-Ni7s2FN33zTzhTFgRjEbOVFO+UAmK8qi3Iu0/GRFYK4jN696OjKHnboSQH/EacQ+yGqS54bfxf409wU5dsLLCw==",
      "license": "MIT",
      "engines": {
        "node": ">=20.18.0"
      },
      "peerDependencies": {
        "typescript": "^5.0.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@solana/functional": {
      "version": "5.5.1",
      "resolved": "https://registry.npmjs.org/@solana/functional/-/functional-5.5.1.tgz",
      "integrity": "sha512-tTHoJcEQq3gQx5qsdsDJ0LEJeFzwNpXD80xApW9o/PPoCNimI3SALkZl+zNW8VnxRrV3l3yYvfHWBKe/X3WG3w==",
      "license": "MIT",
      "engines": {
        "node": ">=20.18.0"
      },
      "peerDependencies": {
        "typescript": "^5.0.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@solana/instruction-plans": {
      "version": "5.5.1",
      "resolved": "https://registry.npmjs.org/@solana/instruction-plans/-/instruction-plans-5.5.1.tgz",
      "integrity": "sha512-7z3CB7YMcFKuVvgcnNY8bY6IsZ8LG61Iytbz7HpNVGX2u1RthOs1tRW8luTzSG1MPL0Ox7afyAVMYeFqSPHnaQ==",
      "license": "MIT",
      "dependencies": {
        "@solana/errors": "5.5.1",
        "@solana/instructions": "5.5.1",
        "@solana/keys": "5.5.1",
        "@solana/promises": "5.5.1",
        "@solana/transaction-messages": "5.5.1",
        "@solana/transactions": "5.5.1"
      },
      "engines": {
        "node": ">=20.18.0"
      },
      "peerDependencies": {
        "typescript": "^5.0.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@solana/instructions": {
      "version": "5.5.1",
      "resolved": "https://registry.npmjs.org/@solana/instructions/-/instructions-5.5.1.tgz",
      "integrity": "sha512-h0G1CG6S+gUUSt0eo6rOtsaXRBwCq1+Js2a+Ps9Bzk9q7YHNFA75/X0NWugWLgC92waRp66hrjMTiYYnLBoWOQ==",
      "license": "MIT",
      "dependencies": {
        "@solana/codecs-core": "5.5.1",
        "@solana/errors": "5.5.1"
      },
      "engines": {
        "node": ">=20.18.0"
      },
      "peerDependencies": {
        "typescript": "^5.0.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@solana/keys": {
      "version": "5.5.1",
      "resolved": "https://registry.npmjs.org/@solana/keys/-/keys-5.5.1.tgz",
      "integrity": "sha512-KRD61cL7CRL+b4r/eB9dEoVxIf/2EJ1Pm1DmRYhtSUAJD2dJ5Xw8QFuehobOGm9URqQ7gaQl+Fkc1qvDlsWqKg==",
      "license": "MIT",
      "dependencies": {
        "@solana/assertions": "5.5.1",
        "@solana/codecs-core": "5.5.1",
        "@solana/codecs-strings": "5.5.1",
        "@solana/errors": "5.5.1",
        "@solana/nominal-types": "5.5.1"
      },
      "engines": {
        "node": ">=20.18.0"
      },
      "peerDependencies": {
        "typescript": "^5.0.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@solana/kit": {
      "version": "5.5.1",
      "resolved": "https://registry.npmjs.org/@solana/kit/-/kit-5.5.1.tgz",
      "integrity": "sha512-irKUGiV2yRoyf+4eGQ/ZeCRxa43yjFEL1DUI5B0DkcfZw3cr0VJtVJnrG8OtVF01vT0OUfYOcUn6zJW5TROHvQ==",
      "license": "MIT",
      "dependencies": {
        "@solana/accounts": "5.5.1",
        "@solana/addresses": "5.5.1",
        "@solana/codecs": "5.5.1",
        "@solana/errors": "5.5.1",
        "@solana/functional": "5.5.1",
        "@solana/instruction-plans": "5.5.1",
        "@solana/instructions": "5.5.1",
        "@solana/keys": "5.5.1",
        "@solana/offchain-messages": "5.5.1",
        "@solana/plugin-core": "5.5.1",
        "@solana/programs": "5.5.1",
        "@solana/rpc": "5.5.1",
        "@solana/rpc-api": "5.5.1",
        "@solana/rpc-parsed-types": "5.5.1",
        "@solana/rpc-spec-types": "5.5.1",
        "@solana/rpc-subscriptions": "5.5.1",
        "@solana/rpc-types": "5.5.1",
        "@solana/signers": "5.5.1",
        "@solana/sysvars": "5.5.1",
        "@solana/transaction-confirmation": "5.5.1",
        "@solana/transaction-messages": "5.5.1",
        "@solana/transactions": "5.5.1"
      },
      "engines": {
        "node": ">=20.18.0"
      },
      "peerDependencies": {
        "typescript": "^5.0.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@solana/nominal-types": {
      "version": "5.5.1",
      "resolved": "https://registry.npmjs.org/@solana/nominal-types/-/nominal-types-5.5.1.tgz",
      "integrity": "sha512-I1ImR+kfrLFxN5z22UDiTWLdRZeKtU0J/pkWkO8qm/8WxveiwdIv4hooi8pb6JnlR4mSrWhq0pCIOxDYrL9GIQ==",
      "license": "MIT",
      "engines": {
        "node": ">=20.18.0"
      },
      "peerDependencies": {
        "typescript": "^5.0.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@solana/offchain-messages": {
      "version": "5.5.1",
      "resolved": "https://registry.npmjs.org/@solana/offchain-messages/-/offchain-messages-5.5.1.tgz",
      "integrity": "sha512-g+xHH95prTU+KujtbOzj8wn+C7ZNoiLhf3hj6nYq3MTyxOXtBEysguc97jJveUZG0K97aIKG6xVUlMutg5yxhw==",
      "license": "MIT",
      "dependencies": {
        "@solana/addresses": "5.5.1",
        "@solana/codecs-core": "5.5.1",
        "@solana/codecs-data-structures": "5.5.1",
        "@solana/codecs-numbers": "5.5.1",
        "@solana/codecs-strings": "5.5.1",
        "@solana/errors": "5.5.1",
        "@solana/keys": "5.5.1",
        "@solana/nominal-types": "5.5.1"
      },
      "engines": {
        "node": ">=20.18.0"
      },
      "peerDependencies": {
        "typescript": "^5.0.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@solana/options": {
      "version": "5.5.1",
      "resolved": "https://registry.npmjs.org/@solana/options/-/options-5.5.1.tgz",
      "integrity": "sha512-eo971c9iLNLmk+yOFyo7yKIJzJ/zou6uKpy6mBuyb/thKtS/haiKIc3VLhyTXty3OH2PW8yOlORJnv4DexJB8A==",
      "license": "MIT",
      "dependencies": {
        "@solana/codecs-core": "5.5.1",
        "@solana/codecs-data-structures": "5.5.1",
        "@solana/codecs-numbers": "5.5.1",
        "@solana/codecs-strings": "5.5.1",
        "@solana/errors": "5.5.1"
      },
      "engines": {
        "node": ">=20.18.0"
      },
      "peerDependencies": {
        "typescript": "^5.0.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@solana/plugin-core": {
      "version": "5.5.1",
      "resolved": "https://registry.npmjs.org/@solana/plugin-core/-/plugin-core-5.5.1.tgz",
      "integrity": "sha512-VUZl30lDQFJeiSyNfzU1EjYt2QZvoBFKEwjn1lilUJw7KgqD5z7mbV7diJhT+dLFs36i0OsjXvq5kSygn8YJ3A==",
      "license": "MIT",
      "engines": {
        "node": ">=20.18.0"
      },
      "peerDependencies": {
        "typescript": "^5.0.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@solana/programs": {
      "version": "5.5.1",
      "resolved": "https://registry.npmjs.org/@solana/programs/-/programs-5.5.1.tgz",
      "integrity": "sha512-7U9kn0Jsx1NuBLn5HRTFYh78MV4XN145Yc3WP/q5BlqAVNlMoU9coG5IUTJIG847TUqC1lRto3Dnpwm6T4YRpA==",
      "license": "MIT",
      "dependencies": {
        "@solana/addresses": "5.5.1",
        "@solana/errors": "5.5.1"
      },
      "engines": {
        "node": ">=20.18.0"
      },
      "peerDependencies": {
        "typescript": "^5.0.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@solana/promises": {
      "version": "5.5.1",
      "resolved": "https://registry.npmjs.org/@solana/promises/-/promises-5.5.1.tgz",
      "integrity": "sha512-T9lfuUYkGykJmppEcssNiCf6yiYQxJkhiLPP+pyAc2z84/7r3UVIb2tNJk4A9sucS66pzJnVHZKcZVGUUp6wzA==",
      "license": "MIT",
      "engines": {
        "node": ">=20.18.0"
      },
      "peerDependencies": {
        "typescript": "^5.0.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@solana/rpc": {
      "version": "5.5.1",
      "resolved": "https://registry.npmjs.org/@solana/rpc/-/rpc-5.5.1.tgz",
      "integrity": "sha512-ku8zTUMrkCWci66PRIBC+1mXepEnZH/q1f3ck0kJZ95a06bOTl5KU7HeXWtskkyefzARJ5zvCs54AD5nxjQJ+A==",
      "license": "MIT",
      "dependencies": {
        "@solana/errors": "5.5.1",
        "@solana/fast-stable-stringify": "5.5.1",
        "@solana/functional": "5.5.1",
        "@solana/rpc-api": "5.5.1",
        "@solana/rpc-spec": "5.5.1",
        "@solana/rpc-spec-types": "5.5.1",
        "@solana/rpc-transformers": "5.5.1",
        "@solana/rpc-transport-http": "5.5.1",
        "@solana/rpc-types": "5.5.1"
      },
      "engines": {
        "node": ">=20.18.0"
      },
      "peerDependencies": {
        "typescript": "^5.0.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@solana/rpc-api": {
      "version": "5.5.1",
      "resolved": "https://registry.npmjs.org/@solana/rpc-api/-/rpc-api-5.5.1.tgz",
      "integrity": "sha512-XWOQQPhKl06Vj0xi3RYHAc6oEQd8B82okYJ04K7N0Vvy3J4PN2cxeK7klwkjgavdcN9EVkYCChm2ADAtnztKnA==",
      "license": "MIT",
      "dependencies": {
        "@solana/addresses": "5.5.1",
        "@solana/codecs-core": "5.5.1",
        "@solana/codecs-strings": "5.5.1",
        "@solana/errors": "5.5.1",
        "@solana/keys": "5.5.1",
        "@solana/rpc-parsed-types": "5.5.1",
        "@solana/rpc-spec": "5.5.1",
        "@solana/rpc-transformers": "5.5.1",
        "@solana/rpc-types": "5.5.1",
        "@solana/transaction-messages": "5.5.1",
        "@solana/transactions": "5.5.1"
      },
      "engines": {
        "node": ">=20.18.0"
      },
      "peerDependencies": {
        "typescript": "^5.0.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@solana/rpc-parsed-types": {
      "version": "5.5.1",
      "resolved": "https://registry.npmjs.org/@solana/rpc-parsed-types/-/rpc-parsed-types-5.5.1.tgz",
      "integrity": "sha512-HEi3G2nZqGEsa3vX6U0FrXLaqnUCg4SKIUrOe8CezD+cSFbRTOn3rCLrUmJrhVyXlHoQVaRO9mmeovk31jWxJg==",
      "license": "MIT",
      "engines": {
        "node": ">=20.18.0"
      },
      "peerDependencies": {
        "typescript": "^5.0.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@solana/rpc-spec": {
      "version": "5.5.1",
      "resolved": "https://registry.npmjs.org/@solana/rpc-spec/-/rpc-spec-5.5.1.tgz",
      "integrity": "sha512-m3LX2bChm3E3by4mQrH4YwCAFY57QBzuUSWqlUw7ChuZ+oLLOq7b2czi4i6L4Vna67j3eCmB3e+4tqy1j5wy7Q==",
      "license": "MIT",
      "dependencies": {
        "@solana/errors": "5.5.1",
        "@solana/rpc-spec-types": "5.5.1"
      },
      "engines": {
        "node": ">=20.18.0"
      },
      "peerDependencies": {
        "typescript": "^5.0.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@solana/rpc-spec-types": {
      "version": "5.5.1",
      "resolved": "https://registry.npmjs.org/@solana/rpc-spec-types/-/rpc-spec-types-5.5.1.tgz",
      "integrity": "sha512-6OFKtRpIEJQs8Jb2C4OO8KyP2h2Hy1MFhatMAoXA+0Ik8S3H+CicIuMZvGZ91mIu/tXicuOOsNNLu3HAkrakrw==",
      "license": "MIT",
      "engines": {
        "node": ">=20.18.0"
      },
      "peerDependencies": {
        "typescript": "^5.0.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@solana/rpc-subscriptions": {
      "version": "5.5.1",
      "resolved": "https://registry.npmjs.org/@solana/rpc-subscriptions/-/rpc-subscriptions-5.5.1.tgz",
      "integrity": "sha512-CTMy5bt/6mDh4tc6vUJms9EcuZj3xvK0/xq8IQ90rhkpYvate91RjBP+egvjgSayUg9yucU9vNuUpEjz4spM7w==",
      "license": "MIT",
      "dependencies": {
        "@solana/errors": "5.5.1",
        "@solana/fast-stable-stringify": "5.5.1",
        "@solana/functional": "5.5.1",
        "@solana/promises": "5.5.1",
        "@solana/rpc-spec-types": "5.5.1",
        "@solana/rpc-subscriptions-api": "5.5.1",
        "@solana/rpc-subscriptions-channel-websocket": "5.5.1",
        "@solana/rpc-subscriptions-spec": "5.5.1",
        "@solana/rpc-transformers": "5.5.1",
        "@solana/rpc-types": "5.5.1",
        "@solana/subscribable": "5.5.1"
      },
      "engines": {
        "node": ">=20.18.0"
      },
      "peerDependencies": {
        "typescript": "^5.0.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@solana/rpc-subscriptions-api": {
      "version": "5.5.1",
      "resolved": "https://registry.npmjs.org/@solana/rpc-subscriptions-api/-/rpc-subscriptions-api-5.5.1.tgz",
      "integrity": "sha512-5Oi7k+GdeS8xR2ly1iuSFkAv6CZqwG0Z6b1QZKbEgxadE1XGSDrhM2cn59l+bqCozUWCqh4c/A2znU/qQjROlw==",
      "license": "MIT",
      "dependencies": {
        "@solana/addresses": "5.5.1",
        "@solana/keys": "5.5.1",
        "@solana/rpc-subscriptions-spec": "5.5.1",
        "@solana/rpc-transformers": "5.5.1",
        "@solana/rpc-types": "5.5.1",
        "@solana/transaction-messages": "5.5.1",
        "@solana/transactions": "5.5.1"
      },
      "engines": {
        "node": ">=20.18.0"
      },
      "peerDependencies": {
        "typescript": "^5.0.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@solana/rpc-subscriptions-channel-websocket": {
      "version": "5.5.1",
      "resolved": "https://registry.npmjs.org/@solana/rpc-subscriptions-channel-websocket/-/rpc-subscriptions-channel-websocket-5.5.1.tgz",
      "integrity": "sha512-7tGfBBrYY8TrngOyxSHoCU5shy86iA9SRMRrPSyBhEaZRAk6dnbdpmUTez7gtdVo0BCvh9nzQtUycKWSS7PnFQ==",
      "license": "MIT",
      "dependencies": {
        "@solana/errors": "5.5.1",
        "@solana/functional": "5.5.1",
        "@solana/rpc-subscriptions-spec": "5.5.1",
        "@solana/subscribable": "5.5.1",
        "ws": "^8.19.0"
      },
      "engines": {
        "node": ">=20.18.0"
      },
      "peerDependencies": {
        "typescript": "^5.0.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@solana/rpc-subscriptions-spec": {
      "version": "5.5.1",
      "resolved": "https://registry.npmjs.org/@solana/rpc-subscriptions-spec/-/rpc-subscriptions-spec-5.5.1.tgz",
      "integrity": "sha512-iq+rGq5fMKP3/mKHPNB6MC8IbVW41KGZg83Us/+LE3AWOTWV1WT20KT2iH1F1ik9roi42COv/TpoZZvhKj45XQ==",
      "license": "MIT",
      "dependencies": {
        "@solana/errors": "5.5.1",
        "@solana/promises": "5.5.1",
        "@solana/rpc-spec-types": "5.5.1",
        "@solana/subscribable": "5.5.1"
      },
      "engines": {
        "node": ">=20.18.0"
      },
      "peerDependencies": {
        "typescript": "^5.0.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@solana/rpc-transformers": {
      "version": "5.5.1",
      "resolved": "https://registry.npmjs.org/@solana/rpc-transformers/-/rpc-transformers-5.5.1.tgz",
      "integrity": "sha512-OsWqLCQdcrRJKvHiMmwFhp9noNZ4FARuMkHT5us3ustDLXaxOjF0gfqZLnMkulSLcKt7TGXqMhBV+HCo7z5M8Q==",
      "license": "MIT",
      "dependencies": {
        "@solana/errors": "5.5.1",
        "@solana/functional": "5.5.1",
        "@solana/nominal-types": "5.5.1",
        "@solana/rpc-spec-types": "5.5.1",
        "@solana/rpc-types": "5.5.1"
      },
      "engines": {
        "node": ">=20.18.0"
      },
      "peerDependencies": {
        "typescript": "^5.0.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@solana/rpc-transport-http": {
      "version": "5.5.1",
      "resolved": "https://registry.npmjs.org/@solana/rpc-transport-http/-/rpc-transport-http-5.5.1.tgz",
      "integrity": "sha512-yv8GoVSHqEV0kUJEIhkdOVkR2SvJ6yoWC51cJn2rSV7plr6huLGe0JgujCmB7uZhhaLbcbP3zxXxu9sOjsi7Fg==",
      "license": "MIT",
      "dependencies": {
        "@solana/errors": "5.5.1",
        "@solana/rpc-spec": "5.5.1",
        "@solana/rpc-spec-types": "5.5.1",
        "undici-types": "^7.19.2"
      },
      "engines": {
        "node": ">=20.18.0"
      },
      "peerDependencies": {
        "typescript": "^5.0.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@solana/rpc-types": {
      "version": "5.5.1",
      "resolved": "https://registry.npmjs.org/@solana/rpc-types/-/rpc-types-5.5.1.tgz",
      "integrity": "sha512-bibTFQ7PbHJJjGJPmfYC2I+/5CRFS4O2p9WwbFraX1Keeel+nRrt/NBXIy8veP5AEn2sVJIyJPpWBRpCx1oATA==",
      "license": "MIT",
      "dependencies": {
        "@solana/addresses": "5.5.1",
        "@solana/codecs-core": "5.5.1",
        "@solana/codecs-numbers": "5.5.1",
        "@solana/codecs-strings": "5.5.1",
        "@solana/errors": "5.5.1",
        "@solana/nominal-types": "5.5.1"
      },
      "engines": {
        "node": ">=20.18.0"
      },
      "peerDependencies": {
        "typescript": "^5.0.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@solana/signers": {
      "version": "5.5.1",
      "resolved": "https://registry.npmjs.org/@solana/signers/-/signers-5.5.1.tgz",
      "integrity": "sha512-FY0IVaBT2kCAze55vEieR6hag4coqcuJ31Aw3hqRH7mv6sV8oqwuJmUrx+uFwOp1gwd5OEAzlv6N4hOOple4sQ==",
      "license": "MIT",
      "dependencies": {
        "@solana/addresses": "5.5.1",
        "@solana/codecs-core": "5.5.1",
        "@solana/errors": "5.5.1",
        "@solana/instructions": "5.5.1",
        "@solana/keys": "5.5.1",
        "@solana/nominal-types": "5.5.1",
        "@solana/offchain-messages": "5.5.1",
        "@solana/transaction-messages": "5.5.1",
        "@solana/transactions": "5.5.1"
      },
      "engines": {
        "node": ">=20.18.0"
      },
      "peerDependencies": {
        "typescript": "^5.0.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@solana/subscribable": {
      "version": "5.5.1",
      "resolved": "https://registry.npmjs.org/@solana/subscribable/-/subscribable-5.5.1.tgz",
      "integrity": "sha512-9K0PsynFq0CsmK1CDi5Y2vUIJpCqkgSS5yfDN0eKPgHqEptLEaia09Kaxc90cSZDZU5mKY/zv1NBmB6Aro9zQQ==",
      "license": "MIT",
      "dependencies": {
        "@solana/errors": "5.5.1"
      },
      "engines": {
        "node": ">=20.18.0"
      },
      "peerDependencies": {
        "typescript": "^5.0.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@solana/sysvars": {
      "version": "5.5.1",
      "resolved": "https://registry.npmjs.org/@solana/sysvars/-/sysvars-5.5.1.tgz",
      "integrity": "sha512-k3Quq87Mm+geGUu1GWv6knPk0ALsfY6EKSJGw9xUJDHzY/RkYSBnh0RiOrUhtFm2TDNjOailg8/m0VHmi3reFA==",
      "license": "MIT",
      "dependencies": {
        "@solana/accounts": "5.5.1",
        "@solana/codecs": "5.5.1",
        "@solana/errors": "5.5.1",
        "@solana/rpc-types": "5.5.1"
      },
      "engines": {
        "node": ">=20.18.0"
      },
      "peerDependencies": {
        "typescript": "^5.0.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@solana/transaction-confirmation": {
      "version": "5.5.1",
      "resolved": "https://registry.npmjs.org/@solana/transaction-confirmation/-/transaction-confirmation-5.5.1.tgz",
      "integrity": "sha512-j4mKlYPHEyu+OD7MBt3jRoX4ScFgkhZC6H65on4Fux6LMScgivPJlwnKoZMnsgxFgWds0pl+BYzSiALDsXlYtw==",
      "license": "MIT",
      "dependencies": {
        "@solana/addresses": "5.5.1",
        "@solana/codecs-strings": "5.5.1",
        "@solana/errors": "5.5.1",
        "@solana/keys": "5.5.1",
        "@solana/promises": "5.5.1",
        "@solana/rpc": "5.5.1",
        "@solana/rpc-subscriptions": "5.5.1",
        "@solana/rpc-types": "5.5.1",
        "@solana/transaction-messages": "5.5.1",
        "@solana/transactions": "5.5.1"
      },
      "engines": {
        "node": ">=20.18.0"
      },
      "peerDependencies": {
        "typescript": "^5.0.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@solana/transaction-messages": {
      "version": "5.5.1",
      "resolved": "https://registry.npmjs.org/@solana/transaction-messages/-/transaction-messages-5.5.1.tgz",
      "integrity": "sha512-aXyhMCEaAp3M/4fP0akwBBQkFPr4pfwoC5CLDq999r/FUwDax2RE/h4Ic7h2Xk+JdcUwsb+rLq85Y52hq84XvQ==",
      "license": "MIT",
      "dependencies": {
        "@solana/addresses": "5.5.1",
        "@solana/codecs-core": "5.5.1",
        "@solana/codecs-data-structures": "5.5.1",
        "@solana/codecs-numbers": "5.5.1",
        "@solana/errors": "5.5.1",
        "@solana/functional": "5.5.1",
        "@solana/instructions": "5.5.1",
        "@solana/nominal-types": "5.5.1",
        "@solana/rpc-types": "5.5.1"
      },
      "engines": {
        "node": ">=20.18.0"
      },
      "peerDependencies": {
        "typescript": "^5.0.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@solana/transactions": {
      "version": "5.5.1",
      "resolved": "https://registry.npmjs.org/@solana/transactions/-/transactions-5.5.1.tgz",
      "integrity": "sha512-8hHtDxtqalZ157pnx6p8k10D7J/KY/biLzfgh9R09VNLLY3Fqi7kJvJCr7M2ik3oRll56pxhraAGCC9yIT6eOA==",
      "license": "MIT",
      "dependencies": {
        "@solana/addresses": "5.5.1",
        "@solana/codecs-core": "5.5.1",
        "@solana/codecs-data-structures": "5.5.1",
        "@solana/codecs-numbers": "5.5.1",
        "@solana/codecs-strings": "5.5.1",
        "@solana/errors": "5.5.1",
        "@solana/functional": "5.5.1",
        "@solana/instructions": "5.5.1",
        "@solana/keys": "5.5.1",
        "@solana/nominal-types": "5.5.1",
        "@solana/rpc-types": "5.5.1",
        "@solana/transaction-messages": "5.5.1"
      },
      "engines": {
        "node": ">=20.18.0"
      },
      "peerDependencies": {
        "typescript": "^5.0.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@standard-schema/spec": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@standard-schema/spec/-/spec-1.1.0.tgz",
      "integrity": "sha512-l2aFy5jALhniG5HgqrD6jXLi/rUWrKvqN/qJx6yoJsgKhblVd+iqqU4RCXavm/jPityDo5TCvKMnpjKnOriy0w==",
      "devOptional": true,
      "license": "MIT"
    },
    "node_modules/@tanstack/query-core": {
      "version": "5.100.8",
      "resolved": "https://registry.npmjs.org/@tanstack/query-core/-/query-core-5.100.8.tgz",
      "integrity": "sha512-ceYwSFOqjPwET5TA6IOYxzxlGc0ekyH/gfOtWkP0PX43rzX9bxW48Iuw8KAduKCToi4rJAQ6nRy2kAe8gszdmg==",
      "license": "MIT",
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/tannerlinsley"
      }
    },
    "node_modules/@tanstack/react-query": {
      "version": "5.100.8",
      "resolved": "https://registry.npmjs.org/@tanstack/react-query/-/react-query-5.100.8.tgz",
      "integrity": "sha512-iNNEekixXU5vtAGKKZX2lx3jTooG5yNY+kv0wSgEdEYG0Mj0JM5bcuQtC35ZAP3nDopT6jciUK3xeX65U7AnfA==",
      "license": "MIT",
      "dependencies": {
        "@tanstack/query-core": "5.100.8"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/tannerlinsley"
      },
      "peerDependencies": {
        "react": "^18 || ^19"
      }
    },
    "node_modules/@types/babel__core": {
      "version": "7.20.5",
      "resolved": "https://registry.npmjs.org/@types/babel__core/-/babel__core-7.20.5.tgz",
      "integrity": "sha512-qoQprZvz5wQFJwMDqeseRXWv3rqMvhgpbXFfVyWhbx9X47POIA6i/+dXefEmZKoAgOaTdaIgNSMqMIU61yRyzA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/parser": "^7.20.7",
        "@babel/types": "^7.20.7",
        "@types/babel__generator": "*",
        "@types/babel__template": "*",
        "@types/babel__traverse": "*"
      }
    },
    "node_modules/@types/babel__generator": {
      "version": "7.27.0",
      "resolved": "https://registry.npmjs.org/@types/babel__generator/-/babel__generator-7.27.0.tgz",
      "integrity": "sha512-ufFd2Xi92OAVPYsy+P4n7/U7e68fex0+Ee8gSG9KX7eo084CWiQ4sdxktvdl0bOPupXtVJPY19zk6EwWqUQ8lg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/types": "^7.0.0"
      }
    },
    "node_modules/@types/babel__template": {
      "version": "7.4.4",
      "resolved": "https://registry.npmjs.org/@types/babel__template/-/babel__template-7.4.4.tgz",
      "integrity": "sha512-h/NUaSyG5EyxBIp8YRxo4RMe2/qQgvyowRwVMzhYhBCONbW8PUsg4lkFMrhgZhUe5z3L3MiLDuvyJ/CaPa2A8A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/parser": "^7.1.0",
        "@babel/types": "^7.0.0"
      }
    },
    "node_modules/@types/babel__traverse": {
      "version": "7.28.0",
      "resolved": "https://registry.npmjs.org/@types/babel__traverse/-/babel__traverse-7.28.0.tgz",
      "integrity": "sha512-8PvcXf70gTDZBgt9ptxJ8elBeBjcLOAcOtoO/mPJjtji1+CdGbHgm77om1GrsPxsiE+uXIpNSK64UYaIwQXd4Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/types": "^7.28.2"
      }
    },
    "node_modules/@types/chai": {
      "version": "5.2.3",
      "resolved": "https://registry.npmjs.org/@types/chai/-/chai-5.2.3.tgz",
      "integrity": "sha512-Mw558oeA9fFbv65/y4mHtXDs9bPnFMZAL/jxdPFUpOHHIXX91mcgEHbS5Lahr+pwZFR8A7GQleRWeI6cGFC2UA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/deep-eql": "*",
        "assertion-error": "^2.0.1"
      }
    },
    "node_modules/@types/debug": {
      "version": "4.1.13",
      "resolved": "https://registry.npmjs.org/@types/debug/-/debug-4.1.13.tgz",
      "integrity": "sha512-KSVgmQmzMwPlmtljOomayoR89W4FynCAi3E8PPs7vmDVPe84hT+vGPKkJfThkmXs0x0jAaa9U8uW8bbfyS2fWw==",
      "license": "MIT",
      "dependencies": {
        "@types/ms": "*"
      }
    },
    "node_modules/@types/deep-eql": {
      "version": "4.0.2",
      "resolved": "https://registry.npmjs.org/@types/deep-eql/-/deep-eql-4.0.2.tgz",
      "integrity": "sha512-c9h9dVVMigMPc4bwTvC5dxqtqJZwQPePsWjPlpSOnojbor6pGqdk541lfA7AqFQr5pB1BRdq0juY9db81BwyFw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@types/estree": {
      "version": "1.0.8",
      "resolved": "https://registry.npmjs.org/@types/estree/-/estree-1.0.8.tgz",
      "integrity": "sha512-dWHzHa2WqEXI/O1E9OjrocMTKJl2mSrEolh1Iomrv6U+JuNwaHXsXx9bLu5gG7BUWFIN0skIQJQ/L1rIex4X6w==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@types/lodash": {
      "version": "4.17.24",
      "resolved": "https://registry.npmjs.org/@types/lodash/-/lodash-4.17.24.tgz",
      "integrity": "sha512-gIW7lQLZbue7lRSWEFql49QJJWThrTFFeIMJdp3eH4tKoxm1OvEPg02rm4wCCSHS0cL3/Fizimb35b7k8atwsQ==",
      "license": "MIT"
    },
    "node_modules/@types/ms": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/@types/ms/-/ms-2.1.0.tgz",
      "integrity": "sha512-GsCCIZDE/p3i96vtEqx+7dBUGXrc7zeSK3wwPHIaRThS+9OhWIXRqzs4d6k1SVU8g91DrNRWxWUGhp5KXQb2VA==",
      "license": "MIT"
    },
    "node_modules/@types/node": {
      "version": "22.19.17",
      "resolved": "https://registry.npmjs.org/@types/node/-/node-22.19.17.tgz",
      "integrity": "sha512-wGdMcf+vPYM6jikpS/qhg6WiqSV/OhG+jeeHT/KlVqxYfD40iYJf9/AE1uQxVWFvU7MipKRkRv8NSHiCGgPr8Q==",
      "devOptional": true,
      "license": "MIT",
      "dependencies": {
        "undici-types": "~6.21.0"
      }
    },
    "node_modules/@types/node/node_modules/undici-types": {
      "version": "6.21.0",
      "resolved": "https://registry.npmjs.org/undici-types/-/undici-types-6.21.0.tgz",
      "integrity": "sha512-iwDZqg0QAGrg9Rav5H4n0M64c3mkR59cJ6wQp+7C4nI0gsmExaedaYLNO44eT4AtBBwjbTiGPMlt2Md0T9H9JQ==",
      "devOptional": true,
      "license": "MIT"
    },
    "node_modules/@types/prop-types": {
      "version": "15.7.15",
      "resolved": "https://registry.npmjs.org/@types/prop-types/-/prop-types-15.7.15.tgz",
      "integrity": "sha512-F6bEyamV9jKGAFBEmlQnesRPGOQqS2+Uwi0Em15xenOxHaf2hv6L8YCVn3rPdPJOiJfPiCnLIRyvwVaqMY3MIw==",
      "devOptional": true,
      "license": "MIT"
    },
    "node_modules/@types/react": {
      "version": "18.3.28",
      "resolved": "https://registry.npmjs.org/@types/react/-/react-18.3.28.tgz",
      "integrity": "sha512-z9VXpC7MWrhfWipitjNdgCauoMLRdIILQsAEV+ZesIzBq/oUlxk0m3ApZuMFCXdnS4U7KrI+l3WRUEGQ8K1QKw==",
      "devOptional": true,
      "license": "MIT",
      "dependencies": {
        "@types/prop-types": "*",
        "csstype": "^3.2.2"
      }
    },
    "node_modules/@types/react-dom": {
      "version": "18.3.7",
      "resolved": "https://registry.npmjs.org/@types/react-dom/-/react-dom-18.3.7.tgz",
      "integrity": "sha512-MEe3UeoENYVFXzoXEWsvcpg6ZvlrFNlOQ7EOsvhI3CfAXwzPfO8Qwuxd40nepsYKqyyVQnTdEfv68q91yLcKrQ==",
      "dev": true,
      "license": "MIT",
      "peerDependencies": {
        "@types/react": "^18.0.0"
      }
    },
    "node_modules/@types/trusted-types": {
      "version": "2.0.7",
      "resolved": "https://registry.npmjs.org/@types/trusted-types/-/trusted-types-2.0.7.tgz",
      "integrity": "sha512-ScaPdn1dQczgbl0QFTeTOmVHFULt394XJgOQNoyVhZ6r2vLnMLJfBPd53SB52T/3G36VI1/g2MZaX0cwDuXsfw==",
      "license": "MIT"
    },
    "node_modules/@vitejs/plugin-react": {
      "version": "4.7.0",
      "resolved": "https://registry.npmjs.org/@vitejs/plugin-react/-/plugin-react-4.7.0.tgz",
      "integrity": "sha512-gUu9hwfWvvEDBBmgtAowQCojwZmJ5mcLn3aufeCsitijs3+f2NsrPtlAWIR6OPiqljl96GVCUbLe0HyqIpVaoA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/core": "^7.28.0",
        "@babel/plugin-transform-react-jsx-self": "^7.27.1",
        "@babel/plugin-transform-react-jsx-source": "^7.27.1",
        "@rolldown/pluginutils": "1.0.0-beta.27",
        "@types/babel__core": "^7.20.5",
        "react-refresh": "^0.17.0"
      },
      "engines": {
        "node": "^14.18.0 || >=16.0.0"
      },
      "peerDependencies": {
        "vite": "^4.2.0 || ^5.0.0 || ^6.0.0 || ^7.0.0"
      }
    },
    "node_modules/@vitest/expect": {
      "version": "3.2.4",
      "resolved": "https://registry.npmjs.org/@vitest/expect/-/expect-3.2.4.tgz",
      "integrity": "sha512-Io0yyORnB6sikFlt8QW5K7slY4OjqNX9jmJQ02QDda8lyM6B5oNgVWoSoKPac8/kgnCUzuHQKrSLtu/uOqqrig==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/chai": "^5.2.2",
        "@vitest/spy": "3.2.4",
        "@vitest/utils": "3.2.4",
        "chai": "^5.2.0",
        "tinyrainbow": "^2.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/vitest"
      }
    },
    "node_modules/@vitest/mocker": {
      "version": "3.2.4",
      "resolved": "https://registry.npmjs.org/@vitest/mocker/-/mocker-3.2.4.tgz",
      "integrity": "sha512-46ryTE9RZO/rfDd7pEqFl7etuyzekzEhUbTW3BvmeO/BcCMEgq59BKhek3dXDWgAj4oMK6OZi+vRr1wPW6qjEQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@vitest/spy": "3.2.4",
        "estree-walker": "^3.0.3",
        "magic-string": "^0.30.17"
      },
      "funding": {
        "url": "https://opencollective.com/vitest"
      },
      "peerDependencies": {
        "msw": "^2.4.9",
        "vite": "^5.0.0 || ^6.0.0 || ^7.0.0-0"
      },
      "peerDependenciesMeta": {
        "msw": {
          "optional": true
        },
        "vite": {
          "optional": true
        }
      }
    },
    "node_modules/@vitest/pretty-format": {
      "version": "3.2.4",
      "resolved": "https://registry.npmjs.org/@vitest/pretty-format/-/pretty-format-3.2.4.tgz",
      "integrity": "sha512-IVNZik8IVRJRTr9fxlitMKeJeXFFFN0JaB9PHPGQ8NKQbGpfjlTx9zO4RefN8gp7eqjNy8nyK3NZmBzOPeIxtA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "tinyrainbow": "^2.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/vitest"
      }
    },
    "node_modules/@vitest/runner": {
      "version": "3.2.4",
      "resolved": "https://registry.npmjs.org/@vitest/runner/-/runner-3.2.4.tgz",
      "integrity": "sha512-oukfKT9Mk41LreEW09vt45f8wx7DordoWUZMYdY/cyAk7w5TWkTRCNZYF7sX7n2wB7jyGAl74OxgwhPgKaqDMQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@vitest/utils": "3.2.4",
        "pathe": "^2.0.3",
        "strip-literal": "^3.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/vitest"
      }
    },
    "node_modules/@vitest/snapshot": {
      "version": "3.2.4",
      "resolved": "https://registry.npmjs.org/@vitest/snapshot/-/snapshot-3.2.4.tgz",
      "integrity": "sha512-dEYtS7qQP2CjU27QBC5oUOxLE/v5eLkGqPE0ZKEIDGMs4vKWe7IjgLOeauHsR0D5YuuycGRO5oSRXnwnmA78fQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@vitest/pretty-format": "3.2.4",
        "magic-string": "^0.30.17",
        "pathe": "^2.0.3"
      },
      "funding": {
        "url": "https://opencollective.com/vitest"
      }
    },
    "node_modules/@vitest/spy": {
      "version": "3.2.4",
      "resolved": "https://registry.npmjs.org/@vitest/spy/-/spy-3.2.4.tgz",
      "integrity": "sha512-vAfasCOe6AIK70iP5UD11Ac4siNUNJ9i/9PZ3NKx07sG6sUxeag1LWdNrMWeKKYBLlzuK+Gn65Yd5nyL6ds+nw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "tinyspy": "^4.0.3"
      },
      "funding": {
        "url": "https://opencollective.com/vitest"
      }
    },
    "node_modules/@vitest/utils": {
      "version": "3.2.4",
      "resolved": "https://registry.npmjs.org/@vitest/utils/-/utils-3.2.4.tgz",
      "integrity": "sha512-fB2V0JFrQSMsCo9HiSq3Ezpdv4iYaXRG1Sx8edX3MwxfyNn83mKiGzOcH+Fkxt4MHxr3y42fQi1oeAInqgX2QA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@vitest/pretty-format": "3.2.4",
        "loupe": "^3.1.4",
        "tinyrainbow": "^2.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/vitest"
      }
    },
    "node_modules/@wagmi/connectors": {
      "version": "6.2.0",
      "resolved": "https://registry.npmjs.org/@wagmi/connectors/-/connectors-6.2.0.tgz",
      "integrity": "sha512-2NfkbqhNWdjfibb4abRMrn7u6rPjEGolMfApXss6HCDVt9AW2oVC6k8Q5FouzpJezElxLJSagWz9FW1zaRlanA==",
      "license": "MIT",
      "dependencies": {
        "@base-org/account": "2.4.0",
        "@coinbase/wallet-sdk": "4.3.6",
        "@gemini-wallet/core": "0.3.2",
        "@metamask/sdk": "0.33.1",
        "@safe-global/safe-apps-provider": "0.18.6",
        "@safe-global/safe-apps-sdk": "9.1.0",
        "@walletconnect/ethereum-provider": "2.21.1",
        "cbw-sdk": "npm:@coinbase/wallet-sdk@3.9.3",
        "porto": "0.2.35"
      },
      "funding": {
        "url": "https://github.com/sponsors/wevm"
      },
      "peerDependencies": {
        "@wagmi/core": "2.22.1",
        "typescript": ">=5.0.4",
        "viem": "2.x"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@wagmi/connectors/node_modules/@base-org/account": {
      "version": "2.4.0",
      "resolved": "https://registry.npmjs.org/@base-org/account/-/account-2.4.0.tgz",
      "integrity": "sha512-A4Umpi8B9/pqR78D1Yoze4xHyQaujioVRqqO3d6xuDFw9VRtjg6tK3bPlwE0aW+nVH/ntllCpPa2PbI8Rnjcug==",
      "license": "Apache-2.0",
      "dependencies": {
        "@coinbase/cdp-sdk": "^1.0.0",
        "@noble/hashes": "1.4.0",
        "clsx": "1.2.1",
        "eventemitter3": "5.0.1",
        "idb-keyval": "6.2.1",
        "ox": "0.6.9",
        "preact": "10.24.2",
        "viem": "^2.31.7",
        "zustand": "5.0.3"
      }
    },
    "node_modules/@wagmi/connectors/node_modules/@noble/ciphers": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/@noble/ciphers/-/ciphers-1.3.0.tgz",
      "integrity": "sha512-2I0gnIVPtfnMw9ee9h1dJG7tp81+8Ob3OJb3Mv37rx5L40/b0i7djjCVvGOVqc9AEIQyvyu1i6ypKdFw8R8gQw==",
      "license": "MIT",
      "engines": {
        "node": "^14.21.3 || >=16"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@wagmi/connectors/node_modules/@noble/curves": {
      "version": "1.9.1",
      "resolved": "https://registry.npmjs.org/@noble/curves/-/curves-1.9.1.tgz",
      "integrity": "sha512-k11yZxZg+t+gWvBbIswW0yoJlu8cHOC7dhunwOzoWH/mXGBiYyR4YY6hAEK/3EUs4UpB8la1RfdRpeGsFHkWsA==",
      "license": "MIT",
      "dependencies": {
        "@noble/hashes": "1.8.0"
      },
      "engines": {
        "node": "^14.21.3 || >=16"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@wagmi/connectors/node_modules/@noble/curves/node_modules/@noble/hashes": {
      "version": "1.8.0",
      "resolved": "https://registry.npmjs.org/@noble/hashes/-/hashes-1.8.0.tgz",
      "integrity": "sha512-jCs9ldd7NwzpgXDIf6P3+NrHh9/sD6CQdxHyjQI+h/6rDNo88ypBxxz45UDuZHz9r3tNz7N/VInSVoVdtXEI4A==",
      "license": "MIT",
      "engines": {
        "node": "^14.21.3 || >=16"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@wagmi/connectors/node_modules/@noble/hashes": {
      "version": "1.4.0",
      "resolved": "https://registry.npmjs.org/@noble/hashes/-/hashes-1.4.0.tgz",
      "integrity": "sha512-V1JJ1WTRUqHHrOSh597hURcMqVKVGL/ea3kv0gSnEdsEZ0/+VyPghM1lMNGc00z7CIQorSvbKpuJkxvuHbvdbg==",
      "license": "MIT",
      "engines": {
        "node": ">= 16"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@wagmi/connectors/node_modules/abitype": {
      "version": "1.2.4",
      "resolved": "https://registry.npmjs.org/abitype/-/abitype-1.2.4.tgz",
      "integrity": "sha512-dpKH+N27vRjarMVTFFkeY445VTKftzGWpL0FiT7xmVmzQRKazZexzC5uHG0f6XKsVLAuUlndnbGau6lRejClxg==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/wevm"
      },
      "peerDependencies": {
        "typescript": ">=5.0.4",
        "zod": "^3.22.0 || ^4.0.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        },
        "zod": {
          "optional": true
        }
      }
    },
    "node_modules/@wagmi/connectors/node_modules/porto": {
      "version": "0.2.35",
      "resolved": "https://registry.npmjs.org/porto/-/porto-0.2.35.tgz",
      "integrity": "sha512-gu9FfjjvvYBgQXUHWTp6n3wkTxVtEcqFotM7i3GEZeoQbvLGbssAicCz6hFZ8+xggrJWwi/RLmbwNra50SMmUQ==",
      "license": "MIT",
      "dependencies": {
        "hono": "^4.10.3",
        "idb-keyval": "^6.2.1",
        "mipd": "^0.0.7",
        "ox": "^0.9.6",
        "zod": "^4.1.5",
        "zustand": "^5.0.1"
      },
      "bin": {
        "porto": "dist/cli/bin/index.js"
      },
      "peerDependencies": {
        "@tanstack/react-query": ">=5.59.0",
        "@wagmi/core": ">=2.16.3",
        "expo-auth-session": ">=7.0.8",
        "expo-crypto": ">=15.0.7",
        "expo-web-browser": ">=15.0.8",
        "react": ">=18",
        "react-native": ">=0.81.4",
        "typescript": ">=5.4.0",
        "viem": ">=2.37.0",
        "wagmi": ">=2.0.0"
      },
      "peerDependenciesMeta": {
        "@tanstack/react-query": {
          "optional": true
        },
        "expo-auth-session": {
          "optional": true
        },
        "expo-crypto": {
          "optional": true
        },
        "expo-web-browser": {
          "optional": true
        },
        "react": {
          "optional": true
        },
        "react-native": {
          "optional": true
        },
        "typescript": {
          "optional": true
        },
        "wagmi": {
          "optional": true
        }
      }
    },
    "node_modules/@wagmi/connectors/node_modules/porto/node_modules/@noble/hashes": {
      "version": "1.8.0",
      "resolved": "https://registry.npmjs.org/@noble/hashes/-/hashes-1.8.0.tgz",
      "integrity": "sha512-jCs9ldd7NwzpgXDIf6P3+NrHh9/sD6CQdxHyjQI+h/6rDNo88ypBxxz45UDuZHz9r3tNz7N/VInSVoVdtXEI4A==",
      "license": "MIT",
      "engines": {
        "node": "^14.21.3 || >=16"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@wagmi/connectors/node_modules/porto/node_modules/ox": {
      "version": "0.9.17",
      "resolved": "https://registry.npmjs.org/ox/-/ox-0.9.17.tgz",
      "integrity": "sha512-rKAnhzhRU3Xh3hiko+i1ZxywZ55eWQzeS/Q4HRKLx2PqfHOolisZHErSsJVipGlmQKHW5qwOED/GighEw9dbLg==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/wevm"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "@adraffy/ens-normalize": "^1.11.0",
        "@noble/ciphers": "^1.3.0",
        "@noble/curves": "1.9.1",
        "@noble/hashes": "^1.8.0",
        "@scure/bip32": "^1.7.0",
        "@scure/bip39": "^1.6.0",
        "abitype": "^1.0.9",
        "eventemitter3": "5.0.1"
      },
      "peerDependencies": {
        "typescript": ">=5.4.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@wagmi/connectors/node_modules/zod": {
      "version": "4.4.2",
      "resolved": "https://registry.npmjs.org/zod/-/zod-4.4.2.tgz",
      "integrity": "sha512-IynmDyxsEsb9RKzO3J9+4SxXnl2FTFSzNBaKKaMV6tsSk0rw9gYw9gs+JFCq/qk2LCZ78KDwyj+Z289TijSkUw==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/colinhacks"
      }
    },
    "node_modules/@wagmi/core": {
      "version": "2.22.1",
      "resolved": "https://registry.npmjs.org/@wagmi/core/-/core-2.22.1.tgz",
      "integrity": "sha512-cG/xwQWsBEcKgRTkQVhH29cbpbs/TdcUJVFXCyri3ZknxhMyGv0YEjTcrNpRgt2SaswL1KrvslSNYKKo+5YEAg==",
      "license": "MIT",
      "dependencies": {
        "eventemitter3": "5.0.1",
        "mipd": "0.0.7",
        "zustand": "5.0.0"
      },
      "funding": {
        "url": "https://github.com/sponsors/wevm"
      },
      "peerDependencies": {
        "@tanstack/query-core": ">=5.0.0",
        "typescript": ">=5.0.4",
        "viem": "2.x"
      },
      "peerDependenciesMeta": {
        "@tanstack/query-core": {
          "optional": true
        },
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@wagmi/core/node_modules/zustand": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/zustand/-/zustand-5.0.0.tgz",
      "integrity": "sha512-LE+VcmbartOPM+auOjCCLQOsQ05zUTp8RkgwRzefUk+2jISdMMFnxvyTjA4YNWr5ZGXYbVsEMZosttuxUBkojQ==",
      "license": "MIT",
      "engines": {
        "node": ">=12.20.0"
      },
      "peerDependencies": {
        "@types/react": ">=18.0.0",
        "immer": ">=9.0.6",
        "react": ">=18.0.0",
        "use-sync-external-store": ">=1.2.0"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "immer": {
          "optional": true
        },
        "react": {
          "optional": true
        },
        "use-sync-external-store": {
          "optional": true
        }
      }
    },
    "node_modules/@walletconnect/core": {
      "version": "2.21.1",
      "resolved": "https://registry.npmjs.org/@walletconnect/core/-/core-2.21.1.tgz",
      "integrity": "sha512-Tp4MHJYcdWD846PH//2r+Mu4wz1/ZU/fr9av1UWFiaYQ2t2TPLDiZxjLw54AAEpMqlEHemwCgiRiAmjR1NDdTQ==",
      "license": "Apache-2.0",
      "dependencies": {
        "@walletconnect/heartbeat": "1.2.2",
        "@walletconnect/jsonrpc-provider": "1.0.14",
        "@walletconnect/jsonrpc-types": "1.0.4",
        "@walletconnect/jsonrpc-utils": "1.0.8",
        "@walletconnect/jsonrpc-ws-connection": "1.0.16",
        "@walletconnect/keyvaluestorage": "1.1.1",
        "@walletconnect/logger": "2.1.2",
        "@walletconnect/relay-api": "1.0.11",
        "@walletconnect/relay-auth": "1.1.0",
        "@walletconnect/safe-json": "1.0.2",
        "@walletconnect/time": "1.0.2",
        "@walletconnect/types": "2.21.1",
        "@walletconnect/utils": "2.21.1",
        "@walletconnect/window-getters": "1.0.1",
        "es-toolkit": "1.33.0",
        "events": "3.3.0",
        "uint8arrays": "3.1.0"
      },
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@walletconnect/core/node_modules/@walletconnect/keyvaluestorage": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@walletconnect/keyvaluestorage/-/keyvaluestorage-1.1.1.tgz",
      "integrity": "sha512-V7ZQq2+mSxAq7MrRqDxanTzu2RcElfK1PfNYiaVnJgJ7Q7G7hTVwF8voIBx92qsRyGHZihrwNPHuZd1aKkd0rA==",
      "license": "MIT",
      "dependencies": {
        "@walletconnect/safe-json": "^1.0.1",
        "idb-keyval": "^6.2.1",
        "unstorage": "^1.9.0"
      },
      "peerDependencies": {
        "@react-native-async-storage/async-storage": "1.x"
      },
      "peerDependenciesMeta": {
        "@react-native-async-storage/async-storage": {
          "optional": true
        }
      }
    },
    "node_modules/@walletconnect/core/node_modules/chokidar": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/chokidar/-/chokidar-5.0.0.tgz",
      "integrity": "sha512-TQMmc3w+5AxjpL8iIiwebF73dRDF4fBIieAqGn9RGCWaEVwQ6Fb2cGe31Yns0RRIzii5goJ1Y7xbMwo1TxMplw==",
      "license": "MIT",
      "dependencies": {
        "readdirp": "^5.0.0"
      },
      "engines": {
        "node": ">= 20.19.0"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@walletconnect/core/node_modules/lru-cache": {
      "version": "11.3.5",
      "resolved": "https://registry.npmjs.org/lru-cache/-/lru-cache-11.3.5.tgz",
      "integrity": "sha512-NxVFwLAnrd9i7KUBxC4DrUhmgjzOs+1Qm50D3oF1/oL+r1NpZ4gA7xvG0/zJ8evR7zIKn4vLf7qTNduWFtCrRw==",
      "license": "BlueOak-1.0.0",
      "engines": {
        "node": "20 || >=22"
      }
    },
    "node_modules/@walletconnect/core/node_modules/readdirp": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/readdirp/-/readdirp-5.0.0.tgz",
      "integrity": "sha512-9u/XQ1pvrQtYyMpZe7DXKv2p5CNvyVwzUB6uhLAnQwHMSgKMBR62lc7AHljaeteeHXn11XTAaLLUVZYVZyuRBQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 20.19.0"
      },
      "funding": {
        "type": "individual",
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@walletconnect/core/node_modules/unstorage": {
      "version": "1.17.5",
      "resolved": "https://registry.npmjs.org/unstorage/-/unstorage-1.17.5.tgz",
      "integrity": "sha512-0i3iqvRfx29hkNntHyQvJTpf5W9dQ9ZadSoRU8+xVlhVtT7jAX57fazYO9EHvcRCfBCyi5YRya7XCDOsbTgkPg==",
      "license": "MIT",
      "dependencies": {
        "anymatch": "^3.1.3",
        "chokidar": "^5.0.0",
        "destr": "^2.0.5",
        "h3": "^1.15.10",
        "lru-cache": "^11.2.7",
        "node-fetch-native": "^1.6.7",
        "ofetch": "^1.5.1",
        "ufo": "^1.6.3"
      },
      "peerDependencies": {
        "@azure/app-configuration": "^1.8.0",
        "@azure/cosmos": "^4.2.0",
        "@azure/data-tables": "^13.3.0",
        "@azure/identity": "^4.6.0",
        "@azure/keyvault-secrets": "^4.9.0",
        "@azure/storage-blob": "^12.26.0",
        "@capacitor/preferences": "^6 || ^7 || ^8",
        "@deno/kv": ">=0.9.0",
        "@netlify/blobs": "^6.5.0 || ^7.0.0 || ^8.1.0 || ^9.0.0 || ^10.0.0",
        "@planetscale/database": "^1.19.0",
        "@upstash/redis": "^1.34.3",
        "@vercel/blob": ">=0.27.1",
        "@vercel/functions": "^2.2.12 || ^3.0.0",
        "@vercel/kv": "^1 || ^2 || ^3",
        "aws4fetch": "^1.0.20",
        "db0": ">=0.2.1",
        "idb-keyval": "^6.2.1",
        "ioredis": "^5.4.2",
        "uploadthing": "^7.4.4"
      },
      "peerDependenciesMeta": {
        "@azure/app-configuration": {
          "optional": true
        },
        "@azure/cosmos": {
          "optional": true
        },
        "@azure/data-tables": {
          "optional": true
        },
        "@azure/identity": {
          "optional": true
        },
        "@azure/keyvault-secrets": {
          "optional": true
        },
        "@azure/storage-blob": {
          "optional": true
        },
        "@capacitor/preferences": {
          "optional": true
        },
        "@deno/kv": {
          "optional": true
        },
        "@netlify/blobs": {
          "optional": true
        },
        "@planetscale/database": {
          "optional": true
        },
        "@upstash/redis": {
          "optional": true
        },
        "@vercel/blob": {
          "optional": true
        },
        "@vercel/functions": {
          "optional": true
        },
        "@vercel/kv": {
          "optional": true
        },
        "aws4fetch": {
          "optional": true
        },
        "db0": {
          "optional": true
        },
        "idb-keyval": {
          "optional": true
        },
        "ioredis": {
          "optional": true
        },
        "uploadthing": {
          "optional": true
        }
      }
    },
    "node_modules/@walletconnect/environment": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/@walletconnect/environment/-/environment-1.0.1.tgz",
      "integrity": "sha512-T426LLZtHj8e8rYnKfzsw1aG6+M0BT1ZxayMdv/p8yM0MU+eJDISqNY3/bccxRr4LrF9csq02Rhqt08Ibl0VRg==",
      "license": "MIT",
      "dependencies": {
        "tslib": "1.14.1"
      }
    },
    "node_modules/@walletconnect/environment/node_modules/tslib": {
      "version": "1.14.1",
      "resolved": "https://registry.npmjs.org/tslib/-/tslib-1.14.1.tgz",
      "integrity": "sha512-Xni35NKzjgMrwevysHTCArtLDpPvye8zV/0E4EyYn43P7/7qvQwPh9BGkHewbMulVntbigmcT7rdX3BNo9wRJg==",
      "license": "0BSD"
    },
    "node_modules/@walletconnect/ethereum-provider": {
      "version": "2.21.1",
      "resolved": "https://registry.npmjs.org/@walletconnect/ethereum-provider/-/ethereum-provider-2.21.1.tgz",
      "integrity": "sha512-SSlIG6QEVxClgl1s0LMk4xr2wg4eT3Zn/Hb81IocyqNSGfXpjtawWxKxiC5/9Z95f1INyBD6MctJbL/R1oBwIw==",
      "deprecated": "Reliability and performance improvements. See: https://github.com/WalletConnect/walletconnect-monorepo/releases",
      "license": "Apache-2.0",
      "dependencies": {
        "@reown/appkit": "1.7.8",
        "@walletconnect/jsonrpc-http-connection": "1.0.8",
        "@walletconnect/jsonrpc-provider": "1.0.14",
        "@walletconnect/jsonrpc-types": "1.0.4",
        "@walletconnect/jsonrpc-utils": "1.0.8",
        "@walletconnect/keyvaluestorage": "1.1.1",
        "@walletconnect/sign-client": "2.21.1",
        "@walletconnect/types": "2.21.1",
        "@walletconnect/universal-provider": "2.21.1",
        "@walletconnect/utils": "2.21.1",
        "events": "3.3.0"
      }
    },
    "node_modules/@walletconnect/ethereum-provider/node_modules/@walletconnect/keyvaluestorage": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@walletconnect/keyvaluestorage/-/keyvaluestorage-1.1.1.tgz",
      "integrity": "sha512-V7ZQq2+mSxAq7MrRqDxanTzu2RcElfK1PfNYiaVnJgJ7Q7G7hTVwF8voIBx92qsRyGHZihrwNPHuZd1aKkd0rA==",
      "license": "MIT",
      "dependencies": {
        "@walletconnect/safe-json": "^1.0.1",
        "idb-keyval": "^6.2.1",
        "unstorage": "^1.9.0"
      },
      "peerDependencies": {
        "@react-native-async-storage/async-storage": "1.x"
      },
      "peerDependenciesMeta": {
        "@react-native-async-storage/async-storage": {
          "optional": true
        }
      }
    },
    "node_modules/@walletconnect/ethereum-provider/node_modules/chokidar": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/chokidar/-/chokidar-5.0.0.tgz",
      "integrity": "sha512-TQMmc3w+5AxjpL8iIiwebF73dRDF4fBIieAqGn9RGCWaEVwQ6Fb2cGe31Yns0RRIzii5goJ1Y7xbMwo1TxMplw==",
      "license": "MIT",
      "dependencies": {
        "readdirp": "^5.0.0"
      },
      "engines": {
        "node": ">= 20.19.0"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@walletconnect/ethereum-provider/node_modules/lru-cache": {
      "version": "11.3.5",
      "resolved": "https://registry.npmjs.org/lru-cache/-/lru-cache-11.3.5.tgz",
      "integrity": "sha512-NxVFwLAnrd9i7KUBxC4DrUhmgjzOs+1Qm50D3oF1/oL+r1NpZ4gA7xvG0/zJ8evR7zIKn4vLf7qTNduWFtCrRw==",
      "license": "BlueOak-1.0.0",
      "engines": {
        "node": "20 || >=22"
      }
    },
    "node_modules/@walletconnect/ethereum-provider/node_modules/readdirp": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/readdirp/-/readdirp-5.0.0.tgz",
      "integrity": "sha512-9u/XQ1pvrQtYyMpZe7DXKv2p5CNvyVwzUB6uhLAnQwHMSgKMBR62lc7AHljaeteeHXn11XTAaLLUVZYVZyuRBQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 20.19.0"
      },
      "funding": {
        "type": "individual",
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@walletconnect/ethereum-provider/node_modules/unstorage": {
      "version": "1.17.5",
      "resolved": "https://registry.npmjs.org/unstorage/-/unstorage-1.17.5.tgz",
      "integrity": "sha512-0i3iqvRfx29hkNntHyQvJTpf5W9dQ9ZadSoRU8+xVlhVtT7jAX57fazYO9EHvcRCfBCyi5YRya7XCDOsbTgkPg==",
      "license": "MIT",
      "dependencies": {
        "anymatch": "^3.1.3",
        "chokidar": "^5.0.0",
        "destr": "^2.0.5",
        "h3": "^1.15.10",
        "lru-cache": "^11.2.7",
        "node-fetch-native": "^1.6.7",
        "ofetch": "^1.5.1",
        "ufo": "^1.6.3"
      },
      "peerDependencies": {
        "@azure/app-configuration": "^1.8.0",
        "@azure/cosmos": "^4.2.0",
        "@azure/data-tables": "^13.3.0",
        "@azure/identity": "^4.6.0",
        "@azure/keyvault-secrets": "^4.9.0",
        "@azure/storage-blob": "^12.26.0",
        "@capacitor/preferences": "^6 || ^7 || ^8",
        "@deno/kv": ">=0.9.0",
        "@netlify/blobs": "^6.5.0 || ^7.0.0 || ^8.1.0 || ^9.0.0 || ^10.0.0",
        "@planetscale/database": "^1.19.0",
        "@upstash/redis": "^1.34.3",
        "@vercel/blob": ">=0.27.1",
        "@vercel/functions": "^2.2.12 || ^3.0.0",
        "@vercel/kv": "^1 || ^2 || ^3",
        "aws4fetch": "^1.0.20",
        "db0": ">=0.2.1",
        "idb-keyval": "^6.2.1",
        "ioredis": "^5.4.2",
        "uploadthing": "^7.4.4"
      },
      "peerDependenciesMeta": {
        "@azure/app-configuration": {
          "optional": true
        },
        "@azure/cosmos": {
          "optional": true
        },
        "@azure/data-tables": {
          "optional": true
        },
        "@azure/identity": {
          "optional": true
        },
        "@azure/keyvault-secrets": {
          "optional": true
        },
        "@azure/storage-blob": {
          "optional": true
        },
        "@capacitor/preferences": {
          "optional": true
        },
        "@deno/kv": {
          "optional": true
        },
        "@netlify/blobs": {
          "optional": true
        },
        "@planetscale/database": {
          "optional": true
        },
        "@upstash/redis": {
          "optional": true
        },
        "@vercel/blob": {
          "optional": true
        },
        "@vercel/functions": {
          "optional": true
        },
        "@vercel/kv": {
          "optional": true
        },
        "aws4fetch": {
          "optional": true
        },
        "db0": {
          "optional": true
        },
        "idb-keyval": {
          "optional": true
        },
        "ioredis": {
          "optional": true
        },
        "uploadthing": {
          "optional": true
        }
      }
    },
    "node_modules/@walletconnect/events": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/@walletconnect/events/-/events-1.0.1.tgz",
      "integrity": "sha512-NPTqaoi0oPBVNuLv7qPaJazmGHs5JGyO8eEAk5VGKmJzDR7AHzD4k6ilox5kxk1iwiOnFopBOOMLs86Oa76HpQ==",
      "license": "MIT",
      "dependencies": {
        "keyvaluestorage-interface": "^1.0.0",
        "tslib": "1.14.1"
      }
    },
    "node_modules/@walletconnect/events/node_modules/tslib": {
      "version": "1.14.1",
      "resolved": "https://registry.npmjs.org/tslib/-/tslib-1.14.1.tgz",
      "integrity": "sha512-Xni35NKzjgMrwevysHTCArtLDpPvye8zV/0E4EyYn43P7/7qvQwPh9BGkHewbMulVntbigmcT7rdX3BNo9wRJg==",
      "license": "0BSD"
    },
    "node_modules/@walletconnect/heartbeat": {
      "version": "1.2.2",
      "resolved": "https://registry.npmjs.org/@walletconnect/heartbeat/-/heartbeat-1.2.2.tgz",
      "integrity": "sha512-uASiRmC5MwhuRuf05vq4AT48Pq8RMi876zV8rr8cV969uTOzWdB/k+Lj5yI2PBtB1bGQisGen7MM1GcZlQTBXw==",
      "license": "MIT",
      "dependencies": {
        "@walletconnect/events": "^1.0.1",
        "@walletconnect/time": "^1.0.2",
        "events": "^3.3.0"
      }
    },
    "node_modules/@walletconnect/jsonrpc-http-connection": {
      "version": "1.0.8",
      "resolved": "https://registry.npmjs.org/@walletconnect/jsonrpc-http-connection/-/jsonrpc-http-connection-1.0.8.tgz",
      "integrity": "sha512-+B7cRuaxijLeFDJUq5hAzNyef3e3tBDIxyaCNmFtjwnod5AGis3RToNqzFU33vpVcxFhofkpE7Cx+5MYejbMGw==",
      "license": "MIT",
      "dependencies": {
        "@walletconnect/jsonrpc-utils": "^1.0.6",
        "@walletconnect/safe-json": "^1.0.1",
        "cross-fetch": "^3.1.4",
        "events": "^3.3.0"
      }
    },
    "node_modules/@walletconnect/jsonrpc-http-connection/node_modules/cross-fetch": {
      "version": "3.2.0",
      "resolved": "https://registry.npmjs.org/cross-fetch/-/cross-fetch-3.2.0.tgz",
      "integrity": "sha512-Q+xVJLoGOeIMXZmbUK4HYk+69cQH6LudR0Vu/pRm2YlU/hDV9CiS0gKUMaWY5f2NeUH9C1nV3bsTlCo0FsTV1Q==",
      "license": "MIT",
      "dependencies": {
        "node-fetch": "^2.7.0"
      }
    },
    "node_modules/@walletconnect/jsonrpc-provider": {
      "version": "1.0.14",
      "resolved": "https://registry.npmjs.org/@walletconnect/jsonrpc-provider/-/jsonrpc-provider-1.0.14.tgz",
      "integrity": "sha512-rtsNY1XqHvWj0EtITNeuf8PHMvlCLiS3EjQL+WOkxEOA4KPxsohFnBDeyPYiNm4ZvkQdLnece36opYidmtbmow==",
      "license": "MIT",
      "dependencies": {
        "@walletconnect/jsonrpc-utils": "^1.0.8",
        "@walletconnect/safe-json": "^1.0.2",
        "events": "^3.3.0"
      }
    },
    "node_modules/@walletconnect/jsonrpc-types": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/@walletconnect/jsonrpc-types/-/jsonrpc-types-1.0.4.tgz",
      "integrity": "sha512-P6679fG/M+wuWg9TY8mh6xFSdYnFyFjwFelxyISxMDrlbXokorEVXYOxiqEbrU3x1BmBoCAJJ+vtEaEoMlpCBQ==",
      "license": "MIT",
      "dependencies": {
        "events": "^3.3.0",
        "keyvaluestorage-interface": "^1.0.0"
      }
    },
    "node_modules/@walletconnect/jsonrpc-utils": {
      "version": "1.0.8",
      "resolved": "https://registry.npmjs.org/@walletconnect/jsonrpc-utils/-/jsonrpc-utils-1.0.8.tgz",
      "integrity": "sha512-vdeb03bD8VzJUL6ZtzRYsFMq1eZQcM3EAzT0a3st59dyLfJ0wq+tKMpmGH7HlB7waD858UWgfIcudbPFsbzVdw==",
      "license": "MIT",
      "dependencies": {
        "@walletconnect/environment": "^1.0.1",
        "@walletconnect/jsonrpc-types": "^1.0.3",
        "tslib": "1.14.1"
      }
    },
    "node_modules/@walletconnect/jsonrpc-utils/node_modules/tslib": {
      "version": "1.14.1",
      "resolved": "https://registry.npmjs.org/tslib/-/tslib-1.14.1.tgz",
      "integrity": "sha512-Xni35NKzjgMrwevysHTCArtLDpPvye8zV/0E4EyYn43P7/7qvQwPh9BGkHewbMulVntbigmcT7rdX3BNo9wRJg==",
      "license": "0BSD"
    },
    "node_modules/@walletconnect/jsonrpc-ws-connection": {
      "version": "1.0.16",
      "resolved": "https://registry.npmjs.org/@walletconnect/jsonrpc-ws-connection/-/jsonrpc-ws-connection-1.0.16.tgz",
      "integrity": "sha512-G81JmsMqh5nJheE1mPst1W0WfVv0SG3N7JggwLLGnI7iuDZJq8cRJvQwLGKHn5H1WTW7DEPCo00zz5w62AbL3Q==",
      "license": "MIT",
      "dependencies": {
        "@walletconnect/jsonrpc-utils": "^1.0.6",
        "@walletconnect/safe-json": "^1.0.2",
        "events": "^3.3.0",
        "ws": "^7.5.1"
      }
    },
    "node_modules/@walletconnect/jsonrpc-ws-connection/node_modules/ws": {
      "version": "7.5.10",
      "resolved": "https://registry.npmjs.org/ws/-/ws-7.5.10.tgz",
      "integrity": "sha512-+dbF1tHwZpXcbOJdVOkzLDxZP1ailvSxM6ZweXTegylPny803bFhA+vqBYw4s31NSAk4S2Qz+AKXK9a4wkdjcQ==",
      "license": "MIT",
      "engines": {
        "node": ">=8.3.0"
      },
      "peerDependencies": {
        "bufferutil": "^4.0.1",
        "utf-8-validate": "^5.0.2"
      },
      "peerDependenciesMeta": {
        "bufferutil": {
          "optional": true
        },
        "utf-8-validate": {
          "optional": true
        }
      }
    },
    "node_modules/@walletconnect/logger": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/@walletconnect/logger/-/logger-2.1.2.tgz",
      "integrity": "sha512-aAb28I3S6pYXZHQm5ESB+V6rDqIYfsnHaQyzFbwUUBFY4H0OXx/YtTl8lvhUNhMMfb9UxbwEBS253TlXUYJWSw==",
      "license": "MIT",
      "dependencies": {
        "@walletconnect/safe-json": "^1.0.2",
        "pino": "7.11.0"
      }
    },
    "node_modules/@walletconnect/logger/node_modules/on-exit-leak-free": {
      "version": "0.2.0",
      "resolved": "https://registry.npmjs.org/on-exit-leak-free/-/on-exit-leak-free-0.2.0.tgz",
      "integrity": "sha512-dqaz3u44QbRXQooZLTUKU41ZrzYrcvLISVgbrzbyCMxpmSLJvZ3ZamIJIZ29P6OhZIkNIQKosdeM6t1LYbA9hg==",
      "license": "MIT"
    },
    "node_modules/@walletconnect/logger/node_modules/pino": {
      "version": "7.11.0",
      "resolved": "https://registry.npmjs.org/pino/-/pino-7.11.0.tgz",
      "integrity": "sha512-dMACeu63HtRLmCG8VKdy4cShCPKaYDR4youZqoSWLxl5Gu99HUw8bw75thbPv9Nip+H+QYX8o3ZJbTdVZZ2TVg==",
      "license": "MIT",
      "dependencies": {
        "atomic-sleep": "^1.0.0",
        "fast-redact": "^3.0.0",
        "on-exit-leak-free": "^0.2.0",
        "pino-abstract-transport": "v0.5.0",
        "pino-std-serializers": "^4.0.0",
        "process-warning": "^1.0.0",
        "quick-format-unescaped": "^4.0.3",
        "real-require": "^0.1.0",
        "safe-stable-stringify": "^2.1.0",
        "sonic-boom": "^2.2.1",
        "thread-stream": "^0.15.1"
      },
      "bin": {
        "pino": "bin.js"
      }
    },
    "node_modules/@walletconnect/logger/node_modules/pino-abstract-transport": {
      "version": "0.5.0",
      "resolved": "https://registry.npmjs.org/pino-abstract-transport/-/pino-abstract-transport-0.5.0.tgz",
      "integrity": "sha512-+KAgmVeqXYbTtU2FScx1XS3kNyfZ5TrXY07V96QnUSFqo2gAqlvmaxH67Lj7SWazqsMabf+58ctdTcBgnOLUOQ==",
      "license": "MIT",
      "dependencies": {
        "duplexify": "^4.1.2",
        "split2": "^4.0.0"
      }
    },
    "node_modules/@walletconnect/logger/node_modules/pino-std-serializers": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/pino-std-serializers/-/pino-std-serializers-4.0.0.tgz",
      "integrity": "sha512-cK0pekc1Kjy5w9V2/n+8MkZwusa6EyyxfeQCB799CQRhRt/CqYKiWs5adeu8Shve2ZNffvfC/7J64A2PJo1W/Q==",
      "license": "MIT"
    },
    "node_modules/@walletconnect/logger/node_modules/process-warning": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/process-warning/-/process-warning-1.0.0.tgz",
      "integrity": "sha512-du4wfLyj4yCZq1VupnVSZmRsPJsNuxoDQFdCFHLaYiEbFBD7QE0a+I4D7hOxrVnh78QE/YipFAj9lXHiXocV+Q==",
      "license": "MIT"
    },
    "node_modules/@walletconnect/logger/node_modules/real-require": {
      "version": "0.1.0",
      "resolved": "https://registry.npmjs.org/real-require/-/real-require-0.1.0.tgz",
      "integrity": "sha512-r/H9MzAWtrv8aSVjPCMFpDMl5q66GqtmmRkRjpHTsp4zBAa+snZyiQNlMONiUmEJcsnaw0wCauJ2GWODr/aFkg==",
      "license": "MIT",
      "engines": {
        "node": ">= 12.13.0"
      }
    },
    "node_modules/@walletconnect/logger/node_modules/sonic-boom": {
      "version": "2.8.0",
      "resolved": "https://registry.npmjs.org/sonic-boom/-/sonic-boom-2.8.0.tgz",
      "integrity": "sha512-kuonw1YOYYNOve5iHdSahXPOK49GqwA+LZhI6Wz/l0rP57iKyXXIHaRagOBHAPmGwJC6od2Z9zgvZ5loSgMlVg==",
      "license": "MIT",
      "dependencies": {
        "atomic-sleep": "^1.0.0"
      }
    },
    "node_modules/@walletconnect/logger/node_modules/thread-stream": {
      "version": "0.15.2",
      "resolved": "https://registry.npmjs.org/thread-stream/-/thread-stream-0.15.2.tgz",
      "integrity": "sha512-UkEhKIg2pD+fjkHQKyJO3yoIvAP3N6RlNFt2dUhcS1FGvCD1cQa1M/PGknCLFIyZdtJOWQjejp7bdNqmN7zwdA==",
      "license": "MIT",
      "dependencies": {
        "real-require": "^0.1.0"
      }
    },
    "node_modules/@walletconnect/relay-api": {
      "version": "1.0.11",
      "resolved": "https://registry.npmjs.org/@walletconnect/relay-api/-/relay-api-1.0.11.tgz",
      "integrity": "sha512-tLPErkze/HmC9aCmdZOhtVmYZq1wKfWTJtygQHoWtgg722Jd4homo54Cs4ak2RUFUZIGO2RsOpIcWipaua5D5Q==",
      "license": "MIT",
      "dependencies": {
        "@walletconnect/jsonrpc-types": "^1.0.2"
      }
    },
    "node_modules/@walletconnect/relay-auth": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@walletconnect/relay-auth/-/relay-auth-1.1.0.tgz",
      "integrity": "sha512-qFw+a9uRz26jRCDgL7Q5TA9qYIgcNY8jpJzI1zAWNZ8i7mQjaijRnWFKsCHAU9CyGjvt6RKrRXyFtFOpWTVmCQ==",
      "license": "MIT",
      "dependencies": {
        "@noble/curves": "1.8.0",
        "@noble/hashes": "1.7.0",
        "@walletconnect/safe-json": "^1.0.1",
        "@walletconnect/time": "^1.0.2",
        "uint8arrays": "^3.0.0"
      }
    },
    "node_modules/@walletconnect/relay-auth/node_modules/@noble/curves": {
      "version": "1.8.0",
      "resolved": "https://registry.npmjs.org/@noble/curves/-/curves-1.8.0.tgz",
      "integrity": "sha512-j84kjAbzEnQHaSIhRPUmB3/eVXu2k3dKPl2LOrR8fSOIL+89U+7lV117EWHtq/GHM3ReGHM46iRBdZfpc4HRUQ==",
      "license": "MIT",
      "dependencies": {
        "@noble/hashes": "1.7.0"
      },
      "engines": {
        "node": "^14.21.3 || >=16"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@walletconnect/relay-auth/node_modules/@noble/hashes": {
      "version": "1.7.0",
      "resolved": "https://registry.npmjs.org/@noble/hashes/-/hashes-1.7.0.tgz",
      "integrity": "sha512-HXydb0DgzTpDPwbVeDGCG1gIu7X6+AuU6Zl6av/E/KG8LMsvPntvq+w17CHRpKBmN6Ybdrt1eP3k4cj8DJa78w==",
      "license": "MIT",
      "engines": {
        "node": "^14.21.3 || >=16"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@walletconnect/safe-json": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/@walletconnect/safe-json/-/safe-json-1.0.2.tgz",
      "integrity": "sha512-Ogb7I27kZ3LPC3ibn8ldyUr5544t3/STow9+lzz7Sfo808YD7SBWk7SAsdBFlYgP2zDRy2hS3sKRcuSRM0OTmA==",
      "license": "MIT",
      "dependencies": {
        "tslib": "1.14.1"
      }
    },
    "node_modules/@walletconnect/safe-json/node_modules/tslib": {
      "version": "1.14.1",
      "resolved": "https://registry.npmjs.org/tslib/-/tslib-1.14.1.tgz",
      "integrity": "sha512-Xni35NKzjgMrwevysHTCArtLDpPvye8zV/0E4EyYn43P7/7qvQwPh9BGkHewbMulVntbigmcT7rdX3BNo9wRJg==",
      "license": "0BSD"
    },
    "node_modules/@walletconnect/sign-client": {
      "version": "2.21.1",
      "resolved": "https://registry.npmjs.org/@walletconnect/sign-client/-/sign-client-2.21.1.tgz",
      "integrity": "sha512-QaXzmPsMnKGV6tc4UcdnQVNOz4zyXgarvdIQibJ4L3EmLat73r5ZVl4c0cCOcoaV7rgM9Wbphgu5E/7jNcd3Zg==",
      "deprecated": "Reliability and performance improvements. See: https://github.com/WalletConnect/walletconnect-monorepo/releases",
      "license": "Apache-2.0",
      "dependencies": {
        "@walletconnect/core": "2.21.1",
        "@walletconnect/events": "1.0.1",
        "@walletconnect/heartbeat": "1.2.2",
        "@walletconnect/jsonrpc-utils": "1.0.8",
        "@walletconnect/logger": "2.1.2",
        "@walletconnect/time": "1.0.2",
        "@walletconnect/types": "2.21.1",
        "@walletconnect/utils": "2.21.1",
        "events": "3.3.0"
      }
    },
    "node_modules/@walletconnect/time": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/@walletconnect/time/-/time-1.0.2.tgz",
      "integrity": "sha512-uzdd9woDcJ1AaBZRhqy5rNC9laqWGErfc4dxA9a87mPdKOgWMD85mcFo9dIYIts/Jwocfwn07EC6EzclKubk/g==",
      "license": "MIT",
      "dependencies": {
        "tslib": "1.14.1"
      }
    },
    "node_modules/@walletconnect/time/node_modules/tslib": {
      "version": "1.14.1",
      "resolved": "https://registry.npmjs.org/tslib/-/tslib-1.14.1.tgz",
      "integrity": "sha512-Xni35NKzjgMrwevysHTCArtLDpPvye8zV/0E4EyYn43P7/7qvQwPh9BGkHewbMulVntbigmcT7rdX3BNo9wRJg==",
      "license": "0BSD"
    },
    "node_modules/@walletconnect/types": {
      "version": "2.21.1",
      "resolved": "https://registry.npmjs.org/@walletconnect/types/-/types-2.21.1.tgz",
      "integrity": "sha512-UeefNadqP6IyfwWC1Yi7ux+ljbP2R66PLfDrDm8izmvlPmYlqRerJWJvYO4t0Vvr9wrG4Ko7E0c4M7FaPKT/sQ==",
      "license": "Apache-2.0",
      "dependencies": {
        "@walletconnect/events": "1.0.1",
        "@walletconnect/heartbeat": "1.2.2",
        "@walletconnect/jsonrpc-types": "1.0.4",
        "@walletconnect/keyvaluestorage": "1.1.1",
        "@walletconnect/logger": "2.1.2",
        "events": "3.3.0"
      }
    },
    "node_modules/@walletconnect/types/node_modules/@walletconnect/keyvaluestorage": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@walletconnect/keyvaluestorage/-/keyvaluestorage-1.1.1.tgz",
      "integrity": "sha512-V7ZQq2+mSxAq7MrRqDxanTzu2RcElfK1PfNYiaVnJgJ7Q7G7hTVwF8voIBx92qsRyGHZihrwNPHuZd1aKkd0rA==",
      "license": "MIT",
      "dependencies": {
        "@walletconnect/safe-json": "^1.0.1",
        "idb-keyval": "^6.2.1",
        "unstorage": "^1.9.0"
      },
      "peerDependencies": {
        "@react-native-async-storage/async-storage": "1.x"
      },
      "peerDependenciesMeta": {
        "@react-native-async-storage/async-storage": {
          "optional": true
        }
      }
    },
    "node_modules/@walletconnect/types/node_modules/chokidar": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/chokidar/-/chokidar-5.0.0.tgz",
      "integrity": "sha512-TQMmc3w+5AxjpL8iIiwebF73dRDF4fBIieAqGn9RGCWaEVwQ6Fb2cGe31Yns0RRIzii5goJ1Y7xbMwo1TxMplw==",
      "license": "MIT",
      "dependencies": {
        "readdirp": "^5.0.0"
      },
      "engines": {
        "node": ">= 20.19.0"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@walletconnect/types/node_modules/lru-cache": {
      "version": "11.3.5",
      "resolved": "https://registry.npmjs.org/lru-cache/-/lru-cache-11.3.5.tgz",
      "integrity": "sha512-NxVFwLAnrd9i7KUBxC4DrUhmgjzOs+1Qm50D3oF1/oL+r1NpZ4gA7xvG0/zJ8evR7zIKn4vLf7qTNduWFtCrRw==",
      "license": "BlueOak-1.0.0",
      "engines": {
        "node": "20 || >=22"
      }
    },
    "node_modules/@walletconnect/types/node_modules/readdirp": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/readdirp/-/readdirp-5.0.0.tgz",
      "integrity": "sha512-9u/XQ1pvrQtYyMpZe7DXKv2p5CNvyVwzUB6uhLAnQwHMSgKMBR62lc7AHljaeteeHXn11XTAaLLUVZYVZyuRBQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 20.19.0"
      },
      "funding": {
        "type": "individual",
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@walletconnect/types/node_modules/unstorage": {
      "version": "1.17.5",
      "resolved": "https://registry.npmjs.org/unstorage/-/unstorage-1.17.5.tgz",
      "integrity": "sha512-0i3iqvRfx29hkNntHyQvJTpf5W9dQ9ZadSoRU8+xVlhVtT7jAX57fazYO9EHvcRCfBCyi5YRya7XCDOsbTgkPg==",
      "license": "MIT",
      "dependencies": {
        "anymatch": "^3.1.3",
        "chokidar": "^5.0.0",
        "destr": "^2.0.5",
        "h3": "^1.15.10",
        "lru-cache": "^11.2.7",
        "node-fetch-native": "^1.6.7",
        "ofetch": "^1.5.1",
        "ufo": "^1.6.3"
      },
      "peerDependencies": {
        "@azure/app-configuration": "^1.8.0",
        "@azure/cosmos": "^4.2.0",
        "@azure/data-tables": "^13.3.0",
        "@azure/identity": "^4.6.0",
        "@azure/keyvault-secrets": "^4.9.0",
        "@azure/storage-blob": "^12.26.0",
        "@capacitor/preferences": "^6 || ^7 || ^8",
        "@deno/kv": ">=0.9.0",
        "@netlify/blobs": "^6.5.0 || ^7.0.0 || ^8.1.0 || ^9.0.0 || ^10.0.0",
        "@planetscale/database": "^1.19.0",
        "@upstash/redis": "^1.34.3",
        "@vercel/blob": ">=0.27.1",
        "@vercel/functions": "^2.2.12 || ^3.0.0",
        "@vercel/kv": "^1 || ^2 || ^3",
        "aws4fetch": "^1.0.20",
        "db0": ">=0.2.1",
        "idb-keyval": "^6.2.1",
        "ioredis": "^5.4.2",
        "uploadthing": "^7.4.4"
      },
      "peerDependenciesMeta": {
        "@azure/app-configuration": {
          "optional": true
        },
        "@azure/cosmos": {
          "optional": true
        },
        "@azure/data-tables": {
          "optional": true
        },
        "@azure/identity": {
          "optional": true
        },
        "@azure/keyvault-secrets": {
          "optional": true
        },
        "@azure/storage-blob": {
          "optional": true
        },
        "@capacitor/preferences": {
          "optional": true
        },
        "@deno/kv": {
          "optional": true
        },
        "@netlify/blobs": {
          "optional": true
        },
        "@planetscale/database": {
          "optional": true
        },
        "@upstash/redis": {
          "optional": true
        },
        "@vercel/blob": {
          "optional": true
        },
        "@vercel/functions": {
          "optional": true
        },
        "@vercel/kv": {
          "optional": true
        },
        "aws4fetch": {
          "optional": true
        },
        "db0": {
          "optional": true
        },
        "idb-keyval": {
          "optional": true
        },
        "ioredis": {
          "optional": true
        },
        "uploadthing": {
          "optional": true
        }
      }
    },
    "node_modules/@walletconnect/universal-provider": {
      "version": "2.21.1",
      "resolved": "https://registry.npmjs.org/@walletconnect/universal-provider/-/universal-provider-2.21.1.tgz",
      "integrity": "sha512-Wjx9G8gUHVMnYfxtasC9poGm8QMiPCpXpbbLFT+iPoQskDDly8BwueWnqKs4Mx2SdIAWAwuXeZ5ojk5qQOxJJg==",
      "deprecated": "Reliability and performance improvements. See: https://github.com/WalletConnect/walletconnect-monorepo/releases",
      "license": "Apache-2.0",
      "dependencies": {
        "@walletconnect/events": "1.0.1",
        "@walletconnect/jsonrpc-http-connection": "1.0.8",
        "@walletconnect/jsonrpc-provider": "1.0.14",
        "@walletconnect/jsonrpc-types": "1.0.4",
        "@walletconnect/jsonrpc-utils": "1.0.8",
        "@walletconnect/keyvaluestorage": "1.1.1",
        "@walletconnect/logger": "2.1.2",
        "@walletconnect/sign-client": "2.21.1",
        "@walletconnect/types": "2.21.1",
        "@walletconnect/utils": "2.21.1",
        "es-toolkit": "1.33.0",
        "events": "3.3.0"
      }
    },
    "node_modules/@walletconnect/universal-provider/node_modules/@walletconnect/keyvaluestorage": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@walletconnect/keyvaluestorage/-/keyvaluestorage-1.1.1.tgz",
      "integrity": "sha512-V7ZQq2+mSxAq7MrRqDxanTzu2RcElfK1PfNYiaVnJgJ7Q7G7hTVwF8voIBx92qsRyGHZihrwNPHuZd1aKkd0rA==",
      "license": "MIT",
      "dependencies": {
        "@walletconnect/safe-json": "^1.0.1",
        "idb-keyval": "^6.2.1",
        "unstorage": "^1.9.0"
      },
      "peerDependencies": {
        "@react-native-async-storage/async-storage": "1.x"
      },
      "peerDependenciesMeta": {
        "@react-native-async-storage/async-storage": {
          "optional": true
        }
      }
    },
    "node_modules/@walletconnect/universal-provider/node_modules/chokidar": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/chokidar/-/chokidar-5.0.0.tgz",
      "integrity": "sha512-TQMmc3w+5AxjpL8iIiwebF73dRDF4fBIieAqGn9RGCWaEVwQ6Fb2cGe31Yns0RRIzii5goJ1Y7xbMwo1TxMplw==",
      "license": "MIT",
      "dependencies": {
        "readdirp": "^5.0.0"
      },
      "engines": {
        "node": ">= 20.19.0"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@walletconnect/universal-provider/node_modules/lru-cache": {
      "version": "11.3.5",
      "resolved": "https://registry.npmjs.org/lru-cache/-/lru-cache-11.3.5.tgz",
      "integrity": "sha512-NxVFwLAnrd9i7KUBxC4DrUhmgjzOs+1Qm50D3oF1/oL+r1NpZ4gA7xvG0/zJ8evR7zIKn4vLf7qTNduWFtCrRw==",
      "license": "BlueOak-1.0.0",
      "engines": {
        "node": "20 || >=22"
      }
    },
    "node_modules/@walletconnect/universal-provider/node_modules/readdirp": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/readdirp/-/readdirp-5.0.0.tgz",
      "integrity": "sha512-9u/XQ1pvrQtYyMpZe7DXKv2p5CNvyVwzUB6uhLAnQwHMSgKMBR62lc7AHljaeteeHXn11XTAaLLUVZYVZyuRBQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 20.19.0"
      },
      "funding": {
        "type": "individual",
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@walletconnect/universal-provider/node_modules/unstorage": {
      "version": "1.17.5",
      "resolved": "https://registry.npmjs.org/unstorage/-/unstorage-1.17.5.tgz",
      "integrity": "sha512-0i3iqvRfx29hkNntHyQvJTpf5W9dQ9ZadSoRU8+xVlhVtT7jAX57fazYO9EHvcRCfBCyi5YRya7XCDOsbTgkPg==",
      "license": "MIT",
      "dependencies": {
        "anymatch": "^3.1.3",
        "chokidar": "^5.0.0",
        "destr": "^2.0.5",
        "h3": "^1.15.10",
        "lru-cache": "^11.2.7",
        "node-fetch-native": "^1.6.7",
        "ofetch": "^1.5.1",
        "ufo": "^1.6.3"
      },
      "peerDependencies": {
        "@azure/app-configuration": "^1.8.0",
        "@azure/cosmos": "^4.2.0",
        "@azure/data-tables": "^13.3.0",
        "@azure/identity": "^4.6.0",
        "@azure/keyvault-secrets": "^4.9.0",
        "@azure/storage-blob": "^12.26.0",
        "@capacitor/preferences": "^6 || ^7 || ^8",
        "@deno/kv": ">=0.9.0",
        "@netlify/blobs": "^6.5.0 || ^7.0.0 || ^8.1.0 || ^9.0.0 || ^10.0.0",
        "@planetscale/database": "^1.19.0",
        "@upstash/redis": "^1.34.3",
        "@vercel/blob": ">=0.27.1",
        "@vercel/functions": "^2.2.12 || ^3.0.0",
        "@vercel/kv": "^1 || ^2 || ^3",
        "aws4fetch": "^1.0.20",
        "db0": ">=0.2.1",
        "idb-keyval": "^6.2.1",
        "ioredis": "^5.4.2",
        "uploadthing": "^7.4.4"
      },
      "peerDependenciesMeta": {
        "@azure/app-configuration": {
          "optional": true
        },
        "@azure/cosmos": {
          "optional": true
        },
        "@azure/data-tables": {
          "optional": true
        },
        "@azure/identity": {
          "optional": true
        },
        "@azure/keyvault-secrets": {
          "optional": true
        },
        "@azure/storage-blob": {
          "optional": true
        },
        "@capacitor/preferences": {
          "optional": true
        },
        "@deno/kv": {
          "optional": true
        },
        "@netlify/blobs": {
          "optional": true
        },
        "@planetscale/database": {
          "optional": true
        },
        "@upstash/redis": {
          "optional": true
        },
        "@vercel/blob": {
          "optional": true
        },
        "@vercel/functions": {
          "optional": true
        },
        "@vercel/kv": {
          "optional": true
        },
        "aws4fetch": {
          "optional": true
        },
        "db0": {
          "optional": true
        },
        "idb-keyval": {
          "optional": true
        },
        "ioredis": {
          "optional": true
        },
        "uploadthing": {
          "optional": true
        }
      }
    },
    "node_modules/@walletconnect/utils": {
      "version": "2.21.1",
      "resolved": "https://registry.npmjs.org/@walletconnect/utils/-/utils-2.21.1.tgz",
      "integrity": "sha512-VPZvTcrNQCkbGOjFRbC24mm/pzbRMUq2DSQoiHlhh0X1U7ZhuIrzVtAoKsrzu6rqjz0EEtGxCr3K1TGRqDG4NA==",
      "license": "Apache-2.0",
      "dependencies": {
        "@noble/ciphers": "1.2.1",
        "@noble/curves": "1.8.1",
        "@noble/hashes": "1.7.1",
        "@walletconnect/jsonrpc-utils": "1.0.8",
        "@walletconnect/keyvaluestorage": "1.1.1",
        "@walletconnect/relay-api": "1.0.11",
        "@walletconnect/relay-auth": "1.1.0",
        "@walletconnect/safe-json": "1.0.2",
        "@walletconnect/time": "1.0.2",
        "@walletconnect/types": "2.21.1",
        "@walletconnect/window-getters": "1.0.1",
        "@walletconnect/window-metadata": "1.0.1",
        "bs58": "6.0.0",
        "detect-browser": "5.3.0",
        "query-string": "7.1.3",
        "uint8arrays": "3.1.0",
        "viem": "2.23.2"
      }
    },
    "node_modules/@walletconnect/utils/node_modules/@noble/curves": {
      "version": "1.8.1",
      "resolved": "https://registry.npmjs.org/@noble/curves/-/curves-1.8.1.tgz",
      "integrity": "sha512-warwspo+UYUPep0Q+vtdVB4Ugn8GGQj8iyB3gnRWsztmUHTI3S1nhdiWNsPUGL0vud7JlRRk1XEu7Lq1KGTnMQ==",
      "license": "MIT",
      "dependencies": {
        "@noble/hashes": "1.7.1"
      },
      "engines": {
        "node": "^14.21.3 || >=16"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@walletconnect/utils/node_modules/@noble/hashes": {
      "version": "1.7.1",
      "resolved": "https://registry.npmjs.org/@noble/hashes/-/hashes-1.7.1.tgz",
      "integrity": "sha512-B8XBPsn4vT/KJAGqDzbwztd+6Yte3P4V7iafm24bxgDe/mlRuK6xmWPuCNrKt2vDafZ8MfJLlchDG/vYafQEjQ==",
      "license": "MIT",
      "engines": {
        "node": "^14.21.3 || >=16"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@walletconnect/utils/node_modules/@scure/bip32": {
      "version": "1.6.2",
      "resolved": "https://registry.npmjs.org/@scure/bip32/-/bip32-1.6.2.tgz",
      "integrity": "sha512-t96EPDMbtGgtb7onKKqxRLfE5g05k7uHnHRM2xdE6BP/ZmxaLtPek4J4KfVn/90IQNrU1IOAqMgiDtUdtbe3nw==",
      "license": "MIT",
      "dependencies": {
        "@noble/curves": "~1.8.1",
        "@noble/hashes": "~1.7.1",
        "@scure/base": "~1.2.2"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@walletconnect/utils/node_modules/@scure/bip39": {
      "version": "1.5.4",
      "resolved": "https://registry.npmjs.org/@scure/bip39/-/bip39-1.5.4.tgz",
      "integrity": "sha512-TFM4ni0vKvCfBpohoh+/lY05i9gRbSwXWngAsF4CABQxoaOHijxuaZ2R6cStDQ5CHtHO9aGJTr4ksVJASRRyMA==",
      "license": "MIT",
      "dependencies": {
        "@noble/hashes": "~1.7.1",
        "@scure/base": "~1.2.4"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@walletconnect/utils/node_modules/@walletconnect/keyvaluestorage": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@walletconnect/keyvaluestorage/-/keyvaluestorage-1.1.1.tgz",
      "integrity": "sha512-V7ZQq2+mSxAq7MrRqDxanTzu2RcElfK1PfNYiaVnJgJ7Q7G7hTVwF8voIBx92qsRyGHZihrwNPHuZd1aKkd0rA==",
      "license": "MIT",
      "dependencies": {
        "@walletconnect/safe-json": "^1.0.1",
        "idb-keyval": "^6.2.1",
        "unstorage": "^1.9.0"
      },
      "peerDependencies": {
        "@react-native-async-storage/async-storage": "1.x"
      },
      "peerDependenciesMeta": {
        "@react-native-async-storage/async-storage": {
          "optional": true
        }
      }
    },
    "node_modules/@walletconnect/utils/node_modules/abitype": {
      "version": "1.0.8",
      "resolved": "https://registry.npmjs.org/abitype/-/abitype-1.0.8.tgz",
      "integrity": "sha512-ZeiI6h3GnW06uYDLx0etQtX/p8E24UaHHBj57RSjK7YBFe7iuVn07EDpOeP451D06sF27VOz9JJPlIKJmXgkEg==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/wevm"
      },
      "peerDependencies": {
        "typescript": ">=5.0.4",
        "zod": "^3 >=3.22.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        },
        "zod": {
          "optional": true
        }
      }
    },
    "node_modules/@walletconnect/utils/node_modules/chokidar": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/chokidar/-/chokidar-5.0.0.tgz",
      "integrity": "sha512-TQMmc3w+5AxjpL8iIiwebF73dRDF4fBIieAqGn9RGCWaEVwQ6Fb2cGe31Yns0RRIzii5goJ1Y7xbMwo1TxMplw==",
      "license": "MIT",
      "dependencies": {
        "readdirp": "^5.0.0"
      },
      "engines": {
        "node": ">= 20.19.0"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@walletconnect/utils/node_modules/isows": {
      "version": "1.0.6",
      "resolved": "https://registry.npmjs.org/isows/-/isows-1.0.6.tgz",
      "integrity": "sha512-lPHCayd40oW98/I0uvgaHKWCSvkzY27LjWLbtzOm64yQ+G3Q5npjjbdppU65iZXkK1Zt+kH9pfegli0AYfwYYw==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/wevm"
        }
      ],
      "license": "MIT",
      "peerDependencies": {
        "ws": "*"
      }
    },
    "node_modules/@walletconnect/utils/node_modules/lru-cache": {
      "version": "11.3.5",
      "resolved": "https://registry.npmjs.org/lru-cache/-/lru-cache-11.3.5.tgz",
      "integrity": "sha512-NxVFwLAnrd9i7KUBxC4DrUhmgjzOs+1Qm50D3oF1/oL+r1NpZ4gA7xvG0/zJ8evR7zIKn4vLf7qTNduWFtCrRw==",
      "license": "BlueOak-1.0.0",
      "engines": {
        "node": "20 || >=22"
      }
    },
    "node_modules/@walletconnect/utils/node_modules/ox": {
      "version": "0.6.7",
      "resolved": "https://registry.npmjs.org/ox/-/ox-0.6.7.tgz",
      "integrity": "sha512-17Gk/eFsFRAZ80p5eKqv89a57uXjd3NgIf1CaXojATPBuujVc/fQSVhBeAU9JCRB+k7J50WQAyWTxK19T9GgbA==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/wevm"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "@adraffy/ens-normalize": "^1.10.1",
        "@noble/curves": "^1.6.0",
        "@noble/hashes": "^1.5.0",
        "@scure/bip32": "^1.5.0",
        "@scure/bip39": "^1.4.0",
        "abitype": "^1.0.6",
        "eventemitter3": "5.0.1"
      },
      "peerDependencies": {
        "typescript": ">=5.4.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@walletconnect/utils/node_modules/readdirp": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/readdirp/-/readdirp-5.0.0.tgz",
      "integrity": "sha512-9u/XQ1pvrQtYyMpZe7DXKv2p5CNvyVwzUB6uhLAnQwHMSgKMBR62lc7AHljaeteeHXn11XTAaLLUVZYVZyuRBQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 20.19.0"
      },
      "funding": {
        "type": "individual",
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@walletconnect/utils/node_modules/unstorage": {
      "version": "1.17.5",
      "resolved": "https://registry.npmjs.org/unstorage/-/unstorage-1.17.5.tgz",
      "integrity": "sha512-0i3iqvRfx29hkNntHyQvJTpf5W9dQ9ZadSoRU8+xVlhVtT7jAX57fazYO9EHvcRCfBCyi5YRya7XCDOsbTgkPg==",
      "license": "MIT",
      "dependencies": {
        "anymatch": "^3.1.3",
        "chokidar": "^5.0.0",
        "destr": "^2.0.5",
        "h3": "^1.15.10",
        "lru-cache": "^11.2.7",
        "node-fetch-native": "^1.6.7",
        "ofetch": "^1.5.1",
        "ufo": "^1.6.3"
      },
      "peerDependencies": {
        "@azure/app-configuration": "^1.8.0",
        "@azure/cosmos": "^4.2.0",
        "@azure/data-tables": "^13.3.0",
        "@azure/identity": "^4.6.0",
        "@azure/keyvault-secrets": "^4.9.0",
        "@azure/storage-blob": "^12.26.0",
        "@capacitor/preferences": "^6 || ^7 || ^8",
        "@deno/kv": ">=0.9.0",
        "@netlify/blobs": "^6.5.0 || ^7.0.0 || ^8.1.0 || ^9.0.0 || ^10.0.0",
        "@planetscale/database": "^1.19.0",
        "@upstash/redis": "^1.34.3",
        "@vercel/blob": ">=0.27.1",
        "@vercel/functions": "^2.2.12 || ^3.0.0",
        "@vercel/kv": "^1 || ^2 || ^3",
        "aws4fetch": "^1.0.20",
        "db0": ">=0.2.1",
        "idb-keyval": "^6.2.1",
        "ioredis": "^5.4.2",
        "uploadthing": "^7.4.4"
      },
      "peerDependenciesMeta": {
        "@azure/app-configuration": {
          "optional": true
        },
        "@azure/cosmos": {
          "optional": true
        },
        "@azure/data-tables": {
          "optional": true
        },
        "@azure/identity": {
          "optional": true
        },
        "@azure/keyvault-secrets": {
          "optional": true
        },
        "@azure/storage-blob": {
          "optional": true
        },
        "@capacitor/preferences": {
          "optional": true
        },
        "@deno/kv": {
          "optional": true
        },
        "@netlify/blobs": {
          "optional": true
        },
        "@planetscale/database": {
          "optional": true
        },
        "@upstash/redis": {
          "optional": true
        },
        "@vercel/blob": {
          "optional": true
        },
        "@vercel/functions": {
          "optional": true
        },
        "@vercel/kv": {
          "optional": true
        },
        "aws4fetch": {
          "optional": true
        },
        "db0": {
          "optional": true
        },
        "idb-keyval": {
          "optional": true
        },
        "ioredis": {
          "optional": true
        },
        "uploadthing": {
          "optional": true
        }
      }
    },
    "node_modules/@walletconnect/utils/node_modules/viem": {
      "version": "2.23.2",
      "resolved": "https://registry.npmjs.org/viem/-/viem-2.23.2.tgz",
      "integrity": "sha512-NVmW/E0c5crMOtbEAqMF0e3NmvQykFXhLOc/CkLIXOlzHSA6KXVz3CYVmaKqBF8/xtjsjHAGjdJN3Ru1kFJLaA==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/wevm"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "@noble/curves": "1.8.1",
        "@noble/hashes": "1.7.1",
        "@scure/bip32": "1.6.2",
        "@scure/bip39": "1.5.4",
        "abitype": "1.0.8",
        "isows": "1.0.6",
        "ox": "0.6.7",
        "ws": "8.18.0"
      },
      "peerDependencies": {
        "typescript": ">=5.0.4"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@walletconnect/utils/node_modules/ws": {
      "version": "8.18.0",
      "resolved": "https://registry.npmjs.org/ws/-/ws-8.18.0.tgz",
      "integrity": "sha512-8VbfWfHLbbwu3+N6OKsOMpBdT4kXPDDB9cJk2bJ6mh9ucxdlnNvH1e+roYkKmN9Nxw2yjz7VzeO9oOz2zJ04Pw==",
      "license": "MIT",
      "engines": {
        "node": ">=10.0.0"
      },
      "peerDependencies": {
        "bufferutil": "^4.0.1",
        "utf-8-validate": ">=5.0.2"
      },
      "peerDependenciesMeta": {
        "bufferutil": {
          "optional": true
        },
        "utf-8-validate": {
          "optional": true
        }
      }
    },
    "node_modules/@walletconnect/window-getters": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/@walletconnect/window-getters/-/window-getters-1.0.1.tgz",
      "integrity": "sha512-vHp+HqzGxORPAN8gY03qnbTMnhqIwjeRJNOMOAzePRg4xVEEE2WvYsI9G2NMjOknA8hnuYbU3/hwLcKbjhc8+Q==",
      "license": "MIT",
      "dependencies": {
        "tslib": "1.14.1"
      }
    },
    "node_modules/@walletconnect/window-getters/node_modules/tslib": {
      "version": "1.14.1",
      "resolved": "https://registry.npmjs.org/tslib/-/tslib-1.14.1.tgz",
      "integrity": "sha512-Xni35NKzjgMrwevysHTCArtLDpPvye8zV/0E4EyYn43P7/7qvQwPh9BGkHewbMulVntbigmcT7rdX3BNo9wRJg==",
      "license": "0BSD"
    },
    "node_modules/@walletconnect/window-metadata": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/@walletconnect/window-metadata/-/window-metadata-1.0.1.tgz",
      "integrity": "sha512-9koTqyGrM2cqFRW517BPY/iEtUDx2r1+Pwwu5m7sJ7ka79wi3EyqhqcICk/yDmv6jAS1rjKgTKXlEhanYjijcA==",
      "license": "MIT",
      "dependencies": {
        "@walletconnect/window-getters": "^1.0.1",
        "tslib": "1.14.1"
      }
    },
    "node_modules/@walletconnect/window-metadata/node_modules/tslib": {
      "version": "1.14.1",
      "resolved": "https://registry.npmjs.org/tslib/-/tslib-1.14.1.tgz",
      "integrity": "sha512-Xni35NKzjgMrwevysHTCArtLDpPvye8zV/0E4EyYn43P7/7qvQwPh9BGkHewbMulVntbigmcT7rdX3BNo9wRJg==",
      "license": "0BSD"
    },
    "node_modules/abitype": {
      "version": "1.0.6",
      "resolved": "https://registry.npmjs.org/abitype/-/abitype-1.0.6.tgz",
      "integrity": "sha512-MMSqYh4+C/aVqI2RQaWqbvI4Kxo5cQV40WQ4QFtDnNzCkqChm8MuENhElmynZlO0qUy/ObkEUaXtKqYnx1Kp3A==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/wevm"
      },
      "peerDependencies": {
        "typescript": ">=5.0.4",
        "zod": "^3 >=3.22.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        },
        "zod": {
          "optional": true
        }
      }
    },
    "node_modules/abstract-logging": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/abstract-logging/-/abstract-logging-2.0.1.tgz",
      "integrity": "sha512-2BjRTZxTPvheOvGbBslFSYOUkr+SjPtOnrLP33f+VIWLzezQpZcqVg7ja3L4dBXmzzgwT+a029jRx5PCi3JuiA==",
      "license": "MIT"
    },
    "node_modules/ajv": {
      "version": "8.20.0",
      "resolved": "https://registry.npmjs.org/ajv/-/ajv-8.20.0.tgz",
      "integrity": "sha512-Thbli+OlOj+iMPYFBVBfJ3OmCAnaSyNn4M1vz9T6Gka5Jt9ba/HIR56joy65tY6kx/FCF5VXNB819Y7/GUrBGA==",
      "license": "MIT",
      "dependencies": {
        "fast-deep-equal": "^3.1.3",
        "fast-uri": "^3.0.1",
        "json-schema-traverse": "^1.0.0",
        "require-from-string": "^2.0.2"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/epoberezkin"
      }
    },
    "node_modules/ajv-formats": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/ajv-formats/-/ajv-formats-3.0.1.tgz",
      "integrity": "sha512-8iUql50EUR+uUcdRQ3HDqa6EVyo3docL8g5WJ3FNcWmu62IbkGUue/pEyLBW8VGKKucTPgqeks4fIU1DA4yowQ==",
      "license": "MIT",
      "dependencies": {
        "ajv": "^8.0.0"
      },
      "peerDependencies": {
        "ajv": "^8.0.0"
      },
      "peerDependenciesMeta": {
        "ajv": {
          "optional": true
        }
      }
    },
    "node_modules/ansi-regex": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/ansi-regex/-/ansi-regex-5.0.1.tgz",
      "integrity": "sha512-quJQXlTSUGL2LH9SUXo8VwsY4soanhgo6LNSm84E1LBcE8s3O0wpdiRzyR9z/ZZJMlMWv37qOOb9pdJlMUEKFQ==",
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/ansi-styles": {
      "version": "3.2.1",
      "resolved": "https://registry.npmjs.org/ansi-styles/-/ansi-styles-3.2.1.tgz",
      "integrity": "sha512-VT0ZI6kZRdTh8YyJw3SMbYm/u+NqfsAxEpWO0Pf9sq8/e94WxxOpPKx9FR1FlyCtOVDNOQ+8ntlqFxiRc+r5qA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "color-convert": "^1.9.0"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/anymatch": {
      "version": "3.1.3",
      "resolved": "https://registry.npmjs.org/anymatch/-/anymatch-3.1.3.tgz",
      "integrity": "sha512-KMReFUr0B4t+D+OBkjR3KYqvocp2XaSzO55UcB6mgQMd3KbcE+mWTyvVV7D/zsdEbNnV6acZUutkiHQXvTr1Rw==",
      "license": "ISC",
      "dependencies": {
        "normalize-path": "^3.0.0",
        "picomatch": "^2.0.4"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/anymatch/node_modules/picomatch": {
      "version": "2.3.2",
      "resolved": "https://registry.npmjs.org/picomatch/-/picomatch-2.3.2.tgz",
      "integrity": "sha512-V7+vQEJ06Z+c5tSye8S+nHUfI51xoXIXjHQ99cQtKUkQqqO1kO/KCJUfZXuB47h/YBlDhah2H3hdUGXn8ie0oA==",
      "license": "MIT",
      "engines": {
        "node": ">=8.6"
      },
      "funding": {
        "url": "https://github.com/sponsors/jonschlinkert"
      }
    },
    "node_modules/array-buffer-byte-length": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/array-buffer-byte-length/-/array-buffer-byte-length-1.0.2.tgz",
      "integrity": "sha512-LHE+8BuR7RYGDKvnrmcuSq3tDcKv9OFEXQt/HpbZhY7V6h0zlUXutnAD82GiFx9rdieCMjkvtcsPqBwgUl1Iiw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3",
        "is-array-buffer": "^3.0.5"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/arraybuffer.prototype.slice": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/arraybuffer.prototype.slice/-/arraybuffer.prototype.slice-1.0.4.tgz",
      "integrity": "sha512-BNoCY6SXXPQ7gF2opIP4GBE+Xw7U+pHMYKuzjgCN3GwiaIR09UUeKfheyIry77QtrCBlC0KK0q5/TER/tYh3PQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "array-buffer-byte-length": "^1.0.1",
        "call-bind": "^1.0.8",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.5",
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.6",
        "is-array-buffer": "^3.0.4"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/asn1.js": {
      "version": "5.4.1",
      "resolved": "https://registry.npmjs.org/asn1.js/-/asn1.js-5.4.1.tgz",
      "integrity": "sha512-+I//4cYPccV8LdmBLiX8CYvf9Sp3vQsrqu2QNXRcrbiWvcx/UdlFiqUJJzxRQxgsZmvhXhn4cSKeSmoFjVdupA==",
      "license": "MIT",
      "dependencies": {
        "bn.js": "^4.0.0",
        "inherits": "^2.0.1",
        "minimalistic-assert": "^1.0.0",
        "safer-buffer": "^2.1.0"
      }
    },
    "node_modules/assertion-error": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/assertion-error/-/assertion-error-2.0.1.tgz",
      "integrity": "sha512-Izi8RQcffqCeNVgFigKli1ssklIbpHnCYc6AknXGYoB6grJqyeby7jv12JUQgmTAnIDnbck1uxksT4dzN3PWBA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/async-function": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/async-function/-/async-function-1.0.0.tgz",
      "integrity": "sha512-hsU18Ae8CDTR6Kgu9DYf0EbCr/a5iGL0rytQDobUcdpYOKokk8LEjVphnXkDkgpi0wYVsqrXuP0bZxJaTqdgoA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/async-mutex": {
      "version": "0.2.6",
      "resolved": "https://registry.npmjs.org/async-mutex/-/async-mutex-0.2.6.tgz",
      "integrity": "sha512-Hs4R+4SPgamu6rSGW8C7cV9gaWUKEHykfzCCvIRuaVv636Ju10ZdeUbvb4TBEW0INuq2DHZqXbK4Nd3yG4RaRw==",
      "license": "MIT",
      "dependencies": {
        "tslib": "^2.0.0"
      }
    },
    "node_modules/asynckit": {
      "version": "0.4.0",
      "resolved": "https://registry.npmjs.org/asynckit/-/asynckit-0.4.0.tgz",
      "integrity": "sha512-Oei9OH4tRh0YqU3GxhX79dM/mwVgvbZJaSNaRk+bshkj0S5cfHcgYakreBjrHwatXKbz+IoIdYLxrKim2MjW0Q==",
      "license": "MIT"
    },
    "node_modules/atomic-sleep": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/atomic-sleep/-/atomic-sleep-1.0.0.tgz",
      "integrity": "sha512-kNOjDqAh7px0XWNI+4QbzoiR/nTkHAWNud2uvnJquD1/x5a7EQZMJT0AczqK0Qn67oY/TTQ1LbUKajZpp3I9tQ==",
      "license": "MIT",
      "engines": {
        "node": ">=8.0.0"
      }
    },
    "node_modules/available-typed-arrays": {
      "version": "1.0.7",
      "resolved": "https://registry.npmjs.org/available-typed-arrays/-/available-typed-arrays-1.0.7.tgz",
      "integrity": "sha512-wvUjBtSGN7+7SjNpq/9M2Tg350UZD3q62IFZLbRAR1bSMlCo1ZaeW+BJ+D090e4hIIZLBcTDWe4Mh4jvUDajzQ==",
      "license": "MIT",
      "dependencies": {
        "possible-typed-array-names": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/avvio": {
      "version": "9.2.0",
      "resolved": "https://registry.npmjs.org/avvio/-/avvio-9.2.0.tgz",
      "integrity": "sha512-2t/sy01ArdHHE0vRH5Hsay+RtCZt3dLPji7W7/MMOCEgze5b7SNDC4j5H6FnVgPkI1MTNFGzHdHrVXDDl7QSSQ==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/fastify"
        },
        {
          "type": "opencollective",
          "url": "https://opencollective.com/fastify"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "@fastify/error": "^4.0.0",
        "fastq": "^1.17.1"
      }
    },
    "node_modules/axios": {
      "version": "1.13.6",
      "resolved": "https://registry.npmjs.org/axios/-/axios-1.13.6.tgz",
      "integrity": "sha512-ChTCHMouEe2kn713WHbQGcuYrr6fXTBiu460OTwWrWob16g1bXn4vtz07Ope7ewMozJAnEquLk5lWQWtBig9DQ==",
      "license": "MIT",
      "dependencies": {
        "follow-redirects": "^1.15.11",
        "form-data": "^4.0.5",
        "proxy-from-env": "^1.1.0"
      }
    },
    "node_modules/axios-retry": {
      "version": "4.5.0",
      "resolved": "https://registry.npmjs.org/axios-retry/-/axios-retry-4.5.0.tgz",
      "integrity": "sha512-aR99oXhpEDGo0UuAlYcn2iGRds30k366Zfa05XWScR9QaQD4JYiP3/1Qt1u7YlefUOK+cn0CcwoL1oefavQUlQ==",
      "license": "Apache-2.0",
      "dependencies": {
        "is-retry-allowed": "^2.2.0"
      },
      "peerDependencies": {
        "axios": "0.x || 1.x"
      }
    },
    "node_modules/balanced-match": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/balanced-match/-/balanced-match-1.0.2.tgz",
      "integrity": "sha512-3oSeUO0TMV67hN1AmbXsK4yaqU7tjiHlbxRDZOpH0KW9+CeX4bRAaX0Anxt0tx2MrpRpWwQaPwIlISEJhYU5Pw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/base-x": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/base-x/-/base-x-5.0.1.tgz",
      "integrity": "sha512-M7uio8Zt++eg3jPj+rHMfCC+IuygQHHCOU+IYsVtik6FWjuYpVt/+MRKcgsAMHh8mMFAwnB+Bs+mTrFiXjMzKg==",
      "license": "MIT"
    },
    "node_modules/base64-js": {
      "version": "1.5.1",
      "resolved": "https://registry.npmjs.org/base64-js/-/base64-js-1.5.1.tgz",
      "integrity": "sha512-AKpaYlHn8t4SVbOHCy+b5+KKgvR4vrsD8vbvrbiQJps7fKDTkjkDry6ji0rUJjC0kzbNePLwzxq8iypo41qeWA==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "MIT"
    },
    "node_modules/baseline-browser-mapping": {
      "version": "2.10.25",
      "resolved": "https://registry.npmjs.org/baseline-browser-mapping/-/baseline-browser-mapping-2.10.25.tgz",
      "integrity": "sha512-QO/VHsXCQdnzADMfmkeOPvHdIAkoB7i0/rGjINPJEetLx75hNttVWGQ/jycHUDP9zZ9rupbm60WRxcwViB0MiA==",
      "dev": true,
      "license": "Apache-2.0",
      "bin": {
        "baseline-browser-mapping": "dist/cli.cjs"
      },
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/big.js": {
      "version": "6.2.2",
      "resolved": "https://registry.npmjs.org/big.js/-/big.js-6.2.2.tgz",
      "integrity": "sha512-y/ie+Faknx7sZA5MfGA2xKlu0GDv8RWrXGsmlteyJQ2lvoKv9GBK/fpRMc2qlSoBAgNxrixICFCBefIq8WCQpQ==",
      "license": "MIT",
      "engines": {
        "node": "*"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/bigjs"
      }
    },
    "node_modules/bn.js": {
      "version": "4.12.3",
      "resolved": "https://registry.npmjs.org/bn.js/-/bn.js-4.12.3.tgz",
      "integrity": "sha512-fGTi3gxV/23FTYdAoUtLYp6qySe2KE3teyZitipKNRuVYcBkoP/bB3guXN/XVKUe9mxCHXnc9C4ocyz8OmgN0g==",
      "license": "MIT"
    },
    "node_modules/bowser": {
      "version": "2.14.1",
      "resolved": "https://registry.npmjs.org/bowser/-/bowser-2.14.1.tgz",
      "integrity": "sha512-tzPjzCxygAKWFOJP011oxFHs57HzIhOEracIgAePE4pqB3LikALKnSzUyU4MGs9/iCEUuHlAJTjTc5M+u7YEGg==",
      "license": "MIT"
    },
    "node_modules/brace-expansion": {
      "version": "1.1.14",
      "resolved": "https://registry.npmjs.org/brace-expansion/-/brace-expansion-1.1.14.tgz",
      "integrity": "sha512-MWPGfDxnyzKU7rNOW9SP/c50vi3xrmrua/+6hfPbCS2ABNWfx24vPidzvC7krjU/RTo235sV776ymlsMtGKj8g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "balanced-match": "^1.0.0",
        "concat-map": "0.0.1"
      }
    },
    "node_modules/brotli-wasm": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/brotli-wasm/-/brotli-wasm-3.0.1.tgz",
      "integrity": "sha512-U3K72/JAi3jITpdhZBqzSUq+DUY697tLxOuFXB+FpAE/Ug+5C3VZrv4uA674EUZHxNAuQ9wETXNqQkxZD6oL4A==",
      "license": "Apache-2.0",
      "engines": {
        "node": ">=v18.0.0"
      }
    },
    "node_modules/browserslist": {
      "version": "4.28.2",
      "resolved": "https://registry.npmjs.org/browserslist/-/browserslist-4.28.2.tgz",
      "integrity": "sha512-48xSriZYYg+8qXna9kwqjIVzuQxi+KYWp2+5nCYnYKPTr0LvD89Jqk2Or5ogxz0NUMfIjhh2lIUX/LyX9B4oIg==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/browserslist"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/browserslist"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "baseline-browser-mapping": "^2.10.12",
        "caniuse-lite": "^1.0.30001782",
        "electron-to-chromium": "^1.5.328",
        "node-releases": "^2.0.36",
        "update-browserslist-db": "^1.2.3"
      },
      "bin": {
        "browserslist": "cli.js"
      },
      "engines": {
        "node": "^6 || ^7 || ^8 || ^9 || ^10 || ^11 || ^12 || >=13.7"
      }
    },
    "node_modules/bs58": {
      "version": "6.0.0",
      "resolved": "https://registry.npmjs.org/bs58/-/bs58-6.0.0.tgz",
      "integrity": "sha512-PD0wEnEYg6ijszw/u8s+iI3H17cTymlrwkKhDhPZq+Sokl3AU4htyBFTjAeNAlCCmg0f53g6ih3jATyCKftTfw==",
      "license": "MIT",
      "dependencies": {
        "base-x": "^5.0.0"
      }
    },
    "node_modules/buffer": {
      "version": "6.0.3",
      "resolved": "https://registry.npmjs.org/buffer/-/buffer-6.0.3.tgz",
      "integrity": "sha512-FTiCpNxtwiZZHEZbcbTIcZjERVICn9yq/pDFkTl95/AxzD1naBctN7YO68riM/gLSDY7sdrMby8hofADYuuqOA==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "base64-js": "^1.3.1",
        "ieee754": "^1.2.1"
      }
    },
    "node_modules/bufferutil": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/bufferutil/-/bufferutil-4.1.0.tgz",
      "integrity": "sha512-ZMANVnAixE6AWWnPzlW2KpUrxhm9woycYvPOo67jWHyFowASTEd9s+QN1EIMsSDtwhIxN4sWE1jotpuDUIgyIw==",
      "hasInstallScript": true,
      "license": "MIT",
      "dependencies": {
        "node-gyp-build": "^4.3.0"
      },
      "engines": {
        "node": ">=6.14.2"
      }
    },
    "node_modules/c12": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/c12/-/c12-3.1.0.tgz",
      "integrity": "sha512-uWoS8OU1MEIsOv8p/5a82c3H31LsWVR5qiyXVfBNOzfffjUWtPnhAb4BYI2uG2HfGmZmFjCtui5XNWaps+iFuw==",
      "devOptional": true,
      "license": "MIT",
      "dependencies": {
        "chokidar": "^4.0.3",
        "confbox": "^0.2.2",
        "defu": "^6.1.4",
        "dotenv": "^16.6.1",
        "exsolve": "^1.0.7",
        "giget": "^2.0.0",
        "jiti": "^2.4.2",
        "ohash": "^2.0.11",
        "pathe": "^2.0.3",
        "perfect-debounce": "^1.0.0",
        "pkg-types": "^2.2.0",
        "rc9": "^2.1.2"
      },
      "peerDependencies": {
        "magicast": "^0.3.5"
      },
      "peerDependenciesMeta": {
        "magicast": {
          "optional": true
        }
      }
    },
    "node_modules/cac": {
      "version": "6.7.14",
      "resolved": "https://registry.npmjs.org/cac/-/cac-6.7.14.tgz",
      "integrity": "sha512-b6Ilus+c3RrdDk+JhLKUAQfzzgLEPy6wcXqS7f/xe1EETvsDP6GORG7SFuOs6cID5YkqchW/LXZbX5bc8j7ZcQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/call-bind": {
      "version": "1.0.9",
      "resolved": "https://registry.npmjs.org/call-bind/-/call-bind-1.0.9.tgz",
      "integrity": "sha512-a/hy+pNsFUTR+Iz8TCJvXudKVLAnz/DyeSUo10I5yvFDQJBFU2s9uqQpoSrJlroHUKoKqzg+epxyP9lqFdzfBQ==",
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.2",
        "es-define-property": "^1.0.1",
        "get-intrinsic": "^1.3.0",
        "set-function-length": "^1.2.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/call-bind-apply-helpers": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/call-bind-apply-helpers/-/call-bind-apply-helpers-1.0.2.tgz",
      "integrity": "sha512-Sp1ablJ0ivDkSzjcaJdxEunN5/XvksFJ2sMBFfq6x0ryhQV/2b/KwFe21cMpmHtPOSij8K99/wSfoEuTObmuMQ==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "function-bind": "^1.1.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/call-bound": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/call-bound/-/call-bound-1.0.4.tgz",
      "integrity": "sha512-+ys997U96po4Kx/ABpBCqhA9EuxJaQWDQg7295H4hBphv3IZg0boBKuwYpt4YXp6MZ5AmZQnU/tyMTlRpaSejg==",
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.2",
        "get-intrinsic": "^1.3.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/camelcase": {
      "version": "5.3.1",
      "resolved": "https://registry.npmjs.org/camelcase/-/camelcase-5.3.1.tgz",
      "integrity": "sha512-L28STB170nwWS63UjtlEOE3dldQApaJXZkOI1uMFfzf3rRuPegHaHesyee+YxQ+W6SvRDQV6UrdOdRiR153wJg==",
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/caniuse-lite": {
      "version": "1.0.30001791",
      "resolved": "https://registry.npmjs.org/caniuse-lite/-/caniuse-lite-1.0.30001791.tgz",
      "integrity": "sha512-yk0l/YSrOnFZk3UROpDLQD9+kC1l4meK/wed583AXrzoarMGJcbRi2Q4RaUYbKxYAsZ8sWmaSa/DsLmdBeI1vQ==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/browserslist"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/caniuse-lite"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "CC-BY-4.0"
    },
    "node_modules/cbw-sdk": {
      "name": "@coinbase/wallet-sdk",
      "version": "3.9.3",
      "resolved": "https://registry.npmjs.org/@coinbase/wallet-sdk/-/wallet-sdk-3.9.3.tgz",
      "integrity": "sha512-N/A2DRIf0Y3PHc1XAMvbBUu4zisna6qAdqABMZwBMNEfWrXpAwx16pZGkYCLGE+Rvv1edbcB2LYDRnACNcmCiw==",
      "license": "Apache-2.0",
      "dependencies": {
        "bn.js": "^5.2.1",
        "buffer": "^6.0.3",
        "clsx": "^1.2.1",
        "eth-block-tracker": "^7.1.0",
        "eth-json-rpc-filters": "^6.0.0",
        "eventemitter3": "^5.0.1",
        "keccak": "^3.0.3",
        "preact": "^10.16.0",
        "sha.js": "^2.4.11"
      }
    },
    "node_modules/cbw-sdk/node_modules/bn.js": {
      "version": "5.2.3",
      "resolved": "https://registry.npmjs.org/bn.js/-/bn.js-5.2.3.tgz",
      "integrity": "sha512-EAcmnPkxpntVL+DS7bO1zhcZNvCkxqtkd0ZY53h06GNQ3DEkkGZ/gKgmDv6DdZQGj9BgfSPKtJJ7Dp1GPP8f7w==",
      "license": "MIT"
    },
    "node_modules/chai": {
      "version": "5.3.3",
      "resolved": "https://registry.npmjs.org/chai/-/chai-5.3.3.tgz",
      "integrity": "sha512-4zNhdJD/iOjSH0A05ea+Ke6MU5mmpQcbQsSOkgdaUMJ9zTlDTD/GYlwohmIE2u0gaxHYiVHEn1Fw9mZ/ktJWgw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "assertion-error": "^2.0.1",
        "check-error": "^2.1.1",
        "deep-eql": "^5.0.1",
        "loupe": "^3.1.0",
        "pathval": "^2.0.0"
      },
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/chalk": {
      "version": "2.4.2",
      "resolved": "https://registry.npmjs.org/chalk/-/chalk-2.4.2.tgz",
      "integrity": "sha512-Mti+f9lpJNcwF4tWV8/OrTTtF1gZi+f8FqlyAdouralcFWFQWF2+NgCHShjkCb+IFBLq9buZwE1xckQU4peSuQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ansi-styles": "^3.2.1",
        "escape-string-regexp": "^1.0.5",
        "supports-color": "^5.3.0"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/charenc": {
      "version": "0.0.2",
      "resolved": "https://registry.npmjs.org/charenc/-/charenc-0.0.2.tgz",
      "integrity": "sha512-yrLQ/yVUFXkzg7EDQsPieE/53+0RlaWTs+wBrvW36cyilJ2SaDWfl4Yj7MtLTXleV9uEKefbAGUPv2/iWSooRA==",
      "license": "BSD-3-Clause",
      "engines": {
        "node": "*"
      }
    },
    "node_modules/check-error": {
      "version": "2.1.3",
      "resolved": "https://registry.npmjs.org/check-error/-/check-error-2.1.3.tgz",
      "integrity": "sha512-PAJdDJusoxnwm1VwW07VWwUN1sl7smmC3OKggvndJFadxxDRyFJBX/ggnu/KE4kQAB7a3Dp8f/YXC1FlUprWmA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 16"
      }
    },
    "node_modules/chess.js": {
      "version": "1.4.0",
      "resolved": "https://registry.npmjs.org/chess.js/-/chess.js-1.4.0.tgz",
      "integrity": "sha512-BBJgrrtKQOzFLonR0l+k64A98NLemPwNsCskwb+29bRwobUa4iTm51E1kwGPbWXAcfdDa18nad6vpPPKPWarqw==",
      "license": "BSD-2-Clause"
    },
    "node_modules/chokidar": {
      "version": "4.0.3",
      "resolved": "https://registry.npmjs.org/chokidar/-/chokidar-4.0.3.tgz",
      "integrity": "sha512-Qgzu8kfBvo+cA4962jnP1KkS6Dop5NS6g7R5LFYJr4b8Ub94PPQXUksCw9PvXoeXPRRddRNC5C1JQUR2SMGtnA==",
      "devOptional": true,
      "license": "MIT",
      "dependencies": {
        "readdirp": "^4.0.1"
      },
      "engines": {
        "node": ">= 14.16.0"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/citty": {
      "version": "0.1.6",
      "resolved": "https://registry.npmjs.org/citty/-/citty-0.1.6.tgz",
      "integrity": "sha512-tskPPKEs8D2KPafUypv2gxwJP8h/OaJmC82QQGGDQcHvXX43xF2VDACcJVmZ0EuSxkpO9Kc4MlrA3q0+FG58AQ==",
      "devOptional": true,
      "license": "MIT",
      "dependencies": {
        "consola": "^3.2.3"
      }
    },
    "node_modules/cliui": {
      "version": "6.0.0",
      "resolved": "https://registry.npmjs.org/cliui/-/cliui-6.0.0.tgz",
      "integrity": "sha512-t6wbgtoCXvAzst7QgXxJYqPt0usEfbgQdftEPbLL/cvv6HPE5VgvqCuAIDR0NgU52ds6rFwqrgakNLrHEjCbrQ==",
      "license": "ISC",
      "dependencies": {
        "string-width": "^4.2.0",
        "strip-ansi": "^6.0.0",
        "wrap-ansi": "^6.2.0"
      }
    },
    "node_modules/clsx": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/clsx/-/clsx-1.2.1.tgz",
      "integrity": "sha512-EcR6r5a8bj6pu3ycsa/E/cKVGuTgZJZdsyUYHOksG/UHIiKfjxzRxYJpyVBwYaQeOvghal9fcc4PidlgzugAQg==",
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/color-convert": {
      "version": "1.9.3",
      "resolved": "https://registry.npmjs.org/color-convert/-/color-convert-1.9.3.tgz",
      "integrity": "sha512-QfAUtd+vFdAtFQcC8CCyYt1fYWxSqAiK2cSD6zDB8N3cpsEBAvRxp9zOGg6G/SHHJYAT88/az/IuDGALsNVbGg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "color-name": "1.1.3"
      }
    },
    "node_modules/color-name": {
      "version": "1.1.3",
      "resolved": "https://registry.npmjs.org/color-name/-/color-name-1.1.3.tgz",
      "integrity": "sha512-72fSenhMw2HZMTVHeCA9KCmpEIbzWiQsjN+BHcBbS9vr1mtt+vJjPdksIBNUmKAW8TFUDPJK5SUU3QhE9NEXDw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/combined-stream": {
      "version": "1.0.8",
      "resolved": "https://registry.npmjs.org/combined-stream/-/combined-stream-1.0.8.tgz",
      "integrity": "sha512-FQN4MRfuJeHf7cBbBMJFXhKSDq+2kAArBlmRBvcvFE5BB1HZKXtSFASDhdlz9zOYwxh8lDdnvmMOe/+5cdoEdg==",
      "license": "MIT",
      "dependencies": {
        "delayed-stream": "~1.0.0"
      },
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/commander": {
      "version": "14.0.2",
      "resolved": "https://registry.npmjs.org/commander/-/commander-14.0.2.tgz",
      "integrity": "sha512-TywoWNNRbhoD0BXs1P3ZEScW8W5iKrnbithIl0YH+uCmBd0QpPOA8yc82DS3BIE5Ma6FnBVUsJ7wVUDz4dvOWQ==",
      "license": "MIT",
      "engines": {
        "node": ">=20"
      }
    },
    "node_modules/concat-map": {
      "version": "0.0.1",
      "resolved": "https://registry.npmjs.org/concat-map/-/concat-map-0.0.1.tgz",
      "integrity": "sha512-/Srv4dswyQNBfohGpz9o6Yb3Gz3SrUDqBH5rTuhGR7ahtlbYKnVxw2bCFMRljaA7EXHaXZ8wsHdodFvbkhKmqg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/confbox": {
      "version": "0.2.4",
      "resolved": "https://registry.npmjs.org/confbox/-/confbox-0.2.4.tgz",
      "integrity": "sha512-ysOGlgTFbN2/Y6Cg3Iye8YKulHw+R2fNXHrgSmXISQdMnomY6eNDprVdW9R5xBguEqI954+S6709UyiO7B+6OQ==",
      "devOptional": true,
      "license": "MIT"
    },
    "node_modules/consola": {
      "version": "3.4.2",
      "resolved": "https://registry.npmjs.org/consola/-/consola-3.4.2.tgz",
      "integrity": "sha512-5IKcdX0nnYavi6G7TtOhwkYzyjfJlatbjMjuLSfE2kYT5pMDOilZ4OvMhi637CcDICTmz3wARPoyhqyX1Y+XvA==",
      "devOptional": true,
      "license": "MIT",
      "engines": {
        "node": "^14.18.0 || >=16.10.0"
      }
    },
    "node_modules/convert-source-map": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/convert-source-map/-/convert-source-map-2.0.0.tgz",
      "integrity": "sha512-Kvp459HrV2FEJ1CAsi1Ku+MY3kasH19TFykTz2xWmMeq6bk2NU3XXvfJ+Q61m0xktWwt+1HSYf3JZsTms3aRJg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/cookie": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/cookie/-/cookie-1.1.1.tgz",
      "integrity": "sha512-ei8Aos7ja0weRpFzJnEA9UHJ/7XQmqglbRwnf2ATjcB9Wq874VKH9kfjjirM6UhU2/E5fFYadylyhFldcqSidQ==",
      "license": "MIT",
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/cookie-es": {
      "version": "1.2.3",
      "resolved": "https://registry.npmjs.org/cookie-es/-/cookie-es-1.2.3.tgz",
      "integrity": "sha512-lXVyvUvrNXblMqzIRrxHb57UUVmqsSWlxqt3XIjCkUP0wDAf6uicO6KMbEgYrMNtEvWgWHwe42CKxPu9MYAnWw==",
      "license": "MIT"
    },
    "node_modules/core-util-is": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/core-util-is/-/core-util-is-1.0.3.tgz",
      "integrity": "sha512-ZQBvi1DcpJ4GDqanjucZ2Hj3wEO5pZDS89BWbkcrvdxksJorwUDDZamX9ldFkp9aw2lmBDLgkObEA4DWNJ9FYQ==",
      "license": "MIT"
    },
    "node_modules/crc-32": {
      "version": "1.2.2",
      "resolved": "https://registry.npmjs.org/crc-32/-/crc-32-1.2.2.tgz",
      "integrity": "sha512-ROmzCKrTnOwybPcJApAA6WBWij23HVfGVNKqqrZpuyZOHqK2CwHSvpGuyt/UNNvaIjEd8X5IFGp4Mh+Ie1IHJQ==",
      "license": "Apache-2.0",
      "bin": {
        "crc32": "bin/crc32.njs"
      },
      "engines": {
        "node": ">=0.8"
      }
    },
    "node_modules/cross-fetch": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/cross-fetch/-/cross-fetch-4.1.0.tgz",
      "integrity": "sha512-uKm5PU+MHTootlWEY+mZ4vvXoCn4fLQxT9dSc1sXVMSFkINTJVN8cAQROpwcKm8bJ/c7rgZVIBWzH5T78sNZZw==",
      "license": "MIT",
      "dependencies": {
        "node-fetch": "^2.7.0"
      }
    },
    "node_modules/cross-spawn": {
      "version": "6.0.6",
      "resolved": "https://registry.npmjs.org/cross-spawn/-/cross-spawn-6.0.6.tgz",
      "integrity": "sha512-VqCUuhcd1iB+dsv8gxPttb5iZh/D0iubSP21g36KXdEuf6I5JiioesUVjpCdHV9MZRUfVFlvwtIUyPfxo5trtw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "nice-try": "^1.0.4",
        "path-key": "^2.0.1",
        "semver": "^5.5.0",
        "shebang-command": "^1.2.0",
        "which": "^1.2.9"
      },
      "engines": {
        "node": ">=4.8"
      }
    },
    "node_modules/crossws": {
      "version": "0.3.5",
      "resolved": "https://registry.npmjs.org/crossws/-/crossws-0.3.5.tgz",
      "integrity": "sha512-ojKiDvcmByhwa8YYqbQI/hg7MEU0NC03+pSdEq4ZUnZR9xXpwk7E43SMNGkn+JxJGPFtNvQ48+vV2p+P1ml5PA==",
      "license": "MIT",
      "dependencies": {
        "uncrypto": "^0.1.3"
      }
    },
    "node_modules/crypt": {
      "version": "0.0.2",
      "resolved": "https://registry.npmjs.org/crypt/-/crypt-0.0.2.tgz",
      "integrity": "sha512-mCxBlsHFYh9C+HVpiEacem8FEBnMXgU9gy4zmNC+SXAZNB/1idgp/aulFJ4FgCi7GPEVbfyng092GqL2k2rmow==",
      "license": "BSD-3-Clause",
      "engines": {
        "node": "*"
      }
    },
    "node_modules/csstype": {
      "version": "3.2.3",
      "resolved": "https://registry.npmjs.org/csstype/-/csstype-3.2.3.tgz",
      "integrity": "sha512-z1HGKcYy2xA8AGQfwrn0PAy+PB7X/GSj3UVJW9qKyn43xWa+gl5nXmU4qqLMRzWVLFC8KusUX8T/0kCiOYpAIQ==",
      "devOptional": true,
      "license": "MIT"
    },
    "node_modules/data-view-buffer": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/data-view-buffer/-/data-view-buffer-1.0.2.tgz",
      "integrity": "sha512-EmKO5V3OLXh1rtK2wgXRansaK1/mtVdTUEiEI0W8RkvgT05kfxaH29PliLnpLP73yYO6142Q72QNa8Wx/A5CqQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3",
        "es-errors": "^1.3.0",
        "is-data-view": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/data-view-byte-length": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/data-view-byte-length/-/data-view-byte-length-1.0.2.tgz",
      "integrity": "sha512-tuhGbE6CfTM9+5ANGf+oQb72Ky/0+s3xKUpHvShfiz2RxMFgFPjsXuRLBVMtvMs15awe45SRb83D6wH4ew6wlQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3",
        "es-errors": "^1.3.0",
        "is-data-view": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/inspect-js"
      }
    },
    "node_modules/data-view-byte-offset": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/data-view-byte-offset/-/data-view-byte-offset-1.0.1.tgz",
      "integrity": "sha512-BS8PfmtDGnrgYdOonGZQdLZslWIeCGFP9tpan0hi1Co2Zr2NKADsvGYA8XxuG/4UWgJ6Cjtv+YJnB6MM69QGlQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "es-errors": "^1.3.0",
        "is-data-view": "^1.0.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/date-fns": {
      "version": "2.30.0",
      "resolved": "https://registry.npmjs.org/date-fns/-/date-fns-2.30.0.tgz",
      "integrity": "sha512-fnULvOpxnC5/Vg3NCiWelDsLiUc9bRwAPs/+LfTLNvetFCtCTN+yQz15C/fs4AwX1R9K5GLtLfn8QW+dWisaAw==",
      "license": "MIT",
      "dependencies": {
        "@babel/runtime": "^7.21.0"
      },
      "engines": {
        "node": ">=0.11"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/date-fns"
      }
    },
    "node_modules/dayjs": {
      "version": "1.11.13",
      "resolved": "https://registry.npmjs.org/dayjs/-/dayjs-1.11.13.tgz",
      "integrity": "sha512-oaMBel6gjolK862uaPQOVTA7q3TZhuSvuMQAAglQDOWYO9A91IrAOUJEyKVlqJlHE0vq5p5UXxzdPfMH/x6xNg==",
      "license": "MIT"
    },
    "node_modules/debug": {
      "version": "4.4.3",
      "resolved": "https://registry.npmjs.org/debug/-/debug-4.4.3.tgz",
      "integrity": "sha512-RGwwWnwQvkVfavKVt22FGLw+xYSdzARwm0ru6DhTVA3umU5hZc28V3kO4stgYryrTlLpuvgI9GiijltAjNbcqA==",
      "license": "MIT",
      "dependencies": {
        "ms": "^2.1.3"
      },
      "engines": {
        "node": ">=6.0"
      },
      "peerDependenciesMeta": {
        "supports-color": {
          "optional": true
        }
      }
    },
    "node_modules/decamelize": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/decamelize/-/decamelize-1.2.0.tgz",
      "integrity": "sha512-z2S+W9X73hAUUki+N+9Za2lBlun89zigOyGrsax+KUQ6wKW4ZoWpEYBkGhQjwAjjDCkWxhY0VKEhk8wzY7F5cA==",
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/decode-uri-component": {
      "version": "0.2.2",
      "resolved": "https://registry.npmjs.org/decode-uri-component/-/decode-uri-component-0.2.2.tgz",
      "integrity": "sha512-FqUYQ+8o158GyGTrMFJms9qh3CqTKvAqgqsTnkLI8sKu0028orqBhxNMFkFen0zGyg6epACD32pjVk58ngIErQ==",
      "license": "MIT",
      "engines": {
        "node": ">=0.10"
      }
    },
    "node_modules/deep-eql": {
      "version": "5.0.2",
      "resolved": "https://registry.npmjs.org/deep-eql/-/deep-eql-5.0.2.tgz",
      "integrity": "sha512-h5k/5U50IJJFpzfL6nO9jaaumfjO/f2NjK/oYB2Djzm4p9L+3T9qWpZqZ2hAbLPuuYq9wrU08WQyBTL5GbPk5Q==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/deepmerge-ts": {
      "version": "7.1.5",
      "resolved": "https://registry.npmjs.org/deepmerge-ts/-/deepmerge-ts-7.1.5.tgz",
      "integrity": "sha512-HOJkrhaYsweh+W+e74Yn7YStZOilkoPb6fycpwNLKzSPtruFs48nYis0zy5yJz1+ktUhHxoRDJ27RQAWLIJVJw==",
      "devOptional": true,
      "license": "BSD-3-Clause",
      "engines": {
        "node": ">=16.0.0"
      }
    },
    "node_modules/define-data-property": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/define-data-property/-/define-data-property-1.1.4.tgz",
      "integrity": "sha512-rBMvIzlpA8v6E+SJZoo++HAYqsLrkg7MSfIinMPFhmkorw7X+dOXVJQs+QT69zGkzMyfDnIMN2Wid1+NbL3T+A==",
      "license": "MIT",
      "dependencies": {
        "es-define-property": "^1.0.0",
        "es-errors": "^1.3.0",
        "gopd": "^1.0.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/define-properties": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/define-properties/-/define-properties-1.2.1.tgz",
      "integrity": "sha512-8QmQKqEASLd5nx0U1B1okLElbUuuttJ/AnYmRXbbbGDWh6uS208EjD4Xqq/I9wK7u0v6O08XhTWnt5XtEbR6Dg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "define-data-property": "^1.0.1",
        "has-property-descriptors": "^1.0.0",
        "object-keys": "^1.1.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/defu": {
      "version": "6.1.7",
      "resolved": "https://registry.npmjs.org/defu/-/defu-6.1.7.tgz",
      "integrity": "sha512-7z22QmUWiQ/2d0KkdYmANbRUVABpZ9SNYyH5vx6PZ+nE5bcC0l7uFvEfHlyld/HcGBFTL536ClDt3DEcSlEJAQ==",
      "license": "MIT"
    },
    "node_modules/delayed-stream": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/delayed-stream/-/delayed-stream-1.0.0.tgz",
      "integrity": "sha512-ZySD7Nf91aLB0RxL4KGrKHBXl7Eds1DAmEdcoVawXnLD7SDhpNgtuII2aAkg7a7QS41jxPSZ17p4VdGnMHk3MQ==",
      "license": "MIT",
      "engines": {
        "node": ">=0.4.0"
      }
    },
    "node_modules/dequal": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/dequal/-/dequal-2.0.3.tgz",
      "integrity": "sha512-0je+qPKHEMohvfRTCEo3CrPG6cAzAYgmzKyxRiYSSDkS6eGJdyVJm7WaYA5ECaAD9wLB2T4EEeymA5aFVcYXCA==",
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/derive-valtio": {
      "version": "0.1.0",
      "resolved": "https://registry.npmjs.org/derive-valtio/-/derive-valtio-0.1.0.tgz",
      "integrity": "sha512-OCg2UsLbXK7GmmpzMXhYkdO64vhJ1ROUUGaTFyHjVwEdMEcTTRj7W1TxLbSBxdY8QLBPCcp66MTyaSy0RpO17A==",
      "license": "MIT",
      "peerDependencies": {
        "valtio": "*"
      }
    },
    "node_modules/destr": {
      "version": "2.0.5",
      "resolved": "https://registry.npmjs.org/destr/-/destr-2.0.5.tgz",
      "integrity": "sha512-ugFTXCtDZunbzasqBxrK93Ik/DRYsO6S/fedkWEMKqt04xZ4csmnmwGDBAb07QWNaGMAmnTIemsYZCksjATwsA==",
      "license": "MIT"
    },
    "node_modules/detect-browser": {
      "version": "5.3.0",
      "resolved": "https://registry.npmjs.org/detect-browser/-/detect-browser-5.3.0.tgz",
      "integrity": "sha512-53rsFbGdwMwlF7qvCt0ypLM5V5/Mbl0szB7GPN8y9NCcbknYOeVVXdrXEq+90IwAfrrzt6Hd+u2E2ntakICU8w==",
      "license": "MIT"
    },
    "node_modules/dijkstrajs": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/dijkstrajs/-/dijkstrajs-1.0.3.tgz",
      "integrity": "sha512-qiSlmBq9+BCdCA/L46dw8Uy93mloxsPSbwnm5yrKn2vMPiy8KyAskTF6zuV/j5BMsmOGZDPs7KjU+mjb670kfA==",
      "license": "MIT"
    },
    "node_modules/dnd-core": {
      "version": "16.0.1",
      "resolved": "https://registry.npmjs.org/dnd-core/-/dnd-core-16.0.1.tgz",
      "integrity": "sha512-HK294sl7tbw6F6IeuK16YSBUoorvHpY8RHO+9yFfaJyCDVb6n7PRcezrOEOa2SBCqiYpemh5Jx20ZcjKdFAVng==",
      "license": "MIT",
      "dependencies": {
        "@react-dnd/asap": "^5.0.1",
        "@react-dnd/invariant": "^4.0.1",
        "redux": "^4.2.0"
      }
    },
    "node_modules/dotenv": {
      "version": "16.6.1",
      "resolved": "https://registry.npmjs.org/dotenv/-/dotenv-16.6.1.tgz",
      "integrity": "sha512-uBq4egWHTcTt33a72vpSG0z3HnPuIl6NqYcTrKEg2azoEyl2hpW0zqlxysq2pK9HlDIHyHyakeYaYnSAwd8bow==",
      "license": "BSD-2-Clause",
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://dotenvx.com"
      }
    },
    "node_modules/dunder-proto": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/dunder-proto/-/dunder-proto-1.0.1.tgz",
      "integrity": "sha512-KIN/nDJBQRcXw0MLVhZE9iQHmG68qAVIBg9CqmUYjmQIhgij9U5MFvrqkUL5FbtyyzZuOeOt0zdeRe4UY7ct+A==",
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.1",
        "es-errors": "^1.3.0",
        "gopd": "^1.2.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/duplexify": {
      "version": "4.1.3",
      "resolved": "https://registry.npmjs.org/duplexify/-/duplexify-4.1.3.tgz",
      "integrity": "sha512-M3BmBhwJRZsSx38lZyhE53Csddgzl5R7xGJNk7CVddZD6CcmwMCH8J+7AprIrQKH7TonKxaCjcv27Qmf+sQ+oA==",
      "license": "MIT",
      "dependencies": {
        "end-of-stream": "^1.4.1",
        "inherits": "^2.0.3",
        "readable-stream": "^3.1.1",
        "stream-shift": "^1.0.2"
      }
    },
    "node_modules/ecdsa-sig-formatter": {
      "version": "1.0.11",
      "resolved": "https://registry.npmjs.org/ecdsa-sig-formatter/-/ecdsa-sig-formatter-1.0.11.tgz",
      "integrity": "sha512-nagl3RYrbNv6kQkeJIpt6NJZy8twLB/2vtz6yN9Z4vRKHN4/QZJIEbqohALSgwKdnksuY3k5Addp5lg8sVoVcQ==",
      "license": "Apache-2.0",
      "dependencies": {
        "safe-buffer": "^5.0.1"
      }
    },
    "node_modules/eciesjs": {
      "version": "0.4.18",
      "resolved": "https://registry.npmjs.org/eciesjs/-/eciesjs-0.4.18.tgz",
      "integrity": "sha512-wG99Zcfcys9fZux7Cft8BAX/YrOJLJSZ3jyYPfhZHqN2E+Ffx+QXBDsv3gubEgPtV6dTzJMSQUwk1H98/t/0wQ==",
      "license": "MIT",
      "dependencies": {
        "@ecies/ciphers": "^0.2.5",
        "@noble/ciphers": "^1.3.0",
        "@noble/curves": "^1.9.7",
        "@noble/hashes": "^1.8.0"
      },
      "engines": {
        "bun": ">=1",
        "deno": ">=2",
        "node": ">=16"
      }
    },
    "node_modules/eciesjs/node_modules/@noble/ciphers": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/@noble/ciphers/-/ciphers-1.3.0.tgz",
      "integrity": "sha512-2I0gnIVPtfnMw9ee9h1dJG7tp81+8Ob3OJb3Mv37rx5L40/b0i7djjCVvGOVqc9AEIQyvyu1i6ypKdFw8R8gQw==",
      "license": "MIT",
      "engines": {
        "node": "^14.21.3 || >=16"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/effect": {
      "version": "3.21.0",
      "resolved": "https://registry.npmjs.org/effect/-/effect-3.21.0.tgz",
      "integrity": "sha512-PPN80qRokCd1f015IANNhrwOnLO7GrrMQfk4/lnZRE/8j7UPWrNNjPV0uBrZutI/nHzernbW+J0hdqQysHiSnQ==",
      "devOptional": true,
      "license": "MIT",
      "dependencies": {
        "@standard-schema/spec": "^1.0.0",
        "fast-check": "^3.23.1"
      }
    },
    "node_modules/electron-to-chromium": {
      "version": "1.5.349",
      "resolved": "https://registry.npmjs.org/electron-to-chromium/-/electron-to-chromium-1.5.349.tgz",
      "integrity": "sha512-QsWVGyRuY07Aqb234QytTfwd5d9AJlfNIQ5wIOl1L+PZDzI9d9+Fn0FRale/QYlFxt/bUnB0/nLd1jFPGxGK1A==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/emoji-regex": {
      "version": "8.0.0",
      "resolved": "https://registry.npmjs.org/emoji-regex/-/emoji-regex-8.0.0.tgz",
      "integrity": "sha512-MSjYzcWNOA0ewAHpz0MxpYFvwg6yjy1NG3xteoqz644VCo/RPgnr1/GGt+ic3iJTzQ8Eu3TdM14SawnVUmGE6A==",
      "license": "MIT"
    },
    "node_modules/empathic": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/empathic/-/empathic-2.0.0.tgz",
      "integrity": "sha512-i6UzDscO/XfAcNYD75CfICkmfLedpyPDdozrLMmQc5ORaQcdMoc21OnlEylMIqI7U8eniKrPMxxtj8k0vhmJhA==",
      "devOptional": true,
      "license": "MIT",
      "engines": {
        "node": ">=14"
      }
    },
    "node_modules/encode-utf8": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/encode-utf8/-/encode-utf8-1.0.3.tgz",
      "integrity": "sha512-ucAnuBEhUK4boH2HjVYG5Q2mQyPorvv0u/ocS+zhdw0S8AlHYY+GOFhP1Gio5z4icpP2ivFSvhtFjQi8+T9ppw==",
      "license": "MIT"
    },
    "node_modules/end-of-stream": {
      "version": "1.4.5",
      "resolved": "https://registry.npmjs.org/end-of-stream/-/end-of-stream-1.4.5.tgz",
      "integrity": "sha512-ooEGc6HP26xXq/N+GCGOT0JKCLDGrq2bQUZrQ7gyrJiZANJ/8YDTxTpQBXGMn+WbIQXNVpyWymm7KYVICQnyOg==",
      "license": "MIT",
      "dependencies": {
        "once": "^1.4.0"
      }
    },
    "node_modules/engine.io-client": {
      "version": "6.6.4",
      "resolved": "https://registry.npmjs.org/engine.io-client/-/engine.io-client-6.6.4.tgz",
      "integrity": "sha512-+kjUJnZGwzewFDw951CDWcwj35vMNf2fcj7xQWOctq1F2i1jkDdVvdFG9kM/BEChymCH36KgjnW0NsL58JYRxw==",
      "license": "MIT",
      "dependencies": {
        "@socket.io/component-emitter": "~3.1.0",
        "debug": "~4.4.1",
        "engine.io-parser": "~5.2.1",
        "ws": "~8.18.3",
        "xmlhttprequest-ssl": "~2.1.1"
      }
    },
    "node_modules/engine.io-client/node_modules/ws": {
      "version": "8.18.3",
      "resolved": "https://registry.npmjs.org/ws/-/ws-8.18.3.tgz",
      "integrity": "sha512-PEIGCY5tSlUt50cqyMXfCzX+oOPqN0vuGqWzbcJ2xvnkzkq46oOpz7dQaTDBdfICb4N14+GARUDw2XV2N4tvzg==",
      "license": "MIT",
      "engines": {
        "node": ">=10.0.0"
      },
      "peerDependencies": {
        "bufferutil": "^4.0.1",
        "utf-8-validate": ">=5.0.2"
      },
      "peerDependenciesMeta": {
        "bufferutil": {
          "optional": true
        },
        "utf-8-validate": {
          "optional": true
        }
      }
    },
    "node_modules/engine.io-parser": {
      "version": "5.2.3",
      "resolved": "https://registry.npmjs.org/engine.io-parser/-/engine.io-parser-5.2.3.tgz",
      "integrity": "sha512-HqD3yTBfnBxIrbnM1DoD6Pcq8NECnh8d4As1Qgh0z5Gg3jRRIqijury0CL3ghu/edArpUYiYqQiDUQBIs4np3Q==",
      "license": "MIT",
      "engines": {
        "node": ">=10.0.0"
      }
    },
    "node_modules/error-ex": {
      "version": "1.3.4",
      "resolved": "https://registry.npmjs.org/error-ex/-/error-ex-1.3.4.tgz",
      "integrity": "sha512-sqQamAnR14VgCr1A618A3sGrygcpK+HEbenA/HiEAkkUwcZIIB/tgWqHFxWgOyDh4nB4JCRimh79dR5Ywc9MDQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "is-arrayish": "^0.2.1"
      }
    },
    "node_modules/es-abstract": {
      "version": "1.24.2",
      "resolved": "https://registry.npmjs.org/es-abstract/-/es-abstract-1.24.2.tgz",
      "integrity": "sha512-2FpH9Q5i2RRwyEP1AylXe6nYLR5OhaJTZwmlcP0dL/+JCbgg7yyEo/sEK6HeGZRf3dFpWwThaRHVApXSkW3xeg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "array-buffer-byte-length": "^1.0.2",
        "arraybuffer.prototype.slice": "^1.0.4",
        "available-typed-arrays": "^1.0.7",
        "call-bind": "^1.0.8",
        "call-bound": "^1.0.4",
        "data-view-buffer": "^1.0.2",
        "data-view-byte-length": "^1.0.2",
        "data-view-byte-offset": "^1.0.1",
        "es-define-property": "^1.0.1",
        "es-errors": "^1.3.0",
        "es-object-atoms": "^1.1.1",
        "es-set-tostringtag": "^2.1.0",
        "es-to-primitive": "^1.3.0",
        "function.prototype.name": "^1.1.8",
        "get-intrinsic": "^1.3.0",
        "get-proto": "^1.0.1",
        "get-symbol-description": "^1.1.0",
        "globalthis": "^1.0.4",
        "gopd": "^1.2.0",
        "has-property-descriptors": "^1.0.2",
        "has-proto": "^1.2.0",
        "has-symbols": "^1.1.0",
        "hasown": "^2.0.2",
        "internal-slot": "^1.1.0",
        "is-array-buffer": "^3.0.5",
        "is-callable": "^1.2.7",
        "is-data-view": "^1.0.2",
        "is-negative-zero": "^2.0.3",
        "is-regex": "^1.2.1",
        "is-set": "^2.0.3",
        "is-shared-array-buffer": "^1.0.4",
        "is-string": "^1.1.1",
        "is-typed-array": "^1.1.15",
        "is-weakref": "^1.1.1",
        "math-intrinsics": "^1.1.0",
        "object-inspect": "^1.13.4",
        "object-keys": "^1.1.1",
        "object.assign": "^4.1.7",
        "own-keys": "^1.0.1",
        "regexp.prototype.flags": "^1.5.4",
        "safe-array-concat": "^1.1.3",
        "safe-push-apply": "^1.0.0",
        "safe-regex-test": "^1.1.0",
        "set-proto": "^1.0.0",
        "stop-iteration-iterator": "^1.1.0",
        "string.prototype.trim": "^1.2.10",
        "string.prototype.trimend": "^1.0.9",
        "string.prototype.trimstart": "^1.0.8",
        "typed-array-buffer": "^1.0.3",
        "typed-array-byte-length": "^1.0.3",
        "typed-array-byte-offset": "^1.0.4",
        "typed-array-length": "^1.0.7",
        "unbox-primitive": "^1.1.0",
        "which-typed-array": "^1.1.19"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/es-define-property": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/es-define-property/-/es-define-property-1.0.1.tgz",
      "integrity": "sha512-e3nRfgfUZ4rNGL232gUgX06QNyyez04KdjFrF+LTRoOXmrOgFKDg4BCdsjW8EnT69eqdYGmRpJwiPVYNrCaW3g==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-errors": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/es-errors/-/es-errors-1.3.0.tgz",
      "integrity": "sha512-Zf5H2Kxt2xjTvbJvP2ZWLEICxA6j+hAmMzIlypy4xcBg1vKVnx89Wy0GbS+kf5cwCVFFzdCFh2XSCFNULS6csw==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-module-lexer": {
      "version": "1.7.0",
      "resolved": "https://registry.npmjs.org/es-module-lexer/-/es-module-lexer-1.7.0.tgz",
      "integrity": "sha512-jEQoCwk8hyb2AZziIOLhDqpm5+2ww5uIE6lkO/6jcOCusfk6LhMHpXXfBLXTZ7Ydyt0j4VoUQv6uGNYbdW+kBA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/es-object-atoms": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/es-object-atoms/-/es-object-atoms-1.1.1.tgz",
      "integrity": "sha512-FGgH2h8zKNim9ljj7dankFPcICIK9Cp5bm+c2gQSYePhpaG5+esrLODihIorn+Pe6FGJzWhXQotPv73jTaldXA==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-set-tostringtag": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/es-set-tostringtag/-/es-set-tostringtag-2.1.0.tgz",
      "integrity": "sha512-j6vWzfrGVfyXxge+O0x5sh6cvxAog0a/4Rdd2K36zCMV5eJ+/+tOAngRO8cODMNWbVRdVlmGZQL2YS3yR8bIUA==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.6",
        "has-tostringtag": "^1.0.2",
        "hasown": "^2.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-to-primitive": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/es-to-primitive/-/es-to-primitive-1.3.0.tgz",
      "integrity": "sha512-w+5mJ3GuFL+NjVtJlvydShqE1eN3h3PbI7/5LAsYJP/2qtuMXjfL2LpHSRqo4b4eSF5K/DH1JXKUAHSB2UW50g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "is-callable": "^1.2.7",
        "is-date-object": "^1.0.5",
        "is-symbol": "^1.0.4"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/es-toolkit": {
      "version": "1.33.0",
      "resolved": "https://registry.npmjs.org/es-toolkit/-/es-toolkit-1.33.0.tgz",
      "integrity": "sha512-X13Q/ZSc+vsO1q600bvNK4bxgXMkHcf//RxCmYDaRY5DAcT+eoXjY5hoAPGMdRnWQjvyLEcyauG3b6hz76LNqg==",
      "license": "MIT",
      "workspaces": [
        "docs",
        "benchmarks"
      ]
    },
    "node_modules/esbuild": {
      "version": "0.27.7",
      "resolved": "https://registry.npmjs.org/esbuild/-/esbuild-0.27.7.tgz",
      "integrity": "sha512-IxpibTjyVnmrIQo5aqNpCgoACA/dTKLTlhMHihVHhdkxKyPO1uBBthumT0rdHmcsk9uMonIWS0m4FljWzILh3w==",
      "dev": true,
      "hasInstallScript": true,
      "license": "MIT",
      "bin": {
        "esbuild": "bin/esbuild"
      },
      "engines": {
        "node": ">=18"
      },
      "optionalDependencies": {
        "@esbuild/aix-ppc64": "0.27.7",
        "@esbuild/android-arm": "0.27.7",
        "@esbuild/android-arm64": "0.27.7",
        "@esbuild/android-x64": "0.27.7",
        "@esbuild/darwin-arm64": "0.27.7",
        "@esbuild/darwin-x64": "0.27.7",
        "@esbuild/freebsd-arm64": "0.27.7",
        "@esbuild/freebsd-x64": "0.27.7",
        "@esbuild/linux-arm": "0.27.7",
        "@esbuild/linux-arm64": "0.27.7",
        "@esbuild/linux-ia32": "0.27.7",
        "@esbuild/linux-loong64": "0.27.7",
        "@esbuild/linux-mips64el": "0.27.7",
        "@esbuild/linux-ppc64": "0.27.7",
        "@esbuild/linux-riscv64": "0.27.7",
        "@esbuild/linux-s390x": "0.27.7",
        "@esbuild/linux-x64": "0.27.7",
        "@esbuild/netbsd-arm64": "0.27.7",
        "@esbuild/netbsd-x64": "0.27.7",
        "@esbuild/openbsd-arm64": "0.27.7",
        "@esbuild/openbsd-x64": "0.27.7",
        "@esbuild/openharmony-arm64": "0.27.7",
        "@esbuild/sunos-x64": "0.27.7",
        "@esbuild/win32-arm64": "0.27.7",
        "@esbuild/win32-ia32": "0.27.7",
        "@esbuild/win32-x64": "0.27.7"
      }
    },
    "node_modules/escalade": {
      "version": "3.2.0",
      "resolved": "https://registry.npmjs.org/escalade/-/escalade-3.2.0.tgz",
      "integrity": "sha512-WUj2qlxaQtO4g6Pq5c29GTcWGDyd8itL8zTlipgECz3JesAiiOKotd8JU6otB3PACgG6xkJUyVhboMS+bje/jA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/escape-string-regexp": {
      "version": "1.0.5",
      "resolved": "https://registry.npmjs.org/escape-string-regexp/-/escape-string-regexp-1.0.5.tgz",
      "integrity": "sha512-vbRorB5FUQWvla16U8R/qgaFIya2qGzwDrNmCZuYKrbdSUMG6I1ZCGQRefkRVhuOkIGVne7BQ35DSfo1qvJqFg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.8.0"
      }
    },
    "node_modules/estree-walker": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/estree-walker/-/estree-walker-3.0.3.tgz",
      "integrity": "sha512-7RUKfXgSMMkzt6ZuXmqapOurLGPPfgj6l9uRZ7lRGolvk0y2yocc35LdcxKC5PQZdn2DMqioAQ2NoWcrTKmm6g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/estree": "^1.0.0"
      }
    },
    "node_modules/eth-block-tracker": {
      "version": "7.1.0",
      "resolved": "https://registry.npmjs.org/eth-block-tracker/-/eth-block-tracker-7.1.0.tgz",
      "integrity": "sha512-8YdplnuE1IK4xfqpf4iU7oBxnOYAc35934o083G8ao+8WM8QQtt/mVlAY6yIAdY1eMeLqg4Z//PZjJGmWGPMRg==",
      "license": "MIT",
      "dependencies": {
        "@metamask/eth-json-rpc-provider": "^1.0.0",
        "@metamask/safe-event-emitter": "^3.0.0",
        "@metamask/utils": "^5.0.1",
        "json-rpc-random-id": "^1.0.1",
        "pify": "^3.0.0"
      },
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/eth-block-tracker/node_modules/@metamask/utils": {
      "version": "5.0.2",
      "resolved": "https://registry.npmjs.org/@metamask/utils/-/utils-5.0.2.tgz",
      "integrity": "sha512-yfmE79bRQtnMzarnKfX7AEJBwFTxvTyw3nBQlu/5rmGXrjAeAMltoGxO62TFurxrQAFMNa/fEjIHNvungZp0+g==",
      "license": "ISC",
      "dependencies": {
        "@ethereumjs/tx": "^4.1.2",
        "@types/debug": "^4.1.7",
        "debug": "^4.3.4",
        "semver": "^7.3.8",
        "superstruct": "^1.0.3"
      },
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/eth-block-tracker/node_modules/semver": {
      "version": "7.7.4",
      "resolved": "https://registry.npmjs.org/semver/-/semver-7.7.4.tgz",
      "integrity": "sha512-vFKC2IEtQnVhpT78h1Yp8wzwrf8CM+MzKMHGJZfBtzhZNycRFnXsHk6E5TxIkkMsgNS7mdX3AGB7x2QM2di4lA==",
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/eth-json-rpc-filters": {
      "version": "6.0.1",
      "resolved": "https://registry.npmjs.org/eth-json-rpc-filters/-/eth-json-rpc-filters-6.0.1.tgz",
      "integrity": "sha512-ITJTvqoCw6OVMLs7pI8f4gG92n/St6x80ACtHodeS+IXmO0w+t1T5OOzfSt7KLSMLRkVUoexV7tztLgDxg+iig==",
      "license": "ISC",
      "dependencies": {
        "@metamask/safe-event-emitter": "^3.0.0",
        "async-mutex": "^0.2.6",
        "eth-query": "^2.1.2",
        "json-rpc-engine": "^6.1.0",
        "pify": "^5.0.0"
      },
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/eth-json-rpc-filters/node_modules/pify": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/pify/-/pify-5.0.0.tgz",
      "integrity": "sha512-eW/gHNMlxdSP6dmG6uJip6FXN0EQBwm2clYYd8Wul42Cwu/DK8HEftzsapcNdYe2MfLiIwZqsDk2RDEsTE79hA==",
      "license": "MIT",
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/eth-query": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/eth-query/-/eth-query-2.1.2.tgz",
      "integrity": "sha512-srES0ZcvwkR/wd5OQBRA1bIJMww1skfGS0s8wlwK3/oNP4+wnds60krvu5R1QbpRQjMmpG5OMIWro5s7gvDPsA==",
      "license": "ISC",
      "dependencies": {
        "json-rpc-random-id": "^1.0.0",
        "xtend": "^4.0.1"
      }
    },
    "node_modules/eth-rpc-errors": {
      "version": "4.0.3",
      "resolved": "https://registry.npmjs.org/eth-rpc-errors/-/eth-rpc-errors-4.0.3.tgz",
      "integrity": "sha512-Z3ymjopaoft7JDoxZcEb3pwdGh7yiYMhOwm2doUt6ASXlMavpNlK6Cre0+IMl2VSGyEU9rkiperQhp5iRxn5Pg==",
      "license": "MIT",
      "dependencies": {
        "fast-safe-stringify": "^2.0.6"
      }
    },
    "node_modules/ethereum-cryptography": {
      "version": "2.2.1",
      "resolved": "https://registry.npmjs.org/ethereum-cryptography/-/ethereum-cryptography-2.2.1.tgz",
      "integrity": "sha512-r/W8lkHSiTLxUxW8Rf3u4HGB0xQweG2RyETjywylKZSzLWoWAijRz8WCuOtJ6wah+avllXBqZuk29HCCvhEIRg==",
      "license": "MIT",
      "dependencies": {
        "@noble/curves": "1.4.2",
        "@noble/hashes": "1.4.0",
        "@scure/bip32": "1.4.0",
        "@scure/bip39": "1.3.0"
      }
    },
    "node_modules/ethereum-cryptography/node_modules/@noble/curves": {
      "version": "1.4.2",
      "resolved": "https://registry.npmjs.org/@noble/curves/-/curves-1.4.2.tgz",
      "integrity": "sha512-TavHr8qycMChk8UwMld0ZDRvatedkzWfH8IiaeGCfymOP5i0hSCozz9vHOL0nkwk7HRMlFnAiKpS2jrUmSybcw==",
      "license": "MIT",
      "dependencies": {
        "@noble/hashes": "1.4.0"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/ethereum-cryptography/node_modules/@noble/hashes": {
      "version": "1.4.0",
      "resolved": "https://registry.npmjs.org/@noble/hashes/-/hashes-1.4.0.tgz",
      "integrity": "sha512-V1JJ1WTRUqHHrOSh597hURcMqVKVGL/ea3kv0gSnEdsEZ0/+VyPghM1lMNGc00z7CIQorSvbKpuJkxvuHbvdbg==",
      "license": "MIT",
      "engines": {
        "node": ">= 16"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/ethereum-cryptography/node_modules/@scure/base": {
      "version": "1.1.9",
      "resolved": "https://registry.npmjs.org/@scure/base/-/base-1.1.9.tgz",
      "integrity": "sha512-8YKhl8GHiNI/pU2VMaofa2Tor7PJRAjwQLBBuilkJ9L5+13yVbC7JO/wS7piioAvPSwR3JKM1IJ/u4xQzbcXKg==",
      "license": "MIT",
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/ethereum-cryptography/node_modules/@scure/bip32": {
      "version": "1.4.0",
      "resolved": "https://registry.npmjs.org/@scure/bip32/-/bip32-1.4.0.tgz",
      "integrity": "sha512-sVUpc0Vq3tXCkDGYVWGIZTRfnvu8LoTDaev7vbwh0omSvVORONr960MQWdKqJDCReIEmTj3PAr73O3aoxz7OPg==",
      "license": "MIT",
      "dependencies": {
        "@noble/curves": "~1.4.0",
        "@noble/hashes": "~1.4.0",
        "@scure/base": "~1.1.6"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/ethereum-cryptography/node_modules/@scure/bip39": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/@scure/bip39/-/bip39-1.3.0.tgz",
      "integrity": "sha512-disdg7gHuTDZtY+ZdkmLpPCk7fxZSu3gBiEGuoC1XYxv9cGx3Z6cpTggCgW6odSOOIXCiDjuGejW+aJKCY/pIQ==",
      "license": "MIT",
      "dependencies": {
        "@noble/hashes": "~1.4.0",
        "@scure/base": "~1.1.6"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/eventemitter2": {
      "version": "6.4.9",
      "resolved": "https://registry.npmjs.org/eventemitter2/-/eventemitter2-6.4.9.tgz",
      "integrity": "sha512-JEPTiaOt9f04oa6NOkc4aH+nVp5I3wEjpHbIPqfgCdD5v5bUzy7xQqwcVO2aDQgOWhI28da57HksMrzK9HlRxg==",
      "license": "MIT"
    },
    "node_modules/eventemitter3": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/eventemitter3/-/eventemitter3-5.0.1.tgz",
      "integrity": "sha512-GWkBvjiSZK87ELrYOSESUYeVIc9mvLLf/nXalMOS5dYrgZq9o5OVkbZAVM06CVxYsCwH9BDZFPlQTlPA1j4ahA==",
      "license": "MIT"
    },
    "node_modules/events": {
      "version": "3.3.0",
      "resolved": "https://registry.npmjs.org/events/-/events-3.3.0.tgz",
      "integrity": "sha512-mQw+2fkQbALzQ7V0MY0IqdnXNOeTtP4r0lN9z7AAawCXgqea7bDii20AYrIBrFd/Hx0M2Ocz6S111CaFkUcb0Q==",
      "license": "MIT",
      "engines": {
        "node": ">=0.8.x"
      }
    },
    "node_modules/expect-type": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/expect-type/-/expect-type-1.3.0.tgz",
      "integrity": "sha512-knvyeauYhqjOYvQ66MznSMs83wmHrCycNEN6Ao+2AeYEfxUIkuiVxdEa1qlGEPK+We3n0THiDciYSsCcgW/DoA==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": ">=12.0.0"
      }
    },
    "node_modules/exsolve": {
      "version": "1.0.8",
      "resolved": "https://registry.npmjs.org/exsolve/-/exsolve-1.0.8.tgz",
      "integrity": "sha512-LmDxfWXwcTArk8fUEnOfSZpHOJ6zOMUJKOtFLFqJLoKJetuQG874Uc7/Kki7zFLzYybmZhp1M7+98pfMqeX8yA==",
      "devOptional": true,
      "license": "MIT"
    },
    "node_modules/extension-port-stream": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/extension-port-stream/-/extension-port-stream-3.0.0.tgz",
      "integrity": "sha512-an2S5quJMiy5bnZKEf6AkfH/7r8CzHvhchU40gxN+OM6HPhe7Z9T1FUychcf2M9PpPOO0Hf7BAEfJkw2TDIBDw==",
      "license": "ISC",
      "dependencies": {
        "readable-stream": "^3.6.2 || ^4.4.2",
        "webextension-polyfill": ">=0.10.0 <1.0"
      },
      "engines": {
        "node": ">=12.0.0"
      }
    },
    "node_modules/fast-check": {
      "version": "3.23.2",
      "resolved": "https://registry.npmjs.org/fast-check/-/fast-check-3.23.2.tgz",
      "integrity": "sha512-h5+1OzzfCC3Ef7VbtKdcv7zsstUQwUDlYpUTvjeUsJAssPgLn7QzbboPtL5ro04Mq0rPOsMzl7q5hIbRs2wD1A==",
      "devOptional": true,
      "funding": [
        {
          "type": "individual",
          "url": "https://github.com/sponsors/dubzzz"
        },
        {
          "type": "opencollective",
          "url": "https://opencollective.com/fast-check"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "pure-rand": "^6.1.0"
      },
      "engines": {
        "node": ">=8.0.0"
      }
    },
    "node_modules/fast-decode-uri-component": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/fast-decode-uri-component/-/fast-decode-uri-component-1.0.1.tgz",
      "integrity": "sha512-WKgKWg5eUxvRZGwW8FvfbaH7AXSh2cL+3j5fMGzUMCxWBJ3dV3a7Wz8y2f/uQ0e3B6WmodD3oS54jTQ9HVTIIg==",
      "license": "MIT"
    },
    "node_modules/fast-deep-equal": {
      "version": "3.1.3",
      "resolved": "https://registry.npmjs.org/fast-deep-equal/-/fast-deep-equal-3.1.3.tgz",
      "integrity": "sha512-f3qQ9oQy9j2AhBe/H9VC91wLmKBCCU/gDOnKNAYG5hswO7BLKj09Hc5HYNz9cGI++xlpDCIgDaitVs03ATR84Q==",
      "license": "MIT"
    },
    "node_modules/fast-json-stringify": {
      "version": "6.3.0",
      "resolved": "https://registry.npmjs.org/fast-json-stringify/-/fast-json-stringify-6.3.0.tgz",
      "integrity": "sha512-oRCntNDY/329HJPlmdNLIdogNtt6Vyjb1WuT01Soss3slIdyUp8kAcDU3saQTOquEK8KFVfwIIF7FebxUAu+yA==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/fastify"
        },
        {
          "type": "opencollective",
          "url": "https://opencollective.com/fastify"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "@fastify/merge-json-schemas": "^0.2.0",
        "ajv": "^8.12.0",
        "ajv-formats": "^3.0.1",
        "fast-uri": "^3.0.0",
        "json-schema-ref-resolver": "^3.0.0",
        "rfdc": "^1.2.0"
      }
    },
    "node_modules/fast-jwt": {
      "version": "6.2.4",
      "resolved": "https://registry.npmjs.org/fast-jwt/-/fast-jwt-6.2.4.tgz",
      "integrity": "sha512-IoQa53wI6TbARU2yelb0L44ggFQnP2qVcwswCSYHbCAWuwpr70icDb3QjG0v01I8Tt01rVGDkN/rRvpk0lKFTA==",
      "license": "Apache-2.0",
      "dependencies": {
        "@lukeed/ms": "^2.0.2",
        "asn1.js": "^5.4.1",
        "ecdsa-sig-formatter": "^1.0.11",
        "mnemonist": "^0.40.0",
        "safe-regex2": "^5.1.0"
      },
      "engines": {
        "node": ">=20"
      }
    },
    "node_modules/fast-querystring": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/fast-querystring/-/fast-querystring-1.1.2.tgz",
      "integrity": "sha512-g6KuKWmFXc0fID8WWH0jit4g0AGBoJhCkJMb1RmbsSEUNvQ+ZC8D6CUZ+GtF8nMzSPXnhiePyyqqipzNNEnHjg==",
      "license": "MIT",
      "dependencies": {
        "fast-decode-uri-component": "^1.0.1"
      }
    },
    "node_modules/fast-redact": {
      "version": "3.5.0",
      "resolved": "https://registry.npmjs.org/fast-redact/-/fast-redact-3.5.0.tgz",
      "integrity": "sha512-dwsoQlS7h9hMeYUq1W++23NDcBLV4KqONnITDV9DjfS3q1SgDGVrBdvvTLUotWtPSD7asWDV9/CmsZPy8Hf70A==",
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/fast-safe-stringify": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/fast-safe-stringify/-/fast-safe-stringify-2.1.1.tgz",
      "integrity": "sha512-W+KJc2dmILlPplD/H4K9l9LcAHAfPtP6BY84uVLXQ6Evcz9Lcg33Y2z1IVblT6xdY54PXYVHEv+0Wpq8Io6zkA==",
      "license": "MIT"
    },
    "node_modules/fast-uri": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/fast-uri/-/fast-uri-3.1.0.tgz",
      "integrity": "sha512-iPeeDKJSWf4IEOasVVrknXpaBV0IApz/gp7S2bb7Z4Lljbl2MGJRqInZiUrQwV16cpzw/D3S5j5Julj/gT52AA==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/fastify"
        },
        {
          "type": "opencollective",
          "url": "https://opencollective.com/fastify"
        }
      ],
      "license": "BSD-3-Clause"
    },
    "node_modules/fastfall": {
      "version": "1.5.1",
      "resolved": "https://registry.npmjs.org/fastfall/-/fastfall-1.5.1.tgz",
      "integrity": "sha512-KH6p+Z8AKPXnmA7+Iz2Lh8ARCMr+8WNPVludm1LGkZoD2MjY6LVnRMtTKhkdzI+jr0RzQWXKzKyBJm1zoHEL4Q==",
      "license": "MIT",
      "dependencies": {
        "reusify": "^1.0.0"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/fastify": {
      "version": "5.8.5",
      "resolved": "https://registry.npmjs.org/fastify/-/fastify-5.8.5.tgz",
      "integrity": "sha512-Yqptv59pQzPgQUSIm87hMqHJmdkb1+GPxdE6vW6FRyVE9G86mt7rOghitiU4JHRaTyDUk9pfeKmDeu70lAwM4Q==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/fastify"
        },
        {
          "type": "opencollective",
          "url": "https://opencollective.com/fastify"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "@fastify/ajv-compiler": "^4.0.5",
        "@fastify/error": "^4.0.0",
        "@fastify/fast-json-stringify-compiler": "^5.0.0",
        "@fastify/proxy-addr": "^5.0.0",
        "abstract-logging": "^2.0.1",
        "avvio": "^9.0.0",
        "fast-json-stringify": "^6.0.0",
        "find-my-way": "^9.0.0",
        "light-my-request": "^6.0.0",
        "pino": "^9.14.0 || ^10.1.0",
        "process-warning": "^5.0.0",
        "rfdc": "^1.3.1",
        "secure-json-parse": "^4.0.0",
        "semver": "^7.6.0",
        "toad-cache": "^3.7.0"
      }
    },
    "node_modules/fastify-plugin": {
      "version": "5.1.0",
      "resolved": "https://registry.npmjs.org/fastify-plugin/-/fastify-plugin-5.1.0.tgz",
      "integrity": "sha512-FAIDA8eovSt5qcDgcBvDuX/v0Cjz0ohGhENZ/wpc3y+oZCY2afZ9Baqql3g/lC+OHRnciQol4ww7tuthOb9idw==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/fastify"
        },
        {
          "type": "opencollective",
          "url": "https://opencollective.com/fastify"
        }
      ],
      "license": "MIT"
    },
    "node_modules/fastify/node_modules/semver": {
      "version": "7.7.4",
      "resolved": "https://registry.npmjs.org/semver/-/semver-7.7.4.tgz",
      "integrity": "sha512-vFKC2IEtQnVhpT78h1Yp8wzwrf8CM+MzKMHGJZfBtzhZNycRFnXsHk6E5TxIkkMsgNS7mdX3AGB7x2QM2di4lA==",
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/fastparallel": {
      "version": "2.4.1",
      "resolved": "https://registry.npmjs.org/fastparallel/-/fastparallel-2.4.1.tgz",
      "integrity": "sha512-qUmhxPgNHmvRjZKBFUNI0oZuuH9OlSIOXmJ98lhKPxMZZ7zS/Fi0wRHOihDSz0R1YiIOjxzOY4bq65YTcdBi2Q==",
      "license": "ISC",
      "dependencies": {
        "reusify": "^1.0.4",
        "xtend": "^4.0.2"
      }
    },
    "node_modules/fastq": {
      "version": "1.20.1",
      "resolved": "https://registry.npmjs.org/fastq/-/fastq-1.20.1.tgz",
      "integrity": "sha512-GGToxJ/w1x32s/D2EKND7kTil4n8OVk/9mycTc4VDza13lOvpUZTGX3mFSCtV9ksdGBVzvsyAVLM6mHFThxXxw==",
      "license": "ISC",
      "dependencies": {
        "reusify": "^1.0.4"
      }
    },
    "node_modules/fastseries": {
      "version": "1.7.2",
      "resolved": "https://registry.npmjs.org/fastseries/-/fastseries-1.7.2.tgz",
      "integrity": "sha512-dTPFrPGS8SNSzAt7u/CbMKCJ3s01N04s4JFbORHcmyvVfVKmbhMD1VtRbh5enGHxkaQDqWyLefiKOGGmohGDDQ==",
      "license": "ISC",
      "dependencies": {
        "reusify": "^1.0.0",
        "xtend": "^4.0.0"
      }
    },
    "node_modules/fdir": {
      "version": "6.5.0",
      "resolved": "https://registry.npmjs.org/fdir/-/fdir-6.5.0.tgz",
      "integrity": "sha512-tIbYtZbucOs0BRGqPJkshJUYdL+SDH7dVM8gjy+ERp3WAUjLEFJE+02kanyHtwjWOnwrKYBiwAmM0p4kLJAnXg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=12.0.0"
      },
      "peerDependencies": {
        "picomatch": "^3 || ^4"
      },
      "peerDependenciesMeta": {
        "picomatch": {
          "optional": true
        }
      }
    },
    "node_modules/filter-obj": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/filter-obj/-/filter-obj-1.1.0.tgz",
      "integrity": "sha512-8rXg1ZnX7xzy2NGDVkBVaAy+lSlPNwad13BtgSlLuxfIslyt5Vg64U7tFcCt4WS1R0hvtnQybT/IyCkGZ3DpXQ==",
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/find-my-way": {
      "version": "9.5.0",
      "resolved": "https://registry.npmjs.org/find-my-way/-/find-my-way-9.5.0.tgz",
      "integrity": "sha512-VW2RfnmscZO5KgBY5XVyKREMW5nMZcxDy+buTOsL+zIPnBlbKm+00sgzoQzq1EVh4aALZLfKdwv6atBGcjvjrQ==",
      "license": "MIT",
      "dependencies": {
        "fast-deep-equal": "^3.1.3",
        "fast-querystring": "^1.0.0",
        "safe-regex2": "^5.0.0"
      },
      "engines": {
        "node": ">=20"
      }
    },
    "node_modules/find-up": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/find-up/-/find-up-4.1.0.tgz",
      "integrity": "sha512-PpOwAdQ/YlXQ2vj8a3h8IipDuYRi3wceVQQGYWxNINccq40Anw7BlsEXCMbt1Zt+OLA6Fq9suIpIWD0OsnISlw==",
      "license": "MIT",
      "dependencies": {
        "locate-path": "^5.0.0",
        "path-exists": "^4.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/follow-redirects": {
      "version": "1.16.0",
      "resolved": "https://registry.npmjs.org/follow-redirects/-/follow-redirects-1.16.0.tgz",
      "integrity": "sha512-y5rN/uOsadFT/JfYwhxRS5R7Qce+g3zG97+JrtFZlC9klX/W5hD7iiLzScI4nZqUS7DNUdhPgw4xI8W2LuXlUw==",
      "funding": [
        {
          "type": "individual",
          "url": "https://github.com/sponsors/RubenVerborgh"
        }
      ],
      "license": "MIT",
      "engines": {
        "node": ">=4.0"
      },
      "peerDependenciesMeta": {
        "debug": {
          "optional": true
        }
      }
    },
    "node_modules/for-each": {
      "version": "0.3.5",
      "resolved": "https://registry.npmjs.org/for-each/-/for-each-0.3.5.tgz",
      "integrity": "sha512-dKx12eRCVIzqCxFGplyFKJMPvLEWgmNtUrpTiJIR5u97zEhRG8ySrtboPHZXx7daLxQVrl643cTzbab2tkQjxg==",
      "license": "MIT",
      "dependencies": {
        "is-callable": "^1.2.7"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/form-data": {
      "version": "4.0.5",
      "resolved": "https://registry.npmjs.org/form-data/-/form-data-4.0.5.tgz",
      "integrity": "sha512-8RipRLol37bNs2bhoV67fiTEvdTrbMUYcFTiy3+wuuOnUog2QBHCZWXDRijWQfAkhBj2Uf5UnVaiWwA5vdd82w==",
      "license": "MIT",
      "dependencies": {
        "asynckit": "^0.4.0",
        "combined-stream": "^1.0.8",
        "es-set-tostringtag": "^2.1.0",
        "hasown": "^2.0.2",
        "mime-types": "^2.1.12"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/fsevents": {
      "version": "2.3.3",
      "resolved": "https://registry.npmjs.org/fsevents/-/fsevents-2.3.3.tgz",
      "integrity": "sha512-5xoDfX+fL7faATnagmWPpbFtwh/R77WmMMqqHGS65C3vvB0YHrgF+B1YmZ3441tMj5n63k0212XNoJwzlhffQw==",
      "dev": true,
      "hasInstallScript": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": "^8.16.0 || ^10.6.0 || >=11.0.0"
      }
    },
    "node_modules/function-bind": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/function-bind/-/function-bind-1.1.2.tgz",
      "integrity": "sha512-7XHNxH7qX9xG5mIwxkhumTox/MIRNcOgDrxWsMt2pAr23WHp6MrRlN7FBSFpCpr+oVO0F744iUgR82nJMfG2SA==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/function.prototype.name": {
      "version": "1.1.8",
      "resolved": "https://registry.npmjs.org/function.prototype.name/-/function.prototype.name-1.1.8.tgz",
      "integrity": "sha512-e5iwyodOHhbMr/yNrc7fDYG4qlbIvI5gajyzPnb5TCwyhjApznQh1BMFou9b30SevY43gCJKXycoCBjMbsuW0Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "call-bound": "^1.0.3",
        "define-properties": "^1.2.1",
        "functions-have-names": "^1.2.3",
        "hasown": "^2.0.2",
        "is-callable": "^1.2.7"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/functions-have-names": {
      "version": "1.2.3",
      "resolved": "https://registry.npmjs.org/functions-have-names/-/functions-have-names-1.2.3.tgz",
      "integrity": "sha512-xckBUXyTIqT97tq2x2AMb+g163b5JFysYk0x4qxNFwbfQkmNZoiRHb6sPzI9/QV33WeuvVYBUIiD4NzNIyqaRQ==",
      "dev": true,
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/generator-function": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/generator-function/-/generator-function-2.0.1.tgz",
      "integrity": "sha512-SFdFmIJi+ybC0vjlHN0ZGVGHc3lgE0DxPAT0djjVg+kjOnSqclqmj0KQ7ykTOLP6YxoqOvuAODGdcHJn+43q3g==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/gensync": {
      "version": "1.0.0-beta.2",
      "resolved": "https://registry.npmjs.org/gensync/-/gensync-1.0.0-beta.2.tgz",
      "integrity": "sha512-3hN7NaskYvMDLQY55gnW3NQ+mesEAepTqlg+VEbj7zzqEMBVNhzcGYYeqFo/TlYz6eQiFcp1HcsCZO+nGgS8zg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/get-caller-file": {
      "version": "2.0.5",
      "resolved": "https://registry.npmjs.org/get-caller-file/-/get-caller-file-2.0.5.tgz",
      "integrity": "sha512-DyFP3BM/3YHTQOCUL/w0OZHR0lpKeGrxotcHWcqNEdnltqFwXVfhEBQ94eIo34AfQpo0rGki4cyIiftY06h2Fg==",
      "license": "ISC",
      "engines": {
        "node": "6.* || 8.* || >= 10.*"
      }
    },
    "node_modules/get-intrinsic": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/get-intrinsic/-/get-intrinsic-1.3.0.tgz",
      "integrity": "sha512-9fSjSaos/fRIVIp+xSJlE6lfwhES7LNtKaCBIamHsjr2na1BiABJPo0mOjjz8GJDURarmCPGqaiVg5mfjb98CQ==",
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.2",
        "es-define-property": "^1.0.1",
        "es-errors": "^1.3.0",
        "es-object-atoms": "^1.1.1",
        "function-bind": "^1.1.2",
        "get-proto": "^1.0.1",
        "gopd": "^1.2.0",
        "has-symbols": "^1.1.0",
        "hasown": "^2.0.2",
        "math-intrinsics": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/get-proto": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/get-proto/-/get-proto-1.0.1.tgz",
      "integrity": "sha512-sTSfBjoXBp89JvIKIefqw7U2CCebsc74kiY6awiGogKtoSGbgjYE/G/+l9sF3MWFPNc9IcoOC4ODfKHfxFmp0g==",
      "license": "MIT",
      "dependencies": {
        "dunder-proto": "^1.0.1",
        "es-object-atoms": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/get-symbol-description": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/get-symbol-description/-/get-symbol-description-1.1.0.tgz",
      "integrity": "sha512-w9UMqWwJxHNOvoNzSJ2oPF5wvYcvP7jUvYzhp67yEhTi17ZDBBC1z9pTdGuzjD+EFIqLSYRweZjqfiPzQ06Ebg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3",
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.6"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/get-tsconfig": {
      "version": "4.14.0",
      "resolved": "https://registry.npmjs.org/get-tsconfig/-/get-tsconfig-4.14.0.tgz",
      "integrity": "sha512-yTb+8DXzDREzgvYmh6s9vHsSVCHeC0G3PI5bEXNBHtmshPnO+S5O7qgLEOn0I5QvMy6kpZN8K1NKGyilLb93wA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "resolve-pkg-maps": "^1.0.0"
      },
      "funding": {
        "url": "https://github.com/privatenumber/get-tsconfig?sponsor=1"
      }
    },
    "node_modules/giget": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/giget/-/giget-2.0.0.tgz",
      "integrity": "sha512-L5bGsVkxJbJgdnwyuheIunkGatUF/zssUoxxjACCseZYAVbaqdh9Tsmmlkl8vYan09H7sbvKt4pS8GqKLBrEzA==",
      "devOptional": true,
      "license": "MIT",
      "dependencies": {
        "citty": "^0.1.6",
        "consola": "^3.4.0",
        "defu": "^6.1.4",
        "node-fetch-native": "^1.6.6",
        "nypm": "^0.6.0",
        "pathe": "^2.0.3"
      },
      "bin": {
        "giget": "dist/cli.mjs"
      }
    },
    "node_modules/globalthis": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/globalthis/-/globalthis-1.0.4.tgz",
      "integrity": "sha512-DpLKbNU4WylpxJykQujfCcwYWiV/Jhm50Goo0wrVILAv5jOr9d+H+UR3PhSCD2rCCEIg0uc+G+muBTwD54JhDQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "define-properties": "^1.2.1",
        "gopd": "^1.0.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/gopd": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/gopd/-/gopd-1.2.0.tgz",
      "integrity": "sha512-ZUKRh6/kUFoAiTAtTYPZJ3hw9wNxx+BIBOijnlG9PnrJsCcSjs1wyyD6vJpaYtgnzDrKYRSqf3OO6Rfa93xsRg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/graceful-fs": {
      "version": "4.2.11",
      "resolved": "https://registry.npmjs.org/graceful-fs/-/graceful-fs-4.2.11.tgz",
      "integrity": "sha512-RbJ5/jmFcNNCcDV5o9eTnBLJ/HszWV0P73bc+Ff4nS/rJj+YaS6IGyiOL0VoBYX+l1Wrl3k63h/KrH+nhJ0XvQ==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/h3": {
      "version": "1.15.11",
      "resolved": "https://registry.npmjs.org/h3/-/h3-1.15.11.tgz",
      "integrity": "sha512-L3THSe2MPeBwgIZVSH5zLdBBU90TOxarvhK9d04IDY2AmVS8j2Jz2LIWtwsGOU3lu2I5jCN7FNvVfY2+XyF+mg==",
      "license": "MIT",
      "dependencies": {
        "cookie-es": "^1.2.3",
        "crossws": "^0.3.5",
        "defu": "^6.1.6",
        "destr": "^2.0.5",
        "iron-webcrypto": "^1.2.1",
        "node-mock-http": "^1.0.4",
        "radix3": "^1.1.2",
        "ufo": "^1.6.3",
        "uncrypto": "^0.1.3"
      }
    },
    "node_modules/has-bigints": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/has-bigints/-/has-bigints-1.1.0.tgz",
      "integrity": "sha512-R3pbpkcIqv2Pm3dUwgjclDRVmWpTJW2DcMzcIhEXEx1oh/CEMObMm3KLmRJOdvhM7o4uQBnwr8pzRK2sJWIqfg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/has-flag": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/has-flag/-/has-flag-3.0.0.tgz",
      "integrity": "sha512-sKJf1+ceQBr4SMkvQnBDNDtf4TXpVhVGateu0t918bl30FnbE2m4vNLX+VWe/dpjlb+HugGYzW7uQXH98HPEYw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/has-property-descriptors": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/has-property-descriptors/-/has-property-descriptors-1.0.2.tgz",
      "integrity": "sha512-55JNKuIW+vq4Ke1BjOTjM2YctQIvCT7GFzHwmfZPGo5wnrgkid0YQtnAleFSqumZm4az3n2BS+erby5ipJdgrg==",
      "license": "MIT",
      "dependencies": {
        "es-define-property": "^1.0.0"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/has-proto": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/has-proto/-/has-proto-1.2.0.tgz",
      "integrity": "sha512-KIL7eQPfHQRC8+XluaIw7BHUwwqL19bQn4hzNgdr+1wXoU0KKj6rufu47lhY7KbJR2C6T6+PfyN0Ea7wkSS+qQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "dunder-proto": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/has-symbols": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/has-symbols/-/has-symbols-1.1.0.tgz",
      "integrity": "sha512-1cDNdwJ2Jaohmb3sg4OmKaMBwuC48sYni5HUw2DvsC8LjGTLK9h+eb1X6RyuOHe4hT0ULCW68iomhjUoKUqlPQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/has-tostringtag": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/has-tostringtag/-/has-tostringtag-1.0.2.tgz",
      "integrity": "sha512-NqADB8VjPFLM2V0VvHUewwwsw0ZWBaIdgo+ieHtK3hasLz4qeCRjYcqfB6AQrBggRKppKF8L52/VqdVsO47Dlw==",
      "license": "MIT",
      "dependencies": {
        "has-symbols": "^1.0.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/hasown": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/hasown/-/hasown-2.0.3.tgz",
      "integrity": "sha512-ej4AhfhfL2Q2zpMmLo7U1Uv9+PyhIZpgQLGT1F9miIGmiCJIoCgSmczFdrc97mWT4kVY72KA+WnnhJ5pghSvSg==",
      "license": "MIT",
      "dependencies": {
        "function-bind": "^1.1.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/hoist-non-react-statics": {
      "version": "3.3.2",
      "resolved": "https://registry.npmjs.org/hoist-non-react-statics/-/hoist-non-react-statics-3.3.2.tgz",
      "integrity": "sha512-/gGivxi8JPKWNm/W0jSmzcMPpfpPLc3dY/6GxhX2hQ9iGj3aDfklV4ET7NjKpSinLpJ5vafa9iiGIEZg10SfBw==",
      "license": "BSD-3-Clause",
      "dependencies": {
        "react-is": "^16.7.0"
      }
    },
    "node_modules/hono": {
      "version": "4.12.16",
      "resolved": "https://registry.npmjs.org/hono/-/hono-4.12.16.tgz",
      "integrity": "sha512-jN0ZewiNAWSe5khM3EyCmBb250+b40wWbwNILNfEvq84VREWwOIkuUsFONk/3i3nqkz7Oe1PcpM2mwQEK2L9Kg==",
      "license": "MIT",
      "engines": {
        "node": ">=16.9.0"
      }
    },
    "node_modules/hosted-git-info": {
      "version": "2.8.9",
      "resolved": "https://registry.npmjs.org/hosted-git-info/-/hosted-git-info-2.8.9.tgz",
      "integrity": "sha512-mxIDAb9Lsm6DoOJ7xH+5+X4y1LU/4Hi50L9C5sIswK3JzULS4bwk1FvjdBgvYR4bzT4tuUQiC15FE2f5HbLvYw==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/idb-keyval": {
      "version": "6.2.1",
      "resolved": "https://registry.npmjs.org/idb-keyval/-/idb-keyval-6.2.1.tgz",
      "integrity": "sha512-8Sb3veuYCyrZL+VBt9LJfZjLUPWVvqn8tG28VqYNFCo43KHcKuq+b4EiXGeuaLAQWL2YmyDgMp2aSpH9JHsEQg==",
      "license": "Apache-2.0"
    },
    "node_modules/ieee754": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/ieee754/-/ieee754-1.2.1.tgz",
      "integrity": "sha512-dcyqhDvX1C46lXZcVqCpK+FtMRQVdIMN6/Df5js2zouUsqG7I6sFxitIC+7KYK29KdXOLHdu9zL4sFnoVQnqaA==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "BSD-3-Clause"
    },
    "node_modules/inherits": {
      "version": "2.0.4",
      "resolved": "https://registry.npmjs.org/inherits/-/inherits-2.0.4.tgz",
      "integrity": "sha512-k/vGaX4/Yla3WzyMCvTQOXYeIHvqOKtnqBduzTHpzpQZzAskKMhZ2K+EnBiSM9zGSoIFeMpXKxa4dYeZIQqewQ==",
      "license": "ISC"
    },
    "node_modules/internal-slot": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/internal-slot/-/internal-slot-1.1.0.tgz",
      "integrity": "sha512-4gd7VpWNQNB4UKKCFFVcp1AVv+FMOgs9NKzjHKusc8jTMhd5eL1NqQqOpE0KzMds804/yHlglp3uxgluOqAPLw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "hasown": "^2.0.2",
        "side-channel": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/ipaddr.js": {
      "version": "2.3.0",
      "resolved": "https://registry.npmjs.org/ipaddr.js/-/ipaddr.js-2.3.0.tgz",
      "integrity": "sha512-Zv/pA+ciVFbCSBBjGfaKUya/CcGmUHzTydLMaTwrUUEM2DIEO3iZvueGxmacvmN50fGpGVKeTXpb2LcYQxeVdg==",
      "license": "MIT",
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/iron-webcrypto": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/iron-webcrypto/-/iron-webcrypto-1.2.1.tgz",
      "integrity": "sha512-feOM6FaSr6rEABp/eDfVseKyTMDt+KGpeB35SkVn9Tyn0CqvVsY3EwI0v5i8nMHyJnzCIQf7nsy3p41TPkJZhg==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/brc-dd"
      }
    },
    "node_modules/is-arguments": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/is-arguments/-/is-arguments-1.2.0.tgz",
      "integrity": "sha512-7bVbi0huj/wrIAOzb8U1aszg9kdi3KN/CyU19CTI7tAoZYEZoL9yCDXpbXN+uPsuWnP02cyug1gleqq+TU+YCA==",
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "has-tostringtag": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-array-buffer": {
      "version": "3.0.5",
      "resolved": "https://registry.npmjs.org/is-array-buffer/-/is-array-buffer-3.0.5.tgz",
      "integrity": "sha512-DDfANUiiG2wC1qawP66qlTugJeL5HyzMpfr8lLK+jMQirGzNod0B12cFB/9q838Ru27sBwfw78/rdoU7RERz6A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "call-bound": "^1.0.3",
        "get-intrinsic": "^1.2.6"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-arrayish": {
      "version": "0.2.1",
      "resolved": "https://registry.npmjs.org/is-arrayish/-/is-arrayish-0.2.1.tgz",
      "integrity": "sha512-zz06S8t0ozoDXMG+ube26zeCTNXcKIPJZJi8hBrF4idCLms4CG9QtK7qBl1boi5ODzFpjswb5JPmHCbMpjaYzg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/is-async-function": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/is-async-function/-/is-async-function-2.1.1.tgz",
      "integrity": "sha512-9dgM/cZBnNvjzaMYHVoxxfPj2QXt22Ev7SuuPrs+xav0ukGB0S6d4ydZdEiM48kLx5kDV+QBPrpVnFyefL8kkQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "async-function": "^1.0.0",
        "call-bound": "^1.0.3",
        "get-proto": "^1.0.1",
        "has-tostringtag": "^1.0.2",
        "safe-regex-test": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-bigint": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/is-bigint/-/is-bigint-1.1.0.tgz",
      "integrity": "sha512-n4ZT37wG78iz03xPRKJrHTdZbe3IicyucEtdRsV5yglwc3GyUfbAfpSeD0FJ41NbUNSt5wbhqfp1fS+BgnvDFQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "has-bigints": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-boolean-object": {
      "version": "1.2.2",
      "resolved": "https://registry.npmjs.org/is-boolean-object/-/is-boolean-object-1.2.2.tgz",
      "integrity": "sha512-wa56o2/ElJMYqjCjGkXri7it5FbebW5usLw/nPmCMs5DeZ7eziSYZhSmPRn0txqeW4LnAmQQU7FgqLpsEFKM4A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3",
        "has-tostringtag": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-buffer": {
      "version": "1.1.6",
      "resolved": "https://registry.npmjs.org/is-buffer/-/is-buffer-1.1.6.tgz",
      "integrity": "sha512-NcdALwpXkTm5Zvvbk7owOUSvVvBKDgKP5/ewfXEznmQFfs4ZRmanOeKBTjRVjka3QFoN6XJ+9F3USqfHqTaU5w==",
      "license": "MIT"
    },
    "node_modules/is-callable": {
      "version": "1.2.7",
      "resolved": "https://registry.npmjs.org/is-callable/-/is-callable-1.2.7.tgz",
      "integrity": "sha512-1BC0BVFhS/p0qtw6enp8e+8OD0UrK0oFLztSjNzhcKA3WDuJxxAPXzPuPtKkjEY9UUoEWlX/8fgKeu2S8i9JTA==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-core-module": {
      "version": "2.16.1",
      "resolved": "https://registry.npmjs.org/is-core-module/-/is-core-module-2.16.1.tgz",
      "integrity": "sha512-UfoeMA6fIJ8wTYFEUjelnaGI67v6+N7qXJEvQuIGa99l4xsCruSYOVSQ0uPANn4dAzm8lkYPaKLrrijLq7x23w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "hasown": "^2.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-data-view": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/is-data-view/-/is-data-view-1.0.2.tgz",
      "integrity": "sha512-RKtWF8pGmS87i2D6gqQu/l7EYRlVdfzemCJN/P3UOs//x1QE7mfhvzHIApBTRf7axvT6DMGwSwBXYCT0nfB9xw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "get-intrinsic": "^1.2.6",
        "is-typed-array": "^1.1.13"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-date-object": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/is-date-object/-/is-date-object-1.1.0.tgz",
      "integrity": "sha512-PwwhEakHVKTdRNVOw+/Gyh0+MzlCl4R6qKvkhuvLtPMggI1WAHt9sOwZxQLSGpUaDnrdyDsomoRgNnCfKNSXXg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "has-tostringtag": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-finalizationregistry": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/is-finalizationregistry/-/is-finalizationregistry-1.1.1.tgz",
      "integrity": "sha512-1pC6N8qWJbWoPtEjgcL2xyhQOP491EQjeUo3qTKcmV8YSDDJrOepfG8pcC7h/QgnQHYSv0mJ3Z/ZWxmatVrysg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-fullwidth-code-point": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/is-fullwidth-code-point/-/is-fullwidth-code-point-3.0.0.tgz",
      "integrity": "sha512-zymm5+u+sCsSWyD9qNaejV3DFvhCKclKdizYaJUuHA83RLjb7nSuGnddCHGv0hk+KY7BMAlsWeK4Ueg6EV6XQg==",
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/is-generator-function": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/is-generator-function/-/is-generator-function-1.1.2.tgz",
      "integrity": "sha512-upqt1SkGkODW9tsGNG5mtXTXtECizwtS2kA161M+gJPc1xdb/Ax629af6YrTwcOeQHbewrPNlE5Dx7kzvXTizA==",
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.4",
        "generator-function": "^2.0.0",
        "get-proto": "^1.0.1",
        "has-tostringtag": "^1.0.2",
        "safe-regex-test": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-map": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/is-map/-/is-map-2.0.3.tgz",
      "integrity": "sha512-1Qed0/Hr2m+YqxnM09CjA2d/i6YZNfF6R2oRAOj36eUdS6qIV/huPJNSEpKbupewFs+ZsJlxsjjPbc0/afW6Lw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-negative-zero": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/is-negative-zero/-/is-negative-zero-2.0.3.tgz",
      "integrity": "sha512-5KoIu2Ngpyek75jXodFvnafB6DJgr3u8uuK0LEZJjrU19DrMD3EVERaR8sjz8CCGgpZvxPl9SuE1GMVPFHx1mw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-number-object": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/is-number-object/-/is-number-object-1.1.1.tgz",
      "integrity": "sha512-lZhclumE1G6VYD8VHe35wFaIif+CTy5SJIi5+3y4psDgWu4wPDoBhF8NxUOinEc7pHgiTsT6MaBb92rKhhD+Xw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3",
        "has-tostringtag": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-regex": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/is-regex/-/is-regex-1.2.1.tgz",
      "integrity": "sha512-MjYsKHO5O7mCsmRGxWcLWheFqN9DJ/2TmngvjKXihe6efViPqc274+Fx/4fYj/r03+ESvBdTXK0V6tA3rgez1g==",
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "gopd": "^1.2.0",
        "has-tostringtag": "^1.0.2",
        "hasown": "^2.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-retry-allowed": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/is-retry-allowed/-/is-retry-allowed-2.2.0.tgz",
      "integrity": "sha512-XVm7LOeLpTW4jV19QSH38vkswxoLud8sQ57YwJVTPWdiaI9I8keEhGFpBlslyVsgdQy4Opg8QOLb8YRgsyZiQg==",
      "license": "MIT",
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/is-set": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/is-set/-/is-set-2.0.3.tgz",
      "integrity": "sha512-iPAjerrse27/ygGLxw+EBR9agv9Y6uLeYVJMu+QNCoouJ1/1ri0mGrcWpfCqFZuzzx3WjtwxG098X+n4OuRkPg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-shared-array-buffer": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/is-shared-array-buffer/-/is-shared-array-buffer-1.0.4.tgz",
      "integrity": "sha512-ISWac8drv4ZGfwKl5slpHG9OwPNty4jOWPRIhBpxOoD+hqITiwuipOQ2bNthAzwA3B4fIjO4Nln74N0S9byq8A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-stream": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/is-stream/-/is-stream-2.0.1.tgz",
      "integrity": "sha512-hFoiJiTl63nn+kstHGBtewWSKnQLpyb155KHheA1l39uvtO9nWIop1p3udqPcUd/xbF1VLMO4n7OI6p7RbngDg==",
      "license": "MIT",
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/is-string": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/is-string/-/is-string-1.1.1.tgz",
      "integrity": "sha512-BtEeSsoaQjlSPBemMQIrY1MY0uM6vnS1g5fmufYOtnxLGUZM2178PKbhsk7Ffv58IX+ZtcvoGwccYsh0PglkAA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3",
        "has-tostringtag": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-symbol": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/is-symbol/-/is-symbol-1.1.1.tgz",
      "integrity": "sha512-9gGx6GTtCQM73BgmHQXfDmLtfjjTUDSyoxTCbp5WtoixAhfgsDirWIcVQ/IHpvI5Vgd5i/J5F7B9cN/WlVbC/w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "has-symbols": "^1.1.0",
        "safe-regex-test": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-typed-array": {
      "version": "1.1.15",
      "resolved": "https://registry.npmjs.org/is-typed-array/-/is-typed-array-1.1.15.tgz",
      "integrity": "sha512-p3EcsicXjit7SaskXHs1hA91QxgTw46Fv6EFKKGS5DRFLD8yKnohjF3hxoju94b/OcMZoQukzpPpBE9uLVKzgQ==",
      "license": "MIT",
      "dependencies": {
        "which-typed-array": "^1.1.16"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-weakmap": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/is-weakmap/-/is-weakmap-2.0.2.tgz",
      "integrity": "sha512-K5pXYOm9wqY1RgjpL3YTkF39tni1XajUIkawTLUo9EZEVUFga5gSQJF8nNS7ZwJQ02y+1YCNYcMh+HIf1ZqE+w==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-weakref": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/is-weakref/-/is-weakref-1.1.1.tgz",
      "integrity": "sha512-6i9mGWSlqzNMEqpCp93KwRS1uUOodk2OJ6b+sq7ZPDSy2WuI5NFIxp/254TytR8ftefexkWn5xNiHUNpPOfSew==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-weakset": {
      "version": "2.0.4",
      "resolved": "https://registry.npmjs.org/is-weakset/-/is-weakset-2.0.4.tgz",
      "integrity": "sha512-mfcwb6IzQyOKTs84CQMrOwW4gQcaTOAWJ0zzJCl2WSPDrWk/OzDaImWFH3djXhb24g4eudZfLRozAvPGw4d9hQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3",
        "get-intrinsic": "^1.2.6"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/isarray": {
      "version": "2.0.5",
      "resolved": "https://registry.npmjs.org/isarray/-/isarray-2.0.5.tgz",
      "integrity": "sha512-xHjhDr3cNBK0BzdUJSPXZntQUx/mwMS5Rw4A7lPJ90XGAO6ISP/ePDNuo0vhqOZU+UD5JoodwCAAoZQd3FeAKw==",
      "license": "MIT"
    },
    "node_modules/isexe": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/isexe/-/isexe-2.0.0.tgz",
      "integrity": "sha512-RHxMLp9lnKHGHRng9QFhRCMbYAcVpn69smSGcq3f36xjgVVWThj4qqLbTLlq7Ssj8B+fIQ1EuCEGI2lKsyQeIw==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/isows": {
      "version": "1.0.7",
      "resolved": "https://registry.npmjs.org/isows/-/isows-1.0.7.tgz",
      "integrity": "sha512-I1fSfDCZL5P0v33sVqeTDSpcstAg/N+wF5HS033mogOVIp4B+oHC7oOCsA3axAbBSGTJ8QubbNmnIRN/h8U7hg==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/wevm"
        }
      ],
      "license": "MIT",
      "peerDependencies": {
        "ws": "*"
      }
    },
    "node_modules/jiti": {
      "version": "2.6.1",
      "resolved": "https://registry.npmjs.org/jiti/-/jiti-2.6.1.tgz",
      "integrity": "sha512-ekilCSN1jwRvIbgeg/57YFh8qQDNbwDb9xT/qu2DAHbFFZUicIl4ygVaAvzveMhMVr3LnpSKTNnwt8PoOfmKhQ==",
      "devOptional": true,
      "license": "MIT",
      "bin": {
        "jiti": "lib/jiti-cli.mjs"
      }
    },
    "node_modules/jose": {
      "version": "6.2.3",
      "resolved": "https://registry.npmjs.org/jose/-/jose-6.2.3.tgz",
      "integrity": "sha512-YYVDInQKFJfR/xa3ojUTl8c2KoTwiL1R5Wg9YCydwH0x0B9grbzlg5HC7mMjCtUJjbQ/YnGEZIhI5tCgfTb4Hw==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/panva"
      }
    },
    "node_modules/js-tokens": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/js-tokens/-/js-tokens-4.0.0.tgz",
      "integrity": "sha512-RdJUflcE3cUzKiMqQgsCu06FPu9UdIJO0beYbPhHN4k6apgJtifcoCtT9bcxOpYBtpD2kCM6Sbzg4CausW/PKQ==",
      "license": "MIT"
    },
    "node_modules/jsesc": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/jsesc/-/jsesc-3.1.0.tgz",
      "integrity": "sha512-/sM3dO2FOzXjKQhJuo0Q173wf2KOo8t4I8vHy6lF9poUp7bKT0/NHE8fPX23PwfhnykfqnC2xRxOnVw5XuGIaA==",
      "dev": true,
      "license": "MIT",
      "bin": {
        "jsesc": "bin/jsesc"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/json-parse-better-errors": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/json-parse-better-errors/-/json-parse-better-errors-1.0.2.tgz",
      "integrity": "sha512-mrqyZKfX5EhL7hvqcV6WG1yYjnjeuYDzDhhcAAUrq8Po85NBQBJP+ZDUT75qZQ98IkUoBqdkExkukOU7Ts2wrw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/json-rpc-engine": {
      "version": "6.1.0",
      "resolved": "https://registry.npmjs.org/json-rpc-engine/-/json-rpc-engine-6.1.0.tgz",
      "integrity": "sha512-NEdLrtrq1jUZyfjkr9OCz9EzCNhnRyWtt1PAnvnhwy6e8XETS0Dtc+ZNCO2gvuAoKsIn2+vCSowXTYE4CkgnAQ==",
      "license": "ISC",
      "dependencies": {
        "@metamask/safe-event-emitter": "^2.0.0",
        "eth-rpc-errors": "^4.0.2"
      },
      "engines": {
        "node": ">=10.0.0"
      }
    },
    "node_modules/json-rpc-engine/node_modules/@metamask/safe-event-emitter": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/@metamask/safe-event-emitter/-/safe-event-emitter-2.0.0.tgz",
      "integrity": "sha512-/kSXhY692qiV1MXu6EeOZvg5nECLclxNXcKCxJ3cXQgYuRymRHpdx/t7JXfsK+JLjwA1e1c1/SBrlQYpusC29Q==",
      "license": "ISC"
    },
    "node_modules/json-rpc-random-id": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/json-rpc-random-id/-/json-rpc-random-id-1.0.1.tgz",
      "integrity": "sha512-RJ9YYNCkhVDBuP4zN5BBtYAzEl03yq/jIIsyif0JY9qyJuQQZNeDK7anAPKKlyEtLSj2s8h6hNh2F8zO5q7ScA==",
      "license": "ISC"
    },
    "node_modules/json-schema-ref-resolver": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/json-schema-ref-resolver/-/json-schema-ref-resolver-3.0.0.tgz",
      "integrity": "sha512-hOrZIVL5jyYFjzk7+y7n5JDzGlU8rfWDuYyHwGa2WA8/pcmMHezp2xsVwxrebD/Q9t8Nc5DboieySDpCp4WG4A==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/fastify"
        },
        {
          "type": "opencollective",
          "url": "https://opencollective.com/fastify"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "dequal": "^2.0.3"
      }
    },
    "node_modules/json-schema-traverse": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/json-schema-traverse/-/json-schema-traverse-1.0.0.tgz",
      "integrity": "sha512-NM8/P9n3XjXhIZn1lLhkFaACTOURQXjWhV4BA/RnOv8xvgqtqpAX9IO4mRQxSx1Rlo4tqzeqb0sOlruaOy3dug==",
      "license": "MIT"
    },
    "node_modules/json5": {
      "version": "2.2.3",
      "resolved": "https://registry.npmjs.org/json5/-/json5-2.2.3.tgz",
      "integrity": "sha512-XmOWe7eyHYH14cLdVPoyg+GOH3rYX++KpzrylJwSW98t3Nk+U8XOl8FWKOgwtzdb8lXGf6zYwDUzeHMWfxasyg==",
      "dev": true,
      "license": "MIT",
      "bin": {
        "json5": "lib/cli.js"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/keccak": {
      "version": "3.0.4",
      "resolved": "https://registry.npmjs.org/keccak/-/keccak-3.0.4.tgz",
      "integrity": "sha512-3vKuW0jV8J3XNTzvfyicFR5qvxrSAGl7KIhvgOu5cmWwM7tZRj3fMbj/pfIf4be7aznbc+prBWGjywox/g2Y6Q==",
      "hasInstallScript": true,
      "license": "MIT",
      "dependencies": {
        "node-addon-api": "^2.0.0",
        "node-gyp-build": "^4.2.0",
        "readable-stream": "^3.6.0"
      },
      "engines": {
        "node": ">=10.0.0"
      }
    },
    "node_modules/keyvaluestorage-interface": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/keyvaluestorage-interface/-/keyvaluestorage-interface-1.0.0.tgz",
      "integrity": "sha512-8t6Q3TclQ4uZynJY9IGr2+SsIGwK9JHcO6ootkHCGA0CrQCRy+VkouYNO2xicET6b9al7QKzpebNow+gkpCL8g==",
      "license": "MIT"
    },
    "node_modules/light-my-request": {
      "version": "6.6.0",
      "resolved": "https://registry.npmjs.org/light-my-request/-/light-my-request-6.6.0.tgz",
      "integrity": "sha512-CHYbu8RtboSIoVsHZ6Ye4cj4Aw/yg2oAFimlF7mNvfDV192LR7nDiKtSIfCuLT7KokPSTn/9kfVLm5OGN0A28A==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/fastify"
        },
        {
          "type": "opencollective",
          "url": "https://opencollective.com/fastify"
        }
      ],
      "license": "BSD-3-Clause",
      "dependencies": {
        "cookie": "^1.0.1",
        "process-warning": "^4.0.0",
        "set-cookie-parser": "^2.6.0"
      }
    },
    "node_modules/light-my-request/node_modules/process-warning": {
      "version": "4.0.1",
      "resolved": "https://registry.npmjs.org/process-warning/-/process-warning-4.0.1.tgz",
      "integrity": "sha512-3c2LzQ3rY9d0hc1emcsHhfT9Jwz0cChib/QN89oME2R451w5fy3f0afAhERFZAwrbDU43wk12d0ORBpDVME50Q==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/fastify"
        },
        {
          "type": "opencollective",
          "url": "https://opencollective.com/fastify"
        }
      ],
      "license": "MIT"
    },
    "node_modules/lit": {
      "version": "3.3.0",
      "resolved": "https://registry.npmjs.org/lit/-/lit-3.3.0.tgz",
      "integrity": "sha512-DGVsqsOIHBww2DqnuZzW7QsuCdahp50ojuDaBPC7jUDRpYoH0z7kHBBYZewRzer75FwtrkmkKk7iOAwSaWdBmw==",
      "license": "BSD-3-Clause",
      "dependencies": {
        "@lit/reactive-element": "^2.1.0",
        "lit-element": "^4.2.0",
        "lit-html": "^3.3.0"
      }
    },
    "node_modules/lit-element": {
      "version": "4.2.2",
      "resolved": "https://registry.npmjs.org/lit-element/-/lit-element-4.2.2.tgz",
      "integrity": "sha512-aFKhNToWxoyhkNDmWZwEva2SlQia+jfG0fjIWV//YeTaWrVnOxD89dPKfigCUspXFmjzOEUQpOkejH5Ly6sG0w==",
      "license": "BSD-3-Clause",
      "dependencies": {
        "@lit-labs/ssr-dom-shim": "^1.5.0",
        "@lit/reactive-element": "^2.1.0",
        "lit-html": "^3.3.0"
      }
    },
    "node_modules/lit-html": {
      "version": "3.3.2",
      "resolved": "https://registry.npmjs.org/lit-html/-/lit-html-3.3.2.tgz",
      "integrity": "sha512-Qy9hU88zcmaxBXcc10ZpdK7cOLXvXpRoBxERdtqV9QOrfpMZZ6pSYP91LhpPtap3sFMUiL7Tw2RImbe0Al2/kw==",
      "license": "BSD-3-Clause",
      "dependencies": {
        "@types/trusted-types": "^2.0.2"
      }
    },
    "node_modules/load-json-file": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/load-json-file/-/load-json-file-4.0.0.tgz",
      "integrity": "sha512-Kx8hMakjX03tiGTLAIdJ+lL0htKnXjEZN6hk/tozf/WOuYGdZBJrZ+rCJRbVCugsjB3jMLn9746NsQIf5VjBMw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "graceful-fs": "^4.1.2",
        "parse-json": "^4.0.0",
        "pify": "^3.0.0",
        "strip-bom": "^3.0.0"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/locate-path": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/locate-path/-/locate-path-5.0.0.tgz",
      "integrity": "sha512-t7hw9pI+WvuwNJXwk5zVHpyhIqzg2qTlklJOf0mVxGSbe3Fp2VieZcduNYjaLDoy6p9uGpQEGWG87WpMKlNq8g==",
      "license": "MIT",
      "dependencies": {
        "p-locate": "^4.1.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/lodash": {
      "version": "4.18.1",
      "resolved": "https://registry.npmjs.org/lodash/-/lodash-4.18.1.tgz",
      "integrity": "sha512-dMInicTPVE8d1e5otfwmmjlxkZoUpiVLwyeTdUsi/Caj/gfzzblBcCE5sRHV/AsjuCmxWrte2TNGSYuCeCq+0Q==",
      "license": "MIT"
    },
    "node_modules/loose-envify": {
      "version": "1.4.0",
      "resolved": "https://registry.npmjs.org/loose-envify/-/loose-envify-1.4.0.tgz",
      "integrity": "sha512-lyuxPGr/Wfhrlem2CL/UcnUc1zcqKAImBDzukY7Y5F/yQiNdko6+fRLevlw1HgMySw7f611UIY408EtxRSoK3Q==",
      "license": "MIT",
      "dependencies": {
        "js-tokens": "^3.0.0 || ^4.0.0"
      },
      "bin": {
        "loose-envify": "cli.js"
      }
    },
    "node_modules/loupe": {
      "version": "3.2.1",
      "resolved": "https://registry.npmjs.org/loupe/-/loupe-3.2.1.tgz",
      "integrity": "sha512-CdzqowRJCeLU72bHvWqwRBBlLcMEtIvGrlvef74kMnV2AolS9Y8xUv1I0U/MNAWMhBlKIoyuEgoJ0t/bbwHbLQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/lru-cache": {
      "version": "5.1.1",
      "resolved": "https://registry.npmjs.org/lru-cache/-/lru-cache-5.1.1.tgz",
      "integrity": "sha512-KpNARQA3Iwv+jTA0utUVVbrh+Jlrr1Fv0e56GGzAFOXN7dk/FviaDW8LHmK52DlcH4WP2n6gI8vN1aesBFgo9w==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "yallist": "^3.0.2"
      }
    },
    "node_modules/lucide-react": {
      "version": "0.507.0",
      "resolved": "https://registry.npmjs.org/lucide-react/-/lucide-react-0.507.0.tgz",
      "integrity": "sha512-XfgE6gvAHwAtnbUvWiTTHx4S3VGR+cUJHEc0vrh9Ogu672I1Tue2+Cp/8JJqpytgcBHAB1FVI297W4XGNwc2dQ==",
      "license": "ISC",
      "peerDependencies": {
        "react": "^16.5.1 || ^17.0.0 || ^18.0.0 || ^19.0.0"
      }
    },
    "node_modules/magic-string": {
      "version": "0.30.21",
      "resolved": "https://registry.npmjs.org/magic-string/-/magic-string-0.30.21.tgz",
      "integrity": "sha512-vd2F4YUyEXKGcLHoq+TEyCjxueSeHnFxyyjNp80yg0XV4vUhnDer/lvvlqM/arB5bXQN5K2/3oinyCRyx8T2CQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/sourcemap-codec": "^1.5.5"
      }
    },
    "node_modules/math-intrinsics": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/math-intrinsics/-/math-intrinsics-1.1.0.tgz",
      "integrity": "sha512-/IXtbwEk5HTPyEwyKX6hGkYXxM9nbj64B+ilVJnC/R6B0pH5G4V3b0pVbL7DBj4tkhBAppbQUlf6F6Xl9LHu1g==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/md5": {
      "version": "2.3.0",
      "resolved": "https://registry.npmjs.org/md5/-/md5-2.3.0.tgz",
      "integrity": "sha512-T1GITYmFaKuO91vxyoQMFETst+O71VUPEU3ze5GNzDm0OWdP8v1ziTaAEPUr/3kLsY3Sftgz242A1SetQiDL7g==",
      "license": "BSD-3-Clause",
      "dependencies": {
        "charenc": "0.0.2",
        "crypt": "0.0.2",
        "is-buffer": "~1.1.6"
      }
    },
    "node_modules/memorystream": {
      "version": "0.3.1",
      "resolved": "https://registry.npmjs.org/memorystream/-/memorystream-0.3.1.tgz",
      "integrity": "sha512-S3UwM3yj5mtUSEfP41UZmt/0SCoVYUcU1rkXv+BQ5Ig8ndL4sPoJNBUJERafdPb5jjHJGuMgytgKvKIf58XNBw==",
      "dev": true,
      "engines": {
        "node": ">= 0.10.0"
      }
    },
    "node_modules/micro-ftch": {
      "version": "0.3.1",
      "resolved": "https://registry.npmjs.org/micro-ftch/-/micro-ftch-0.3.1.tgz",
      "integrity": "sha512-/0LLxhzP0tfiR5hcQebtudP56gUurs2CLkGarnCiB/OqEyUFQ6U3paQi/tgLv0hBJYt2rnr9MNpxz4fiiugstg==",
      "license": "MIT"
    },
    "node_modules/mime-db": {
      "version": "1.52.0",
      "resolved": "https://registry.npmjs.org/mime-db/-/mime-db-1.52.0.tgz",
      "integrity": "sha512-sPU4uV7dYlvtWJxwwxHD0PuihVNiE7TyAbQ5SWxDCB9mUYvOgroQOwYQQOKPJ8CIbE+1ETVlOoK1UC2nU3gYvg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/mime-types": {
      "version": "2.1.35",
      "resolved": "https://registry.npmjs.org/mime-types/-/mime-types-2.1.35.tgz",
      "integrity": "sha512-ZDY+bPm5zTTF+YpCrAU9nK0UgICYPT0QtT1NZWFv4s++TNkcgVaT0g6+4R2uI4MjQjzysHB1zxuWL50hzaeXiw==",
      "license": "MIT",
      "dependencies": {
        "mime-db": "1.52.0"
      },
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/minimalistic-assert": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/minimalistic-assert/-/minimalistic-assert-1.0.1.tgz",
      "integrity": "sha512-UtJcAD4yEaGtjPezWuO9wC4nwUnVH/8/Im3yEHQP4b67cXlD/Qr9hdITCU1xDbSEXg2XKNaP8jsReV7vQd00/A==",
      "license": "ISC"
    },
    "node_modules/minimatch": {
      "version": "3.1.5",
      "resolved": "https://registry.npmjs.org/minimatch/-/minimatch-3.1.5.tgz",
      "integrity": "sha512-VgjWUsnnT6n+NUk6eZq77zeFdpW2LWDzP6zFGrCbHXiYNul5Dzqk2HHQ5uFH2DNW5Xbp8+jVzaeNt94ssEEl4w==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "brace-expansion": "^1.1.7"
      },
      "engines": {
        "node": "*"
      }
    },
    "node_modules/mipd": {
      "version": "0.0.7",
      "resolved": "https://registry.npmjs.org/mipd/-/mipd-0.0.7.tgz",
      "integrity": "sha512-aAPZPNDQ3uMTdKbuO2YmAw2TxLHO0moa4YKAyETM/DTj5FloZo+a+8tU+iv4GmW+sOxKLSRwcSFuczk+Cpt6fg==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/wagmi-dev"
        }
      ],
      "license": "MIT",
      "peerDependencies": {
        "typescript": ">=5.0.4"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/mnemonist": {
      "version": "0.40.4",
      "resolved": "https://registry.npmjs.org/mnemonist/-/mnemonist-0.40.4.tgz",
      "integrity": "sha512-ZAv+KNavneRVzu4tUeOgzkScI3W5BGwZ3rkxIpKtzzVgfTtWQFN1CgX0U72cyvyh3iTuHL3SiSmrQxTlryEIcw==",
      "license": "MIT",
      "dependencies": {
        "obliterator": "^2.0.4"
      }
    },
    "node_modules/ms": {
      "version": "2.1.3",
      "resolved": "https://registry.npmjs.org/ms/-/ms-2.1.3.tgz",
      "integrity": "sha512-6FlzubTLZG3J2a/NVCAleEhjzq5oxgHyaCU9yYXvcLsvoVaHJq/s5xXI6/XXP6tz7R9xAOtHnSO/tXtF3WRTlA==",
      "license": "MIT"
    },
    "node_modules/multiformats": {
      "version": "9.9.0",
      "resolved": "https://registry.npmjs.org/multiformats/-/multiformats-9.9.0.tgz",
      "integrity": "sha512-HoMUjhH9T8DDBNT+6xzkrd9ga/XiBI4xLr58LJACwK6G3HTOPeMz4nB4KJs33L2BelrIJa7P0VuNaVF3hMYfjg==",
      "license": "(Apache-2.0 AND MIT)"
    },
    "node_modules/nanoid": {
      "version": "5.1.11",
      "resolved": "https://registry.npmjs.org/nanoid/-/nanoid-5.1.11.tgz",
      "integrity": "sha512-v+KEsUv2ps74PaSKv0gHTxTCgMXOIfBEbaqa6w6ISIGC7ZsvHN4N9oJ8d4cmf0n5oTzQz2SLmThbQWhjd/8eKg==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "bin": {
        "nanoid": "bin/nanoid.js"
      },
      "engines": {
        "node": "^18 || >=20"
      }
    },
    "node_modules/nice-try": {
      "version": "1.0.5",
      "resolved": "https://registry.npmjs.org/nice-try/-/nice-try-1.0.5.tgz",
      "integrity": "sha512-1nh45deeb5olNY7eX82BkPO7SSxR5SSYJiPTrTdFUVYwAl8CKMA5N9PjTYkHiRjisVcxcQ1HXdLhx2qxxJzLNQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/node-addon-api": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/node-addon-api/-/node-addon-api-2.0.2.tgz",
      "integrity": "sha512-Ntyt4AIXyaLIuMHF6IOoTakB3K+RWxwtsHNRxllEoA6vPwP9o4866g6YWDLUdnucilZhmkxiHwHr11gAENw+QA==",
      "license": "MIT"
    },
    "node_modules/node-fetch": {
      "version": "2.7.0",
      "resolved": "https://registry.npmjs.org/node-fetch/-/node-fetch-2.7.0.tgz",
      "integrity": "sha512-c4FRfUm/dbcWZ7U+1Wq0AwCyFL+3nt2bEw05wfxSz+DWpWsitgmSgYmy2dQdWyKC1694ELPqMs/YzUSNozLt8A==",
      "license": "MIT",
      "dependencies": {
        "whatwg-url": "^5.0.0"
      },
      "engines": {
        "node": "4.x || >=6.0.0"
      },
      "peerDependencies": {
        "encoding": "^0.1.0"
      },
      "peerDependenciesMeta": {
        "encoding": {
          "optional": true
        }
      }
    },
    "node_modules/node-fetch-native": {
      "version": "1.6.7",
      "resolved": "https://registry.npmjs.org/node-fetch-native/-/node-fetch-native-1.6.7.tgz",
      "integrity": "sha512-g9yhqoedzIUm0nTnTqAQvueMPVOuIY16bqgAJJC8XOOubYFNwz6IER9qs0Gq2Xd0+CecCKFjtdDTMA4u4xG06Q==",
      "license": "MIT"
    },
    "node_modules/node-gyp-build": {
      "version": "4.8.4",
      "resolved": "https://registry.npmjs.org/node-gyp-build/-/node-gyp-build-4.8.4.tgz",
      "integrity": "sha512-LA4ZjwlnUblHVgq0oBF3Jl/6h/Nvs5fzBLwdEF4nuxnFdsfajde4WfxtJr3CaiH+F6ewcIB/q4jQ4UzPyid+CQ==",
      "license": "MIT",
      "bin": {
        "node-gyp-build": "bin.js",
        "node-gyp-build-optional": "optional.js",
        "node-gyp-build-test": "build-test.js"
      }
    },
    "node_modules/node-mock-http": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/node-mock-http/-/node-mock-http-1.0.4.tgz",
      "integrity": "sha512-8DY+kFsDkNXy1sJglUfuODx1/opAGJGyrTuFqEoN90oRc2Vk0ZbD4K2qmKXBBEhZQzdKHIVfEJpDU8Ak2NJEvQ==",
      "license": "MIT"
    },
    "node_modules/node-releases": {
      "version": "2.0.38",
      "resolved": "https://registry.npmjs.org/node-releases/-/node-releases-2.0.38.tgz",
      "integrity": "sha512-3qT/88Y3FbH/Kx4szpQQ4HzUbVrHPKTLVpVocKiLfoYvw9XSGOX2FmD2d6DrXbVYyAQTF2HeF6My8jmzx7/CRw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/normalize-package-data": {
      "version": "2.5.0",
      "resolved": "https://registry.npmjs.org/normalize-package-data/-/normalize-package-data-2.5.0.tgz",
      "integrity": "sha512-/5CMN3T0R4XTj4DcGaexo+roZSdSFW/0AOOTROrjxzCG1wrWXEsGbRKevjlIL+ZDE4sZlJr5ED4YW0yqmkK+eA==",
      "dev": true,
      "license": "BSD-2-Clause",
      "dependencies": {
        "hosted-git-info": "^2.1.4",
        "resolve": "^1.10.0",
        "semver": "2 || 3 || 4 || 5",
        "validate-npm-package-license": "^3.0.1"
      }
    },
    "node_modules/normalize-path": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/normalize-path/-/normalize-path-3.0.0.tgz",
      "integrity": "sha512-6eZs5Ls3WtCisHWp9S2GUy8dqkpGi4BVSz3GaqiE6ezub0512ESztXUwUB6C6IKbQkY2Pnb/mD4WYojCRwcwLA==",
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/npm-run-all": {
      "version": "4.1.5",
      "resolved": "https://registry.npmjs.org/npm-run-all/-/npm-run-all-4.1.5.tgz",
      "integrity": "sha512-Oo82gJDAVcaMdi3nuoKFavkIHBRVqQ1qvMb+9LHk/cF4P6B2m8aP04hGf7oL6wZ9BuGwX1onlLhpuoofSyoQDQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ansi-styles": "^3.2.1",
        "chalk": "^2.4.1",
        "cross-spawn": "^6.0.5",
        "memorystream": "^0.3.1",
        "minimatch": "^3.0.4",
        "pidtree": "^0.3.0",
        "read-pkg": "^3.0.0",
        "shell-quote": "^1.6.1",
        "string.prototype.padend": "^3.0.0"
      },
      "bin": {
        "npm-run-all": "bin/npm-run-all/index.js",
        "run-p": "bin/run-p/index.js",
        "run-s": "bin/run-s/index.js"
      },
      "engines": {
        "node": ">= 4"
      }
    },
    "node_modules/nypm": {
      "version": "0.6.6",
      "resolved": "https://registry.npmjs.org/nypm/-/nypm-0.6.6.tgz",
      "integrity": "sha512-vRyr0r4cbBapw07Xw8xrj9Teq3o7MUD35rSaTcanDbW+aK2XHDgJFiU6ZTj2GBw7Q12ysdsyFss+Vdz4hQ0Y6Q==",
      "devOptional": true,
      "license": "MIT",
      "dependencies": {
        "citty": "^0.2.2",
        "pathe": "^2.0.3",
        "tinyexec": "^1.1.1"
      },
      "bin": {
        "nypm": "dist/cli.mjs"
      },
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/nypm/node_modules/citty": {
      "version": "0.2.2",
      "resolved": "https://registry.npmjs.org/citty/-/citty-0.2.2.tgz",
      "integrity": "sha512-+6vJA3L98yv+IdfKGZHBNiGW5KHn22e/JwID0Strsz8h4S/csAu/OuICwxrg44k5MRiZHWIo8XXuJgQTriRP4w==",
      "devOptional": true,
      "license": "MIT"
    },
    "node_modules/obj-multiplex": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/obj-multiplex/-/obj-multiplex-1.0.0.tgz",
      "integrity": "sha512-0GNJAOsHoBHeNTvl5Vt6IWnpUEcc3uSRxzBri7EDyIcMgYvnY2JL2qdeV5zTMjWQX5OHcD5amcW2HFfDh0gjIA==",
      "license": "ISC",
      "dependencies": {
        "end-of-stream": "^1.4.0",
        "once": "^1.4.0",
        "readable-stream": "^2.3.3"
      }
    },
    "node_modules/obj-multiplex/node_modules/isarray": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/isarray/-/isarray-1.0.0.tgz",
      "integrity": "sha512-VLghIWNM6ELQzo7zwmcg0NmTVyWKYjvIeM83yjp0wRDTmUnrM678fQbcKBo6n2CJEF0szoG//ytg+TKla89ALQ==",
      "license": "MIT"
    },
    "node_modules/obj-multiplex/node_modules/readable-stream": {
      "version": "2.3.8",
      "resolved": "https://registry.npmjs.org/readable-stream/-/readable-stream-2.3.8.tgz",
      "integrity": "sha512-8p0AUk4XODgIewSi0l8Epjs+EVnWiK7NoDIEGU0HhE7+ZyY8D1IMY7odu5lRrFXGg71L15KG8QrPmum45RTtdA==",
      "license": "MIT",
      "dependencies": {
        "core-util-is": "~1.0.0",
        "inherits": "~2.0.3",
        "isarray": "~1.0.0",
        "process-nextick-args": "~2.0.0",
        "safe-buffer": "~5.1.1",
        "string_decoder": "~1.1.1",
        "util-deprecate": "~1.0.1"
      }
    },
    "node_modules/obj-multiplex/node_modules/safe-buffer": {
      "version": "5.1.2",
      "resolved": "https://registry.npmjs.org/safe-buffer/-/safe-buffer-5.1.2.tgz",
      "integrity": "sha512-Gd2UZBJDkXlY7GbJxfsE8/nvKkUEU1G38c1siN6QP6a9PT9MmHB8GnpscSmMJSoF8LOIrt8ud/wPtojys4G6+g==",
      "license": "MIT"
    },
    "node_modules/obj-multiplex/node_modules/string_decoder": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/string_decoder/-/string_decoder-1.1.1.tgz",
      "integrity": "sha512-n/ShnvDi6FHbbVfviro+WojiFzv+s8MPMHBczVePfUpDJLwoLT0ht1l4YwBCbi8pJAveEEdnkHyPyTP/mzRfwg==",
      "license": "MIT",
      "dependencies": {
        "safe-buffer": "~5.1.0"
      }
    },
    "node_modules/object-inspect": {
      "version": "1.13.4",
      "resolved": "https://registry.npmjs.org/object-inspect/-/object-inspect-1.13.4.tgz",
      "integrity": "sha512-W67iLl4J2EXEGTbfeHCffrjDfitvLANg0UlX3wFUUSTx92KXRFegMHUVgSqE+wvhAbi4WqjGg9czysTV2Epbew==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/object-keys": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/object-keys/-/object-keys-1.1.1.tgz",
      "integrity": "sha512-NuAESUOUMrlIXOfHKzD6bpPu3tYt3xvjNdRIQ+FeT0lNb4K8WR70CaDxhuNguS2XG+GjkyMwOzsN5ZktImfhLA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/object.assign": {
      "version": "4.1.7",
      "resolved": "https://registry.npmjs.org/object.assign/-/object.assign-4.1.7.tgz",
      "integrity": "sha512-nK28WOo+QIjBkDduTINE4JkF/UJJKyf2EJxvJKfblDpyg0Q+pkOHNTL0Qwy6NP6FhE/EnzV73BxxqcJaXY9anw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "call-bound": "^1.0.3",
        "define-properties": "^1.2.1",
        "es-object-atoms": "^1.0.0",
        "has-symbols": "^1.1.0",
        "object-keys": "^1.1.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/obliterator": {
      "version": "2.0.5",
      "resolved": "https://registry.npmjs.org/obliterator/-/obliterator-2.0.5.tgz",
      "integrity": "sha512-42CPE9AhahZRsMNslczq0ctAEtqk8Eka26QofnqC346BZdHDySk3LWka23LI7ULIw11NmltpiLagIq8gBozxTw==",
      "license": "MIT"
    },
    "node_modules/ofetch": {
      "version": "1.5.1",
      "resolved": "https://registry.npmjs.org/ofetch/-/ofetch-1.5.1.tgz",
      "integrity": "sha512-2W4oUZlVaqAPAil6FUg/difl6YhqhUR7x2eZY4bQCko22UXg3hptq9KLQdqFClV+Wu85UX7hNtdGTngi/1BxcA==",
      "license": "MIT",
      "dependencies": {
        "destr": "^2.0.5",
        "node-fetch-native": "^1.6.7",
        "ufo": "^1.6.1"
      }
    },
    "node_modules/ohash": {
      "version": "2.0.11",
      "resolved": "https://registry.npmjs.org/ohash/-/ohash-2.0.11.tgz",
      "integrity": "sha512-RdR9FQrFwNBNXAr4GixM8YaRZRJ5PUWbKYbE5eOsrwAjJW0q2REGcf79oYPsLyskQCZG1PLN+S/K1V00joZAoQ==",
      "devOptional": true,
      "license": "MIT"
    },
    "node_modules/on-exit-leak-free": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/on-exit-leak-free/-/on-exit-leak-free-2.1.2.tgz",
      "integrity": "sha512-0eJJY6hXLGf1udHwfNftBqH+g73EU4B504nZeKpz1sYRKafAghwxEJunB2O7rDZkL4PGfsMVnTXZ2EjibbqcsA==",
      "license": "MIT",
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/once": {
      "version": "1.4.0",
      "resolved": "https://registry.npmjs.org/once/-/once-1.4.0.tgz",
      "integrity": "sha512-lNaJgI+2Q5URQBkccEKHTQOPaXdUxnZZElQTZY0MFUAuaEqe1E+Nyvgdz/aIyNi6Z9MzO5dv1H8n58/GELp3+w==",
      "license": "ISC",
      "dependencies": {
        "wrappy": "1"
      }
    },
    "node_modules/openapi-fetch": {
      "version": "0.13.8",
      "resolved": "https://registry.npmjs.org/openapi-fetch/-/openapi-fetch-0.13.8.tgz",
      "integrity": "sha512-yJ4QKRyNxE44baQ9mY5+r/kAzZ8yXMemtNAOFwOzRXJscdjSxxzWSNlyBAr+o5JjkUw9Lc3W7OIoca0cY3PYnQ==",
      "license": "MIT",
      "dependencies": {
        "openapi-typescript-helpers": "^0.0.15"
      }
    },
    "node_modules/openapi-typescript-helpers": {
      "version": "0.0.15",
      "resolved": "https://registry.npmjs.org/openapi-typescript-helpers/-/openapi-typescript-helpers-0.0.15.tgz",
      "integrity": "sha512-opyTPaunsklCBpTK8JGef6mfPhLSnyy5a0IN9vKtx3+4aExf+KxEqYwIy3hqkedXIB97u357uLMJsOnm3GVjsw==",
      "license": "MIT"
    },
    "node_modules/own-keys": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/own-keys/-/own-keys-1.0.1.tgz",
      "integrity": "sha512-qFOyK5PjiWZd+QQIh+1jhdb9LpxTF0qs7Pm8o5QHYZ0M3vKqSqzsZaEB6oWlxZ+q2sJBMI/Ktgd2N5ZwQoRHfg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "get-intrinsic": "^1.2.6",
        "object-keys": "^1.1.1",
        "safe-push-apply": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/ox": {
      "version": "0.6.9",
      "resolved": "https://registry.npmjs.org/ox/-/ox-0.6.9.tgz",
      "integrity": "sha512-wi5ShvzE4eOcTwQVsIPdFr+8ycyX+5le/96iAJutaZAvCes1J0+RvpEPg5QDPDiaR0XQQAvZVl7AwqQcINuUug==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/wevm"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "@adraffy/ens-normalize": "^1.10.1",
        "@noble/curves": "^1.6.0",
        "@noble/hashes": "^1.5.0",
        "@scure/bip32": "^1.5.0",
        "@scure/bip39": "^1.4.0",
        "abitype": "^1.0.6",
        "eventemitter3": "5.0.1"
      },
      "peerDependencies": {
        "typescript": ">=5.4.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/p-limit": {
      "version": "2.3.0",
      "resolved": "https://registry.npmjs.org/p-limit/-/p-limit-2.3.0.tgz",
      "integrity": "sha512-//88mFWSJx8lxCzwdAABTJL2MyWB12+eIY7MDL2SqLmAkeKU9qxRvWuSyTjm3FUmpBEMuFfckAIqEaVGUDxb6w==",
      "license": "MIT",
      "dependencies": {
        "p-try": "^2.0.0"
      },
      "engines": {
        "node": ">=6"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/p-locate": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/p-locate/-/p-locate-4.1.0.tgz",
      "integrity": "sha512-R79ZZ/0wAxKGu3oYMlz8jy/kbhsNrS7SKZ7PxEHBgJ5+F2mtFW2fK2cOtBh1cHYkQsbzFV7I+EoRKe6Yt0oK7A==",
      "license": "MIT",
      "dependencies": {
        "p-limit": "^2.2.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/p-try": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/p-try/-/p-try-2.2.0.tgz",
      "integrity": "sha512-R4nPAVTAU0B9D35/Gk3uJf/7XYbQcyohSKdvAxIRSNghFl4e71hVoGnBNQz9cWaXxO2I10KTC+3jMdvvoKw6dQ==",
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/parse-json": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/parse-json/-/parse-json-4.0.0.tgz",
      "integrity": "sha512-aOIos8bujGN93/8Ox/jPLh7RwVnPEysynVFE+fQZyg6jKELEHwzgKdLRFHUgXJL6kylijVSBC4BvN9OmsB48Rw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "error-ex": "^1.3.1",
        "json-parse-better-errors": "^1.0.1"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/path-exists": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/path-exists/-/path-exists-4.0.0.tgz",
      "integrity": "sha512-ak9Qy5Q7jYb2Wwcey5Fpvg2KoAc/ZIhLSLOSBmRmygPsGwkVVt0fZa0qrtMz+m6tJTAHfZQ8FnmB4MG4LWy7/w==",
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/path-key": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/path-key/-/path-key-2.0.1.tgz",
      "integrity": "sha512-fEHGKCSmUSDPv4uoj8AlD+joPlq3peND+HRYyxFz4KPw4z926S/b8rIuFs2FYJg3BwsxJf6A9/3eIdLaYC+9Dw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/path-parse": {
      "version": "1.0.7",
      "resolved": "https://registry.npmjs.org/path-parse/-/path-parse-1.0.7.tgz",
      "integrity": "sha512-LDJzPVEEEPR+y48z93A0Ed0yXb8pAByGWo/k5YYdYgpY2/2EsOsksJrq7lOHxryrVOn1ejG6oAp8ahvOIQD8sw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/path-type": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/path-type/-/path-type-3.0.0.tgz",
      "integrity": "sha512-T2ZUsdZFHgA3u4e5PfPbjd7HDDpxPnQb5jN0SrDsjNSuVXHJqtwTnWqG0B1jZrgmJ/7lj1EmVIByWt1gxGkWvg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "pify": "^3.0.0"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/pathe": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/pathe/-/pathe-2.0.3.tgz",
      "integrity": "sha512-WUjGcAqP1gQacoQe+OBJsFA7Ld4DyXuUIjZ5cc75cLHvJ7dtNsTugphxIADwspS+AraAUePCKrSVtPLFj/F88w==",
      "devOptional": true,
      "license": "MIT"
    },
    "node_modules/pathval": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/pathval/-/pathval-2.0.1.tgz",
      "integrity": "sha512-//nshmD55c46FuFw26xV/xFAaB5HF9Xdap7HJBBnrKdAd6/GxDBaNA1870O79+9ueg61cZLSVc+OaFlfmObYVQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 14.16"
      }
    },
    "node_modules/perfect-debounce": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/perfect-debounce/-/perfect-debounce-1.0.0.tgz",
      "integrity": "sha512-xCy9V055GLEqoFaHoC1SoLIaLmWctgCUaBaWxDZ7/Zx4CTyX7cJQLJOok/orfjZAh9kEYpjJa4d0KcJmCbctZA==",
      "devOptional": true,
      "license": "MIT"
    },
    "node_modules/picocolors": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/picocolors/-/picocolors-1.1.1.tgz",
      "integrity": "sha512-xceH2snhtb5M9liqDsmEw56le376mTZkEX/jEb/RxNFyegNul7eNslCXP9FDj/Lcu0X8KEyMceP2ntpaHrDEVA==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/picomatch": {
      "version": "4.0.4",
      "resolved": "https://registry.npmjs.org/picomatch/-/picomatch-4.0.4.tgz",
      "integrity": "sha512-QP88BAKvMam/3NxH6vj2o21R6MjxZUAd6nlwAS/pnGvN9IVLocLHxGYIzFhg6fUQ+5th6P4dv4eW9jX3DSIj7A==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/sponsors/jonschlinkert"
      }
    },
    "node_modules/pidtree": {
      "version": "0.3.1",
      "resolved": "https://registry.npmjs.org/pidtree/-/pidtree-0.3.1.tgz",
      "integrity": "sha512-qQbW94hLHEqCg7nhby4yRC7G2+jYHY4Rguc2bjw7Uug4GIJuu1tvf2uHaZv5Q8zdt+WKJ6qK1FOI6amaWUo5FA==",
      "dev": true,
      "license": "MIT",
      "bin": {
        "pidtree": "bin/pidtree.js"
      },
      "engines": {
        "node": ">=0.10"
      }
    },
    "node_modules/pify": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/pify/-/pify-3.0.0.tgz",
      "integrity": "sha512-C3FsVNH1udSEX48gGX1xfvwTWfsYWj5U+8/uK15BGzIGrKoUpghX8hWZwa/OFnakBiiVNmBvemTJR5mcy7iPcg==",
      "license": "MIT",
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/pino": {
      "version": "10.3.1",
      "resolved": "https://registry.npmjs.org/pino/-/pino-10.3.1.tgz",
      "integrity": "sha512-r34yH/GlQpKZbU1BvFFqOjhISRo1MNx1tWYsYvmj6KIRHSPMT2+yHOEb1SG6NMvRoHRF0a07kCOox/9yakl1vg==",
      "license": "MIT",
      "dependencies": {
        "@pinojs/redact": "^0.4.0",
        "atomic-sleep": "^1.0.0",
        "on-exit-leak-free": "^2.1.0",
        "pino-abstract-transport": "^3.0.0",
        "pino-std-serializers": "^7.0.0",
        "process-warning": "^5.0.0",
        "quick-format-unescaped": "^4.0.3",
        "real-require": "^0.2.0",
        "safe-stable-stringify": "^2.3.1",
        "sonic-boom": "^4.0.1",
        "thread-stream": "^4.0.0"
      },
      "bin": {
        "pino": "bin.js"
      }
    },
    "node_modules/pino-abstract-transport": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/pino-abstract-transport/-/pino-abstract-transport-3.0.0.tgz",
      "integrity": "sha512-wlfUczU+n7Hy/Ha5j9a/gZNy7We5+cXp8YL+X+PG8S0KXxw7n/JXA3c46Y0zQznIJ83URJiwy7Lh56WLokNuxg==",
      "license": "MIT",
      "dependencies": {
        "split2": "^4.0.0"
      }
    },
    "node_modules/pino-std-serializers": {
      "version": "7.1.0",
      "resolved": "https://registry.npmjs.org/pino-std-serializers/-/pino-std-serializers-7.1.0.tgz",
      "integrity": "sha512-BndPH67/JxGExRgiX1dX0w1FvZck5Wa4aal9198SrRhZjH3GxKQUKIBnYJTdj2HDN3UQAS06HlfcSbQj2OHmaw==",
      "license": "MIT"
    },
    "node_modules/pkg-types": {
      "version": "2.3.1",
      "resolved": "https://registry.npmjs.org/pkg-types/-/pkg-types-2.3.1.tgz",
      "integrity": "sha512-y+ichcgc2LrADuhLNAx8DFjVfgz91pRxfZdI3UDhxHvcVEZsenLO+7XaU5vOp0u/7V/wZ+plyuQxtrDlZJ+yeg==",
      "devOptional": true,
      "license": "MIT",
      "dependencies": {
        "confbox": "^0.2.4",
        "exsolve": "^1.0.8",
        "pathe": "^2.0.3"
      }
    },
    "node_modules/pngjs": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/pngjs/-/pngjs-5.0.0.tgz",
      "integrity": "sha512-40QW5YalBNfQo5yRYmiw7Yz6TKKVr3h6970B2YE+3fQpsWcrbj1PzJgxeJ19DRQjhMbKPIuMY8rFaXc8moolVw==",
      "license": "MIT",
      "engines": {
        "node": ">=10.13.0"
      }
    },
    "node_modules/pony-cause": {
      "version": "2.1.11",
      "resolved": "https://registry.npmjs.org/pony-cause/-/pony-cause-2.1.11.tgz",
      "integrity": "sha512-M7LhCsdNbNgiLYiP4WjsfLUuFmCfnjdF6jKe2R9NKl4WFN+HZPGHJZ9lnLP7f9ZnKe3U9nuWD0szirmj+migUg==",
      "license": "0BSD",
      "engines": {
        "node": ">=12.0.0"
      }
    },
    "node_modules/possible-typed-array-names": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/possible-typed-array-names/-/possible-typed-array-names-1.1.0.tgz",
      "integrity": "sha512-/+5VFTchJDoVj3bhoqi6UeymcD00DAwb1nJwamzPvHEszJ4FpF6SNNbUbOS8yI56qHzdV8eK0qEfOSiodkTdxg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/postcss": {
      "version": "8.5.13",
      "resolved": "https://registry.npmjs.org/postcss/-/postcss-8.5.13.tgz",
      "integrity": "sha512-qif0+jGGZoLWdHey3UFHHWP0H7Gbmsk8T5VEqyYFbWqPr1XqvLGBbk/sl8V5exGmcYJklJOhOQq1pV9IcsiFag==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/postcss/"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/postcss"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "nanoid": "^3.3.11",
        "picocolors": "^1.1.1",
        "source-map-js": "^1.2.1"
      },
      "engines": {
        "node": "^10 || ^12 || >=14"
      }
    },
    "node_modules/postcss/node_modules/nanoid": {
      "version": "3.3.12",
      "resolved": "https://registry.npmjs.org/nanoid/-/nanoid-3.3.12.tgz",
      "integrity": "sha512-ZB9RH/39qpq5Vu6Y+NmUaFhQR6pp+M2Xt76XBnEwDaGcVAqhlvxrl3B2bKS5D3NH3QR76v3aSrKaF/Kiy7lEtQ==",
      "dev": true,
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "bin": {
        "nanoid": "bin/nanoid.cjs"
      },
      "engines": {
        "node": "^10 || ^12 || ^13.7 || ^14 || >=15.0.1"
      }
    },
    "node_modules/preact": {
      "version": "10.24.2",
      "resolved": "https://registry.npmjs.org/preact/-/preact-10.24.2.tgz",
      "integrity": "sha512-1cSoF0aCC8uaARATfrlz4VCBqE8LwZwRfLgkxJOQwAlQt6ayTmi0D9OF7nXid1POI5SZidFuG9CnlXbDfLqY/Q==",
      "license": "MIT",
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/preact"
      }
    },
    "node_modules/prisma": {
      "version": "6.19.3",
      "resolved": "https://registry.npmjs.org/prisma/-/prisma-6.19.3.tgz",
      "integrity": "sha512-++ZJ0ijLrDJF6hNB4t4uxg2br3fC4H9Yc9tcbjr2fcNFP3rh/SBNrAgjhsqBU4Ght8JPrVofG/ZkXfnSfnYsFg==",
      "devOptional": true,
      "hasInstallScript": true,
      "license": "Apache-2.0",
      "dependencies": {
        "@prisma/config": "6.19.3",
        "@prisma/engines": "6.19.3"
      },
      "bin": {
        "prisma": "build/index.js"
      },
      "engines": {
        "node": ">=18.18"
      },
      "peerDependencies": {
        "typescript": ">=5.1.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/process-nextick-args": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/process-nextick-args/-/process-nextick-args-2.0.1.tgz",
      "integrity": "sha512-3ouUOpQhtgrbOa17J7+uxOTpITYWaGP7/AhoR3+A+/1e9skrzelGi/dXzEYyvbxubEF6Wn2ypscTKiKJFFn1ag==",
      "license": "MIT"
    },
    "node_modules/process-warning": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/process-warning/-/process-warning-5.0.0.tgz",
      "integrity": "sha512-a39t9ApHNx2L4+HBnQKqxxHNs1r7KF+Intd8Q/g1bUh6q0WIp9voPXJ/x0j+ZL45KF1pJd9+q2jLIRMfvEshkA==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/fastify"
        },
        {
          "type": "opencollective",
          "url": "https://opencollective.com/fastify"
        }
      ],
      "license": "MIT"
    },
    "node_modules/proxy-compare": {
      "version": "2.6.0",
      "resolved": "https://registry.npmjs.org/proxy-compare/-/proxy-compare-2.6.0.tgz",
      "integrity": "sha512-8xuCeM3l8yqdmbPoYeLbrAXCBWu19XEYc5/F28f5qOaoAIMyfmBUkl5axiK+x9olUvRlcekvnm98AP9RDngOIw==",
      "license": "MIT"
    },
    "node_modules/proxy-from-env": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/proxy-from-env/-/proxy-from-env-1.1.0.tgz",
      "integrity": "sha512-D+zkORCbA9f1tdWRK0RaCR3GPv50cMxcrz4X8k5LTSUD1Dkw47mKJEZQNunItRTkWwgtaUSo1RVFRIG9ZXiFYg==",
      "license": "MIT"
    },
    "node_modules/pump": {
      "version": "3.0.4",
      "resolved": "https://registry.npmjs.org/pump/-/pump-3.0.4.tgz",
      "integrity": "sha512-VS7sjc6KR7e1ukRFhQSY5LM2uBWAUPiOPa/A3mkKmiMwSmRFUITt0xuj+/lesgnCv+dPIEYlkzrcyXgquIHMcA==",
      "license": "MIT",
      "dependencies": {
        "end-of-stream": "^1.1.0",
        "once": "^1.3.1"
      }
    },
    "node_modules/pure-rand": {
      "version": "6.1.0",
      "resolved": "https://registry.npmjs.org/pure-rand/-/pure-rand-6.1.0.tgz",
      "integrity": "sha512-bVWawvoZoBYpp6yIoQtQXHZjmz35RSVHnUOTefl8Vcjr8snTPY1wnpSPMWekcFwbxI6gtmT7rSYPFvz71ldiOA==",
      "devOptional": true,
      "funding": [
        {
          "type": "individual",
          "url": "https://github.com/sponsors/dubzzz"
        },
        {
          "type": "opencollective",
          "url": "https://opencollective.com/fast-check"
        }
      ],
      "license": "MIT"
    },
    "node_modules/qrcode": {
      "version": "1.5.3",
      "resolved": "https://registry.npmjs.org/qrcode/-/qrcode-1.5.3.tgz",
      "integrity": "sha512-puyri6ApkEHYiVl4CFzo1tDkAZ+ATcnbJrJ6RiBM1Fhctdn/ix9MTE3hRph33omisEbC/2fcfemsseiKgBPKZg==",
      "license": "MIT",
      "dependencies": {
        "dijkstrajs": "^1.0.1",
        "encode-utf8": "^1.0.3",
        "pngjs": "^5.0.0",
        "yargs": "^15.3.1"
      },
      "bin": {
        "qrcode": "bin/qrcode"
      },
      "engines": {
        "node": ">=10.13.0"
      }
    },
    "node_modules/query-string": {
      "version": "7.1.3",
      "resolved": "https://registry.npmjs.org/query-string/-/query-string-7.1.3.tgz",
      "integrity": "sha512-hh2WYhq4fi8+b+/2Kg9CEge4fDPvHS534aOOvOZeQ3+Vf2mCFsaFBYj0i+iXcAq6I9Vzp5fjMFBlONvayDC1qg==",
      "license": "MIT",
      "dependencies": {
        "decode-uri-component": "^0.2.2",
        "filter-obj": "^1.1.0",
        "split-on-first": "^1.0.0",
        "strict-uri-encode": "^2.0.0"
      },
      "engines": {
        "node": ">=6"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/quick-format-unescaped": {
      "version": "4.0.4",
      "resolved": "https://registry.npmjs.org/quick-format-unescaped/-/quick-format-unescaped-4.0.4.tgz",
      "integrity": "sha512-tYC1Q1hgyRuHgloV/YXs2w15unPVh8qfu/qCTfhTYamaw7fyhumKa2yGpdSo87vY32rIclj+4fWYQXUMs9EHvg==",
      "license": "MIT"
    },
    "node_modules/radix3": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/radix3/-/radix3-1.1.2.tgz",
      "integrity": "sha512-b484I/7b8rDEdSDKckSSBA8knMpcdsXudlE/LNL639wFoHKwLbEkQFZHWEYwDC0wa0FKUcCY+GAF73Z7wxNVFA==",
      "license": "MIT"
    },
    "node_modules/rc9": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/rc9/-/rc9-2.1.2.tgz",
      "integrity": "sha512-btXCnMmRIBINM2LDZoEmOogIZU7Qe7zn4BpomSKZ/ykbLObuBdvG+mFq11DL6fjH1DRwHhrlgtYWG96bJiC7Cg==",
      "devOptional": true,
      "license": "MIT",
      "dependencies": {
        "defu": "^6.1.4",
        "destr": "^2.0.3"
      }
    },
    "node_modules/react": {
      "version": "18.3.1",
      "resolved": "https://registry.npmjs.org/react/-/react-18.3.1.tgz",
      "integrity": "sha512-wS+hAgJShR0KhEvPJArfuPVN1+Hz1t0Y6n5jLrGQbkb4urgPE/0Rve+1kMB1v/oWgHgm4WIcV+i7F2pTVj+2iQ==",
      "license": "MIT",
      "dependencies": {
        "loose-envify": "^1.1.0"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/react-chessboard": {
      "version": "4.7.3",
      "resolved": "https://registry.npmjs.org/react-chessboard/-/react-chessboard-4.7.3.tgz",
      "integrity": "sha512-pQNs/Ee3EJqv1kv5sWkO8J4TOEuZC8Nm7NOWGHcFSBmiBLX1uvbZD2/7snmKdt2GB5+QJhTQ+PSJJ+e32c3e7w==",
      "license": "MIT",
      "dependencies": {
        "react-dnd": "^16.0.1",
        "react-dnd-html5-backend": "^16.0.1",
        "react-dnd-touch-backend": "^16.0.1"
      },
      "peerDependencies": {
        "react": ">=16.14.0",
        "react-dom": ">=16.14.0"
      }
    },
    "node_modules/react-dnd": {
      "version": "16.0.1",
      "resolved": "https://registry.npmjs.org/react-dnd/-/react-dnd-16.0.1.tgz",
      "integrity": "sha512-QeoM/i73HHu2XF9aKksIUuamHPDvRglEwdHL4jsp784BgUuWcg6mzfxT0QDdQz8Wj0qyRKx2eMg8iZtWvU4E2Q==",
      "license": "MIT",
      "dependencies": {
        "@react-dnd/invariant": "^4.0.1",
        "@react-dnd/shallowequal": "^4.0.1",
        "dnd-core": "^16.0.1",
        "fast-deep-equal": "^3.1.3",
        "hoist-non-react-statics": "^3.3.2"
      },
      "peerDependencies": {
        "@types/hoist-non-react-statics": ">= 3.3.1",
        "@types/node": ">= 12",
        "@types/react": ">= 16",
        "react": ">= 16.14"
      },
      "peerDependenciesMeta": {
        "@types/hoist-non-react-statics": {
          "optional": true
        },
        "@types/node": {
          "optional": true
        },
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/react-dnd-html5-backend": {
      "version": "16.0.1",
      "resolved": "https://registry.npmjs.org/react-dnd-html5-backend/-/react-dnd-html5-backend-16.0.1.tgz",
      "integrity": "sha512-Wu3dw5aDJmOGw8WjH1I1/yTH+vlXEL4vmjk5p+MHxP8HuHJS1lAGeIdG/hze1AvNeXWo/JgULV87LyQOr+r5jw==",
      "license": "MIT",
      "dependencies": {
        "dnd-core": "^16.0.1"
      }
    },
    "node_modules/react-dnd-touch-backend": {
      "version": "16.0.1",
      "resolved": "https://registry.npmjs.org/react-dnd-touch-backend/-/react-dnd-touch-backend-16.0.1.tgz",
      "integrity": "sha512-NonoCABzzjyWGZuDxSG77dbgMZ2Wad7eQiCd/ECtsR2/NBLTjGksPUx9UPezZ1nQ/L7iD130Tz3RUshL/ClKLA==",
      "license": "MIT",
      "dependencies": {
        "@react-dnd/invariant": "^4.0.1",
        "dnd-core": "^16.0.1"
      }
    },
    "node_modules/react-dom": {
      "version": "18.3.1",
      "resolved": "https://registry.npmjs.org/react-dom/-/react-dom-18.3.1.tgz",
      "integrity": "sha512-5m4nQKp+rZRb09LNH59GM4BxTh9251/ylbKIbpe7TpGxfJ+9kv6BLkLBXIjjspbgbnIBNqlI23tRnTWT0snUIw==",
      "license": "MIT",
      "dependencies": {
        "loose-envify": "^1.1.0",
        "scheduler": "^0.23.2"
      },
      "peerDependencies": {
        "react": "^18.3.1"
      }
    },
    "node_modules/react-is": {
      "version": "16.13.1",
      "resolved": "https://registry.npmjs.org/react-is/-/react-is-16.13.1.tgz",
      "integrity": "sha512-24e6ynE2H+OKt4kqsOvNd8kBpV65zoxbA4BVsEOB3ARVWQki/DHzaUoC5KuON/BiccDaCCTZBuOcfZs70kR8bQ==",
      "license": "MIT"
    },
    "node_modules/react-refresh": {
      "version": "0.17.0",
      "resolved": "https://registry.npmjs.org/react-refresh/-/react-refresh-0.17.0.tgz",
      "integrity": "sha512-z6F7K9bV85EfseRCp2bzrpyQ0Gkw1uLoCel9XBVWPg/TjRj94SkJzUTGfOa4bs7iJvBWtQG0Wq7wnI0syw3EBQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/read-pkg": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/read-pkg/-/read-pkg-3.0.0.tgz",
      "integrity": "sha512-BLq/cCO9two+lBgiTYNqD6GdtK8s4NpaWrl6/rCO9w0TUS8oJl7cmToOZfRYllKTISY6nt1U7jQ53brmKqY6BA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "load-json-file": "^4.0.0",
        "normalize-package-data": "^2.3.2",
        "path-type": "^3.0.0"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/readable-stream": {
      "version": "3.6.2",
      "resolved": "https://registry.npmjs.org/readable-stream/-/readable-stream-3.6.2.tgz",
      "integrity": "sha512-9u/sniCrY3D5WdsERHzHE4G2YCXqoG5FTHUiCC4SIbr6XcLZBY05ya9EKjYek9O5xOAwjGq+1JdGBAS7Q9ScoA==",
      "license": "MIT",
      "dependencies": {
        "inherits": "^2.0.3",
        "string_decoder": "^1.1.1",
        "util-deprecate": "^1.0.1"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/readdirp": {
      "version": "4.1.2",
      "resolved": "https://registry.npmjs.org/readdirp/-/readdirp-4.1.2.tgz",
      "integrity": "sha512-GDhwkLfywWL2s6vEjyhri+eXmfH6j1L7JE27WhqLeYzoh/A3DBaYGEj2H/HFZCn/kMfim73FXxEJTw06WtxQwg==",
      "devOptional": true,
      "license": "MIT",
      "engines": {
        "node": ">= 14.18.0"
      },
      "funding": {
        "type": "individual",
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/real-require": {
      "version": "0.2.0",
      "resolved": "https://registry.npmjs.org/real-require/-/real-require-0.2.0.tgz",
      "integrity": "sha512-57frrGM/OCTLqLOAh0mhVA9VBMHd+9U7Zb2THMGdBUoZVOtGbJzjxsYGDJ3A9AYYCP4hn6y1TVbaOfzWtm5GFg==",
      "license": "MIT",
      "engines": {
        "node": ">= 12.13.0"
      }
    },
    "node_modules/redux": {
      "version": "4.2.1",
      "resolved": "https://registry.npmjs.org/redux/-/redux-4.2.1.tgz",
      "integrity": "sha512-LAUYz4lc+Do8/g7aeRa8JkyDErK6ekstQaqWQrNRW//MY1TvCEpMtpTWvlQ+FPbWCx+Xixu/6SHt5N0HR+SB4w==",
      "license": "MIT",
      "dependencies": {
        "@babel/runtime": "^7.9.2"
      }
    },
    "node_modules/reflect.getprototypeof": {
      "version": "1.0.10",
      "resolved": "https://registry.npmjs.org/reflect.getprototypeof/-/reflect.getprototypeof-1.0.10.tgz",
      "integrity": "sha512-00o4I+DVrefhv+nX0ulyi3biSHCPDe+yLv5o/p6d/UVlirijB8E16FtfwSAi4g3tcqrQ4lRAqQSoFEZJehYEcw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.9",
        "es-errors": "^1.3.0",
        "es-object-atoms": "^1.0.0",
        "get-intrinsic": "^1.2.7",
        "get-proto": "^1.0.1",
        "which-builtin-type": "^1.2.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/regexp.prototype.flags": {
      "version": "1.5.4",
      "resolved": "https://registry.npmjs.org/regexp.prototype.flags/-/regexp.prototype.flags-1.5.4.tgz",
      "integrity": "sha512-dYqgNSZbDwkaJ2ceRd9ojCGjBq+mOm9LmtXnAnEGyHhN/5R7iDW2TRw3h+o/jCFxus3P2LfWIIiwowAjANm7IA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "define-properties": "^1.2.1",
        "es-errors": "^1.3.0",
        "get-proto": "^1.0.1",
        "gopd": "^1.2.0",
        "set-function-name": "^2.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/require-directory": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/require-directory/-/require-directory-2.1.1.tgz",
      "integrity": "sha512-fGxEI7+wsG9xrvdjsrlmL22OMTTiHRwAMroiEeMgq8gzoLC/PQr7RsRDSTLUg/bZAZtF+TVIkHc6/4RIKrui+Q==",
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/require-from-string": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/require-from-string/-/require-from-string-2.0.2.tgz",
      "integrity": "sha512-Xf0nWe6RseziFMu+Ap9biiUbmplq6S9/p+7w7YXP/JBHhrUDDUhwa+vANyubuqfZWTveU//DYVGsDG7RKL/vEw==",
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/require-main-filename": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/require-main-filename/-/require-main-filename-2.0.0.tgz",
      "integrity": "sha512-NKN5kMDylKuldxYLSUfrbo5Tuzh4hd+2E8NPPX02mZtn1VuREQToYe/ZdlJy+J3uCpfaiGF05e7B8W0iXbQHmg==",
      "license": "ISC"
    },
    "node_modules/resolve": {
      "version": "1.22.12",
      "resolved": "https://registry.npmjs.org/resolve/-/resolve-1.22.12.tgz",
      "integrity": "sha512-TyeJ1zif53BPfHootBGwPRYT1RUt6oGWsaQr8UyZW/eAm9bKoijtvruSDEmZHm92CwS9nj7/fWttqPCgzep8CA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "is-core-module": "^2.16.1",
        "path-parse": "^1.0.7",
        "supports-preserve-symlinks-flag": "^1.0.0"
      },
      "bin": {
        "resolve": "bin/resolve"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/resolve-pkg-maps": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/resolve-pkg-maps/-/resolve-pkg-maps-1.0.0.tgz",
      "integrity": "sha512-seS2Tj26TBVOC2NIc2rOe2y2ZO7efxITtLZcGSOnHHNOQ7CkiUBfw0Iw2ck6xkIhPwLhKNLS8BO+hEpngQlqzw==",
      "dev": true,
      "license": "MIT",
      "funding": {
        "url": "https://github.com/privatenumber/resolve-pkg-maps?sponsor=1"
      }
    },
    "node_modules/ret": {
      "version": "0.5.0",
      "resolved": "https://registry.npmjs.org/ret/-/ret-0.5.0.tgz",
      "integrity": "sha512-I1XxrZSQ+oErkRR4jYbAyEEu2I0avBvvMM5JN+6EBprOGRCs63ENqZ3vjavq8fBw2+62G5LF5XelKwuJpcvcxw==",
      "license": "MIT",
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/reusify": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/reusify/-/reusify-1.1.0.tgz",
      "integrity": "sha512-g6QUff04oZpHs0eG5p83rFLhHeV00ug/Yf9nZM6fLeUrPguBTkTQOdpAWWspMh55TZfVQDPaN3NQJfbVRAxdIw==",
      "license": "MIT",
      "engines": {
        "iojs": ">=1.0.0",
        "node": ">=0.10.0"
      }
    },
    "node_modules/rfdc": {
      "version": "1.4.1",
      "resolved": "https://registry.npmjs.org/rfdc/-/rfdc-1.4.1.tgz",
      "integrity": "sha512-q1b3N5QkRUWUl7iyylaaj3kOpIT0N2i9MqIEQXP73GVsN9cw3fdx8X63cEmWhJGi2PPCF23Ijp7ktmd39rawIA==",
      "license": "MIT"
    },
    "node_modules/rollup": {
      "version": "4.60.2",
      "resolved": "https://registry.npmjs.org/rollup/-/rollup-4.60.2.tgz",
      "integrity": "sha512-J9qZyW++QK/09NyN/zeO0dG/1GdGfyp9lV8ajHnRVLfo/uFsbji5mHnDgn/qYdUHyCkM2N+8VyspgZclfAh0eQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/estree": "1.0.8"
      },
      "bin": {
        "rollup": "dist/bin/rollup"
      },
      "engines": {
        "node": ">=18.0.0",
        "npm": ">=8.0.0"
      },
      "optionalDependencies": {
        "@rollup/rollup-android-arm-eabi": "4.60.2",
        "@rollup/rollup-android-arm64": "4.60.2",
        "@rollup/rollup-darwin-arm64": "4.60.2",
        "@rollup/rollup-darwin-x64": "4.60.2",
        "@rollup/rollup-freebsd-arm64": "4.60.2",
        "@rollup/rollup-freebsd-x64": "4.60.2",
        "@rollup/rollup-linux-arm-gnueabihf": "4.60.2",
        "@rollup/rollup-linux-arm-musleabihf": "4.60.2",
        "@rollup/rollup-linux-arm64-gnu": "4.60.2",
        "@rollup/rollup-linux-arm64-musl": "4.60.2",
        "@rollup/rollup-linux-loong64-gnu": "4.60.2",
        "@rollup/rollup-linux-loong64-musl": "4.60.2",
        "@rollup/rollup-linux-ppc64-gnu": "4.60.2",
        "@rollup/rollup-linux-ppc64-musl": "4.60.2",
        "@rollup/rollup-linux-riscv64-gnu": "4.60.2",
        "@rollup/rollup-linux-riscv64-musl": "4.60.2",
        "@rollup/rollup-linux-s390x-gnu": "4.60.2",
        "@rollup/rollup-linux-x64-gnu": "4.60.2",
        "@rollup/rollup-linux-x64-musl": "4.60.2",
        "@rollup/rollup-openbsd-x64": "4.60.2",
        "@rollup/rollup-openharmony-arm64": "4.60.2",
        "@rollup/rollup-win32-arm64-msvc": "4.60.2",
        "@rollup/rollup-win32-ia32-msvc": "4.60.2",
        "@rollup/rollup-win32-x64-gnu": "4.60.2",
        "@rollup/rollup-win32-x64-msvc": "4.60.2",
        "fsevents": "~2.3.2"
      }
    },
    "node_modules/safe-array-concat": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/safe-array-concat/-/safe-array-concat-1.1.4.tgz",
      "integrity": "sha512-wtZlHyOje6OZTGqAoaDKxFkgRtkF9CnHAVnCHKfuj200wAgL+bSJhdsCD2l0Qx/2ekEXjPWcyKkfGb5CPboslg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.9",
        "call-bound": "^1.0.4",
        "get-intrinsic": "^1.3.0",
        "has-symbols": "^1.1.0",
        "isarray": "^2.0.5"
      },
      "engines": {
        "node": ">=0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/safe-buffer": {
      "version": "5.2.1",
      "resolved": "https://registry.npmjs.org/safe-buffer/-/safe-buffer-5.2.1.tgz",
      "integrity": "sha512-rp3So07KcdmmKbGvgaNxQSJr7bGVSVk5S9Eq1F+ppbRo70+YeaDxkw5Dd8NPN+GD6bjnYm2VuPuCXmpuYvmCXQ==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "MIT"
    },
    "node_modules/safe-push-apply": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/safe-push-apply/-/safe-push-apply-1.0.0.tgz",
      "integrity": "sha512-iKE9w/Z7xCzUMIZqdBsp6pEQvwuEebH4vdpjcDWnyzaI6yl6O9FHvVpmGelvEHNsoY6wGblkxR6Zty/h00WiSA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "isarray": "^2.0.5"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/safe-regex-test": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/safe-regex-test/-/safe-regex-test-1.1.0.tgz",
      "integrity": "sha512-x/+Cz4YrimQxQccJf5mKEbIa1NzeCRNI5Ecl/ekmlYaampdNLPalVyIcCZNNH3MvmqBugV5TMYZXv0ljslUlaw==",
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "es-errors": "^1.3.0",
        "is-regex": "^1.2.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/safe-regex2": {
      "version": "5.1.1",
      "resolved": "https://registry.npmjs.org/safe-regex2/-/safe-regex2-5.1.1.tgz",
      "integrity": "sha512-mOSBvHGDZMuIEZMdOz/aCEYDCv0E7nfcNsIhUF+/P+xC7Hyf3FkvymqgPbg9D1EdSGu+uKbJgy09K/RKKc7kJA==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/fastify"
        },
        {
          "type": "opencollective",
          "url": "https://opencollective.com/fastify"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "ret": "~0.5.0"
      },
      "bin": {
        "safe-regex2": "bin/safe-regex2.js"
      }
    },
    "node_modules/safe-stable-stringify": {
      "version": "2.5.0",
      "resolved": "https://registry.npmjs.org/safe-stable-stringify/-/safe-stable-stringify-2.5.0.tgz",
      "integrity": "sha512-b3rppTKm9T+PsVCBEOUR46GWI7fdOs00VKZ1+9c1EWDaDMvjQc6tUwuFyIprgGgTcWoVHSKrU8H31ZHA2e0RHA==",
      "license": "MIT",
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/safer-buffer": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/safer-buffer/-/safer-buffer-2.1.2.tgz",
      "integrity": "sha512-YZo3K82SD7Riyi0E1EQPojLz7kpepnSQI9IyPbHHg1XXXevb5dJI7tpyN2ADxGcQbHG7vcyRHk0cbwqcQriUtg==",
      "license": "MIT"
    },
    "node_modules/scheduler": {
      "version": "0.23.2",
      "resolved": "https://registry.npmjs.org/scheduler/-/scheduler-0.23.2.tgz",
      "integrity": "sha512-UOShsPwz7NrMUqhR6t0hWjFduvOzbtv7toDH1/hIrfRNIDBnnBWd0CwJTGvTpngVlmwGCdP9/Zl/tVrDqcuYzQ==",
      "license": "MIT",
      "dependencies": {
        "loose-envify": "^1.1.0"
      }
    },
    "node_modules/secure-json-parse": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/secure-json-parse/-/secure-json-parse-4.1.0.tgz",
      "integrity": "sha512-l4KnYfEyqYJxDwlNVyRfO2E4NTHfMKAWdUuA8J0yve2Dz/E/PdBepY03RvyJpssIpRFwJoCD55wA+mEDs6ByWA==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/fastify"
        },
        {
          "type": "opencollective",
          "url": "https://opencollective.com/fastify"
        }
      ],
      "license": "BSD-3-Clause"
    },
    "node_modules/semver": {
      "version": "5.7.2",
      "resolved": "https://registry.npmjs.org/semver/-/semver-5.7.2.tgz",
      "integrity": "sha512-cBznnQ9KjJqU67B52RMC65CMarK2600WFnbkcaiwWq3xy/5haFJlshgnpjovMVJ+Hff49d8GEn0b87C5pDQ10g==",
      "dev": true,
      "license": "ISC",
      "bin": {
        "semver": "bin/semver"
      }
    },
    "node_modules/set-blocking": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/set-blocking/-/set-blocking-2.0.0.tgz",
      "integrity": "sha512-KiKBS8AnWGEyLzofFfmvKwpdPzqiy16LvQfK3yv/fVH7Bj13/wl3JSR1J+rfgRE9q7xUJK4qvgS8raSOeLUehw==",
      "license": "ISC"
    },
    "node_modules/set-cookie-parser": {
      "version": "2.7.2",
      "resolved": "https://registry.npmjs.org/set-cookie-parser/-/set-cookie-parser-2.7.2.tgz",
      "integrity": "sha512-oeM1lpU/UvhTxw+g3cIfxXHyJRc/uidd3yK1P242gzHds0udQBYzs3y8j4gCCW+ZJ7ad0yctld8RYO+bdurlvw==",
      "license": "MIT"
    },
    "node_modules/set-function-length": {
      "version": "1.2.2",
      "resolved": "https://registry.npmjs.org/set-function-length/-/set-function-length-1.2.2.tgz",
      "integrity": "sha512-pgRc4hJ4/sNjWCSS9AmnS40x3bNMDTknHgL5UaMBTMyJnU90EgWh1Rz+MC9eFu4BuN/UwZjKQuY/1v3rM7HMfg==",
      "license": "MIT",
      "dependencies": {
        "define-data-property": "^1.1.4",
        "es-errors": "^1.3.0",
        "function-bind": "^1.1.2",
        "get-intrinsic": "^1.2.4",
        "gopd": "^1.0.1",
        "has-property-descriptors": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/set-function-name": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/set-function-name/-/set-function-name-2.0.2.tgz",
      "integrity": "sha512-7PGFlmtwsEADb0WYyvCMa1t+yke6daIG4Wirafur5kcf+MhUnPms1UeR0CKQdTZD81yESwMHbtn+TR+dMviakQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "define-data-property": "^1.1.4",
        "es-errors": "^1.3.0",
        "functions-have-names": "^1.2.3",
        "has-property-descriptors": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/set-proto": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/set-proto/-/set-proto-1.0.0.tgz",
      "integrity": "sha512-RJRdvCo6IAnPdsvP/7m6bsQqNnn1FCBX5ZNtFL98MmFF/4xAIJTIg1YbHW5DC2W5SKZanrC6i4HsJqlajw/dZw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "dunder-proto": "^1.0.1",
        "es-errors": "^1.3.0",
        "es-object-atoms": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/sha.js": {
      "version": "2.4.12",
      "resolved": "https://registry.npmjs.org/sha.js/-/sha.js-2.4.12.tgz",
      "integrity": "sha512-8LzC5+bvI45BjpfXU8V5fdU2mfeKiQe1D1gIMn7XUlF3OTUrpdJpPPH4EMAnF0DsHHdSZqCdSss5qCmJKuiO3w==",
      "license": "(MIT AND BSD-3-Clause)",
      "dependencies": {
        "inherits": "^2.0.4",
        "safe-buffer": "^5.2.1",
        "to-buffer": "^1.2.0"
      },
      "bin": {
        "sha.js": "bin.js"
      },
      "engines": {
        "node": ">= 0.10"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/shebang-command": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/shebang-command/-/shebang-command-1.2.0.tgz",
      "integrity": "sha512-EV3L1+UQWGor21OmnvojK36mhg+TyIKDh3iFBKBohr5xeXIhNBcx8oWdgkTEEQ+BEFFYdLRuqMfd5L84N1V5Vg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "shebang-regex": "^1.0.0"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/shebang-regex": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/shebang-regex/-/shebang-regex-1.0.0.tgz",
      "integrity": "sha512-wpoSFAxys6b2a2wHZ1XpDSgD7N9iVjg29Ph9uV/uaP9Ex/KXlkTZTeddxDPSYQpgvzKLGJke2UU0AzoGCjNIvQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/shell-quote": {
      "version": "1.8.3",
      "resolved": "https://registry.npmjs.org/shell-quote/-/shell-quote-1.8.3.tgz",
      "integrity": "sha512-ObmnIF4hXNg1BqhnHmgbDETF8dLPCggZWBjkQfhZpbszZnYur5DUljTcCHii5LC3J5E0yeO/1LIMyH+UvHQgyw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/side-channel": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/side-channel/-/side-channel-1.1.0.tgz",
      "integrity": "sha512-ZX99e6tRweoUXqR+VBrslhda51Nh5MTQwou5tnUDgbtyM0dBgmhEDtWGP/xbKn6hqfPRHujUNwz5fy/wbbhnpw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "object-inspect": "^1.13.3",
        "side-channel-list": "^1.0.0",
        "side-channel-map": "^1.0.1",
        "side-channel-weakmap": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/side-channel-list": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/side-channel-list/-/side-channel-list-1.0.1.tgz",
      "integrity": "sha512-mjn/0bi/oUURjc5Xl7IaWi/OJJJumuoJFQJfDDyO46+hBWsfaVM65TBHq2eoZBhzl9EchxOijpkbRC8SVBQU0w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "object-inspect": "^1.13.4"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/side-channel-map": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/side-channel-map/-/side-channel-map-1.0.1.tgz",
      "integrity": "sha512-VCjCNfgMsby3tTdo02nbjtM/ewra6jPHmpThenkTYh8pG9ucZ/1P8So4u4FGBek/BjpOVsDCMoLA/iuBKIFXRA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.5",
        "object-inspect": "^1.13.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/side-channel-weakmap": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/side-channel-weakmap/-/side-channel-weakmap-1.0.2.tgz",
      "integrity": "sha512-WPS/HvHQTYnHisLo9McqBHOJk2FkHO/tlpvldyrnem4aeQp4hai3gythswg6p01oSoTl58rcpiFAjF2br2Ak2A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.5",
        "object-inspect": "^1.13.3",
        "side-channel-map": "^1.0.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/siginfo": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/siginfo/-/siginfo-2.0.0.tgz",
      "integrity": "sha512-ybx0WO1/8bSBLEWXZvEd7gMW3Sn3JFlW3TvX1nREbDLRNQNaeNN8WK0meBwPdAaOI7TtRRRJn/Es1zhrrCHu7g==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/socket.io-client": {
      "version": "4.8.3",
      "resolved": "https://registry.npmjs.org/socket.io-client/-/socket.io-client-4.8.3.tgz",
      "integrity": "sha512-uP0bpjWrjQmUt5DTHq9RuoCBdFJF10cdX9X+a368j/Ft0wmaVgxlrjvK3kjvgCODOMMOz9lcaRzxmso0bTWZ/g==",
      "license": "MIT",
      "dependencies": {
        "@socket.io/component-emitter": "~3.1.0",
        "debug": "~4.4.1",
        "engine.io-client": "~6.6.1",
        "socket.io-parser": "~4.2.4"
      },
      "engines": {
        "node": ">=10.0.0"
      }
    },
    "node_modules/socket.io-parser": {
      "version": "4.2.6",
      "resolved": "https://registry.npmjs.org/socket.io-parser/-/socket.io-parser-4.2.6.tgz",
      "integrity": "sha512-asJqbVBDsBCJx0pTqw3WfesSY0iRX+2xzWEWzrpcH7L6fLzrhyF8WPI8UaeM4YCuDfpwA/cgsdugMsmtz8EJeg==",
      "license": "MIT",
      "dependencies": {
        "@socket.io/component-emitter": "~3.1.0",
        "debug": "~4.4.1"
      },
      "engines": {
        "node": ">=10.0.0"
      }
    },
    "node_modules/sonic-boom": {
      "version": "4.2.1",
      "resolved": "https://registry.npmjs.org/sonic-boom/-/sonic-boom-4.2.1.tgz",
      "integrity": "sha512-w6AxtubXa2wTXAUsZMMWERrsIRAdrK0Sc+FUytWvYAhBJLyuI4llrMIC1DtlNSdI99EI86KZum2MMq3EAZlF9Q==",
      "license": "MIT",
      "dependencies": {
        "atomic-sleep": "^1.0.0"
      }
    },
    "node_modules/source-map-js": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/source-map-js/-/source-map-js-1.2.1.tgz",
      "integrity": "sha512-UXWMKhLOwVKb728IUtQPXxfYU+usdybtUrK/8uGE8CQMvrhOpwvzDBwj0QhSL7MQc7vIsISBG8VQ8+IDQxpfQA==",
      "dev": true,
      "license": "BSD-3-Clause",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/spdx-correct": {
      "version": "3.2.0",
      "resolved": "https://registry.npmjs.org/spdx-correct/-/spdx-correct-3.2.0.tgz",
      "integrity": "sha512-kN9dJbvnySHULIluDHy32WHRUu3Og7B9sbY7tsFLctQkIqnMh3hErYgdMjTYuqmcXX+lK5T1lnUt3G7zNswmZA==",
      "dev": true,
      "license": "Apache-2.0",
      "dependencies": {
        "spdx-expression-parse": "^3.0.0",
        "spdx-license-ids": "^3.0.0"
      }
    },
    "node_modules/spdx-exceptions": {
      "version": "2.5.0",
      "resolved": "https://registry.npmjs.org/spdx-exceptions/-/spdx-exceptions-2.5.0.tgz",
      "integrity": "sha512-PiU42r+xO4UbUS1buo3LPJkjlO7430Xn5SVAhdpzzsPHsjbYVflnnFdATgabnLude+Cqu25p6N+g2lw/PFsa4w==",
      "dev": true,
      "license": "CC-BY-3.0"
    },
    "node_modules/spdx-expression-parse": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/spdx-expression-parse/-/spdx-expression-parse-3.0.1.tgz",
      "integrity": "sha512-cbqHunsQWnJNE6KhVSMsMeH5H/L9EpymbzqTQ3uLwNCLZ1Q481oWaofqH7nO6V07xlXwY6PhQdQ2IedWx/ZK4Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "spdx-exceptions": "^2.1.0",
        "spdx-license-ids": "^3.0.0"
      }
    },
    "node_modules/spdx-license-ids": {
      "version": "3.0.23",
      "resolved": "https://registry.npmjs.org/spdx-license-ids/-/spdx-license-ids-3.0.23.tgz",
      "integrity": "sha512-CWLcCCH7VLu13TgOH+r8p1O/Znwhqv/dbb6lqWy67G+pT1kHmeD/+V36AVb/vq8QMIQwVShJ6Ssl5FPh0fuSdw==",
      "dev": true,
      "license": "CC0-1.0"
    },
    "node_modules/split-on-first": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/split-on-first/-/split-on-first-1.1.0.tgz",
      "integrity": "sha512-43ZssAJaMusuKWL8sKUBQXHWOpq8d6CfN/u1p4gUzfJkM05C8rxTmYrkIPTXapZpORA6LkkzcUulJ8FqA7Uudw==",
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/split2": {
      "version": "4.2.0",
      "resolved": "https://registry.npmjs.org/split2/-/split2-4.2.0.tgz",
      "integrity": "sha512-UcjcJOWknrNkF6PLX83qcHM6KHgVKNkV62Y8a5uYDVv9ydGQVwAHMKqHdJje1VTWpljG0WYpCDhrCdAOYH4TWg==",
      "license": "ISC",
      "engines": {
        "node": ">= 10.x"
      }
    },
    "node_modules/stackback": {
      "version": "0.0.2",
      "resolved": "https://registry.npmjs.org/stackback/-/stackback-0.0.2.tgz",
      "integrity": "sha512-1XMJE5fQo1jGH6Y/7ebnwPOBEkIEnT4QF32d5R1+VXdXveM0IBMJt8zfaxX1P3QhVwrYe+576+jkANtSS2mBbw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/std-env": {
      "version": "3.10.0",
      "resolved": "https://registry.npmjs.org/std-env/-/std-env-3.10.0.tgz",
      "integrity": "sha512-5GS12FdOZNliM5mAOxFRg7Ir0pWz8MdpYm6AY6VPkGpbA7ZzmbzNcBJQ0GPvvyWgcY7QAhCgf9Uy89I03faLkg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/steed": {
      "version": "1.1.3",
      "resolved": "https://registry.npmjs.org/steed/-/steed-1.1.3.tgz",
      "integrity": "sha512-EUkci0FAUiE4IvGTSKcDJIQ/eRUP2JJb56+fvZ4sdnguLTqIdKjSxUe138poW8mkvKWXW2sFPrgTsxqoISnmoA==",
      "license": "MIT",
      "dependencies": {
        "fastfall": "^1.5.0",
        "fastparallel": "^2.2.0",
        "fastq": "^1.3.0",
        "fastseries": "^1.7.0",
        "reusify": "^1.0.0"
      }
    },
    "node_modules/stop-iteration-iterator": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/stop-iteration-iterator/-/stop-iteration-iterator-1.1.0.tgz",
      "integrity": "sha512-eLoXW/DHyl62zxY4SCaIgnRhuMr6ri4juEYARS8E6sCEqzKpOiE521Ucofdx+KnDZl5xmvGYaaKCk5FEOxJCoQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "internal-slot": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/stream-shift": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/stream-shift/-/stream-shift-1.0.3.tgz",
      "integrity": "sha512-76ORR0DO1o1hlKwTbi/DM3EXWGf3ZJYO8cXX5RJwnul2DEg2oyoZyjLNoQM8WsvZiFKCRfC1O0J7iCvie3RZmQ==",
      "license": "MIT"
    },
    "node_modules/strict-uri-encode": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/strict-uri-encode/-/strict-uri-encode-2.0.0.tgz",
      "integrity": "sha512-QwiXZgpRcKkhTj2Scnn++4PKtWsH0kpzZ62L2R6c/LUVYv7hVnZqcg2+sMuT6R7Jusu1vviK/MFsu6kNJfWlEQ==",
      "license": "MIT",
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/string_decoder": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/string_decoder/-/string_decoder-1.3.0.tgz",
      "integrity": "sha512-hkRX8U1WjJFd8LsDJ2yQ/wWWxaopEsABU1XfkM8A+j0+85JAGppt16cr1Whg6KIbb4okU6Mql6BOj+uup/wKeA==",
      "license": "MIT",
      "dependencies": {
        "safe-buffer": "~5.2.0"
      }
    },
    "node_modules/string-width": {
      "version": "4.2.3",
      "resolved": "https://registry.npmjs.org/string-width/-/string-width-4.2.3.tgz",
      "integrity": "sha512-wKyQRQpjJ0sIp62ErSZdGsjMJWsap5oRNihHhu6G7JVO/9jIB6UyevL+tXuOqrng8j/cxKTWyWUwvSTriiZz/g==",
      "license": "MIT",
      "dependencies": {
        "emoji-regex": "^8.0.0",
        "is-fullwidth-code-point": "^3.0.0",
        "strip-ansi": "^6.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/string.prototype.padend": {
      "version": "3.1.6",
      "resolved": "https://registry.npmjs.org/string.prototype.padend/-/string.prototype.padend-3.1.6.tgz",
      "integrity": "sha512-XZpspuSB7vJWhvJc9DLSlrXl1mcA2BdoY5jjnS135ydXqLoqhs96JjDtCkjJEQHvfqZIp9hBuBMgI589peyx9Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.7",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.2",
        "es-object-atoms": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/string.prototype.trim": {
      "version": "1.2.10",
      "resolved": "https://registry.npmjs.org/string.prototype.trim/-/string.prototype.trim-1.2.10.tgz",
      "integrity": "sha512-Rs66F0P/1kedk5lyYyH9uBzuiI/kNRmwJAR9quK6VOtIpZ2G+hMZd+HQbbv25MgCA6gEffoMZYxlTod4WcdrKA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "call-bound": "^1.0.2",
        "define-data-property": "^1.1.4",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.5",
        "es-object-atoms": "^1.0.0",
        "has-property-descriptors": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/string.prototype.trimend": {
      "version": "1.0.9",
      "resolved": "https://registry.npmjs.org/string.prototype.trimend/-/string.prototype.trimend-1.0.9.tgz",
      "integrity": "sha512-G7Ok5C6E/j4SGfyLCloXTrngQIQU3PWtXGst3yM7Bea9FRURf1S42ZHlZZtsNque2FN2PoUhfZXYLNWwEr4dLQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "call-bound": "^1.0.2",
        "define-properties": "^1.2.1",
        "es-object-atoms": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/string.prototype.trimstart": {
      "version": "1.0.8",
      "resolved": "https://registry.npmjs.org/string.prototype.trimstart/-/string.prototype.trimstart-1.0.8.tgz",
      "integrity": "sha512-UXSH262CSZY1tfu3G3Secr6uGLCFVPMhIqHjlgCUtCCcgihYc/xKs9djMTMUOb2j1mVSeU8EU6NWc/iQKU6Gfg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.7",
        "define-properties": "^1.2.1",
        "es-object-atoms": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/strip-ansi": {
      "version": "6.0.1",
      "resolved": "https://registry.npmjs.org/strip-ansi/-/strip-ansi-6.0.1.tgz",
      "integrity": "sha512-Y38VPSHcqkFrCpFnQ9vuSXmquuv5oXOKpGeT6aGrr3o3Gc9AlVa6JBfUSOCnbxGGZF+/0ooI7KrPuUSztUdU5A==",
      "license": "MIT",
      "dependencies": {
        "ansi-regex": "^5.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/strip-bom": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/strip-bom/-/strip-bom-3.0.0.tgz",
      "integrity": "sha512-vavAMRXOgBVNF6nyEEmL3DBK19iRpDcoIwW+swQ+CbGiu7lju6t+JklA1MHweoWtadgt4ISVUsXLyDq34ddcwA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/strip-literal": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/strip-literal/-/strip-literal-3.1.0.tgz",
      "integrity": "sha512-8r3mkIM/2+PpjHoOtiAW8Rg3jJLHaV7xPwG+YRGrv6FP0wwk/toTpATxWYOW0BKdWwl82VT2tFYi5DlROa0Mxg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "js-tokens": "^9.0.1"
      },
      "funding": {
        "url": "https://github.com/sponsors/antfu"
      }
    },
    "node_modules/strip-literal/node_modules/js-tokens": {
      "version": "9.0.1",
      "resolved": "https://registry.npmjs.org/js-tokens/-/js-tokens-9.0.1.tgz",
      "integrity": "sha512-mxa9E9ITFOt0ban3j6L5MpjwegGz6lBQmM1IJkWeBZGcMxto50+eWdjC/52xDbS2vy0k7vIMK0Fe2wfL9OQSpQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/superstruct": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/superstruct/-/superstruct-1.0.4.tgz",
      "integrity": "sha512-7JpaAoX2NGyoFlI9NBh66BQXGONc+uE+MRS5i2iOBKuS4e+ccgMDjATgZldkah+33DakBxDHiss9kvUcGAO8UQ==",
      "license": "MIT",
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/supports-color": {
      "version": "5.5.0",
      "resolved": "https://registry.npmjs.org/supports-color/-/supports-color-5.5.0.tgz",
      "integrity": "sha512-QjVjwdXIt408MIiAqCX4oUKsgU2EqAGzs2Ppkm4aQYbjm+ZEWEcW4SfFNTr4uMNZma0ey4f5lgLrkB0aX0QMow==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "has-flag": "^3.0.0"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/supports-preserve-symlinks-flag": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/supports-preserve-symlinks-flag/-/supports-preserve-symlinks-flag-1.0.0.tgz",
      "integrity": "sha512-ot0WnXS9fgdkgIcePe6RHNk1WA8+muPa6cSjeR3V8K27q9BB1rTE3R1p7Hv0z1ZyAc8s6Vvv8DIyWf681MAt0w==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/thread-stream": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/thread-stream/-/thread-stream-4.0.0.tgz",
      "integrity": "sha512-4iMVL6HAINXWf1ZKZjIPcz5wYaOdPhtO8ATvZ+Xqp3BTdaqtAwQkNmKORqcIo5YkQqGXq5cwfswDwMqqQNrpJA==",
      "license": "MIT",
      "dependencies": {
        "real-require": "^0.2.0"
      },
      "engines": {
        "node": ">=20"
      }
    },
    "node_modules/tinybench": {
      "version": "2.9.0",
      "resolved": "https://registry.npmjs.org/tinybench/-/tinybench-2.9.0.tgz",
      "integrity": "sha512-0+DUvqWMValLmha6lr4kD8iAMK1HzV0/aKnCtWb9v9641TnP/MFb7Pc2bxoxQjTXAErryXVgUOfv2YqNllqGeg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/tinyexec": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/tinyexec/-/tinyexec-1.1.2.tgz",
      "integrity": "sha512-dAqSqE/RabpBKI8+h26GfLq6Vb3JVXs30XYQjdMjaj/c2tS8IYYMbIzP599KtRj7c57/wYApb3QjgRgXmrCukA==",
      "devOptional": true,
      "license": "MIT",
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/tinyglobby": {
      "version": "0.2.16",
      "resolved": "https://registry.npmjs.org/tinyglobby/-/tinyglobby-0.2.16.tgz",
      "integrity": "sha512-pn99VhoACYR8nFHhxqix+uvsbXineAasWm5ojXoN8xEwK5Kd3/TrhNn1wByuD52UxWRLy8pu+kRMniEi6Eq9Zg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "fdir": "^6.5.0",
        "picomatch": "^4.0.4"
      },
      "engines": {
        "node": ">=12.0.0"
      },
      "funding": {
        "url": "https://github.com/sponsors/SuperchupuDev"
      }
    },
    "node_modules/tinypool": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/tinypool/-/tinypool-1.1.1.tgz",
      "integrity": "sha512-Zba82s87IFq9A9XmjiX5uZA/ARWDrB03OHlq+Vw1fSdt0I+4/Kutwy8BP4Y/y/aORMo61FQ0vIb5j44vSo5Pkg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": "^18.0.0 || >=20.0.0"
      }
    },
    "node_modules/tinyrainbow": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/tinyrainbow/-/tinyrainbow-2.0.0.tgz",
      "integrity": "sha512-op4nsTR47R6p0vMUUoYl/a+ljLFVtlfaXkLQmqfLR1qHma1h/ysYk4hEXZ880bf2CYgTskvTa/e196Vd5dDQXw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/tinyspy": {
      "version": "4.0.4",
      "resolved": "https://registry.npmjs.org/tinyspy/-/tinyspy-4.0.4.tgz",
      "integrity": "sha512-azl+t0z7pw/z958Gy9svOTuzqIk6xq+NSheJzn5MMWtWTFywIacg2wUlzKFGtt3cthx0r2SxMK0yzJOR0IES7Q==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/to-buffer": {
      "version": "1.2.2",
      "resolved": "https://registry.npmjs.org/to-buffer/-/to-buffer-1.2.2.tgz",
      "integrity": "sha512-db0E3UJjcFhpDhAF4tLo03oli3pwl3dbnzXOUIlRKrp+ldk/VUxzpWYZENsw2SZiuBjHAk7DfB0VU7NKdpb6sw==",
      "license": "MIT",
      "dependencies": {
        "isarray": "^2.0.5",
        "safe-buffer": "^5.2.1",
        "typed-array-buffer": "^1.0.3"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/toad-cache": {
      "version": "3.7.0",
      "resolved": "https://registry.npmjs.org/toad-cache/-/toad-cache-3.7.0.tgz",
      "integrity": "sha512-/m8M+2BJUpoJdgAHoG+baCwBT+tf2VraSfkBgl0Y00qIWt41DJ8R5B8nsEw0I58YwF5IZH6z24/2TobDKnqSWw==",
      "license": "MIT",
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/tr46": {
      "version": "0.0.3",
      "resolved": "https://registry.npmjs.org/tr46/-/tr46-0.0.3.tgz",
      "integrity": "sha512-N3WMsuqV66lT30CrXNbEjx4GEwlow3v6rr4mCcv6prnfwhS01rkgyFdjPNBYd9br7LpXV1+Emh01fHnq2Gdgrw==",
      "license": "MIT"
    },
    "node_modules/tslib": {
      "version": "2.8.1",
      "resolved": "https://registry.npmjs.org/tslib/-/tslib-2.8.1.tgz",
      "integrity": "sha512-oJFu94HQb+KVduSUQL7wnpmqnfmLsOA/nAh6b6EH0wCEoK0/mPeXU6c3wKDV83MkOuHPRHtSXKKU99IBazS/2w==",
      "license": "0BSD"
    },
    "node_modules/tsx": {
      "version": "4.21.0",
      "resolved": "https://registry.npmjs.org/tsx/-/tsx-4.21.0.tgz",
      "integrity": "sha512-5C1sg4USs1lfG0GFb2RLXsdpXqBSEhAaA/0kPL01wxzpMqLILNxIxIOKiILz+cdg/pLnOUxFYOR5yhHU666wbw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "esbuild": "~0.27.0",
        "get-tsconfig": "^4.7.5"
      },
      "bin": {
        "tsx": "dist/cli.mjs"
      },
      "engines": {
        "node": ">=18.0.0"
      },
      "optionalDependencies": {
        "fsevents": "~2.3.3"
      }
    },
    "node_modules/typed-array-buffer": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/typed-array-buffer/-/typed-array-buffer-1.0.3.tgz",
      "integrity": "sha512-nAYYwfY3qnzX30IkA6AQZjVbtK6duGontcQm1WSG1MD94YLqK0515GNApXkoxKOWMusVssAHWLh9SeaoefYFGw==",
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3",
        "es-errors": "^1.3.0",
        "is-typed-array": "^1.1.14"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/typed-array-byte-length": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/typed-array-byte-length/-/typed-array-byte-length-1.0.3.tgz",
      "integrity": "sha512-BaXgOuIxz8n8pIq3e7Atg/7s+DpiYrxn4vdot3w9KbnBhcRQq6o3xemQdIfynqSeXeDrF32x+WvfzmOjPiY9lg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "for-each": "^0.3.3",
        "gopd": "^1.2.0",
        "has-proto": "^1.2.0",
        "is-typed-array": "^1.1.14"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/typed-array-byte-offset": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/typed-array-byte-offset/-/typed-array-byte-offset-1.0.4.tgz",
      "integrity": "sha512-bTlAFB/FBYMcuX81gbL4OcpH5PmlFHqlCCpAl8AlEzMz5k53oNDvN8p1PNOWLEmI2x4orp3raOFB51tv9X+MFQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "available-typed-arrays": "^1.0.7",
        "call-bind": "^1.0.8",
        "for-each": "^0.3.3",
        "gopd": "^1.2.0",
        "has-proto": "^1.2.0",
        "is-typed-array": "^1.1.15",
        "reflect.getprototypeof": "^1.0.9"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/typed-array-length": {
      "version": "1.0.7",
      "resolved": "https://registry.npmjs.org/typed-array-length/-/typed-array-length-1.0.7.tgz",
      "integrity": "sha512-3KS2b+kL7fsuk/eJZ7EQdnEmQoaho/r6KUef7hxvltNA5DR8NAUM+8wJMbJyZ4G9/7i3v5zPBIMN5aybAh2/Jg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.7",
        "for-each": "^0.3.3",
        "gopd": "^1.0.1",
        "is-typed-array": "^1.1.13",
        "possible-typed-array-names": "^1.0.0",
        "reflect.getprototypeof": "^1.0.6"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/typescript": {
      "version": "5.9.3",
      "resolved": "https://registry.npmjs.org/typescript/-/typescript-5.9.3.tgz",
      "integrity": "sha512-jl1vZzPDinLr9eUt3J/t7V6FgNEw9QjvBPdysz9KfQDD41fQrC2Y4vKQdiaUpFT4bXlb1RHhLpp8wtm6M5TgSw==",
      "devOptional": true,
      "license": "Apache-2.0",
      "bin": {
        "tsc": "bin/tsc",
        "tsserver": "bin/tsserver"
      },
      "engines": {
        "node": ">=14.17"
      }
    },
    "node_modules/ufo": {
      "version": "1.6.4",
      "resolved": "https://registry.npmjs.org/ufo/-/ufo-1.6.4.tgz",
      "integrity": "sha512-JFNbkD1Svwe0KvGi8GOeLcP4kAWQ609twvCdcHxq1oSL8svv39ZuSvajcD8B+5D0eL4+s1Is2D/O6KN3qcTeRA==",
      "license": "MIT"
    },
    "node_modules/uint8arrays": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/uint8arrays/-/uint8arrays-3.1.0.tgz",
      "integrity": "sha512-ei5rfKtoRO8OyOIor2Rz5fhzjThwIHJZ3uyDPnDHTXbP0aMQ1RN/6AI5B5d9dBxJOU+BvOAk7ZQ1xphsX8Lrog==",
      "license": "MIT",
      "dependencies": {
        "multiformats": "^9.4.2"
      }
    },
    "node_modules/unbox-primitive": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/unbox-primitive/-/unbox-primitive-1.1.0.tgz",
      "integrity": "sha512-nWJ91DjeOkej/TA8pXQ3myruKpKEYgqvpw9lz4OPHj/NWFNluYrjbz9j01CJ8yKQd2g4jFoOkINCTW2I5LEEyw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3",
        "has-bigints": "^1.0.2",
        "has-symbols": "^1.1.0",
        "which-boxed-primitive": "^1.1.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/uncrypto": {
      "version": "0.1.3",
      "resolved": "https://registry.npmjs.org/uncrypto/-/uncrypto-0.1.3.tgz",
      "integrity": "sha512-Ql87qFHB3s/De2ClA9e0gsnS6zXG27SkTiSJwjCc9MebbfapQfuPzumMIUMi38ezPZVNFcHI9sUIepeQfw8J8Q==",
      "license": "MIT"
    },
    "node_modules/undici-types": {
      "version": "7.25.0",
      "resolved": "https://registry.npmjs.org/undici-types/-/undici-types-7.25.0.tgz",
      "integrity": "sha512-AXNgS1Byr27fTI+2bsPEkV9CxkT8H6xNyRI68b3TatlZo3RkzlqQBLL+w7SmGPVpokjHbcuNVQUWE7FRTg+LRA==",
      "license": "MIT"
    },
    "node_modules/update-browserslist-db": {
      "version": "1.2.3",
      "resolved": "https://registry.npmjs.org/update-browserslist-db/-/update-browserslist-db-1.2.3.tgz",
      "integrity": "sha512-Js0m9cx+qOgDxo0eMiFGEueWztz+d4+M3rGlmKPT+T4IS/jP4ylw3Nwpu6cpTTP8R1MAC1kF4VbdLt3ARf209w==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/browserslist"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/browserslist"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "escalade": "^3.2.0",
        "picocolors": "^1.1.1"
      },
      "bin": {
        "update-browserslist-db": "cli.js"
      },
      "peerDependencies": {
        "browserslist": ">= 4.21.0"
      }
    },
    "node_modules/use-sync-external-store": {
      "version": "1.4.0",
      "resolved": "https://registry.npmjs.org/use-sync-external-store/-/use-sync-external-store-1.4.0.tgz",
      "integrity": "sha512-9WXSPC5fMv61vaupRkCKCxsPxBocVnwakBEkMIHHpkTTg6icbJtg6jzgtLDm4bl3cSHAca52rYWih0k4K3PfHw==",
      "license": "MIT",
      "peerDependencies": {
        "react": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0"
      }
    },
    "node_modules/utf-8-validate": {
      "version": "5.0.10",
      "resolved": "https://registry.npmjs.org/utf-8-validate/-/utf-8-validate-5.0.10.tgz",
      "integrity": "sha512-Z6czzLq4u8fPOyx7TU6X3dvUZVvoJmxSQ+IcrlmagKhilxlhZgxPK6C5Jqbkw1IDUmFTM+cz9QDnnLTwDz/2gQ==",
      "hasInstallScript": true,
      "license": "MIT",
      "dependencies": {
        "node-gyp-build": "^4.3.0"
      },
      "engines": {
        "node": ">=6.14.2"
      }
    },
    "node_modules/util": {
      "version": "0.12.5",
      "resolved": "https://registry.npmjs.org/util/-/util-0.12.5.tgz",
      "integrity": "sha512-kZf/K6hEIrWHI6XqOFUiiMa+79wE/D8Q+NCNAWclkyg3b4d2k7s0QGepNjiABc+aR3N1PAyHL7p6UcLY6LmrnA==",
      "license": "MIT",
      "dependencies": {
        "inherits": "^2.0.3",
        "is-arguments": "^1.0.4",
        "is-generator-function": "^1.0.7",
        "is-typed-array": "^1.1.3",
        "which-typed-array": "^1.1.2"
      }
    },
    "node_modules/util-deprecate": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/util-deprecate/-/util-deprecate-1.0.2.tgz",
      "integrity": "sha512-EPD5q1uXyFxJpCrLnCc1nHnq3gOa6DZBocAIiI2TaSCA7VCJ1UJDMagCzIkXNsUYfD1daK//LTEQ8xiIbrHtcw==",
      "license": "MIT"
    },
    "node_modules/uuid": {
      "version": "8.3.2",
      "resolved": "https://registry.npmjs.org/uuid/-/uuid-8.3.2.tgz",
      "integrity": "sha512-+NYs2QeMWy+GWFOEm9xnn6HCDp0l7QBD7ml8zLUmJ+93Q5NF0NocErnwkTkXVFNiX3/fpC6afS8Dhb/gz7R7eg==",
      "deprecated": "uuid@10 and below is no longer supported.  For ESM codebases, update to uuid@latest.  For CommonJS codebases, use uuid@11 (but be aware this version will likely be deprecated in 2028).",
      "license": "MIT",
      "bin": {
        "uuid": "dist/bin/uuid"
      }
    },
    "node_modules/validate-npm-package-license": {
      "version": "3.0.4",
      "resolved": "https://registry.npmjs.org/validate-npm-package-license/-/validate-npm-package-license-3.0.4.tgz",
      "integrity": "sha512-DpKm2Ui/xN7/HQKCtpZxoRWBhZ9Z0kqtygG8XCgNQ8ZlDnxuQmWhj566j8fN4Cu3/JmbhsDo7fcAJq4s9h27Ew==",
      "dev": true,
      "license": "Apache-2.0",
      "dependencies": {
        "spdx-correct": "^3.0.0",
        "spdx-expression-parse": "^3.0.0"
      }
    },
    "node_modules/valtio": {
      "version": "1.13.2",
      "resolved": "https://registry.npmjs.org/valtio/-/valtio-1.13.2.tgz",
      "integrity": "sha512-Qik0o+DSy741TmkqmRfjq+0xpZBXi/Y6+fXZLn0xNF1z/waFMbE3rkivv5Zcf9RrMUp6zswf2J7sbh2KBlba5A==",
      "license": "MIT",
      "dependencies": {
        "derive-valtio": "0.1.0",
        "proxy-compare": "2.6.0",
        "use-sync-external-store": "1.2.0"
      },
      "engines": {
        "node": ">=12.20.0"
      },
      "peerDependencies": {
        "@types/react": ">=16.8",
        "react": ">=16.8"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "react": {
          "optional": true
        }
      }
    },
    "node_modules/valtio/node_modules/use-sync-external-store": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/use-sync-external-store/-/use-sync-external-store-1.2.0.tgz",
      "integrity": "sha512-eEgnFxGQ1Ife9bzYs6VLi8/4X6CObHMw9Qr9tPY43iKwsPw8xE8+EFsf/2cFZ5S3esXgpWgtSCtLNS41F+sKPA==",
      "license": "MIT",
      "peerDependencies": {
        "react": "^16.8.0 || ^17.0.0 || ^18.0.0"
      }
    },
    "node_modules/viem": {
      "version": "2.48.8",
      "resolved": "https://registry.npmjs.org/viem/-/viem-2.48.8.tgz",
      "integrity": "sha512-Xj3Nrt66SKtn06kczU91ELn9Difr84ZM5A62BTlaisT5lpgt058i2mBkfMZCXHGb1ocOLjzC2ztPhD0Lvky7uQ==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/wevm"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "@noble/curves": "1.9.1",
        "@noble/hashes": "1.8.0",
        "@scure/bip32": "1.7.0",
        "@scure/bip39": "1.6.0",
        "abitype": "1.2.3",
        "isows": "1.0.7",
        "ox": "0.14.20",
        "ws": "8.18.3"
      },
      "peerDependencies": {
        "typescript": ">=5.0.4"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/viem/node_modules/@noble/ciphers": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/@noble/ciphers/-/ciphers-1.3.0.tgz",
      "integrity": "sha512-2I0gnIVPtfnMw9ee9h1dJG7tp81+8Ob3OJb3Mv37rx5L40/b0i7djjCVvGOVqc9AEIQyvyu1i6ypKdFw8R8gQw==",
      "license": "MIT",
      "engines": {
        "node": "^14.21.3 || >=16"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/viem/node_modules/@noble/curves": {
      "version": "1.9.1",
      "resolved": "https://registry.npmjs.org/@noble/curves/-/curves-1.9.1.tgz",
      "integrity": "sha512-k11yZxZg+t+gWvBbIswW0yoJlu8cHOC7dhunwOzoWH/mXGBiYyR4YY6hAEK/3EUs4UpB8la1RfdRpeGsFHkWsA==",
      "license": "MIT",
      "dependencies": {
        "@noble/hashes": "1.8.0"
      },
      "engines": {
        "node": "^14.21.3 || >=16"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/viem/node_modules/abitype": {
      "version": "1.2.3",
      "resolved": "https://registry.npmjs.org/abitype/-/abitype-1.2.3.tgz",
      "integrity": "sha512-Ofer5QUnuUdTFsBRwARMoWKOH1ND5ehwYhJ3OJ/BQO+StkwQjHw0XyVh4vDttzHB7QOFhPHa/o413PJ82gU/Tg==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/wevm"
      },
      "peerDependencies": {
        "typescript": ">=5.0.4",
        "zod": "^3.22.0 || ^4.0.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        },
        "zod": {
          "optional": true
        }
      }
    },
    "node_modules/viem/node_modules/ox": {
      "version": "0.14.20",
      "resolved": "https://registry.npmjs.org/ox/-/ox-0.14.20.tgz",
      "integrity": "sha512-rby38C3nDn8eQkf29Zgw4hkCZJ64Qqi0zRPWL8ENUQ7JVuoITqrVtwWQgM/He19SCMUEc7hS/Sjw0jIOSLJhOw==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/wevm"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "@adraffy/ens-normalize": "^1.11.0",
        "@noble/ciphers": "^1.3.0",
        "@noble/curves": "1.9.1",
        "@noble/hashes": "^1.8.0",
        "@scure/bip32": "^1.7.0",
        "@scure/bip39": "^1.6.0",
        "abitype": "^1.2.3",
        "eventemitter3": "5.0.1"
      },
      "peerDependencies": {
        "typescript": ">=5.4.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/viem/node_modules/ws": {
      "version": "8.18.3",
      "resolved": "https://registry.npmjs.org/ws/-/ws-8.18.3.tgz",
      "integrity": "sha512-PEIGCY5tSlUt50cqyMXfCzX+oOPqN0vuGqWzbcJ2xvnkzkq46oOpz7dQaTDBdfICb4N14+GARUDw2XV2N4tvzg==",
      "license": "MIT",
      "engines": {
        "node": ">=10.0.0"
      },
      "peerDependencies": {
        "bufferutil": "^4.0.1",
        "utf-8-validate": ">=5.0.2"
      },
      "peerDependenciesMeta": {
        "bufferutil": {
          "optional": true
        },
        "utf-8-validate": {
          "optional": true
        }
      }
    },
    "node_modules/vite": {
      "version": "6.4.2",
      "resolved": "https://registry.npmjs.org/vite/-/vite-6.4.2.tgz",
      "integrity": "sha512-2N/55r4JDJ4gdrCvGgINMy+HH3iRpNIz8K6SFwVsA+JbQScLiC+clmAxBgwiSPgcG9U15QmvqCGWzMbqda5zGQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "esbuild": "^0.25.0",
        "fdir": "^6.4.4",
        "picomatch": "^4.0.2",
        "postcss": "^8.5.3",
        "rollup": "^4.34.9",
        "tinyglobby": "^0.2.13"
      },
      "bin": {
        "vite": "bin/vite.js"
      },
      "engines": {
        "node": "^18.0.0 || ^20.0.0 || >=22.0.0"
      },
      "funding": {
        "url": "https://github.com/vitejs/vite?sponsor=1"
      },
      "optionalDependencies": {
        "fsevents": "~2.3.3"
      },
      "peerDependencies": {
        "@types/node": "^18.0.0 || ^20.0.0 || >=22.0.0",
        "jiti": ">=1.21.0",
        "less": "*",
        "lightningcss": "^1.21.0",
        "sass": "*",
        "sass-embedded": "*",
        "stylus": "*",
        "sugarss": "*",
        "terser": "^5.16.0",
        "tsx": "^4.8.1",
        "yaml": "^2.4.2"
      },
      "peerDependenciesMeta": {
        "@types/node": {
          "optional": true
        },
        "jiti": {
          "optional": true
        },
        "less": {
          "optional": true
        },
        "lightningcss": {
          "optional": true
        },
        "sass": {
          "optional": true
        },
        "sass-embedded": {
          "optional": true
        },
        "stylus": {
          "optional": true
        },
        "sugarss": {
          "optional": true
        },
        "terser": {
          "optional": true
        },
        "tsx": {
          "optional": true
        },
        "yaml": {
          "optional": true
        }
      }
    },
    "node_modules/vite-node": {
      "version": "3.2.4",
      "resolved": "https://registry.npmjs.org/vite-node/-/vite-node-3.2.4.tgz",
      "integrity": "sha512-EbKSKh+bh1E1IFxeO0pg1n4dvoOTt0UDiXMd/qn++r98+jPO1xtJilvXldeuQ8giIB5IkpjCgMleHMNEsGH6pg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "cac": "^6.7.14",
        "debug": "^4.4.1",
        "es-module-lexer": "^1.7.0",
        "pathe": "^2.0.3",
        "vite": "^5.0.0 || ^6.0.0 || ^7.0.0-0"
      },
      "bin": {
        "vite-node": "vite-node.mjs"
      },
      "engines": {
        "node": "^18.0.0 || ^20.0.0 || >=22.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/vitest"
      }
    },
    "node_modules/vite/node_modules/@esbuild/aix-ppc64": {
      "version": "0.25.12",
      "resolved": "https://registry.npmjs.org/@esbuild/aix-ppc64/-/aix-ppc64-0.25.12.tgz",
      "integrity": "sha512-Hhmwd6CInZ3dwpuGTF8fJG6yoWmsToE+vYgD4nytZVxcu1ulHpUQRAB1UJ8+N1Am3Mz4+xOByoQoSZf4D+CpkA==",
      "cpu": [
        "ppc64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "aix"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/vite/node_modules/@esbuild/android-arm": {
      "version": "0.25.12",
      "resolved": "https://registry.npmjs.org/@esbuild/android-arm/-/android-arm-0.25.12.tgz",
      "integrity": "sha512-VJ+sKvNA/GE7Ccacc9Cha7bpS8nyzVv0jdVgwNDaR4gDMC/2TTRc33Ip8qrNYUcpkOHUT5OZ0bUcNNVZQ9RLlg==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/vite/node_modules/@esbuild/android-arm64": {
      "version": "0.25.12",
      "resolved": "https://registry.npmjs.org/@esbuild/android-arm64/-/android-arm64-0.25.12.tgz",
      "integrity": "sha512-6AAmLG7zwD1Z159jCKPvAxZd4y/VTO0VkprYy+3N2FtJ8+BQWFXU+OxARIwA46c5tdD9SsKGZ/1ocqBS/gAKHg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/vite/node_modules/@esbuild/android-x64": {
      "version": "0.25.12",
      "resolved": "https://registry.npmjs.org/@esbuild/android-x64/-/android-x64-0.25.12.tgz",
      "integrity": "sha512-5jbb+2hhDHx5phYR2By8GTWEzn6I9UqR11Kwf22iKbNpYrsmRB18aX/9ivc5cabcUiAT/wM+YIZ6SG9QO6a8kg==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/vite/node_modules/@esbuild/darwin-arm64": {
      "version": "0.25.12",
      "resolved": "https://registry.npmjs.org/@esbuild/darwin-arm64/-/darwin-arm64-0.25.12.tgz",
      "integrity": "sha512-N3zl+lxHCifgIlcMUP5016ESkeQjLj/959RxxNYIthIg+CQHInujFuXeWbWMgnTo4cp5XVHqFPmpyu9J65C1Yg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/vite/node_modules/@esbuild/darwin-x64": {
      "version": "0.25.12",
      "resolved": "https://registry.npmjs.org/@esbuild/darwin-x64/-/darwin-x64-0.25.12.tgz",
      "integrity": "sha512-HQ9ka4Kx21qHXwtlTUVbKJOAnmG1ipXhdWTmNXiPzPfWKpXqASVcWdnf2bnL73wgjNrFXAa3yYvBSd9pzfEIpA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/vite/node_modules/@esbuild/freebsd-arm64": {
      "version": "0.25.12",
      "resolved": "https://registry.npmjs.org/@esbuild/freebsd-arm64/-/freebsd-arm64-0.25.12.tgz",
      "integrity": "sha512-gA0Bx759+7Jve03K1S0vkOu5Lg/85dou3EseOGUes8flVOGxbhDDh/iZaoek11Y8mtyKPGF3vP8XhnkDEAmzeg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/vite/node_modules/@esbuild/freebsd-x64": {
      "version": "0.25.12",
      "resolved": "https://registry.npmjs.org/@esbuild/freebsd-x64/-/freebsd-x64-0.25.12.tgz",
      "integrity": "sha512-TGbO26Yw2xsHzxtbVFGEXBFH0FRAP7gtcPE7P5yP7wGy7cXK2oO7RyOhL5NLiqTlBh47XhmIUXuGciXEqYFfBQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/vite/node_modules/@esbuild/linux-arm": {
      "version": "0.25.12",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-arm/-/linux-arm-0.25.12.tgz",
      "integrity": "sha512-lPDGyC1JPDou8kGcywY0YILzWlhhnRjdof3UlcoqYmS9El818LLfJJc3PXXgZHrHCAKs/Z2SeZtDJr5MrkxtOw==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/vite/node_modules/@esbuild/linux-arm64": {
      "version": "0.25.12",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-arm64/-/linux-arm64-0.25.12.tgz",
      "integrity": "sha512-8bwX7a8FghIgrupcxb4aUmYDLp8pX06rGh5HqDT7bB+8Rdells6mHvrFHHW2JAOPZUbnjUpKTLg6ECyzvas2AQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/vite/node_modules/@esbuild/linux-ia32": {
      "version": "0.25.12",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-ia32/-/linux-ia32-0.25.12.tgz",
      "integrity": "sha512-0y9KrdVnbMM2/vG8KfU0byhUN+EFCny9+8g202gYqSSVMonbsCfLjUO+rCci7pM0WBEtz+oK/PIwHkzxkyharA==",
      "cpu": [
        "ia32"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/vite/node_modules/@esbuild/linux-loong64": {
      "version": "0.25.12",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-loong64/-/linux-loong64-0.25.12.tgz",
      "integrity": "sha512-h///Lr5a9rib/v1GGqXVGzjL4TMvVTv+s1DPoxQdz7l/AYv6LDSxdIwzxkrPW438oUXiDtwM10o9PmwS/6Z0Ng==",
      "cpu": [
        "loong64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/vite/node_modules/@esbuild/linux-mips64el": {
      "version": "0.25.12",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-mips64el/-/linux-mips64el-0.25.12.tgz",
      "integrity": "sha512-iyRrM1Pzy9GFMDLsXn1iHUm18nhKnNMWscjmp4+hpafcZjrr2WbT//d20xaGljXDBYHqRcl8HnxbX6uaA/eGVw==",
      "cpu": [
        "mips64el"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/vite/node_modules/@esbuild/linux-ppc64": {
      "version": "0.25.12",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-ppc64/-/linux-ppc64-0.25.12.tgz",
      "integrity": "sha512-9meM/lRXxMi5PSUqEXRCtVjEZBGwB7P/D4yT8UG/mwIdze2aV4Vo6U5gD3+RsoHXKkHCfSxZKzmDssVlRj1QQA==",
      "cpu": [
        "ppc64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/vite/node_modules/@esbuild/linux-riscv64": {
      "version": "0.25.12",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-riscv64/-/linux-riscv64-0.25.12.tgz",
      "integrity": "sha512-Zr7KR4hgKUpWAwb1f3o5ygT04MzqVrGEGXGLnj15YQDJErYu/BGg+wmFlIDOdJp0PmB0lLvxFIOXZgFRrdjR0w==",
      "cpu": [
        "riscv64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/vite/node_modules/@esbuild/linux-s390x": {
      "version": "0.25.12",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-s390x/-/linux-s390x-0.25.12.tgz",
      "integrity": "sha512-MsKncOcgTNvdtiISc/jZs/Zf8d0cl/t3gYWX8J9ubBnVOwlk65UIEEvgBORTiljloIWnBzLs4qhzPkJcitIzIg==",
      "cpu": [
        "s390x"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/vite/node_modules/@esbuild/linux-x64": {
      "version": "0.25.12",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-x64/-/linux-x64-0.25.12.tgz",
      "integrity": "sha512-uqZMTLr/zR/ed4jIGnwSLkaHmPjOjJvnm6TVVitAa08SLS9Z0VM8wIRx7gWbJB5/J54YuIMInDquWyYvQLZkgw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/vite/node_modules/@esbuild/netbsd-arm64": {
      "version": "0.25.12",
      "resolved": "https://registry.npmjs.org/@esbuild/netbsd-arm64/-/netbsd-arm64-0.25.12.tgz",
      "integrity": "sha512-xXwcTq4GhRM7J9A8Gv5boanHhRa/Q9KLVmcyXHCTaM4wKfIpWkdXiMog/KsnxzJ0A1+nD+zoecuzqPmCRyBGjg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "netbsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/vite/node_modules/@esbuild/netbsd-x64": {
      "version": "0.25.12",
      "resolved": "https://registry.npmjs.org/@esbuild/netbsd-x64/-/netbsd-x64-0.25.12.tgz",
      "integrity": "sha512-Ld5pTlzPy3YwGec4OuHh1aCVCRvOXdH8DgRjfDy/oumVovmuSzWfnSJg+VtakB9Cm0gxNO9BzWkj6mtO1FMXkQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "netbsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/vite/node_modules/@esbuild/openbsd-arm64": {
      "version": "0.25.12",
      "resolved": "https://registry.npmjs.org/@esbuild/openbsd-arm64/-/openbsd-arm64-0.25.12.tgz",
      "integrity": "sha512-fF96T6KsBo/pkQI950FARU9apGNTSlZGsv1jZBAlcLL1MLjLNIWPBkj5NlSz8aAzYKg+eNqknrUJ24QBybeR5A==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "openbsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/vite/node_modules/@esbuild/openbsd-x64": {
      "version": "0.25.12",
      "resolved": "https://registry.npmjs.org/@esbuild/openbsd-x64/-/openbsd-x64-0.25.12.tgz",
      "integrity": "sha512-MZyXUkZHjQxUvzK7rN8DJ3SRmrVrke8ZyRusHlP+kuwqTcfWLyqMOE3sScPPyeIXN/mDJIfGXvcMqCgYKekoQw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "openbsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/vite/node_modules/@esbuild/openharmony-arm64": {
      "version": "0.25.12",
      "resolved": "https://registry.npmjs.org/@esbuild/openharmony-arm64/-/openharmony-arm64-0.25.12.tgz",
      "integrity": "sha512-rm0YWsqUSRrjncSXGA7Zv78Nbnw4XL6/dzr20cyrQf7ZmRcsovpcRBdhD43Nuk3y7XIoW2OxMVvwuRvk9XdASg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "openharmony"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/vite/node_modules/@esbuild/sunos-x64": {
      "version": "0.25.12",
      "resolved": "https://registry.npmjs.org/@esbuild/sunos-x64/-/sunos-x64-0.25.12.tgz",
      "integrity": "sha512-3wGSCDyuTHQUzt0nV7bocDy72r2lI33QL3gkDNGkod22EsYl04sMf0qLb8luNKTOmgF/eDEDP5BFNwoBKH441w==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "sunos"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/vite/node_modules/@esbuild/win32-arm64": {
      "version": "0.25.12",
      "resolved": "https://registry.npmjs.org/@esbuild/win32-arm64/-/win32-arm64-0.25.12.tgz",
      "integrity": "sha512-rMmLrur64A7+DKlnSuwqUdRKyd3UE7oPJZmnljqEptesKM8wx9J8gx5u0+9Pq0fQQW8vqeKebwNXdfOyP+8Bsg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/vite/node_modules/@esbuild/win32-ia32": {
      "version": "0.25.12",
      "resolved": "https://registry.npmjs.org/@esbuild/win32-ia32/-/win32-ia32-0.25.12.tgz",
      "integrity": "sha512-HkqnmmBoCbCwxUKKNPBixiWDGCpQGVsrQfJoVGYLPT41XWF8lHuE5N6WhVia2n4o5QK5M4tYr21827fNhi4byQ==",
      "cpu": [
        "ia32"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/vite/node_modules/@esbuild/win32-x64": {
      "version": "0.25.12",
      "resolved": "https://registry.npmjs.org/@esbuild/win32-x64/-/win32-x64-0.25.12.tgz",
      "integrity": "sha512-alJC0uCZpTFrSL0CCDjcgleBXPnCrEAhTBILpeAp7M/OFgoqtAetfBzX0xM00MUsVVPpVjlPuMbREqnZCXaTnA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/vite/node_modules/esbuild": {
      "version": "0.25.12",
      "resolved": "https://registry.npmjs.org/esbuild/-/esbuild-0.25.12.tgz",
      "integrity": "sha512-bbPBYYrtZbkt6Os6FiTLCTFxvq4tt3JKall1vRwshA3fdVztsLAatFaZobhkBC8/BrPetoa0oksYoKXoG4ryJg==",
      "dev": true,
      "hasInstallScript": true,
      "license": "MIT",
      "bin": {
        "esbuild": "bin/esbuild"
      },
      "engines": {
        "node": ">=18"
      },
      "optionalDependencies": {
        "@esbuild/aix-ppc64": "0.25.12",
        "@esbuild/android-arm": "0.25.12",
        "@esbuild/android-arm64": "0.25.12",
        "@esbuild/android-x64": "0.25.12",
        "@esbuild/darwin-arm64": "0.25.12",
        "@esbuild/darwin-x64": "0.25.12",
        "@esbuild/freebsd-arm64": "0.25.12",
        "@esbuild/freebsd-x64": "0.25.12",
        "@esbuild/linux-arm": "0.25.12",
        "@esbuild/linux-arm64": "0.25.12",
        "@esbuild/linux-ia32": "0.25.12",
        "@esbuild/linux-loong64": "0.25.12",
        "@esbuild/linux-mips64el": "0.25.12",
        "@esbuild/linux-ppc64": "0.25.12",
        "@esbuild/linux-riscv64": "0.25.12",
        "@esbuild/linux-s390x": "0.25.12",
        "@esbuild/linux-x64": "0.25.12",
        "@esbuild/netbsd-arm64": "0.25.12",
        "@esbuild/netbsd-x64": "0.25.12",
        "@esbuild/openbsd-arm64": "0.25.12",
        "@esbuild/openbsd-x64": "0.25.12",
        "@esbuild/openharmony-arm64": "0.25.12",
        "@esbuild/sunos-x64": "0.25.12",
        "@esbuild/win32-arm64": "0.25.12",
        "@esbuild/win32-ia32": "0.25.12",
        "@esbuild/win32-x64": "0.25.12"
      }
    },
    "node_modules/vitest": {
      "version": "3.2.4",
      "resolved": "https://registry.npmjs.org/vitest/-/vitest-3.2.4.tgz",
      "integrity": "sha512-LUCP5ev3GURDysTWiP47wRRUpLKMOfPh+yKTx3kVIEiu5KOMeqzpnYNsKyOoVrULivR8tLcks4+lga33Whn90A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/chai": "^5.2.2",
        "@vitest/expect": "3.2.4",
        "@vitest/mocker": "3.2.4",
        "@vitest/pretty-format": "^3.2.4",
        "@vitest/runner": "3.2.4",
        "@vitest/snapshot": "3.2.4",
        "@vitest/spy": "3.2.4",
        "@vitest/utils": "3.2.4",
        "chai": "^5.2.0",
        "debug": "^4.4.1",
        "expect-type": "^1.2.1",
        "magic-string": "^0.30.17",
        "pathe": "^2.0.3",
        "picomatch": "^4.0.2",
        "std-env": "^3.9.0",
        "tinybench": "^2.9.0",
        "tinyexec": "^0.3.2",
        "tinyglobby": "^0.2.14",
        "tinypool": "^1.1.1",
        "tinyrainbow": "^2.0.0",
        "vite": "^5.0.0 || ^6.0.0 || ^7.0.0-0",
        "vite-node": "3.2.4",
        "why-is-node-running": "^2.3.0"
      },
      "bin": {
        "vitest": "vitest.mjs"
      },
      "engines": {
        "node": "^18.0.0 || ^20.0.0 || >=22.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/vitest"
      },
      "peerDependencies": {
        "@edge-runtime/vm": "*",
        "@types/debug": "^4.1.12",
        "@types/node": "^18.0.0 || ^20.0.0 || >=22.0.0",
        "@vitest/browser": "3.2.4",
        "@vitest/ui": "3.2.4",
        "happy-dom": "*",
        "jsdom": "*"
      },
      "peerDependenciesMeta": {
        "@edge-runtime/vm": {
          "optional": true
        },
        "@types/debug": {
          "optional": true
        },
        "@types/node": {
          "optional": true
        },
        "@vitest/browser": {
          "optional": true
        },
        "@vitest/ui": {
          "optional": true
        },
        "happy-dom": {
          "optional": true
        },
        "jsdom": {
          "optional": true
        }
      }
    },
    "node_modules/vitest/node_modules/tinyexec": {
      "version": "0.3.2",
      "resolved": "https://registry.npmjs.org/tinyexec/-/tinyexec-0.3.2.tgz",
      "integrity": "sha512-KQQR9yN7R5+OSwaK0XQoj22pwHoTlgYqmUscPYoknOoWCWfj/5/ABTMRi69FrKU5ffPVh5QcFikpWJI/P1ocHA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/wagmi": {
      "version": "2.19.5",
      "resolved": "https://registry.npmjs.org/wagmi/-/wagmi-2.19.5.tgz",
      "integrity": "sha512-RQUfKMv6U+EcSNNGiPbdkDtJwtuFxZWLmvDiQmjjBgkuPulUwDJsKhi7gjynzJdsx2yDqhHCXkKsbbfbIsHfcQ==",
      "license": "MIT",
      "dependencies": {
        "@wagmi/connectors": "6.2.0",
        "@wagmi/core": "2.22.1",
        "use-sync-external-store": "1.4.0"
      },
      "funding": {
        "url": "https://github.com/sponsors/wevm"
      },
      "peerDependencies": {
        "@tanstack/react-query": ">=5.0.0",
        "react": ">=18",
        "typescript": ">=5.0.4",
        "viem": "2.x"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/webextension-polyfill": {
      "version": "0.10.0",
      "resolved": "https://registry.npmjs.org/webextension-polyfill/-/webextension-polyfill-0.10.0.tgz",
      "integrity": "sha512-c5s35LgVa5tFaHhrZDnr3FpQpjj1BB+RXhLTYUxGqBVN460HkbM8TBtEqdXWbpTKfzwCcjAZVF7zXCYSKtcp9g==",
      "license": "MPL-2.0"
    },
    "node_modules/webidl-conversions": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/webidl-conversions/-/webidl-conversions-3.0.1.tgz",
      "integrity": "sha512-2JAn3z8AR6rjK8Sm8orRC0h/bcl/DqL7tRPdGZ4I1CjdF+EaMLmYxBHyXuKL849eucPFhvBoxMsflfOb8kxaeQ==",
      "license": "BSD-2-Clause"
    },
    "node_modules/whatwg-url": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/whatwg-url/-/whatwg-url-5.0.0.tgz",
      "integrity": "sha512-saE57nupxk6v3HY35+jzBwYa0rKSy0XR8JSxZPwgLr7ys0IBzhGviA1/TUGJLmSVqs8pb9AnvICXEuOHLprYTw==",
      "license": "MIT",
      "dependencies": {
        "tr46": "~0.0.3",
        "webidl-conversions": "^3.0.0"
      }
    },
    "node_modules/which": {
      "version": "1.3.1",
      "resolved": "https://registry.npmjs.org/which/-/which-1.3.1.tgz",
      "integrity": "sha512-HxJdYWq1MTIQbJ3nw0cqssHoTNU267KlrDuGZ1WYlxDStUtKUhOaJmh112/TZmHxxUfuJqPXSOm7tDyas0OSIQ==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "isexe": "^2.0.0"
      },
      "bin": {
        "which": "bin/which"
      }
    },
    "node_modules/which-boxed-primitive": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/which-boxed-primitive/-/which-boxed-primitive-1.1.1.tgz",
      "integrity": "sha512-TbX3mj8n0odCBFVlY8AxkqcHASw3L60jIuF8jFP78az3C2YhmGvqbHBpAjTRH2/xqYunrJ9g1jSyjCjpoWzIAA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "is-bigint": "^1.1.0",
        "is-boolean-object": "^1.2.1",
        "is-number-object": "^1.1.1",
        "is-string": "^1.1.1",
        "is-symbol": "^1.1.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/which-builtin-type": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/which-builtin-type/-/which-builtin-type-1.2.1.tgz",
      "integrity": "sha512-6iBczoX+kDQ7a3+YJBnh3T+KZRxM/iYNPXicqk66/Qfm1b93iu+yOImkg0zHbj5LNOcNv1TEADiZ0xa34B4q6Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "function.prototype.name": "^1.1.6",
        "has-tostringtag": "^1.0.2",
        "is-async-function": "^2.0.0",
        "is-date-object": "^1.1.0",
        "is-finalizationregistry": "^1.1.0",
        "is-generator-function": "^1.0.10",
        "is-regex": "^1.2.1",
        "is-weakref": "^1.0.2",
        "isarray": "^2.0.5",
        "which-boxed-primitive": "^1.1.0",
        "which-collection": "^1.0.2",
        "which-typed-array": "^1.1.16"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/which-collection": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/which-collection/-/which-collection-1.0.2.tgz",
      "integrity": "sha512-K4jVyjnBdgvc86Y6BkaLZEN933SwYOuBFkdmBu9ZfkcAbdVbpITnDmjvZ/aQjRXQrv5EPkTnD1s39GiiqbngCw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "is-map": "^2.0.3",
        "is-set": "^2.0.3",
        "is-weakmap": "^2.0.2",
        "is-weakset": "^2.0.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/which-module": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/which-module/-/which-module-2.0.1.tgz",
      "integrity": "sha512-iBdZ57RDvnOR9AGBhML2vFZf7h8vmBjhoaZqODJBFWHVtKkDmKuHai3cx5PgVMrX5YDNp27AofYbAwctSS+vhQ==",
      "license": "ISC"
    },
    "node_modules/which-typed-array": {
      "version": "1.1.20",
      "resolved": "https://registry.npmjs.org/which-typed-array/-/which-typed-array-1.1.20.tgz",
      "integrity": "sha512-LYfpUkmqwl0h9A2HL09Mms427Q1RZWuOHsukfVcKRq9q95iQxdw0ix1JQrqbcDR9PH1QDwf5Qo8OZb5lksZ8Xg==",
      "license": "MIT",
      "dependencies": {
        "available-typed-arrays": "^1.0.7",
        "call-bind": "^1.0.8",
        "call-bound": "^1.0.4",
        "for-each": "^0.3.5",
        "get-proto": "^1.0.1",
        "gopd": "^1.2.0",
        "has-tostringtag": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/why-is-node-running": {
      "version": "2.3.0",
      "resolved": "https://registry.npmjs.org/why-is-node-running/-/why-is-node-running-2.3.0.tgz",
      "integrity": "sha512-hUrmaWBdVDcxvYqnyh09zunKzROWjbZTiNy8dBEjkS7ehEDQibXJ7XvlmtbwuTclUiIyN+CyXQD4Vmko8fNm8w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "siginfo": "^2.0.0",
        "stackback": "0.0.2"
      },
      "bin": {
        "why-is-node-running": "cli.js"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/wrap-ansi": {
      "version": "6.2.0",
      "resolved": "https://registry.npmjs.org/wrap-ansi/-/wrap-ansi-6.2.0.tgz",
      "integrity": "sha512-r6lPcBGxZXlIcymEu7InxDMhdW0KDxpLgoFLcguasxCaJ/SOIZwINatK9KY/tf+ZrlywOKU0UDj3ATXUBfxJXA==",
      "license": "MIT",
      "dependencies": {
        "ansi-styles": "^4.0.0",
        "string-width": "^4.1.0",
        "strip-ansi": "^6.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/wrap-ansi/node_modules/ansi-styles": {
      "version": "4.3.0",
      "resolved": "https://registry.npmjs.org/ansi-styles/-/ansi-styles-4.3.0.tgz",
      "integrity": "sha512-zbB9rCJAT1rbjiVDb2hqKFHNYLxgtk8NURxZ3IZwD3F6NtxbXZQCnnSi1Lkx+IDohdPlFp222wVALIheZJQSEg==",
      "license": "MIT",
      "dependencies": {
        "color-convert": "^2.0.1"
      },
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/chalk/ansi-styles?sponsor=1"
      }
    },
    "node_modules/wrap-ansi/node_modules/color-convert": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/color-convert/-/color-convert-2.0.1.tgz",
      "integrity": "sha512-RRECPsj7iu/xb5oKYcsFHSppFNnsj/52OVTRKb4zP5onXwVF3zVmmToNcOfGC+CRDpfK/U584fMg38ZHCaElKQ==",
      "license": "MIT",
      "dependencies": {
        "color-name": "~1.1.4"
      },
      "engines": {
        "node": ">=7.0.0"
      }
    },
    "node_modules/wrap-ansi/node_modules/color-name": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/color-name/-/color-name-1.1.4.tgz",
      "integrity": "sha512-dOy+3AuW3a2wNbZHIuMZpTcgjGuLU/uBL/ubcZF9OXbDo8ff4O8yVp5Bf0efS8uEoYo5q4Fx7dY9OgQGXgAsQA==",
      "license": "MIT"
    },
    "node_modules/wrappy": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/wrappy/-/wrappy-1.0.2.tgz",
      "integrity": "sha512-l4Sp/DRseor9wL6EvV2+TuQn63dMkPjZ/sp9XkghTEbV9KlPS1xUsZ3u7/IQO4wxtcFB4bgpQPRcR3QCvezPcQ==",
      "license": "ISC"
    },
    "node_modules/ws": {
      "version": "8.20.0",
      "resolved": "https://registry.npmjs.org/ws/-/ws-8.20.0.tgz",
      "integrity": "sha512-sAt8BhgNbzCtgGbt2OxmpuryO63ZoDk/sqaB/znQm94T4fCEsy/yV+7CdC1kJhOU9lboAEU7R3kquuycDoibVA==",
      "license": "MIT",
      "engines": {
        "node": ">=10.0.0"
      },
      "peerDependencies": {
        "bufferutil": "^4.0.1",
        "utf-8-validate": ">=5.0.2"
      },
      "peerDependenciesMeta": {
        "bufferutil": {
          "optional": true
        },
        "utf-8-validate": {
          "optional": true
        }
      }
    },
    "node_modules/xmlhttprequest-ssl": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/xmlhttprequest-ssl/-/xmlhttprequest-ssl-2.1.2.tgz",
      "integrity": "sha512-TEU+nJVUUnA4CYJFLvK5X9AOeH4KvDvhIfm0vV1GaQRtchnG0hgK5p8hw/xjv8cunWYCsiPCSDzObPyhEwq3KQ==",
      "engines": {
        "node": ">=0.4.0"
      }
    },
    "node_modules/xtend": {
      "version": "4.0.2",
      "resolved": "https://registry.npmjs.org/xtend/-/xtend-4.0.2.tgz",
      "integrity": "sha512-LKYU1iAXJXUgAXn9URjiu+MWhyUXHsvfp7mcuYm9dSUKK0/CjtrUwFAxD82/mCWbtLsGjFIad0wIsod4zrTAEQ==",
      "license": "MIT",
      "engines": {
        "node": ">=0.4"
      }
    },
    "node_modules/y18n": {
      "version": "4.0.3",
      "resolved": "https://registry.npmjs.org/y18n/-/y18n-4.0.3.tgz",
      "integrity": "sha512-JKhqTOwSrqNA1NY5lSztJ1GrBiUodLMmIZuLiDaMRJ+itFd+ABVE8XBjOvIWL+rSqNDC74LCSFmlb/U4UZ4hJQ==",
      "license": "ISC"
    },
    "node_modules/yallist": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/yallist/-/yallist-3.1.1.tgz",
      "integrity": "sha512-a4UGQaWPH59mOXUYnAG2ewncQS4i4F43Tv3JoAM+s2VDAmS9NsK8GpDMLrCHPksFT7h3K6TOoUNn2pb7RoXx4g==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/yargs": {
      "version": "15.4.1",
      "resolved": "https://registry.npmjs.org/yargs/-/yargs-15.4.1.tgz",
      "integrity": "sha512-aePbxDmcYW++PaqBsJ+HYUFwCdv4LVvdnhBy78E57PIor8/OVvhMrADFFEDh8DHDFRv/O9i3lPhsENjO7QX0+A==",
      "license": "MIT",
      "dependencies": {
        "cliui": "^6.0.0",
        "decamelize": "^1.2.0",
        "find-up": "^4.1.0",
        "get-caller-file": "^2.0.1",
        "require-directory": "^2.1.1",
        "require-main-filename": "^2.0.0",
        "set-blocking": "^2.0.0",
        "string-width": "^4.2.0",
        "which-module": "^2.0.0",
        "y18n": "^4.0.0",
        "yargs-parser": "^18.1.2"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/yargs-parser": {
      "version": "18.1.3",
      "resolved": "https://registry.npmjs.org/yargs-parser/-/yargs-parser-18.1.3.tgz",
      "integrity": "sha512-o50j0JeToy/4K6OZcaQmW6lyXXKhq7csREXcDwk2omFPJEwUNOVtJKvmDr9EI1fAJZUyZcRF7kxGBWmRXudrCQ==",
      "license": "ISC",
      "dependencies": {
        "camelcase": "^5.0.0",
        "decamelize": "^1.2.0"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/zod": {
      "version": "3.25.76",
      "resolved": "https://registry.npmjs.org/zod/-/zod-3.25.76.tgz",
      "integrity": "sha512-gzUt/qt81nXsFGKIFcC3YnfEAx5NkunCfnDlvuBSSFS02bcXu4Lmea0AFIUwbLWxWPx3d9p8S5QoaujKcNQxcQ==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/colinhacks"
      }
    },
    "node_modules/zustand": {
      "version": "5.0.3",
      "resolved": "https://registry.npmjs.org/zustand/-/zustand-5.0.3.tgz",
      "integrity": "sha512-14fwWQtU3pH4dE0dOpdMiWjddcH+QzKIgk1cl8epwSE7yag43k/AD/m4L6+K7DytAOr9gGBe3/EXj9g7cdostg==",
      "license": "MIT",
      "engines": {
        "node": ">=12.20.0"
      },
      "peerDependencies": {
        "@types/react": ">=18.0.0",
        "immer": ">=9.0.6",
        "react": ">=18.0.0",
        "use-sync-external-store": ">=1.2.0"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "immer": {
          "optional": true
        },
        "react": {
          "optional": true
        },
        "use-sync-external-store": {
          "optional": true
        }
      }
    },
    "packages/shared": {
      "name": "@based-chess/shared",
      "version": "0.1.0",
      "devDependencies": {
        "vitest": "^3.1.2"
      }
    }
  }
}
````

## `packages/shared/package.json`

````json
{
  "name": "@based-chess/shared",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./src": "./src/index.ts"
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run"
  },
  "devDependencies": {
    "vitest": "^3.1.2"
  }
}
````

## `packages/shared/src/contract.ts`

````ts
export const resultNftAbi = [
  {
    type: "function",
    name: "mintResult",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "gameIdHash", type: "bytes32" },
      { name: "tokenUri", type: "string" },
      {
        name: "data",
        type: "tuple",
        components: [
          { name: "result", type: "uint8" },
          { name: "difficulty", type: "uint8" },
          { name: "rarity", type: "uint8" },
          { name: "moveCount", type: "uint16" },
          { name: "durationSeconds", type: "uint32" },
          { name: "seasonHash", type: "bytes32" },
          { name: "playedAt", type: "uint64" },
          { name: "deadline", type: "uint64" }
        ]
      },
      { name: "signature", type: "bytes" }
    ],
    outputs: [{ name: "tokenId", type: "uint256" }]
  },
  {
    type: "event",
    name: "ResultMinted",
    inputs: [
      { name: "to", type: "address", indexed: true },
      { name: "gameIdHash", type: "bytes32", indexed: true },
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "result", type: "uint8", indexed: false },
      { name: "difficulty", type: "uint8", indexed: false },
      { name: "rarity", type: "uint8", indexed: false },
      { name: "moveCount", type: "uint16", indexed: false },
      { name: "durationSeconds", type: "uint32", indexed: false },
      { name: "seasonHash", type: "bytes32", indexed: false },
      { name: "playedAt", type: "uint64", indexed: false },
      { name: "tokenUri", type: "string", indexed: false }
    ]
  }
] as const;

export const resultEnum = { win: 0, loss: 1, draw: 2 } as const;
export const difficultyEnum = { easy: 0, medium: 1, hard: 2, "very-hard": 3 } as const;
export const rarityEnum = { common: 0, rare: 1, epic: 2, legendary: 3 } as const;
````

## `packages/shared/src/index.ts`

````ts
export * from "./levels.js";
export * from "./seasons.js";
export * from "./nft.js";
export * from "./stats.js";
export * from "./contract.js";
````

## `packages/shared/src/levels.ts`

````ts
export const DIFFICULTIES = ["easy", "medium", "hard", "very-hard"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const RESULTS = ["win", "loss", "draw"] as const;
export type GameResult = (typeof RESULTS)[number];

export const RARITIES = ["common", "rare", "epic", "legendary"] as const;
export type Rarity = (typeof RARITIES)[number];

export const difficultyLabels: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  "very-hard": "Very Hard"
};

export const difficultyColors: Record<Difficulty, string> = {
  easy: "#16a34a",
  medium: "#0052ff",
  hard: "#dc2626",
  "very-hard": "#111827"
};

export const difficultyOrder: Record<Difficulty, number> = {
  easy: 0,
  medium: 1,
  hard: 2,
  "very-hard": 3
};

export const rarityByDifficulty: Record<Difficulty, Rarity> = {
  easy: "common",
  medium: "rare",
  hard: "epic",
  "very-hard": "legendary"
};

export const rarityLabels: Record<Rarity, string> = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary"
};

export const xpByDifficulty: Record<Difficulty, number> = {
  easy: 1,
  medium: 5,
  hard: 10,
  "very-hard": 20
};

export function isDifficulty(value: string): value is Difficulty {
  return (DIFFICULTIES as readonly string[]).includes(value);
}

export function resultLabel(result: GameResult) {
  if (result === "win") return "Win";
  if (result === "loss") return "Loss";
  return "Draw";
}
````

## `packages/shared/src/nft.ts`

````ts
import type { Difficulty, GameResult, Rarity } from "./levels.js";
import { difficultyLabels, rarityByDifficulty, rarityLabels, resultLabel } from "./levels.js";

export type ResultNftAttributes = {
  game_id: string;
  result: GameResult;
  difficulty: Difficulty;
  rarity: Rarity;
  move_count: number;
  duration_seconds: number;
  season: string;
  played_at: string;
  opponent_type: "bot";
};

export type NftVisualTheme = {
  accent: string;
  background: string;
  motif: string;
};

export type RarityArtwork = {
  key: "commonArtwork" | "rareArtwork" | "epicArtwork" | "legendaryArtwork";
  rarity: Rarity;
  fileName: string;
  publicPath: string;
};

export const commonArtwork: RarityArtwork = {
  key: "commonArtwork",
  rarity: "common",
  fileName: "common-artwork.jpg",
  publicPath: "/rarity-artwork/common-artwork.jpg"
};

export const rareArtwork: RarityArtwork = {
  key: "rareArtwork",
  rarity: "rare",
  fileName: "rare-artwork.jpg",
  publicPath: "/rarity-artwork/rare-artwork.jpg"
};

export const epicArtwork: RarityArtwork = {
  key: "epicArtwork",
  rarity: "epic",
  fileName: "epic-artwork.jpg",
  publicPath: "/rarity-artwork/epic-artwork.jpg"
};

export const legendaryArtwork: RarityArtwork = {
  key: "legendaryArtwork",
  rarity: "legendary",
  fileName: "legendary-artwork.jpg",
  publicPath: "/rarity-artwork/legendary-artwork.jpg"
};

export const artworkByRarity: Record<Rarity, RarityArtwork> = {
  common: commonArtwork,
  rare: rareArtwork,
  epic: epicArtwork,
  legendary: legendaryArtwork
};

export function artworkForDifficulty(difficulty: Difficulty) {
  return artworkByRarity[rarityByDifficulty[difficulty]];
}

export const rarityThemes: Record<Rarity, NftVisualTheme> = {
  common: {
    accent: "#88a7ff",
    background: "soft geometric chess motif",
    motif: "Clean diagonal grid with subtle pawn silhouettes"
  },
  rare: {
    accent: "#1e8fff",
    background: "knight-inspired tactical motif",
    motif: "Layered blue vectors with a focused knight mark"
  },
  epic: {
    accent: "#6b5cff",
    background: "fortress and rook power motif",
    motif: "Deep architectural panels framing a rook tower"
  },
  legendary: {
    accent: "#f0c862",
    background: "king-centered Base collectible motif",
    motif: "Prestige blue field with a central chess king"
  }
};

export function buildNftName(gameNumber: number, attrs: ResultNftAttributes) {
  return `Based Chess ${resultLabel(attrs.result)} #${gameNumber}`;
}

export function buildNftDescription(attrs: ResultNftAttributes) {
  return `${resultLabel(attrs.result)} on ${difficultyLabels[attrs.difficulty]} in ${attrs.move_count} moves over ${attrs.duration_seconds} seconds during ${attrs.season}. Rarity: ${rarityLabels[attrs.rarity]}.`;
}

export function attributesForGame(input: Omit<ResultNftAttributes, "rarity" | "opponent_type">): ResultNftAttributes {
  return {
    ...input,
    rarity: rarityByDifficulty[input.difficulty],
    opponent_type: "bot"
  };
}

export function borderForResult(result: GameResult) {
  if (result === "win") return "#17c964";
  if (result === "loss") return "#ef4444";
  return "#0052ff";
}
````

## `packages/shared/src/seasons.test.ts`

````ts
import { describe, expect, it } from "vitest";
import { getSeasonWindow } from "./seasons.js";

describe("season windows", () => {
  it("uses exact two-week UTC windows", () => {
    expect(getSeasonWindow(new Date("2026-01-05T00:00:00.000Z")).label).toBe("Season 1");
    expect(getSeasonWindow(new Date("2026-01-18T23:59:59.999Z")).label).toBe("Season 1");
    expect(getSeasonWindow(new Date("2026-01-19T00:00:00.000Z")).label).toBe("Season 2");
  });
});
````

## `packages/shared/src/seasons.ts`

````ts
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;
const DEFAULT_SEASON_ZERO_START = "2026-01-05T00:00:00.000Z";

export type SeasonWindow = {
  index: number;
  label: string;
  startsAt: string;
  endsAt: string;
};

export function getSeasonWindow(
  at: Date = new Date(),
  seasonZeroStart = DEFAULT_SEASON_ZERO_START
): SeasonWindow {
  const epoch = new Date(seasonZeroStart).getTime();
  if (!Number.isFinite(epoch)) {
    throw new Error("Invalid SEASON_ZERO_START");
  }

  const now = at.getTime();
  const index = Math.max(1, Math.floor((now - epoch) / TWO_WEEKS_MS) + 1);
  const startsAt = new Date(epoch + (index - 1) * TWO_WEEKS_MS);
  const endsAt = new Date(startsAt.getTime() + TWO_WEEKS_MS);

  return {
    index,
    label: `Season ${index}`,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString()
  };
}

export function getSeasonForLabel(label: string, seasonZeroStart = DEFAULT_SEASON_ZERO_START): SeasonWindow {
  const match = /^Season (\d+)$/.exec(label);
  if (!match) throw new Error(`Invalid season label: ${label}`);
  const index = Number(match[1]);
  const epoch = new Date(seasonZeroStart).getTime();
  const startsAt = new Date(epoch + (index - 1) * TWO_WEEKS_MS);
  return {
    index,
    label,
    startsAt: startsAt.toISOString(),
    endsAt: new Date(startsAt.getTime() + TWO_WEEKS_MS).toISOString()
  };
}
````

## `packages/shared/src/stats.test.ts`

````ts
import { describe, expect, it } from "vitest";
import { getTitleForXp, xpForResult } from "./stats.js";

describe("XP progression", () => {
  it("awards one-fifth win XP for losses", () => {
    expect(xpForResult("easy", "loss")).toBe(0.2);
    expect(xpForResult("very-hard", "loss")).toBe(4);
  });

  it("does not award XP for draws", () => {
    expect(xpForResult("hard", "draw")).toBe(0);
  });

  it("keeps title thresholds based on total XP", () => {
    expect(getTitleForXp(24.9)).toBe("Rookie");
    expect(getTitleForXp(25)).toBe("Tactical Knight");
  });
});
````

## `packages/shared/src/stats.ts`

````ts
import type { Difficulty, GameResult } from "./levels.js";
import { xpByDifficulty } from "./levels.js";

export const accountTitles = [
  "Rookie",
  "Tactical Knight",
  "Base Master",
  "Base Grandmaster",
  "Base God"
] as const;

export type AccountTitle = (typeof accountTitles)[number];

export function getTitleForXp(xp: number): AccountTitle {
  if (xp >= 500) return "Base God";
  if (xp >= 250) return "Base Grandmaster";
  if (xp >= 100) return "Base Master";
  if (xp >= 25) return "Tactical Knight";
  return "Rookie";
}

export function xpForWin(difficulty: Difficulty) {
  return xpByDifficulty[difficulty];
}

export function xpForLoss(difficulty: Difficulty) {
  return xpByDifficulty[difficulty] / 5;
}

export function xpForResult(difficulty: Difficulty, result: GameResult) {
  if (result === "win") return xpForWin(difficulty);
  if (result === "loss") return xpForLoss(difficulty);
  return 0;
}

export function formatXp(xp: number) {
  return Number.isInteger(xp) ? xp.toString() : xp.toFixed(1);
}
````

## `packages/shared/tsconfig.json`

````json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "declaration": true,
    "emitDeclarationOnly": false,
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "noEmit": false,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"],
  "exclude": ["src/**/*.test.ts"]
}
````

## `PROJECT_TREE.txt`

````text
Folder PATH listing
Volume serial number is A43C-458C
C:\USERS\USER\DOCUMENTS\CODEX\2026-05-01\BASED-CHESS-GITHUB-READY-20260504-124302
|   .env.example
|   .gitignore
|   package-lock.json
|   package.json
|   README.md
|   tsconfig.base.json
|   
+---.github
|   \---workflows
|           ci.yml
|           
+---apps
|   +---api
|   |   |   package.json
|   |   |   tsconfig.json
|   |   |   
|   |   +---assets
|   |   |   \---rarity
|   |   |           common-artwork.jpg
|   |   |           epic-artwork.jpg
|   |   |           legendary-artwork.jpg
|   |   |           rare-artwork.jpg
|   |   |           
|   |   +---prisma
|   |   |   |   schema.prisma
|   |   |   |   seed.ts
|   |   |   |   
|   |   |   \---migrations
|   |   |       |   migration_lock.toml
|   |   |       |   
|   |   |       +---0001_init
|   |   |       |       migration.sql
|   |   |       |       
|   |   |       +---0002_loss_xp_float
|   |   |       |       migration.sql
|   |   |       |       
|   |   |       \---0003_draw_results
|   |   |               migration.sql
|   |   |               
|   |   \---src
|   |       |   auth.ts
|   |       |   db.ts
|   |       |   domain.ts
|   |       |   env.ts
|   |       |   index.ts
|   |       |   
|   |       +---jobs
|   |       |       closeInactiveGames.ts
|   |       |       
|   |       +---routes
|   |       |       assets.ts
|   |       |       auth.ts
|   |       |       games.ts
|   |       |       leaderboards.ts
|   |       |       me.ts
|   |       |       mints.ts
|   |       |       
|   |       +---services
|   |       |       analysisService.ts
|   |       |       artService.test.ts
|   |       |       artService.ts
|   |       |       chessBot.ts
|   |       |       gameService.test.ts
|   |       |       gameService.ts
|   |       |       integrityService.ts
|   |       |       leaderboardService.ts
|   |       |       nftService.test.ts
|   |       |       nftService.ts
|   |       |       seasonService.ts
|   |       |       shareService.ts
|   |       |       statsService.ts
|   |       |       userService.ts
|   |       |       
|   |       \---utils
|   \---web
|       |   index.html
|       |   package.json
|       |   tsconfig.json
|       |   vite.config.ts
|       |   
|       +---public
|       |   |   site.webmanifest
|       |   |   
|       |   \---brand
|       |           based-chess-logo.jpg
|       |           
|       \---src
|           |   App.tsx
|           |   main.tsx
|           |   styles.css
|           |   types.ts
|           |   
|           +---api
|           |       client.ts
|           |       
|           +---components
|           +---config
|           |       env.ts
|           |       wagmi.ts
|           |       
|           +---hooks
|           \---utils
|                   format.ts
|                   
+---contracts
|   |   foundry.toml
|   |   remappings.txt
|   |   
|   +---script
|   |       DeployBasedChessResults.s.sol
|   |       
|   +---src
|   |       BasedChessResults.sol
|   |       
|   \---test
\---packages
    \---shared
        |   package.json
        |   tsconfig.json
        |   
        \---src
                contract.ts
                index.ts
                levels.ts
                nft.ts
                seasons.test.ts
                seasons.ts
                stats.test.ts
                stats.ts
                
````

## `README.md`

````md
# Based Chess

Based Chess is a mobile-first Base App where a connected wallet plays chess against a bot, completes win/loss/draw games, previews a collectible result NFT, and mints exactly one NFT per completed game.

## Stack

- Frontend: Vite, React, TypeScript, wagmi, viem, Base Account connector, React Query, react-chessboard.
- Backend: Fastify, Prisma, SQLite for local development, chess.js for authoritative validation, and a schema designed to move cleanly to Postgres for production scale.
- Shared package: typed difficulty, season, XP/title, NFT metadata, and contract ABI rules.
- Contract: OpenZeppelin ERC-721 URI storage with EIP-712 backend mint authorization.

Base App assumption: the app follows the current Base guidance for standard mobile web apps using normal wallet connection and SIWE rather than legacy mini-app SDK calls.

## Architecture

The backend is authoritative for game state. The client sends intended user moves, the API validates them with chess.js, applies the bot move, persists the FEN/PGN/move log, and only then returns the updated board.

Core packages:

- `apps/web`: mobile app screens for wallet auth, home, game, result, mint, leaderboards, profile, and trophy gallery.
- `apps/api`: wallet bootstrap, SIWE auth, game lifecycle, inactivity closure, stats, leaderboards, NFT mint eligibility, metadata, images, and share cards.
- `packages/shared`: shared product constants and typed rules.
- `contracts`: `BasedChessResults` NFT contract and Foundry deploy script.

The domain model keeps `opponentType` on games and separates persisted game/move/result/mint records so future PvP can add another opponent type without replacing the current bot flow.

## Local Setup

1. Copy `.env.example` to `.env` and update values.
2. Install dependencies:

```bash
npm install
```

3. Build shared types and generate Prisma:

```bash
npm run build:shared
npm run db:generate
```

4. Apply migrations and seed optional demo rows:

```bash
npm --workspace @based-chess/api run db:deploy
npm run db:seed
```

5. Start the app:

```bash
npm run dev
```

Web runs on `http://127.0.0.1:5173`; API runs on `http://127.0.0.1:8787`.

Wallet connection is the production app entry path. For local testing only, `ENABLE_DEV_AUTH=true` and `VITE_ENABLE_DEV_AUTH=true` expose a temporary local access button; the API rejects that route when `NODE_ENV=production`.

## Verification

```bash
npm run typecheck
npm run test
npm run build
```

Current verification status: type checks, shared/API tests, production build, migration deploy, seed, and API smoke test pass locally.

## Gameplay

- The user plays white against the bot.
- Difficulty levels are Easy, Medium, Hard, and Very Hard.
- Easy is intentionally noisy/random, Medium prefers captures and checks with randomness, Hard uses shallow minimax, and Very Hard uses deeper minimax with a larger node budget.
- Bot replies wait a random 3 to 7 seconds after each valid user move to make the turn rhythm feel natural.
- Move validation, game-over detection, move count, duration, and bot replies happen server-side.
- Checkmate by the user is a win. Checkmate by the bot is a loss. Stalemate and other valid draw states are recorded as draw, not loss.
- If no move is made for 10 minutes, the game becomes `auto_closed`. Auto-closed games do not count in stats, leaderboards, or mint eligibility.

## Seasons And Leaderboards

Seasons are deterministic 14-day UTC windows from `SEASON_ZERO_START`. The API upserts the current season when needed, and leaderboard queries filter by `seasonId` for seasonal views. No destructive reset job is required; seasonal reset is reliable because each game and NFT is stamped with its season at creation.

Leaderboards are separate by difficulty, scope, and metric:

- Most Wins: higher wins rank first; ties go to the wallet that reached the tied count first.
- Fastest Wins: lower duration ranks first; ties go to the earlier record.
- Lowest Move-Count Wins: fewer user moves ranks first; ties go to the earlier record.

Only completed wins are included.

## NFT Minting

`BasedChessResults` uses ERC-721 URI storage because each completed game has unique metadata and art. The backend signs an EIP-712 mint authorization only for a valid completed, integrity-checked game. The contract enforces:

- caller must mint to themselves;
- signature must match the configured backend mint signer;
- deadline must not be expired;
- `gameIdHash` may only be minted once.

Metadata includes `result`, `difficulty`, `rarity`, `move_count`, `duration_seconds`, `season`, `played_at`, `opponent_type=bot`, and `game_id`. The backend derives `move_count` and `duration_seconds` from the validated completed game record; the client never supplies those values for minting.

Rarity maps directly to difficulty:

- Easy: Common
- Medium: Rare
- Hard: Epic
- Very Hard: Legendary

NFT images are served by the API as dynamic SVG wrappers around fixed rarity artwork templates. The four templates are named in shared code and are never randomized:

- `commonArtwork`: Easy / Common
- `rareArtwork`: Medium / Rare
- `epicArtwork`: Hard / Epic
- `legendaryArtwork`: Very Hard / Legendary

The API reads the final validated game result, maps difficulty to rarity, embeds the matching rarity artwork, and injects only move count and duration into the template's reserved value slots. It does not write result, difficulty, rarity, or season text into the Base logo/shield area. The result border is the only result-colored card treatment: green for wins, red for losses, and blue for draws. The same deterministic image URL is used for preview, token metadata, minted NFT records, gallery display, and share card rendering.

## Contract Deployment

Install Foundry, then from `contracts`:

```bash
forge install foundry-rs/forge-std
CONTRACT_OWNER=0x...
MINT_SIGNER_ADDRESS=0x...
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
PRIVATE_KEY=0x...
forge script script/DeployBasedChessResults.s.sol --rpc-url base_sepolia --broadcast --verify
```

After deployment:

- set `RESULT_NFT_CONTRACT_ADDRESS` on the API;
- set `VITE_RESULT_NFT_CONTRACT_ADDRESS` on the web app;
- set `MINT_SIGNER_PRIVATE_KEY` on the API;
- keep the signer private key off the frontend.

## Deployment

Backend:

- Use Postgres in production by switching Prisma datasource provider from SQLite to PostgreSQL and setting `DATABASE_URL`.
- Run `npm --workspace @based-chess/api run db:deploy` during release.
- Run `npm --workspace @based-chess/api run start` behind HTTPS.
- Schedule `npm run job:close-inactive` every minute, or keep the built-in interval active in the API process.

Frontend:

- Build with `npm --workspace @based-chess/web run build`.
- Deploy `apps/web/dist` to a static host.
- Configure `VITE_API_URL`, Base chain, and contract address.

## Share Cards

After each completed game, the API returns dynamic X text and serves an SVG share card at `/share-cards/:gameId.svg`. Share cards use the same fixed rarity artwork mapping as NFT previews, with only move count and duration overlaid from the completed result record. The copy changes based on result and difficulty and stays concise/onchain-friendly.

## Integrity Notes

The API records an HMAC integrity hash over completed game identity, result, season, duration, and move count. Mint eligibility verifies that hash, completion status, ownership, and duplicate mint state. On mint record, the backend stores the generated metadata JSON with the completed game's `move_count`, `duration_seconds`, and `game_id`; the token URI serves that stored metadata for minted NFTs. Leaderboards query only completed wins, and mint records are unique by `gameId` and `txHash`.

## XP Rules

Wins grant the configured difficulty XP: Easy `1`, Medium `5`, Hard `10`, Very Hard `20`. Losses grant one-fifth of the same difficulty value, so Easy losses grant `0.2` XP and Very Hard losses grant `4` XP. XP is stored as a real number so title thresholds remain exact.

Mint recording verifies the onchain transaction receipt before persisting a minted NFT. The API checks the configured contract address, transaction success, emitted `ResultMinted` event, wallet recipient, game hash, token URI, result, difficulty, rarity, move count, duration, season hash, and played-at timestamp.

## Future PvP

Do not add PvP in this MVP. The current structure leaves room for it:

- introduce `opponentType="pvp"`;
- add match/session matchmaking tables;
- replace bot reply generation with turn ownership checks;
- keep the same completed game, season, stats, leaderboard, share, and NFT flows.
````

## `tsconfig.base.json`

````json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  }
}
````

