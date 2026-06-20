import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  const product = await prisma.product.findFirst({
    where: { name: { contains: "AR11637" } },
  });

  if (!product) { console.log("Producto no encontrado"); return; }

  const updated = await prisma.product.update({
    where: { id: product.id },
    data: { price: 199 },
  });

  console.log(`✓ Precio actualizado: ${updated.name} → €${updated.price}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
