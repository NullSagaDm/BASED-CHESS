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
