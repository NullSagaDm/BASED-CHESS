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
