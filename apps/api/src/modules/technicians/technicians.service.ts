import { Injectable, NotFoundException } from '@nestjs/common';

import type { Technician } from '@maintflow/shared';
import { PrismaService } from '../prisma/prisma.service';
import type { UpdateTechnicianDto } from './dto/update-technician.dto';

/** Interventions in these states still count toward a technician's live workload. */
const ACTIVE_STATUSES = ['planned', 'in_progress'] as const;

/** "Laurent Moreau" → "L. Moreau" (matches the prototype's short display name). */
function shortName(full: string): string {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  const first = parts[0];
  const last = parts[parts.length - 1];
  if (!first || !last || parts.length < 2) return full;
  return `${first[0]}. ${last}`;
}

/**
 * Technician directory with performance + live workload, scoped by
 * `siteId` (multi-tenant). The siteId always comes from the authenticated user.
 * Interventions reference the technician's User id (`technicianId`).
 */
@Injectable()
export class TechniciansService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(siteId: string): Promise<Technician[]> {
    const [techs, workload] = await Promise.all([
      this.prisma.technician.findMany({
        where: { user: { siteId } },
        include: { user: { select: { name: true, color: true } } },
        orderBy: { user: { createdAt: 'desc' } },
      }),
      this.prisma.intervention.groupBy({
        by: ['technicianId'],
        where: { siteId, status: { in: [...ACTIVE_STATUSES] } },
        _count: { _all: true },
        _sum: { duration: true },
      }),
    ]);

    const load = new Map(workload.map((w) => [w.technicianId, w]));
    return techs.map((t) => this.toDto(t, load.get(t.userId)));
  }

  async findOne(siteId: string, id: string): Promise<Technician> {
    const tech = await this.prisma.technician.findFirst({
      where: { id, user: { siteId } },
      include: { user: { select: { name: true, color: true } } },
    });
    if (!tech) throw new NotFoundException(`Technician ${id} not found`);

    const w = await this.prisma.intervention.aggregate({
      where: { siteId, technicianId: tech.userId, status: { in: [...ACTIVE_STATUSES] } },
      _count: { _all: true },
      _sum: { duration: true },
    });
    return this.toDto(tech, { _count: { _all: w._count._all }, _sum: { duration: w._sum.duration } });
  }

  /** Availability, specialties and title — tenant-scoped. */
  async update(siteId: string, id: string, dto: UpdateTechnicianDto): Promise<Technician> {
    const tech = await this.prisma.technician.findFirst({
      where: { id, user: { siteId } },
      select: { id: true },
    });
    if (!tech) throw new NotFoundException(`Technician ${id} not found`);

    await this.prisma.technician.update({
      where: { id },
      data: {
        ...(dto.available !== undefined ? { available: dto.available } : {}),
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.specialties !== undefined
          ? { specialties: [...new Set(dto.specialties.map((x) => x.trim().toLowerCase()))] }
          : {}),
      },
    });
    return this.findOne(siteId, id);
  }

  private toDto(
    t: { id: string; userId: string; title: string; specialties: string[]; available: boolean; onTime: number; rating: number; doneThisMonth: number; user: { name: string; color: string | null } },
    w?: { _count: { _all: number }; _sum: { duration: number | null } },
  ): Technician {
    return {
      id: t.id,
      userId: t.userId,
      name: shortName(t.user.name),
      title: t.title,
      color: t.user.color,
      specialties: t.specialties,
      available: t.available,
      onTime: t.onTime,
      rating: t.rating,
      doneThisMonth: t.doneThisMonth,
      activeCount: w?._count._all ?? 0,
      activeHours: w?._sum.duration ?? 0,
    };
  }
}
