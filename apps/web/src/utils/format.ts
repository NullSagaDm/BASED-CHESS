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
