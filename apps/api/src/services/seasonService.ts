import { getSeasonWindow } from "@based-chess/shared";
import { prisma } from "../db.js";
import { env } from "../env.js";

export async function ensureSeason(at = new Date()) {
  const window = getSeasonWindow(at, env.SEASON_ZERO_START);

  const overlappingSeason = await prisma.season.findFirst({
    where: {
      NOT: { index: window.index },
      startsAt: { lt: new Date(window.endsAt) },
      endsAt: { gt: new Date(window.startsAt) }
    }
  });

  if (overlappingSeason) {
    throw new Error(Overlapping season row detected: ${overlappingSeason.label});
  }

  return prisma.season.upsert({
    where: { index: window.index },
    update: {
      label: window.label,
      startsAt: new Date(window.startsAt),
      endsAt: new Date(window.endsAt)
    },
    create: {
      index: window.index,
      label: window.label,
      startsAt: new Date(window.startsAt),
      endsAt: new Date(window.endsAt)
    }
  });
}

export async function getCurrentSeason() {
  return ensureSeason(new Date());
}