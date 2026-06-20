import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  const product = await prisma.product.create({
    data: {
      name: "Emporio Armani Racer AR11637",
      brand: "Emporio Armani",
      category: "Cronógrafos",
      description:
        "Reloj cronógrafo Emporio Armani Racer AR11637 para hombre. Caja de acero inoxidable de 43mm, esfera negra con subdiales en acero, cristal mineral resistente a arañazos. Movimiento de cuarzo japonés con función cronógrafo. Correa de acero inoxidable con cierre de mariposa. Resistente al agua hasta 50 metros. Diseño italiano con elegancia urbana.",
      price: 235,
      images: JSON.stringify([""]),
      stock: 10,
      featured: true,
    },
  });

  console.log(`✓ Producto añadido: ${product.name} — €${product.price}`);
  console.log(`  ID: ${product.id}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
