import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { Chessboard } from "react-chessboard";
import { Chess, type Square as ChessSquare } from "chess.js";
import { createSiweMessage } from "viem/siwe";
import { encodeFunctionData, getAddress, parseAbi, parseAbiItem, parseEventLogs, type Address } from "viem";
import { base } from "viem/chains";
import { useAccount, useConnect, useDisconnect, usePublicClient, useSendTransaction, useSignMessage } from "wagmi";
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
  RARITIES,
  RESULTS,
  difficultyColors,
  difficultyLabels,
  formatXp,
  rarityLabels,
  rarityByDifficulty,
  resultLabel,
  resultNftAbi,
  type Difficulty,
  type GameResult,
  type Rarity
} from "@based-chess/shared";
import { api, setAuthToken } from "./api/client";
import { builderCodeDataSuffix, chain } from "./config/wagmi";
import { env } from "./config/env";
import type { Analysis, ApiGame, LeaderboardResponse, MeResponse, MintPreview, Profile } from "./types";
import { absoluteApiUrl, compactAddress, formatDuration } from "./utils/format";

type Tab = "home" | "play" | "leaderboards" | "profile";
type GalleryItem = Profile["collection"][number];

const erc721GalleryAbi = parseAbi([
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)"
]);
const transferEvent = parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)");

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
const zeroAddress = "0x0000000000000000000000000000000000000000";
const recoveredGalleryStorageKey = "based-chess-recovered-nfts";
const recoveredGalleryEvent = "based-chess:recovered-nft";
const mintedGameStorageKey = "based-chess-minted-game-ids";
const mintedGameEvent = "based-chess:minted-game";
const emptyGalleryItems: GalleryItem[] = [];

function isConfiguredAddress(value: string): value is Address {
  return /^0x[a-fA-F0-9]{40}$/.test(value) && value.toLowerCase() !== zeroAddress;
}

function isResult(value: unknown): value is GameResult {
  return typeof value === "string" && (RESULTS as readonly string[]).includes(value);
}

function isRarity(value: unknown): value is Rarity {
  return typeof value === "string" && (RARITIES as readonly string[]).includes(value);
}

function isDifficulty(value: unknown): value is Difficulty {
  return typeof value === "string" && (DIFFICULTIES as readonly string[]).includes(value);
}

function metadataField(metadata: Record<string, unknown>, key: string) {
  const properties = metadata.properties;
  if (metadata[key] != null) return metadata[key];
  if (properties && typeof properties === "object" && key in properties) {
    return (properties as Record<string, unknown>)[key];
  }
  const attributes = metadata.attributes;
  if (Array.isArray(attributes)) {
    const attribute = attributes.find(
      (item) => item && typeof item === "object" && (item as Record<string, unknown>).trait_type === key
    );
    if (attribute && typeof attribute === "object" && "value" in attribute) {
      return (attribute as Record<string, unknown>).value;
    }
  }
  return undefined;
}

function metadataString(metadata: Record<string, unknown>, key: string) {
  const value = metadataField(metadata, key);
  return typeof value === "string" ? value : null;
}

function metadataUrl(tokenUri: string) {
  if (tokenUri.startsWith("ipfs://")) return `https://ipfs.io/ipfs/${tokenUri.slice("ipfs://".length)}`;
  return absoluteApiUrl(tokenUri);
}

function galleryItemFromMetadata(tokenId: bigint, tokenUri: string, metadata: Record<string, unknown>): GalleryItem | null {
  const result = metadataField(metadata, "result");
  const difficulty = metadataField(metadata, "difficulty");
  const rarity = metadataField(metadata, "rarity");
  if (!isResult(result) || !isDifficulty(difficulty) || !isRarity(rarity)) return null;

  const tokenIdText = tokenId.toString();
  const gameId = metadataString(metadata, "game_id") ?? `onchain-${tokenIdText}`;
  const image = metadataString(metadata, "image");
  const playedAt = metadataString(metadata, "played_at");

  return {
    id: `onchain-${tokenIdText}`,
    gameId,
    result,
    difficulty,
    rarity,
    tokenId: tokenIdText,
    txHash: "onchain",
    imageUrl: image ? absoluteApiUrl(image) : absoluteApiUrl(`/nft-images/${gameId}.svg`),
    tokenUri,
    season: metadataString(metadata, "season") ?? "Onchain",
    mintedAt: playedAt && Number.isFinite(Date.parse(playedAt)) ? new Date(playedAt).toISOString() : new Date().toISOString()
  };
}

function galleryKey(item: GalleryItem) {
  return item.tokenId ? `token:${item.tokenId}` : `game:${item.gameId}`;
}

