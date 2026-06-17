/**
 * Seeds a single admin user from environment variables.
 * Idempotent — skips if the email already exists.
 *
 * Run:
 *   SEED_ADMIN_EMAIL=admin@example.com SEED_ADMIN_PASSWORD=secret123 \
 *     npx ts-node -r tsconfig-paths/register scripts/seed-admin.ts
 *
 * Or with .env loaded:
 *   npx dotenv -e .env -- npx ts-node scripts/seed-admin.ts
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

async function seedAdmin(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('ERROR: SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set.');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('ERROR: SEED_ADMIN_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  });

  try {
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      console.log(`Already exists: ${email}`);
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { email, passwordHash, role: 'ADMIN' },
    });

    console.log(`Admin created: ${email}`);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin().catch((err: unknown) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
