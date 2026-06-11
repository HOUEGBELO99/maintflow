/**
 * Seed — ports the prototype's demo dataset (Industries Nord, Site de Lyon).
 * Idempotent: safe to run repeatedly. Run with `pnpm db:seed`.
 *
 * NOTE: Users here are application profiles only. In a real environment the
 * matching Supabase auth users must be created via the Admin API and their
 * UID used as `User.id`. For local dev we generate deterministic UUIDs.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const site = await prisma.site.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Industries Nord — Site de Lyon',
      hourlyDowntimeCost: 850,
      currency: 'EUR',
    },
  });

  const machines = [
    { code: 'MCH-001', name: 'Compresseur Atlas A7', type: 'compresseur', workshop: 'Atelier A', state: 'ok', criticality: 'high', hourlyCost: 1200, lifespanYears: 12, runtime: 14328 },
    { code: 'MCH-002', name: 'Convoyeur Ligne 2', type: 'convoyeur', workshop: 'Atelier A', state: 'fault', criticality: 'high', hourlyCost: 1800, lifespanYears: 15, runtime: 22510 },
    { code: 'MCH-003', name: 'Tour CNC Mazak QT', type: 'machine-outil', workshop: 'Atelier B', state: 'ok', criticality: 'high', hourlyCost: 1500, lifespanYears: 14, runtime: 9120 },
    { code: 'MCH-004', name: 'Presse hydraulique 250T', type: 'presse', workshop: 'Atelier B', state: 'maintenance', criticality: 'high', hourlyCost: 1100, lifespanYears: 20, runtime: 31204 },
    { code: 'MCH-008', name: 'Chaudière vapeur CV2', type: 'chaudiere', workshop: 'Utilités', state: 'fault', criticality: 'high', hourlyCost: 2200, lifespanYears: 25, runtime: 52310 },
  ] as const;

  for (const m of machines) {
    await prisma.machine.upsert({
      where: { siteId_code: { siteId: site.id, code: m.code } },
      update: {},
      create: {
        siteId: site.id,
        code: m.code,
        name: m.name,
        type: m.type,
        workshop: m.workshop,
        installedAt: new Date('2021-01-01'),
        state: m.state,
        criticality: m.criticality,
        hourlyCost: m.hourlyCost,
        lifespanYears: m.lifespanYears,
        runtime: m.runtime,
      },
    });
  }

  const parts = [
    { ref: 'SKF-6208', name: 'Roulement SKF 6208-2RS', stock: 3, min: 5, location: 'Magasin A · R3-B2', unitCost: 42, forTypes: ['convoyeur', 'moteur', 'pompe'] },
    { ref: 'LES-441-16', name: 'Soupape sécurité vapeur 16b', stock: 0, min: 2, location: 'Magasin B · R4-A1', unitCost: 310, forTypes: ['chaudiere'] },
    { ref: 'ATL-1622-0658', name: 'Filtre à huile compresseur', stock: 15, min: 6, location: 'Magasin A · R1-B1', unitCost: 34, forTypes: ['compresseur'] },
  ] as const;

  for (const p of parts) {
    await prisma.part.upsert({
      where: { siteId_ref: { siteId: site.id, ref: p.ref } },
      update: {},
      create: { siteId: site.id, ...p, forTypes: [...p.forTypes] },
    });
  }

  // eslint-disable-next-line no-console
  console.log('✅ Seed complete:', { site: site.name, machines: machines.length, parts: parts.length });
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
