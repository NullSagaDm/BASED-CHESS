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
