import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  const prisma = {
    machine: { findMany: jest.fn() },
    fault: { findMany: jest.fn(), groupBy: jest.fn() },
    intervention: { findMany: jest.fn() },
    part: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [DashboardService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(DashboardService);
  });

  it('computes KPIs, weighted health and MTTR scoped to the site', async () => {
    prisma.machine.findMany.mockResolvedValue([
      { state: 'ok', criticality: 'high' },
      { state: 'fault', criticality: 'high' },
      { state: 'maintenance', criticality: 'low' },
    ]);
    prisma.fault.findMany.mockResolvedValue([
      { status: 'pending', severity: 'critical' },
      { status: 'in_progress', severity: 'medium' },
      { status: 'resolved', severity: 'low' },
    ]);
    prisma.intervention.findMany.mockResolvedValue([
      { status: 'in_progress', kind: 'corrective', duration: 4, actualDuration: null },
      { status: 'planned', kind: 'preventive', duration: 2, actualDuration: null },
      { status: 'completed', kind: 'corrective', duration: 2, actualDuration: 3 },
      { status: 'completed', kind: 'corrective', duration: 1, actualDuration: 1 },
    ]);
    prisma.part.findMany.mockResolvedValue([
      { stock: 0, min: 2 },
      { stock: 9, min: 5 },
    ]);

    const kpis = await service.getKpis('site-1');

    // Tenant scoping: every query filtered by siteId.
    expect(prisma.machine.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { siteId: 'site-1' } }),
    );

    expect(kpis.totalMachines).toBe(3);
    expect(kpis.ok).toBe(1);
    expect(kpis.fault).toBe(1);
    expect(kpis.maintenance).toBe(1);
    expect(kpis.activeFaults).toBe(2);
    expect(kpis.criticalFaults).toBe(1);
    expect(kpis.inProgressInterventions).toBe(1);
    expect(kpis.plannedInterventions).toBe(1);
    expect(kpis.lowStock).toBe(1);
    expect(kpis.mttr).toBe(2); // (3 + 1) / 2
    // health = (3*100 + 3*8 + 1*58) / (3+3+1) = 382/7 ≈ 55
    expect(kpis.healthScore).toBe(55);
  });

  it('returns null MTTR when no corrective work is completed', async () => {
    prisma.machine.findMany.mockResolvedValue([]);
    prisma.fault.findMany.mockResolvedValue([]);
    prisma.intervention.findMany.mockResolvedValue([
      { status: 'planned', kind: 'corrective', duration: 4, actualDuration: null },
    ]);
    prisma.part.findMany.mockResolvedValue([]);

    const kpis = await service.getKpis('site-1');
    expect(kpis.mttr).toBeNull();
    expect(kpis.healthScore).toBe(100);
  });
});
