import { Test } from '@nestjs/testing';

import { ConflictException, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { SupabaseAuthAdminService } from './supabase-auth-admin.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  const prisma = {
    user: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn() as jest.Mock<Promise<unknown>, [{ data: Record<string, unknown> }]>,
    },
    invitation: {
      findMany: jest.fn(),
      create: jest.fn() as jest.Mock<Promise<unknown>, [{ data: { siteId: string; invitedById: string } }]>,
    },
  };
  const authAdmin = { invite: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: SupabaseAuthAdminService, useValue: authAdmin },
      ],
    }).compile();
    service = moduleRef.get(UsersService);
  });

  it('lists users scoped to the site', async () => {
    prisma.user.findMany.mockResolvedValue([]);
    await service.findAll('site-1');
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { siteId: 'site-1' } }),
    );
  });

  it('rejects updating a user outside the tenant', async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    await expect(service.update('site-1', 'missing', { role: 'admin' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('shortens the inviter name when listing invitations', async () => {
    prisma.invitation.findMany.mockResolvedValue([
      {
        id: 'inv-1',
        email: 'p.kone@usine.fr',
        role: 'technicien',
        workshop: 'Atelier C',
        sentAt: new Date('2026-05-20T10:00:00.000Z'),
        status: 'pending',
        invitedBy: { name: 'Laurent Moreau' },
      },
    ]);
    const [inv] = await service.listInvitations('site-1');
    expect(prisma.invitation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { siteId: 'site-1' } }),
    );
    expect(inv).toMatchObject({ invitedBy: 'L. Moreau', status: 'pending' });
  });

  it('invites via Supabase, provisions an aligned active user, and records the invitation', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    authAdmin.invite.mockResolvedValue({ id: 'auth-uuid', email: 'p.kone@usine.fr' });
    prisma.user.create.mockResolvedValue({ id: 'auth-uuid' });
    prisma.invitation.create.mockResolvedValue({
      id: 'inv-2',
      email: 'p.kone@usine.fr',
      role: 'technicien',
      workshop: 'Atelier C',
      sentAt: new Date('2026-05-21T09:30:00.000Z'),
      status: 'pending',
      invitedBy: { name: 'Laurent Moreau' },
    });

    await service.createInvitation('site-1', 'user-1', {
      email: 'p.kone@usine.fr',
      role: 'technicien',
      workshop: 'Atelier C',
    });

    // Auth user invited with site/role metadata.
    expect(authAdmin.invite).toHaveBeenCalledWith(
      'p.kone@usine.fr',
      expect.objectContaining({ siteId: 'site-1', role: 'technicien', workshop: 'Atelier C' }),
    );
    // App row aligned to the auth id, active, tenant-scoped.
    const userArg = prisma.user.create.mock.calls[0]![0];
    expect(userArg.data).toMatchObject({ id: 'auth-uuid', siteId: 'site-1', status: 'active' });
    // Invitation stamped with inviter + site.
    const invArg = prisma.invitation.create.mock.calls[0]![0];
    expect(invArg.data.siteId).toBe('site-1');
    expect(invArg.data.invitedById).toBe('user-1');
  });

  it('rejects inviting an email that is already a member', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'existing' });
    await expect(
      service.createInvitation('site-1', 'user-1', {
        email: 'l.moreau@usine.fr',
        role: 'admin',
        workshop: 'Direction',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(authAdmin.invite).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });
});
