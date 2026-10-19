import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { FaultStatus, InterventionKind, InterventionStatus, Permission, roleHasPermission } from '@maintflow/shared';
import type { UserRole } from '@maintflow/shared';
import { PrismaService } from '../prisma/prisma.service';
import { syncMachineState } from '../machines/machine-state';
import type { CreateInterventionDto } from './dto/create-intervention.dto';
import type { UpdateInterventionDto } from './dto/update-intervention.dto';

export interface InterventionFilters {
  status?: InterventionStatus;
  technicianId?: string;
  machineId?: string;
  kind?: InterventionKind;
}

/** Fields that change the plan (vs. field work done on the intervention). */
const PLANNING_FIELDS = [
  'technicianId',
  'kind',
  'description',
  'scheduledFor',
  'duration',
  'linkedFaultId',
  'planRuleId',
] as const satisfies readonly (keyof UpdateInterventionDto)[];

/** All queries are scoped by `siteId` (multi-tenant). */
@Injectable()
export class InterventionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(siteId: string, filters: InterventionFilters = {}) {
    const where: Prisma.InterventionWhereInput = { siteId };
    if (filters.status) where.status = filters.status;
    if (filters.technicianId) where.technicianId = filters.technicianId;
    if (filters.machineId) where.machineId = filters.machineId;
    if (filters.kind) where.kind = filters.kind;
    return this.prisma.intervention.findMany({ where, orderBy: { scheduledFor: 'asc' } });
  }

  async findOne(siteId: string, id: string) {
    const intervention = await this.prisma.intervention.findFirst({ where: { id, siteId } });
    if (!intervention) throw new NotFoundException(`Intervention ${id} not found`);
    return intervention;
  }

  async create(siteId: string, dto: CreateInterventionDto) {
    await this.assertMachine(siteId, dto.machineId);
    await this.assertTechnician(siteId, dto.technicianId);
    if (dto.linkedFaultId) await this.assertFault(siteId, dto.linkedFaultId);

    return this.prisma.intervention.create({
      data: {
        siteId,
        machineId: dto.machineId,
        technicianId: dto.technicianId,
        kind: dto.kind,
        description: dto.description,
        scheduledFor: new Date(dto.scheduledFor),
        duration: dto.duration,
        linkedFaultId: dto.linkedFaultId ?? null,
        planRuleId: dto.planRuleId ?? null,
        checklist: (dto.checklist ?? []) as unknown as Prisma.InputJsonValue,
      },
    });
  }

  /**
   * Field work (status, checklist, closure, check-in) needs MANAGE_INTERVENTIONS
   * (checked by the route); changing the plan itself — who, when, what —
   * additionally needs PLAN_INTERVENTIONS, so a technician cannot reschedule
   * or reassign work.
   */
  async update(siteId: string, id: string, dto: UpdateInterventionDto, actorRole?: UserRole) {
    const planningChange = PLANNING_FIELDS.some((f) => dto[f] !== undefined);
    if (planningChange && actorRole && !roleHasPermission(actorRole, Permission.PLAN_INTERVENTIONS)) {
      throw new ForbiddenException('Only planners can reschedule, reassign or edit an intervention');
    }
    const current = await this.findOne(siteId, id);
    if (dto.technicianId) await this.assertTechnician(siteId, dto.technicianId);
    if (dto.linkedFaultId) await this.assertFault(siteId, dto.linkedFaultId);

    const data: Prisma.InterventionUpdateInput = {
      ...(dto.kind !== undefined ? { kind: dto.kind } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.scheduledFor !== undefined ? { scheduledFor: new Date(dto.scheduledFor) } : {}),
      ...(dto.duration !== undefined ? { duration: dto.duration } : {}),
      ...(dto.actualDuration !== undefined ? { actualDuration: dto.actualDuration } : {}),
      ...(dto.rating !== undefined ? { rating: dto.rating } : {}),
      ...(dto.signedBy !== undefined ? { signedBy: dto.signedBy } : {}),
      ...(dto.checkInLat !== undefined ? { checkInLat: dto.checkInLat } : {}),
      ...(dto.checkInLng !== undefined ? { checkInLng: dto.checkInLng } : {}),
      ...(dto.checklist !== undefined
        ? { checklist: dto.checklist as unknown as Prisma.InputJsonValue }
        : {}),
    };

    if (dto.status && dto.status !== current.status) {
      data.status = dto.status;
      if (dto.status === InterventionStatus.IN_PROGRESS && !current.startedAt) {
        data.startedAt = new Date();
      }
      if (dto.status === InterventionStatus.COMPLETED) {
        data.completedAt = new Date();
        if (!current.startedAt) data.startedAt = new Date();
      }
    }

    const statusChanged = dto.status !== undefined && dto.status !== current.status;
    const faultId = dto.linkedFaultId ?? current.linkedFaultId;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.intervention.update({ where: { id }, data });
      if (!statusChanged) return updated;

      // The linked fault follows the work order: starting the work takes the
      // fault in charge, completing it resolves the fault.
      if (faultId) await this.advanceLinkedFault(tx, siteId, faultId, dto.status!);
      await syncMachineState(tx, siteId, current.machineId);
      return updated;
    });
  }

  private async advanceLinkedFault(
    tx: Prisma.TransactionClient,
    siteId: string,
    faultId: string,
    status: InterventionStatus,
  ): Promise<void> {
    const fault = await tx.fault.findFirst({
      where: { id: faultId, siteId },
      select: { status: true, takenAt: true },
    });
    if (!fault || fault.status === FaultStatus.RESOLVED) return;

    const now = new Date();
    if (status === InterventionStatus.IN_PROGRESS && fault.status === FaultStatus.PENDING) {
      await tx.fault.update({
        where: { id: faultId },
        data: { status: FaultStatus.IN_PROGRESS, takenAt: fault.takenAt ?? now },
      });
    } else if (status === InterventionStatus.COMPLETED) {
      await tx.fault.update({
        where: { id: faultId },
        data: { status: FaultStatus.RESOLVED, resolvedAt: now, takenAt: fault.takenAt ?? now },
      });
    }
  }

  async remove(siteId: string, id: string) {
    const intervention = await this.findOne(siteId, id);
    await this.prisma.$transaction(async (tx) => {
      await tx.intervention.delete({ where: { id } });
      await syncMachineState(tx, siteId, intervention.machineId);
    });
    return { id, deleted: true };
  }

  // ── Tenant-scoped referential checks ──────────────────────────────────────
  private async assertMachine(siteId: string, machineId: string): Promise<void> {
    const m = await this.prisma.machine.findFirst({ where: { id: machineId, siteId }, select: { id: true } });
    if (!m) throw new NotFoundException(`Machine ${machineId} not found`);
  }

  private async assertTechnician(siteId: string, technicianId: string): Promise<void> {
    const u = await this.prisma.user.findFirst({ where: { id: technicianId, siteId }, select: { id: true } });
    if (!u) throw new BadRequestException(`Technician ${technicianId} is not a member of this site`);
  }

  private async assertFault(siteId: string, faultId: string): Promise<void> {
    const f = await this.prisma.fault.findFirst({ where: { id: faultId, siteId }, select: { id: true } });
    if (!f) throw new NotFoundException(`Fault ${faultId} not found`);
  }
}
