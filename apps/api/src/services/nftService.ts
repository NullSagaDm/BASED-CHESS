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
