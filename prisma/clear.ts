import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  const deleted = await prisma.product.deleteMany();
  console.log(`Eliminados ${deleted.count} productos.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
