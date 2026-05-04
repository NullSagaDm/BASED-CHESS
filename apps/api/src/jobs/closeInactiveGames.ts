import { prisma } from "../db.js";
import { closeInactiveGames } from "../services/gameService.js";

const closed = await closeInactiveGames();
console.log(`Closed ${closed} inactive game(s).`);
await prisma.$disconnect();
