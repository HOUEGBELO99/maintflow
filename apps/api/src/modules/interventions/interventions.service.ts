import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { InterventionKind, InterventionStatus } from '@maintflow/shared';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateInterventionDto } from './dto/create-intervention.dto';
import type { UpdateInterventionDto } from './dto/update-intervention.dto';

export interface InterventionFilters {
  status?: InterventionStatus;
  technicianId?: string;
  machineId?: string;
  kind?: InterventionKind;
}

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

  async update(siteId: string, id: string, dto: UpdateInterventionDto) {
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

    return this.prisma.intervention.update({ where: { id }, data });
  }

  async remove(siteId: string, id: string) {
    await this.findOne(siteId, id);
    await this.prisma.intervention.delete({ where: { id } });
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
