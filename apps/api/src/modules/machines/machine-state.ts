import type { Prisma } from '@prisma/client';

import { FaultSeverity, FaultStatus, InterventionStatus, MachineState } from '@maintflow/shared';

/** The subset of Prisma used to derive a machine's state (client or transaction). */
type Db = Pick<Prisma.TransactionClient, 'fault' | 'intervention' | 'machine'>;

/**
 * Derives a machine's operational state from its live work, mirroring the
 * prototype rules:
 *  - an unresolved **critical** fault stops the machine → `fault`
 *  - otherwise, work in progress on it → `maintenance`
 *  - otherwise → `ok`
 *
 * Called after every fault / intervention transition so the parc, dashboard
 * and KPIs reflect reality without anyone editing the machine by hand.
 */
export async function syncMachineState(db: Db, siteId: string, machineId: string): Promise<MachineState> {
  const [criticalOpen, workInProgress] = await Promise.all([
    db.fault.count({
      where: {
        siteId,
        machineId,
        severity: FaultSeverity.CRITICAL,
        status: { not: FaultStatus.RESOLVED },
      },
    }),
    db.intervention.count({
      where: { siteId, machineId, status: InterventionStatus.IN_PROGRESS },
    }),
  ]);

  const state: MachineState =
    criticalOpen > 0 ? MachineState.FAULT : workInProgress > 0 ? MachineState.MAINTENANCE : MachineState.OK;

  await db.machine.updateMany({ where: { id: machineId, siteId }, data: { state } });
  return state;
}