function readRecoveredGalleryItems(): GalleryItem[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(recoveredGalleryStorageKey) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is GalleryItem => item && typeof item === "object") : [];
  } catch {
    return [];
  }
}

function rememberRecoveredGalleryItem(item: GalleryItem) {
  const merged = new Map(readRecoveredGalleryItems().map((entry) => [galleryKey(entry), entry]));
  merged.set(galleryKey(item), item);
  window.localStorage.setItem(recoveredGalleryStorageKey, JSON.stringify([...merged.values()]));
  window.dispatchEvent(new Event(recoveredGalleryEvent));
}

function readMintedGameIds() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(mintedGameStorageKey) ?? "[]");
    return new Set(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : []);
  } catch {
    return new Set<string>();
  }
}

function rememberMintedGameId(gameId: string) {
  const gameIds = readMintedGameIds();
  gameIds.add(gameId);
  window.localStorage.setItem(mintedGameStorageKey, JSON.stringify([...gameIds]));
  window.dispatchEvent(new Event(mintedGameEvent));
}

function isLocallyMintedGame(gameId: string) {
  return readMintedGameIds().has(gameId) || readRecoveredGalleryItems().some((item) => item.gameId === gameId);
}

function galleryItemFromMintFallback(input: {
  game: ApiGame;
  preview: MintPreview | null;
  tokenId: bigint;
  tokenUri: string;
  txHash: string;
}) {
  const result = input.preview?.attributes.result ?? input.game.result;
  if (!result) return null;
  const difficulty = input.preview?.attributes.difficulty ?? input.game.difficulty;
  const rarity = input.preview?.attributes.rarity ?? rarityByDifficulty[difficulty];
  const playedAt = input.preview?.attributes.played_at;
  return {
    id: `onchain-${input.tokenId.toString()}`,
    gameId: input.game.id,
    result,
    difficulty,
    rarity,
    tokenId: input.tokenId.toString(),
    txHash: input.txHash,
    imageUrl: input.preview?.imageUrl ? absoluteApiUrl(input.preview.imageUrl) : absoluteApiUrl(`/nft-images/${input.game.id}.svg`),
    tokenUri: input.tokenUri,
    season: input.preview?.attributes.season ?? input.game.season.label,
    mintedAt: playedAt && Number.isFinite(Date.parse(playedAt)) ? new Date(playedAt).toISOString() : new Date().toISOString()
  } satisfies GalleryItem;
}

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

function useRecoveredGalleryItems() {
  const [recoveredGalleryItems, setRecoveredGalleryItems] = useState<GalleryItem[]>(() => readRecoveredGalleryItems());

  useEffect(() => {
    const refreshRecoveredItems = () => setRecoveredGalleryItems(readRecoveredGalleryItems());
    window.addEventListener(recoveredGalleryEvent, refreshRecoveredItems);
    window.addEventListener("storage", refreshRecoveredItems);
    return () => {
      window.removeEventListener(recoveredGalleryEvent, refreshRecoveredItems);
      window.removeEventListener("storage", refreshRecoveredItems);
    };
  }, []);

  return recoveredGalleryItems;
}

