import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { FaultSeverity, FaultStatus, FaultType } from '@maintflow/shared';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateFaultDto } from './dto/create-fault.dto';
import type { UpdateFaultDto } from './dto/update-fault.dto';

export interface FaultFilters {
  status?: FaultStatus;
  machineId?: string;
  severity?: FaultSeverity;
  type?: FaultType;
}

/**
 * All queries are scoped by `siteId` (multi-tenant). siteId and reporter come
 * from the authenticated user, never from client input.
 */
@Injectable()
export class FaultsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Joins needed to satisfy the shared `Fault` contract (reporter name + hasPhoto). */
  private static readonly contractInclude = {
    reportedBy: { select: { name: true } },
    _count: { select: { attachments: true } },
  } as const;

  /**
   * Map a Prisma fault to the shared `Fault` shape: `reportedBy` is the reporter's
   * display name (the column is `reportedById`), and `hasPhoto` is derived from
   * the attachments count. Defensive so callers with partial selects don't break.
   */
  private serialize(fault: Record<string, unknown>) {
    const { reportedBy, _count, ...rest } = fault as {
      reportedBy?: { name?: string };
      _count?: { attachments?: number };
      reportedById?: string;
    } & Record<string, unknown>;
    return {
      ...rest,
      reportedBy: reportedBy?.name ?? rest.reportedById,
      hasPhoto: (_count?.attachments ?? 0) > 0,
    };
  }

  async findAll(siteId: string, filters: FaultFilters = {}) {
    const where: Prisma.FaultWhereInput = { siteId };
    if (filters.status) where.status = filters.status;
    if (filters.machineId) where.machineId = filters.machineId;
    if (filters.severity) where.severity = filters.severity;
    if (filters.type) where.type = filters.type;
    const faults = await this.prisma.fault.findMany({
      where,
      orderBy: { reportedAt: 'desc' },
      include: FaultsService.contractInclude,
    });
    return faults.map((f) => this.serialize(f));
  }

  async findOne(siteId: string, id: string) {
    const fault = await this.prisma.fault.findFirst({
      where: { id, siteId },
      include: FaultsService.contractInclude,
    });
    if (!fault) throw new NotFoundException(`Fault ${id} not found`);
    return this.serialize(fault);
  }

  async create(siteId: string, reportedById: string, dto: CreateFaultDto) {
    // The machine must exist within the caller's tenant.
    const machine = await this.prisma.machine.findFirst({
      where: { id: dto.machineId, siteId },
      select: { id: true },
    });
    if (!machine) throw new NotFoundException(`Machine ${dto.machineId} not found`);

    return this.prisma.fault.create({
      data: {
        siteId,
        machineId: dto.machineId,
        type: dto.type,
        description: dto.description,
        severity: dto.severity,
        reportedById,
      },
    });
  }

  async update(siteId: string, id: string, dto: UpdateFaultDto) {
    // Ownership + the fields the lifecycle stamping needs.
    const current = await this.prisma.fault.findFirst({
      where: { id, siteId },
      select: { id: true, status: true, takenAt: true },
    });
    if (!current) throw new NotFoundException(`Fault ${id} not found`);

    const data: Prisma.FaultUpdateInput = {
      ...(dto.type !== undefined ? { type: dto.type } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.severity !== undefined ? { severity: dto.severity } : {}),
      ...(dto.rootCause !== undefined ? { rootCause: dto.rootCause } : {}),
    };

    // Lifecycle stamping derived from the target status.
    if (dto.status && dto.status !== current.status) {
      data.status = dto.status;
      if (dto.status === FaultStatus.IN_PROGRESS && !current.takenAt) {
        data.takenAt = new Date();
      }
      if (dto.status === FaultStatus.RESOLVED) {
        data.resolvedAt = new Date();
        if (!current.takenAt) data.takenAt = new Date();
      }
    }

    await this.prisma.fault.update({ where: { id }, data });
    return this.findOne(siteId, id);
  }

  async remove(siteId: string, id: string) {
    await this.findOne(siteId, id);
    await this.prisma.fault.delete({ where: { id } });
    return { id, deleted: true };
  }
}
