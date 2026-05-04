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
