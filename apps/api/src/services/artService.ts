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
