import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import type { Invitation } from '@maintflow/shared';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateInvitationDto } from './dto/create-invitation.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import { SupabaseAuthAdminService } from './supabase-auth-admin.service';

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

/** "p.kone@usine.fr" → "P. Kone" — a sensible display name from the email. */
function displayNameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? email;
  const words = local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1));
  if (words.length >= 2) {
    return `${words[0]!.charAt(0)}. ${words.slice(1).join(' ')}`;
  }
  return words[0] ?? local;
}

/** "P. Kone" → "PK". */
function initialsFrom(name: string): string {
  const letters = name.match(/[A-Za-zÀ-ÿ]/g) ?? [];
  return (letters.slice(0, 2).join('') || '··').toUpperCase();
}

/**
 * User directory + role/access administration for the current tenant.
 * All queries are scoped by `siteId`, taken from the authenticated user.
 */
@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authAdmin: SupabaseAuthAdminService,
  ) {}

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

  /**
   * Invite a new member: creates their Supabase Auth account (which emails a
   * password-setup link), provisions the aligned `public.users` row so the JWT
   * guard recognises them once they set a password, and records the invitation
   * for the admin UI. Email delivery needs Supabase SMTP configured.
   */
  async createInvitation(
    siteId: string,
    invitedById: string,
    dto: CreateInvitationDto,
  ): Promise<Invitation> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(`${dto.email} is already a member of this site`);
    }

    const name = displayNameFromEmail(dto.email);

    // 1. Create the auth user + send the setup email (fails fast if SMTP is off).
    let authUser;
    try {
      authUser = await this.authAdmin.invite(dto.email, {
        siteId,
        role: dto.role,
        workshop: dto.workshop,
        name,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new BadRequestException(
        `Could not send the invitation email to ${dto.email}: ${message}. ` +
          `Check the Supabase project's SMTP settings and allowed redirect URLs.`,
      );
    }

    // 2. Provision the aligned app row (id == auth user id) so the JWT guard
    //    accepts them after they set a password.
    await this.prisma.user.create({
      data: {
        id: authUser.id,
        siteId,
        email: dto.email,
        name,
        role: dto.role,
        workshop: dto.workshop,
        status: 'active',
        initials: initialsFrom(name),
      },
    });

    // 3. Record the invitation (admin "Invitations" tab).
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
