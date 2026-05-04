UPDATE "Season"
SET "startsAt" = '2026-05-04T00:00:00.000Z',
    "endsAt" = '2026-05-18T00:00:00.000Z'
WHERE "index" = 1
  AND "label" = 'Season 1'
  AND NOT EXISTS (
    SELECT 1
    FROM "Game"
    WHERE "Game"."seasonId" = "Season"."id"
  )
  AND NOT EXISTS (
    SELECT 1
    FROM "MintedNft"
    WHERE "MintedNft"."seasonId" = "Season"."id"
  );

DELETE FROM "Season"
WHERE "startsAt" < '2026-05-04T00:00:00.000Z'
  AND NOT EXISTS (
    SELECT 1
    FROM "Game"
    WHERE "Game"."seasonId" = "Season"."id"
  )
  AND NOT EXISTS (
    SELECT 1
    FROM "MintedNft"
    WHERE "MintedNft"."seasonId" = "Season"."id"
  );