import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_94vpuGrycFEw@ep-bold-leaf-ajask39f.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require",
  ssl: { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.product.deleteMany();

  const product = await prisma.product.create({
    data: {
      name: "Emporio Armani Racer AR11637",
      brand: "Emporio Armani",
      category: "Cronógrafos",
      description:
        "Reloj cronógrafo Emporio Armani Racer AR11637 para hombre. Caja de acero inoxidable de 43mm, esfera negra con subdiales en acero, cristal mineral resistente a arañazos. Movimiento de cuarzo japonés con función cronógrafo. Correa de acero inoxidable con cierre de mariposa. Resistente al agua hasta 50 metros. Diseño italiano con elegancia urbana.",
      price: 199,
      images: JSON.stringify([
        "/productos/ar11637/1.jpeg",
        "/productos/ar11637/2.jpeg",
        "/productos/ar11637/3.jpeg",
      ]),
      stock: 10,
      featured: true,
    },
  });

  console.log(`✓ ${product.name} — €${product.price}`);
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
