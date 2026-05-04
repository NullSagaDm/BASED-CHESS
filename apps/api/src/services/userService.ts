import { prisma } from "../db.js";
import { normalizeAddress } from "../domain.js";

export async function findOrCreateUserByWallet(address: string) {
  const walletAddress = normalizeAddress(address);
  const wallet = await prisma.walletIdentity.findUnique({
    where: { walletAddress },
    include: { user: true }
  });

  if (wallet) return wallet.user;

  return prisma.user.create({
    data: {
      primaryWallet: walletAddress,
      wallets: {
        create: { walletAddress }
      },
      stats: {
        create: {}
      }
    }
  });
}
