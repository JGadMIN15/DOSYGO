// Create or update an admin user (for the /admin panel login).
//
//   npx tsx scripts/create-admin.ts <email> <password> [nombre] [role]
//
// role: "admin" | "editor" (default "editor"). Requires DATABASE_URL in .env.

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { hashPassword } from "../src/lib/auth";

const [, , emailArg, password, name = "Admin", role = "editor"] = process.argv;

if (!emailArg || !password) {
  console.error(
    "Uso: npx tsx scripts/create-admin.ts <email> <password> [nombre] [role]"
  );
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL no está definido (ponlo en .env)");
  process.exit(1);
}

const email = emailArg.toLowerCase();
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const passwordHash = hashPassword(password);
  const user = await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash, name, role },
    create: { email, passwordHash, name, role },
  });
  console.log(`✓ Admin listo: ${user.email} (${user.role})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
