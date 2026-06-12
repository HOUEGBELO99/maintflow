import { Injectable } from '@nestjs/common';

import type { DashboardKpis } from '@maintflow/shared';
import { Criticality, FaultStatus, InterventionKind, InterventionStatus, MachineState } from '@maintflow/shared';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Read-only analytics, faithfully ported from the prototype's data.js helpers
 * (computeKPIs, healthScore, computeMTTR, faultsByType, topFaultMachines).
 * Every query is scoped by `siteId`.
 */
@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getKpis(siteId: string): Promise<DashboardKpis> {
    const [machines, faults, interventions, parts, availableTechnicians] = await Promise.all([
      this.prisma.machine.findMany({ where: { siteId }, select: { state: true, criticality: true } }),
      this.prisma.fault.findMany({ where: { siteId }, select: { status: true, severity: true } }),
      this.prisma.intervention.findMany({
        where: { siteId },
        select: { status: true, kind: true, duration: true, actualDuration: true },
      }),
      this.prisma.part.findMany({ where: { siteId }, select: { stock: true, min: true } }),
      this.prisma.technician.count({ where: { available: true, user: { siteId } } }),
    ]);

    const activeFaults = faults.filter((f) => f.status !== FaultStatus.RESOLVED);

    // MTTR (hours): mean of actual (or planned) durations of completed corrective work.
    const doneCorrective = interventions.filter(
      (i) => i.status === InterventionStatus.COMPLETED && i.kind === InterventionKind.CORRECTIVE,
    );
    const mttr = doneCorrective.length
      ? Math.round(
          (doneCorrective.reduce((s, i) => s + (i.actualDuration ?? i.duration), 0) /
            doneCorrective.length) *
            10,
        ) / 10
      : null;

    return {
      totalMachines: machines.length,
      ok: machines.filter((m) => m.state === MachineState.OK).length,
      fault: machines.filter((m) => m.state === MachineState.FAULT).length,
      maintenance: machines.filter((m) => m.state === MachineState.MAINTENANCE).length,
      activeFaults: activeFaults.length,
      criticalFaults: activeFaults.filter((f) => f.severity === 'critical').length,
      inProgressInterventions: interventions.filter((i) => i.status === InterventionStatus.IN_PROGRESS).length,
      plannedInterventions: interventions.filter((i) => i.status === InterventionStatus.PLANNED).length,
      lowStock: parts.filter((p) => p.stock < p.min).length,
      availableTechnicians,
      healthScore: this.healthScore(machines),
      mttr,
    };
  }

  /** Global health 0–100, weighted by machine criticality. */
  private healthScore(machines: { state: MachineState; criticality: Criticality }[]): number {
    const stateScore: Record<MachineState, number> = {
      [MachineState.OK]: 100,
      [MachineState.MAINTENANCE]: 58,
      [MachineState.FAULT]: 8,
    };
    const weight: Record<Criticality, number> = {
      [Criticality.HIGH]: 3,
      [Criticality.MEDIUM]: 2,
      [Criticality.LOW]: 1,
    };
    let num = 0;
    let den = 0;
    for (const m of machines) {
      const w = weight[m.criticality] ?? 1;
      num += w * (stateScore[m.state] ?? 60);
      den += w;
    }
    return den ? Math.round(num / den) : 100;
  }

  /** Fault count grouped by type. */
  async faultsByType(siteId: string): Promise<{ type: string; count: number }[]> {
    const grouped = await this.prisma.fault.groupBy({
      by: ['type'],
      where: { siteId },
      _count: { _all: true },
    });
    return grouped
      .map((g) => ({ type: g.type, count: g._count._all }))
      .sort((a, b) => b.count - a.count);
  }

  /** Machines with the most faults (all-time), with their code + name. */
  async topFaultMachines(
    siteId: string,
    n = 5,
  ): Promise<{ machineId: string; code: string; name: string; count: number }[]> {
    const grouped = await this.prisma.fault.groupBy({
      by: ['machineId'],
      where: { siteId },
      _count: { _all: true },
      orderBy: { _count: { machineId: 'desc' } },
      take: n,
    });
    const machines = await this.prisma.machine.findMany({
      where: { siteId, id: { in: grouped.map((g) => g.machineId) } },
      select: { id: true, code: true, name: true },
    });
    const byId = new Map(machines.map((m) => [m.id, m]));
    return grouped.map((g) => ({
      machineId: g.machineId,
      code: byId.get(g.machineId)?.code ?? '—',
      name: byId.get(g.machineId)?.name ?? '—',
      count: g._count._all,
    }));
  }
}
