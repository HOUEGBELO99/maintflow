/**
 * Seed — ports the prototype's demo dataset (Industries Nord, Site de Lyon).
 * Idempotent: safe to run repeatedly (`pnpm db:seed`).
 *
 * Local dev only. In production, User.id MUST equal the Supabase auth UID.
 * IDs here are deterministic but valid v4-format UUIDs (version nibble 4,
 * variant nibble a) so they also pass @IsUUID() when referenced as FKs.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SITE_ID = '00000000-0000-0000-0000-000000000001';

/** Prototype technician display-name → application user id. */
const U: Record<string, string> = {
  'L. Moreau': '00000000-0000-4000-a000-000000000101',
  'S. Diallo': '00000000-0000-4000-a000-000000000102',
  'J. Petit': '00000000-0000-4000-a000-000000000103',
  'T. Khan': '00000000-0000-4000-a000-000000000104',
};

async function main(): Promise<void> {
  const site = await prisma.site.upsert({
    where: { id: SITE_ID },
    update: {},
    create: { id: SITE_ID, name: 'Industries Nord — Site de Lyon', hourlyDowntimeCost: 850, currency: 'EUR' },
  });

  // ── Users (U1..U6) ─────────────────────────────────────────────────────────
  const users = [
    { id: U['L. Moreau'], name: 'Laurent Moreau', email: 'l.moreau@usine.fr', role: 'admin', workshop: 'Tous', color: '#00C24A', initials: 'LM' },
    { id: U['S. Diallo'], name: 'Sophie Diallo', email: 's.diallo@usine.fr', role: 'technicien', workshop: 'Atelier A', color: '#2563EB', initials: 'SD' },
    { id: U['J. Petit'], name: 'Julien Petit', email: 'j.petit@usine.fr', role: 'technicien', workshop: 'Atelier B', color: '#F59E0B', initials: 'JP' },
    { id: U['T. Khan'], name: 'Tarek Khan', email: 't.khan@usine.fr', role: 'operateur', workshop: 'Atelier B', color: '#7C3AED', initials: 'TK' },
    { id: '00000000-0000-4000-a000-000000000105', name: 'Marie Roux', email: 'm.roux@usine.fr', role: 'chef_maintenance', workshop: 'Direction', color: '#0E1410', initials: 'MR' },
    { id: '00000000-0000-4000-a000-000000000106', name: 'Hervé Akkari', email: 'h.akkari@usine.fr', role: 'chef_atelier', workshop: 'Direction', color: '#0EA5A0', initials: 'HA' },
  ] as const;
  for (const u of users) {
    await prisma.user.upsert({ where: { id: u.id }, update: {}, create: { siteId: site.id, ...u } });
  }

  // Technician performance profiles (linked to field users).
  const technicians = [
    { id: '00000000-0000-4000-a000-000000000501', userId: U['L. Moreau'], title: 'Technicien sénior', specialties: ['mécanique', 'hydraulique'], available: true, onTime: 94, rating: 4.8, doneThisMonth: 14 },
    { id: '00000000-0000-4000-a000-000000000502', userId: U['S. Diallo'], title: 'Technicien', specialties: ['électrique', 'mécanique'], available: true, onTime: 88, rating: 4.5, doneThisMonth: 11 },
    { id: '00000000-0000-4000-a000-000000000503', userId: U['J. Petit'], title: 'Technicien', specialties: ['électrique', 'logiciel'], available: false, onTime: 91, rating: 4.6, doneThisMonth: 9 },
    { id: '00000000-0000-4000-a000-000000000504', userId: U['T. Khan'], title: 'Technicien junior', specialties: ['hydraulique', 'mécanique'], available: true, onTime: 79, rating: 4.2, doneThisMonth: 7 },
  ] as const;
  for (const t of technicians) {
    await prisma.technician.upsert({
      where: { id: t.id },
      update: { title: t.title },
      create: { id: t.id, userId: t.userId, title: t.title, specialties: [...t.specialties], available: t.available, onTime: t.onTime, rating: t.rating, doneThisMonth: t.doneThisMonth },
    });
  }

  // ── Machines (12) ──────────────────────────────────────────────────────────
  const machines = [
    { id: '00000000-0000-4000-a000-000000000201', code: 'MCH-001', name: 'Compresseur Atlas A7', type: 'compresseur', workshop: 'Atelier A', installedAt: '2021-04-18', state: 'ok', runtime: 14328, criticality: 'high', hourlyCost: 1200, lifespanYears: 12 },
    { id: '00000000-0000-4000-a000-000000000202', code: 'MCH-002', name: 'Convoyeur Ligne 2', type: 'convoyeur', workshop: 'Atelier A', installedAt: '2019-11-02', state: 'fault', runtime: 22510, criticality: 'high', hourlyCost: 1800, lifespanYears: 15 },
    { id: '00000000-0000-4000-a000-000000000203', code: 'MCH-003', name: 'Tour CNC Mazak QT', type: 'machine-outil', workshop: 'Atelier B', installedAt: '2022-08-15', state: 'ok', runtime: 9120, criticality: 'high', hourlyCost: 1500, lifespanYears: 14 },
    { id: '00000000-0000-4000-a000-000000000204', code: 'MCH-004', name: 'Presse hydraulique 250T', type: 'presse', workshop: 'Atelier B', installedAt: '2018-03-01', state: 'maintenance', runtime: 31204, criticality: 'high', hourlyCost: 1100, lifespanYears: 20 },
    { id: '00000000-0000-4000-a000-000000000205', code: 'MCH-005', name: 'Pompe doseuse P12', type: 'pompe', workshop: 'Atelier C', installedAt: '2020-06-22', state: 'ok', runtime: 18790, criticality: 'medium', hourlyCost: 420, lifespanYears: 10 },
    { id: '00000000-0000-4000-a000-000000000206', code: 'MCH-006', name: 'Moteur ventilation V3', type: 'moteur', workshop: 'Atelier C', installedAt: '2017-09-10', state: 'ok', runtime: 41280, criticality: 'low', hourlyCost: 180, lifespanYears: 18 },
    { id: '00000000-0000-4000-a000-000000000207', code: 'MCH-007', name: 'Robot soudure FANUC', type: 'robot', workshop: 'Atelier B', installedAt: '2023-01-30', state: 'ok', runtime: 5340, criticality: 'high', hourlyCost: 1600, lifespanYears: 12 },
    { id: '00000000-0000-4000-a000-000000000208', code: 'MCH-008', name: 'Chaudière vapeur CV2', type: 'chaudiere', workshop: 'Utilités', installedAt: '2016-05-12', state: 'fault', runtime: 52310, criticality: 'high', hourlyCost: 2200, lifespanYears: 25 },
    { id: '00000000-0000-4000-a000-000000000209', code: 'MCH-009', name: 'Pont roulant 5T', type: 'manutention', workshop: 'Atelier A', installedAt: '2015-11-08', state: 'ok', runtime: 26890, criticality: 'medium', hourlyCost: 600, lifespanYears: 22 },
    { id: '00000000-0000-4000-a000-000000000210', code: 'MCH-010', name: 'Extrudeuse E4', type: 'extrudeuse', workshop: 'Atelier D', installedAt: '2021-12-04', state: 'ok', runtime: 11240, criticality: 'high', hourlyCost: 1400, lifespanYears: 14 },
    { id: '00000000-0000-4000-a000-000000000211', code: 'MCH-011', name: 'Refroidisseur RC-3', type: 'refrigeration', workshop: 'Utilités', installedAt: '2019-07-19', state: 'maintenance', runtime: 28100, criticality: 'medium', hourlyCost: 520, lifespanYears: 16 },
    { id: '00000000-0000-4000-a000-000000000212', code: 'MCH-012', name: 'Découpe laser TruLaser', type: 'machine-outil', workshop: 'Atelier B', installedAt: '2022-03-25', state: 'ok', runtime: 7920, criticality: 'high', hourlyCost: 1700, lifespanYears: 13 },
  ] as const;
  const mid = (code: string): string => machines.find((m) => m.code === code)!.id;
  for (const m of machines) {
    await prisma.machine.upsert({
      where: { id: m.id },
      update: {},
      create: {
        id: m.id, siteId: site.id, code: m.code, name: m.name, type: m.type, workshop: m.workshop,
        installedAt: new Date(m.installedAt), state: m.state, runtime: m.runtime,
        criticality: m.criticality, hourlyCost: m.hourlyCost, lifespanYears: m.lifespanYears,
      },
    });
  }

  // ── Faults (F-2032..F-2041) — accents/hyphens mapped to enum values ─────────
  const faults = [
    { id: '00000000-0000-4000-a000-000000000341', code: 'F-2041', machine: 'MCH-002', type: 'mecanique', description: 'Roulement palier moteur en surchauffe, vibrations anormales détectées', severity: 'critical', status: 'in_progress', rootCause: 'usure', by: 'L. Moreau', reportedAt: '2026-05-21T08:14:00', takenAt: '2026-05-21T08:31:00' },
    { id: '00000000-0000-4000-a000-000000000340', code: 'F-2040', machine: 'MCH-008', type: 'hydraulique', description: 'Fuite vapeur niveau soupape de sécurité — pression instable', severity: 'critical', status: 'pending', rootCause: null, by: 'S. Diallo', reportedAt: '2026-05-21T06:42:00', takenAt: null },
    { id: '00000000-0000-4000-a000-000000000339', code: 'F-2039', machine: 'MCH-004', type: 'electrique', description: 'Disjoncteur principal saute en charge — à investiguer câblage', severity: 'medium', status: 'in_progress', rootCause: 'défaut matériau', by: 'J. Petit', reportedAt: '2026-05-20T15:20:00', takenAt: '2026-05-20T16:05:00' },
    { id: '00000000-0000-4000-a000-000000000338', code: 'F-2038', machine: 'MCH-011', type: 'mecanique', description: 'Bruit anormal compresseur frigorifique', severity: 'medium', status: 'in_progress', rootCause: 'usure', by: 'T. Khan', reportedAt: '2026-05-20T10:05:00', takenAt: '2026-05-20T11:00:00' },
    { id: '00000000-0000-4000-a000-000000000337', code: 'F-2037', machine: 'MCH-005', type: 'hydraulique', description: 'Pression de refoulement en baisse continue', severity: 'low', status: 'resolved', rootCause: 'usure', by: 'L. Moreau', reportedAt: '2026-05-17T11:30:00', takenAt: '2026-05-17T13:00:00' },
    { id: '00000000-0000-4000-a000-000000000336', code: 'F-2036', machine: 'MCH-001', type: 'electrique', description: 'Capteur de pression défaillant remplacé', severity: 'low', status: 'resolved', rootCause: 'défaut matériau', by: 'S. Diallo', reportedAt: '2026-05-16T09:00:00', takenAt: '2026-05-16T09:30:00' },
    { id: '00000000-0000-4000-a000-000000000335', code: 'F-2035', machine: 'MCH-007', type: 'logiciel', description: 'Erreur axe Z — recalibration nécessaire', severity: 'medium', status: 'resolved', rootCause: 'erreur opérateur', by: 'J. Petit', reportedAt: '2026-05-15T14:45:00', takenAt: '2026-05-15T15:10:00' },
    { id: '00000000-0000-4000-a000-000000000334', code: 'F-2034', machine: 'MCH-002', type: 'electrique', description: 'Variateur de fréquence — défaut alimentation intermittent', severity: 'medium', status: 'resolved', rootCause: 'usure', by: 'L. Moreau', reportedAt: '2026-05-14T08:00:00', takenAt: '2026-05-14T08:40:00' },
    { id: '00000000-0000-4000-a000-000000000333', code: 'F-2033', machine: 'MCH-008', type: 'mecanique', description: 'Vibration ventilateur tirage — équilibrage requis', severity: 'medium', status: 'resolved', rootCause: 'usure', by: 'T. Khan', reportedAt: '2026-05-10T13:10:00', takenAt: '2026-05-10T14:00:00' },
    { id: '00000000-0000-4000-a000-000000000332', code: 'F-2032', machine: 'MCH-002', type: 'mecanique', description: 'Glissement bande convoyeur — tension à régler', severity: 'low', status: 'resolved', rootCause: 'usure', by: 'S. Diallo', reportedAt: '2026-05-06T09:25:00', takenAt: '2026-05-06T10:00:00' },
  ] as const;
  const fid = (code: string): string => faults.find((f) => f.code === code)!.id;
  for (const f of faults) {
    await prisma.fault.upsert({
      where: { id: f.id },
      update: {},
      create: {
        id: f.id, siteId: site.id, machineId: mid(f.machine), type: f.type, description: f.description,
        severity: f.severity, status: f.status, rootCause: f.rootCause, reportedById: U[f.by],
        reportedAt: new Date(f.reportedAt), takenAt: f.takenAt ? new Date(f.takenAt) : null,
        resolvedAt: f.status === 'resolved' && f.takenAt ? new Date(f.takenAt) : null,
      },
    });
  }

  // ── Preventive plan rules (PM-01..PM-05) ────────────────────────────────────
  const planRules = [
    { id: '00000000-0000-4000-a000-000000000601', code: 'PM-01', title: 'Visite trimestrielle compresseur', machine: 'MCH-001', everyWeeks: 12, by: 'L. Moreau', duration: 2, nextDue: '2026-05-23' },
    { id: '00000000-0000-4000-a000-000000000602', code: 'PM-02', title: 'Graissage broche tour CNC', machine: 'MCH-003', everyWeeks: 4, by: 'J. Petit', duration: 2, nextDue: '2026-05-25' },
    { id: '00000000-0000-4000-a000-000000000603', code: 'PM-03', title: 'Calibration robot soudure', machine: 'MCH-007', everyWeeks: 8, by: 'T. Khan', duration: 4, nextDue: '2026-05-26' },
    { id: '00000000-0000-4000-a000-000000000604', code: 'PM-04', title: 'Contrôle annuel moteur ventilation', machine: 'MCH-006', everyWeeks: 52, by: 'L. Moreau', duration: 1, nextDue: '2026-06-12' },
    { id: '00000000-0000-4000-a000-000000000605', code: 'PM-05', title: 'Lubrification pont roulant', machine: 'MCH-009', everyWeeks: 4, by: 'S. Diallo', duration: 1, nextDue: '2026-05-28' },
  ] as const;
  const pid = (code: string): string => planRules.find((p) => p.code === code)!.id;
  for (const p of planRules) {
    await prisma.planRule.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id, siteId: site.id, machineId: mid(p.machine), title: p.title, everyWeeks: p.everyWeeks,
        technicianId: U[p.by], duration: p.duration, nextDue: new Date(p.nextDue),
      },
    });
  }

  // ── Interventions (I-1071..I-1082) ──────────────────────────────────────────
  const interventions = [
    { id: '00000000-0000-4000-a000-000000000482', machine: 'MCH-002', by: 'S. Diallo', kind: 'corrective', description: 'Remplacement roulement palier moteur, alignement convoyeur', scheduledFor: '2026-05-21', duration: 4, status: 'in_progress', fault: 'F-2041', plan: null, checklist: [
      { label: 'Consignation électrique (LOTO)', done: true },
      { label: 'Dépose carter de protection', done: true },
      { label: 'Extraction roulement défectueux', done: false },
      { label: 'Montage roulement neuf + graissage', done: false },
      { label: 'Réalignement et test à vide', done: false },
    ], actualDuration: null, rating: null, signedBy: null },
    { id: '00000000-0000-4000-a000-000000000481', machine: 'MCH-008', by: 'J. Petit', kind: 'corrective', description: 'Diagnostic fuite vapeur + remplacement soupape', scheduledFor: '2026-05-21', duration: 6, status: 'planned', fault: 'F-2040', plan: null, checklist: [], actualDuration: null, rating: null, signedBy: null },
    { id: '00000000-0000-4000-a000-000000000480', machine: 'MCH-004', by: 'T. Khan', kind: 'corrective', description: 'Test isolement câblage moteur presse hydraulique', scheduledFor: '2026-05-22', duration: 3, status: 'planned', fault: 'F-2039', plan: null, checklist: [], actualDuration: null, rating: null, signedBy: null },
    { id: '00000000-0000-4000-a000-000000000479', machine: 'MCH-001', by: 'L. Moreau', kind: 'preventive', description: 'Visite trimestrielle compresseur — filtration, huile, courroies', scheduledFor: '2026-05-23', duration: 2, status: 'planned', fault: null, plan: 'PM-01', checklist: [], actualDuration: null, rating: null, signedBy: null },
    { id: '00000000-0000-4000-a000-000000000478', machine: 'MCH-011', by: 'S. Diallo', kind: 'corrective', description: 'Recharge fluide frigorigène + contrôle compresseur', scheduledFor: '2026-05-24', duration: 3, status: 'planned', fault: 'F-2038', plan: null, checklist: [], actualDuration: null, rating: null, signedBy: null },
    { id: '00000000-0000-4000-a000-000000000477', machine: 'MCH-003', by: 'J. Petit', kind: 'preventive', description: 'Maintenance préventive tour CNC — graissage broche', scheduledFor: '2026-05-25', duration: 2, status: 'planned', fault: null, plan: 'PM-02', checklist: [], actualDuration: null, rating: null, signedBy: null },
    { id: '00000000-0000-4000-a000-000000000476', machine: 'MCH-007', by: 'T. Khan', kind: 'preventive', description: 'Calibration robot soudure + mise à jour firmware', scheduledFor: '2026-05-26', duration: 4, status: 'planned', fault: null, plan: 'PM-03', checklist: [], actualDuration: null, rating: null, signedBy: null },
    { id: '00000000-0000-4000-a000-000000000475', machine: 'MCH-005', by: 'L. Moreau', kind: 'corrective', description: 'Remplacement membrane pompe doseuse', scheduledFor: '2026-05-17', duration: 1.5, status: 'completed', fault: 'F-2037', plan: null, checklist: [], actualDuration: 2.25, rating: 5, signedBy: 'L. Moreau' },
    { id: '00000000-0000-4000-a000-000000000474', machine: 'MCH-001', by: 'S. Diallo', kind: 'corrective', description: 'Remplacement capteur de pression', scheduledFor: '2026-05-16', duration: 1, status: 'completed', fault: 'F-2036', plan: null, checklist: [], actualDuration: 1, rating: 4, signedBy: 'S. Diallo' },
    { id: '00000000-0000-4000-a000-000000000473', machine: 'MCH-007', by: 'J. Petit', kind: 'corrective', description: 'Recalibration axe Z robot soudure', scheduledFor: '2026-05-15', duration: 2, status: 'completed', fault: 'F-2035', plan: null, checklist: [], actualDuration: 1.5, rating: 5, signedBy: 'J. Petit' },
    { id: '00000000-0000-4000-a000-000000000472', machine: 'MCH-002', by: 'T. Khan', kind: 'corrective', description: 'Réparation variateur convoyeur', scheduledFor: '2026-05-14', duration: 2.5, status: 'completed', fault: 'F-2034', plan: null, checklist: [], actualDuration: 3.75, rating: 3, signedBy: 'T. Khan' },
    { id: '00000000-0000-4000-a000-000000000471', machine: 'MCH-006', by: 'L. Moreau', kind: 'preventive', description: 'Contrôle annuel moteur ventilation', scheduledFor: '2026-05-12', duration: 1, status: 'completed', fault: null, plan: 'PM-04', checklist: [], actualDuration: 1, rating: 5, signedBy: 'L. Moreau' },
  ] as const;
  for (const i of interventions) {
    const startedAt = i.status === 'in_progress' || i.status === 'completed' ? new Date(`${i.scheduledFor}T08:00:00`) : null;
    const endHour = String(8 + Math.round(i.actualDuration ?? i.duration)).padStart(2, '0');
    const completedAt = i.status === 'completed' ? new Date(`${i.scheduledFor}T${endHour}:00:00`) : null;
    await prisma.intervention.upsert({
      where: { id: i.id },
      update: {},
      create: {
        id: i.id, siteId: site.id, machineId: mid(i.machine), technicianId: U[i.by], kind: i.kind,
        description: i.description, scheduledFor: new Date(i.scheduledFor), duration: i.duration, status: i.status,
        linkedFaultId: i.fault ? fid(i.fault) : null, planRuleId: i.plan ? pid(i.plan) : null,
        checklist: i.checklist as unknown as object[], actualDuration: i.actualDuration, rating: i.rating,
        signedBy: i.signedBy, startedAt, completedAt,
      },
    });
  }

  // ── Spare parts ─────────────────────────────────────────────────────────────
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
  console.log('✅ Seed complete:', {
    site: site.name,
    users: users.length,
    technicians: technicians.length,
    machines: machines.length,
    faults: faults.length,
    planRules: planRules.length,
    interventions: interventions.length,
    parts: parts.length,
  });
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
