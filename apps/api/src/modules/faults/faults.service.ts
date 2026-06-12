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

  findAll(siteId: string, filters: FaultFilters = {}) {
    const where: Prisma.FaultWhereInput = { siteId };
    if (filters.status) where.status = filters.status;
    if (filters.machineId) where.machineId = filters.machineId;
    if (filters.severity) where.severity = filters.severity;
    if (filters.type) where.type = filters.type;
    return this.prisma.fault.findMany({ where, orderBy: { reportedAt: 'desc' } });
  }

  async findOne(siteId: string, id: string) {
    const fault = await this.prisma.fault.findFirst({ where: { id, siteId } });
    if (!fault) throw new NotFoundException(`Fault ${id} not found`);
    return fault;
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
    const current = await this.findOne(siteId, id); // ownership + existence

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

    return this.prisma.fault.update({ where: { id }, data });
  }

  async remove(siteId: string, id: string) {
    await this.findOne(siteId, id);
    await this.prisma.fault.delete({ where: { id } });
    return { id, deleted: true };
  }
}