function useOwnedNftCollection(profile: Profile | null, walletAddress: string | undefined) {
  const publicClient = usePublicClient({ chainId: base.id });
  const recoveredGalleryItems = useRecoveredGalleryItems();
  const profileCollection = profile?.collection ?? emptyGalleryItems;
  const [onchainGallery, setOnchainGallery] = useState<{
    checked: boolean;
    ownedTokenIds: Set<string>;
    items: GalleryItem[];
  }>({ checked: false, ownedTokenIds: new Set(), items: [] });

  useEffect(() => {
    let canceled = false;

    async function loadOnchainGallery() {
      if (!profile || !publicClient || !walletAddress || !isConfiguredAddress(env.resultNftContractAddress)) {
        setOnchainGallery({ checked: false, ownedTokenIds: new Set(), items: [] });
        return;
      }

      try {
        const owner = getAddress(walletAddress as Address);
        const contractAddress = getAddress(env.resultNftContractAddress);
        let logs: Array<{ args: { tokenId?: bigint | null } }> = [];
        try {
          logs = await publicClient.getLogs({
            address: contractAddress,
            event: transferEvent,
            args: { to: owner },
            fromBlock: 0n,
            toBlock: "latest"
          });
        } catch (event) {
          console.warn("Onchain gallery Transfer log query failed; falling back to known token ownership checks", {
            owner,
            contractAddress,
            error: event instanceof Error ? event.message : "Unknown log query error"
          });
        }
        const recoveredTokenIds = recoveredGalleryItems
          .map((item) => item.tokenId)
          .filter((tokenId): tokenId is string => typeof tokenId === "string" && /^\d+$/.test(tokenId))
          .map((tokenId) => BigInt(tokenId));
        const backendTokenIds = profileCollection
          .map((item) => item.tokenId)
          .filter((tokenId): tokenId is string => typeof tokenId === "string" && /^\d+$/.test(tokenId))
          .map((tokenId) => BigInt(tokenId));
        const candidateTokenIds = [
          ...new Set([
            ...logs.map((log) => log.args.tokenId).filter((tokenId): tokenId is bigint => tokenId != null),
            ...recoveredTokenIds,
            ...backendTokenIds
          ])
        ];

        const ownedEntries = await Promise.all(
          candidateTokenIds.map(async (tokenId) => {
            try {
              const currentOwner = await publicClient.readContract({
                address: contractAddress,
                abi: erc721GalleryAbi,
                functionName: "ownerOf",
                args: [tokenId]
              });
              if (getAddress(currentOwner) !== owner) return null;
              const tokenUri = await publicClient.readContract({
                address: contractAddress,
                abi: erc721GalleryAbi,
                functionName: "tokenURI",
                args: [tokenId]
              });
              const metadata = (await fetch(metadataUrl(tokenUri)).then((response) => response.json())) as Record<string, unknown>;
              return {
                tokenId: tokenId.toString(),
                item: galleryItemFromMetadata(tokenId, tokenUri, metadata)
              };
            } catch {
              const fallbackItem = recoveredGalleryItems.find((item) => item.tokenId === tokenId.toString()) ?? null;
              return fallbackItem ? { tokenId: tokenId.toString(), item: fallbackItem } : null;
            }
          })
        );

        if (canceled) return;
        setOnchainGallery({
          checked: true,
          ownedTokenIds: new Set(ownedEntries.flatMap((entry) => (entry ? [entry.tokenId] : []))),
          items: ownedEntries.flatMap((entry) => (entry?.item ? [entry.item] : []))
        });
      } catch {
        if (!canceled) setOnchainGallery({ checked: false, ownedTokenIds: new Set(), items: [] });
      }
    }

    loadOnchainGallery();
    return () => {
      canceled = true;
    };
  }, [profile, profileCollection, publicClient, recoveredGalleryItems, walletAddress]);

  return useMemo(() => {
    const merged = new Map<string, GalleryItem>();
    const backendItems = onchainGallery.checked
      ? profileCollection.filter((item) => !item.tokenId || onchainGallery.ownedTokenIds.has(item.tokenId))
      : profileCollection;
    for (const item of backendItems) merged.set(galleryKey(item), item);
    for (const item of onchainGallery.items) {
      if (!merged.has(galleryKey(item))) merged.set(galleryKey(item), item);
    }
    const recoveredItems = onchainGallery.checked
      ? recoveredGalleryItems.filter((item) => !item.tokenId || onchainGallery.ownedTokenIds.has(item.tokenId))
      : recoveredGalleryItems;
    for (const item of recoveredItems) {
      if (!merged.has(galleryKey(item))) merged.set(galleryKey(item), item);
    }
    return [...merged.values()];
  }, [onchainGallery, profileCollection, recoveredGalleryItems]);
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

function DifficultyGrid({
  onStart,
  busy,
  selectedDifficulty
}: {
  onStart: (difficulty: Difficulty) => void;
  busy: boolean;
  selectedDifficulty: Difficulty | null;
}) {
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
            className={`difficulty-card ${difficulty}${selectedDifficulty === difficulty ? " selected" : ""}`}
            key={difficulty}
            style={{ "--difficulty-color": difficultyColors[difficulty] } as CSSProperties}
            disabled={busy}
            onClick={() => onStart(difficulty)}
            aria-pressed={selectedDifficulty === difficulty}
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
  busy,
  selectedDifficulty,
  ownedNftCount
}: {
  me: MeResponse;
  onStart: (difficulty: Difficulty) => void;
  busy: boolean;
  selectedDifficulty: Difficulty | null;
  ownedNftCount: number;
}) {
  const [showTitleLadder, setShowTitleLadder] = useState(false);

  return (
    <div className="screen">
      <button className="hero-band tier-button" type="button" onClick={() => setShowTitleLadder(true)}>
        <div>
          <p className="eyebrow">{me.season.label}</p>
          <h2>{me.profile.accountTitle}</h2>
          <p>XP {formatXp(me.profile.xp)} · {compactAddress(me.user.address)}</p>
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
        <Stat label="NFTs" value={ownedNftCount} />
      </section>

      <section className="surface">
        <div className="section-title">
          <h3>Choose difficulty</h3>
          <Gamepad2 size={18} />
        </div>
        <DifficultyGrid onStart={onStart} busy={busy} selectedDifficulty={selectedDifficulty} />
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
                  {game.moveCount} moves · {formatDuration(game.durationSeconds)}
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
  const [showBoardResult, setShowBoardResult] = useState(false);
  const displayFen = optimisticFen ?? game.fen;
  const displayedDuration = useDisplayedDuration(game);
  const checkedKing = useMemo(() => findCheckedKingSquare(displayFen), [displayFen]);
  const boardResultText =
    game.status === "completed" && game.result
      ? game.result === "win"
        ? "WIN"
        : game.result === "loss"
          ? "LOSE"
          : "DRAW"
      : null;

  useEffect(() => {
    setSelectedSquare(null);
    setLegalTargets([]);
    setCaptureTargets([]);
    setOptimisticFen(null);
    if (game.status === "active") setShowBoardResult(false);
  }, [game.fen, game.status]);

  useEffect(() => {
    if (boardResultText) setShowBoardResult(true);
  }, [boardResultText, game.id]);

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
        {showBoardResult && boardResultText ? (
          <button
            className={`board-result-overlay ${game.result}`}
            type="button"
            onClick={() => setShowBoardResult(false)}
            aria-label={`${boardResultText}. Dismiss result overlay`}
          >
            {boardResultText}
          </button>
        ) : null}
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
          · Moves: {game.userMoveCount} · Duration: {formatDuration(game.durationSeconds)}
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
  const { sendTransactionAsync } = useSendTransaction();
  const publicClient = usePublicClient();
  const [preview, setPreview] = useState<MintPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [mintSucceeded, setMintSucceeded] = useState(() => game.mint.minted || isLocallyMintedGame(game.id));

  useEffect(() => {
    api.mintPreview(game.id).then(setPreview).catch((event) => setError(event instanceof Error ? event.message : "Mint preview unavailable"));
  }, [game.id]);

  useEffect(() => {
    if (!successMessage) return;
    const timeout = window.setTimeout(() => setSuccessMessage(null), 5_000);
    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  useEffect(() => {
    const syncMintedState = () => setMintSucceeded(game.mint.minted || isLocallyMintedGame(game.id));
    syncMintedState();
    window.addEventListener(mintedGameEvent, syncMintedState);
    window.addEventListener(recoveredGalleryEvent, syncMintedState);
    window.addEventListener("storage", syncMintedState);
    return () => {
      window.removeEventListener(mintedGameEvent, syncMintedState);
      window.removeEventListener(recoveredGalleryEvent, syncMintedState);
      window.removeEventListener("storage", syncMintedState);
    };
  }, [game.id, game.mint.minted]);

  async function mint() {
    if (mintSucceeded || game.mint.minted) return;
    setBusy(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const prepared = await api.prepareMint(game.id);
      if (/^0x0+$/.test(prepared.contractAddress)) {
        throw new Error("Deploy the NFT contract and set VITE_RESULT_NFT_CONTRACT_ADDRESS before minting.");
      }
      const mintResultArgs = [
        prepared.to,
        prepared.gameIdHash,
        prepared.tokenUri,
        {
          ...prepared.data,
          playedAt: BigInt(prepared.data.playedAt),
          deadline: BigInt(prepared.data.deadline)
        },
        prepared.signature
      ] as const;
      const mintResultData = encodeFunctionData({
        abi: resultNftAbi,
        functionName: "mintResult",
        args: mintResultArgs
      });
      const attributedMintData = `${mintResultData}${builderCodeDataSuffix.slice(2)}` as `0x${string}`;
      const hash = await sendTransactionAsync({
        to: prepared.contractAddress,
        data: attributedMintData
      });
      const receipt = publicClient ? await publicClient.waitForTransactionReceipt({ hash }) : null;
      const logs = receipt
        ? parseEventLogs({ abi: resultNftAbi, logs: receipt.logs, eventName: "ResultMinted" })
        : [];
      const contractAddress = getAddress(prepared.contractAddress);
      const transferLogs = receipt
        ? parseEventLogs({ abi: [transferEvent], logs: receipt.logs, eventName: "Transfer" })
        : [];
      const mintTransfer = transferLogs.find(
        (log) =>
          getAddress(log.address) === contractAddress &&
          log.args.tokenId != null &&
          getAddress(log.args.to) !== zeroAddress
      );
      const receiptTokenId = mintTransfer?.args.tokenId;
      const tokenId = (receiptTokenId ?? logs[0]?.args.tokenId)?.toString();

      if (publicClient && receiptTokenId != null && mintTransfer?.args.to) {
        const transferTo = getAddress(mintTransfer.args.to);
        const expectedOwner = getAddress(prepared.to);
        try {
          const currentOwner = getAddress(
            await publicClient.readContract({
              address: contractAddress,
              abi: erc721GalleryAbi,
              functionName: "ownerOf",
              args: [receiptTokenId]
            })
          );
          if (currentOwner === transferTo && currentOwner === expectedOwner) {
            let tokenUri = prepared.tokenUri;
            let recoveredItem: GalleryItem | null = null;
            try {
              tokenUri = await publicClient.readContract({
                address: contractAddress,
                abi: erc721GalleryAbi,
                functionName: "tokenURI",
                args: [receiptTokenId]
              });
              const metadata = (await fetch(metadataUrl(tokenUri)).then((response) => response.json())) as Record<string, unknown>;
              recoveredItem = galleryItemFromMetadata(receiptTokenId, tokenUri, metadata);
            } catch {
              recoveredItem = null;
            }
            const fallbackItem = galleryItemFromMintFallback({
              game,
              preview,
              tokenId: receiptTokenId,
              tokenUri,
              txHash: hash
            });
            const itemToRemember = recoveredItem ?? fallbackItem;
            if (itemToRemember) rememberRecoveredGalleryItem(itemToRemember);
          } else {
            console.warn("Minted NFT owner mismatch", {
              txHash: hash,
              tokenId: receiptTokenId.toString(),
              preparedTo: expectedOwner,
              transferTo,
              ownerOf: currentOwner
            });
          }
        } catch (event) {
          console.warn("Minted NFT receipt recovery failed", {
            txHash: hash,
            tokenId: receiptTokenId.toString(),
            transferTo,
            preparedTo: expectedOwner,
            error: event instanceof Error ? event.message : "Unknown recovery error"
          });
        }
      } else if (receipt) {
        console.warn("Mint receipt did not include a recoverable result NFT Transfer event", {
          txHash: hash,
          contractAddress
        });
      }

      rememberMintedGameId(game.id);
      setMintSucceeded(true);
      await api.recordMint({ gameId: game.id, txHash: hash, tokenId }).catch((event) => {
        console.warn("Mint record sync is pending", event);
      });
      setSuccessMessage("Congratulations! Your NFT has been minted successfully.");
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
      {mintSucceeded || game.mint.minted ? (
        <button className="primary-button centered" disabled>
          <Check size={18} />
          NFT minted
        </button>
      ) : (
        <button className="primary-button centered" disabled={busy || !preview} onClick={mint}>
          <Gem size={18} />
          {busy ? "Minting..." : "Confirm mint"}
        </button>
      )}
      {successMessage ? (
        <button className="toast success-toast" type="button" onClick={() => setSuccessMessage(null)} aria-live="polite">
          {successMessage}
        </button>
      ) : null}
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

function ProfileScreen({ profile, ownedCollection }: { profile: Profile; ownedCollection: GalleryItem[] }) {
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "all">("all");
  const [resultFilter, setResultFilter] = useState<GameResult | "all">("all");
  const [sort, setSort] = useState<"date" | "rarity">("date");

  const collection = useMemo(() => {
    const rarityWeight: Record<Rarity, number> = { common: 1, rare: 2, epic: 3, legendary: 4 };
    return ownedCollection
      .filter((item) => difficultyFilter === "all" || item.difficulty === difficultyFilter)
      .filter((item) => resultFilter === "all" || item.result === resultFilter)
      .sort((a, b) =>
        sort === "date"
          ? new Date(b.mintedAt).getTime() - new Date(a.mintedAt).getTime()
          : rarityWeight[b.rarity] - rarityWeight[a.rarity]
      );
  }, [difficultyFilter, ownedCollection, resultFilter, sort]);

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
          <Stat label="NFTs" value={ownedCollection.length} />
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
              {difficultyLabels[item.difficulty]} · {resultLabel(item.result)}
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
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
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

  const ownedNftCollection = useOwnedNftCollection(me?.profile ?? null, me?.user.address);

  async function start(difficulty: Difficulty) {
    setSelectedDifficulty(difficulty);
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
        <ProfileScreen profile={me.profile} ownedCollection={ownedNftCollection} />
      ) : me ? (
        <HomeScreen
          me={me}
          onStart={start}
          busy={busy}
          selectedDifficulty={selectedDifficulty}
          ownedNftCount={ownedNftCollection.length}
        />
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
