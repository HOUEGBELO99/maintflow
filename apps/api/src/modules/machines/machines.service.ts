import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import type { CreateMachineDto } from './dto/create-machine.dto';
import type { UpdateMachineDto } from './dto/update-machine.dto';

/**
 * All queries are scoped by `siteId` (multi-tenant). The siteId always comes
 * from the authenticated user, never from client input.
 */
@Injectable()
export class MachinesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(siteId: string, workshop?: string) {
    const where: Prisma.MachineWhereInput = { siteId };
    if (workshop) where.workshop = workshop;
    return this.prisma.machine.findMany({ where, orderBy: { code: 'asc' } });
  }

  async findOne(siteId: string, id: string) {
    const machine = await this.prisma.machine.findFirst({ where: { id, siteId } });
    if (!machine) throw new NotFoundException(`Machine ${id} not found`);
    return machine;
  }

  create(siteId: string, dto: CreateMachineDto) {
    return this.prisma.machine.create({
      data: { ...dto, siteId, installedAt: new Date(dto.installedAt) },
    });
  }

  async update(siteId: string, id: string, dto: UpdateMachineDto) {
    await this.findOne(siteId, id); // ownership + existence check
    return this.prisma.machine.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.installedAt ? { installedAt: new Date(dto.installedAt) } : {}),
      },
    });
  }

  async remove(siteId: string, id: string) {
    await this.findOne(siteId, id);
    await this.prisma.machine.delete({ where: { id } });
    return { id, deleted: true };
  }
}
