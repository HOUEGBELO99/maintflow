/**
 * Dev-only helper: mint a Supabase-shaped access token for a seeded user, so
 * you can exercise the protected API locally without a real Supabase project.
 *
 * The token is HS256-signed with SUPABASE_JWT_SECRET — exactly what the
 * JwtAuthGuard verifies. `sub` is the User.id (must exist in the DB).
 *
 * Usage:
 *   pnpm --filter @maintflow/api token                 # default: admin
 *   pnpm --filter @maintflow/api token s.diallo@usine.fr
 *
 * NEVER use this against a real environment — it is a local stand-in for
 * Supabase Auth issuing tokens.
 */
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const DEFAULT_EMAIL = 'l.moreau@usine.fr';

async function main(): Promise<void> {
  const email = process.argv[2] ?? DEFAULT_EMAIL;
  const secret = process.env.SUPABASE_JWT_SECRET;
  const audience = process.env.ACCESS_TOKEN_AUDIENCE ?? 'authenticated';
  if (!secret) throw new Error('SUPABASE_JWT_SECRET is not set (load ../../.env)');

  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique({ where: { email } });
  await prisma.$disconnect();
  if (!user) throw new Error(`No seeded user with email "${email}". Run pnpm db:seed first.`);

  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      aud: audience,
      role: 'authenticated', // Supabase puts the DB auth role here, not our app role
    },
    secret,
    { algorithm: 'HS256', expiresIn: '12h' },
  );

  // eslint-disable-next-line no-console
  console.log(token);
  // eslint-disable-next-line no-console
  console.error(`# ${user.role} · ${user.email} · site ${user.siteId}`);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
