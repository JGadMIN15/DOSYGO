// Invite an admin: creates (or resets) an account WITHOUT a password and prints
// a one-time activation link. The person sets their own password on first login.
//
//   npx tsx scripts/invite-admin.ts <email> [nombre] [role]
//
// role: "admin" | "editor" (default "editor"). Requires DATABASE_URL in .env.

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { generateSetupToken } from "../src/lib/auth";

const [, , emailArg, name = "Admin", role = "editor"] = process.argv;

if (!emailArg) {
  console.error("Uso: npx tsx scripts/invite-admin.ts <email> [nombre] [role]");
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL no está definido (ponlo en .env)");
  process.exit(1);
}

const email = emailArg.toLowerCase();
const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
const { raw, hash } = generateSetupToken();
const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  await prisma.adminUser.upsert({
    where: { email },
    update: {
      name,
      role,
      passwordHash: null,
      setupToken: hash,
      setupTokenExpires: expires,
    },
    create: {
      email,
      name,
      role,
      setupToken: hash,
      setupTokenExpires: expires,
    },
  });

  console.log(`\n✓ Cuenta lista para ${email} (${role}).`);
  console.log("\nEnlace de activación (válido 7 días, un solo uso):");
  console.log(`\n  ${appUrl}/admin/activar?token=${raw}\n`);
  console.log("Para producción usa el mismo token con tu dominio:");
  console.log(`\n  https://dosygo.es/admin/activar?token=${raw}\n`);
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
