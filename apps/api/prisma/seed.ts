/**
 * CLI seed runner (`pnpm db:seed`). The canonical dataset lives in
 * `src/database/seed-demo.ts` so it can be reused by the dev-only
 * "reset demo data" endpoint.
 */
import { PrismaClient } from '@prisma/client';

import { seedDemoData } from '../src/database/seed-demo';

const prisma = new PrismaClient();

seedDemoData(prisma)
  .then((counts) => {
    // eslint-disable-next-line no-console
    console.log('✅ Seed complete:', counts);
  })
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
