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
