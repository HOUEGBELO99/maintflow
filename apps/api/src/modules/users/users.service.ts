import { Injectable, NotFoundException } from '@nestjs/common';

import type { Invitation } from '@maintflow/shared';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateInvitationDto } from './dto/create-invitation.dto';
import type { UpdateUserDto } from './dto/update-user.dto';

/** Public projection of a User row for assignment/admin UIs (no auth internals). */
const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  workshop: true,
  status: true,
  initials: true,
  color: true,
  lastLogin: true,
} as const;

/** "Laurent Moreau" → "L. Moreau". */
function shortName(full: string): string {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  const first = parts[0];
  const last = parts[parts.length - 1];
  if (!first || !last || parts.length < 2) return full;
  return `${first[0]}. ${last}`;
}

/**
 * User directory + role/access administration for the current tenant.
 * All queries are scoped by `siteId`, taken from the authenticated user.
 */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Team members, oldest first (matches the seeded/prototype ordering). */
  findAll(siteId: string) {
    return this.prisma.user.findMany({
      where: { siteId },
      select: USER_SELECT,
      orderBy: { createdAt: 'asc' },
    });
  }

  async update(siteId: string, id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findFirst({ where: { id, siteId }, select: { id: true } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.role !== undefined ? { role: dto.role } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
      select: USER_SELECT,
    });
  }

  async listInvitations(siteId: string): Promise<Invitation[]> {
    const invitations = await this.prisma.invitation.findMany({
      where: { siteId },
      orderBy: { sentAt: 'desc' },
      include: { invitedBy: { select: { name: true } } },
    });
    return invitations.map((i) => this.toInvitationDto(i));
  }

  async createInvitation(
    siteId: string,
    invitedById: string,
    dto: CreateInvitationDto,
  ): Promise<Invitation> {
    const invitation = await this.prisma.invitation.create({
      data: { siteId, email: dto.email, role: dto.role, workshop: dto.workshop, invitedById },
      include: { invitedBy: { select: { name: true } } },
    });
    return this.toInvitationDto(invitation);
  }

  private toInvitationDto(i: {
    id: string;
    email: string;
    role: Invitation['role'];
    workshop: string;
    sentAt: Date;
    status: Invitation['status'];
    invitedBy: { name: string };
  }): Invitation {
    return {
      id: i.id,
      email: i.email,
      role: i.role,
      workshop: i.workshop,
      invitedBy: shortName(i.invitedBy.name),
      sentAt: i.sentAt.toISOString(),
      status: i.status,
    };
  }
}
