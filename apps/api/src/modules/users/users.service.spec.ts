import { Test } from '@nestjs/testing';

import { NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  const prisma = {
    user: { findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    invitation: {
      findMany: jest.fn(),
      create: jest.fn() as jest.Mock<Promise<unknown>, [{ data: { siteId: string; invitedById: string } }]>,
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
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

  it('stamps the inviter and site when creating an invitation', async () => {
    prisma.invitation.create.mockResolvedValue({
      id: 'inv-2',
      email: 'x@usine.fr',
      role: 'operateur',
      workshop: 'Atelier D',
      sentAt: new Date('2026-05-21T09:30:00.000Z'),
      status: 'pending',
      invitedBy: { name: 'Laurent Moreau' },
    });
    await service.createInvitation('site-1', 'user-1', {
      email: 'x@usine.fr',
      role: 'operateur',
      workshop: 'Atelier D',
    });
    const arg = prisma.invitation.create.mock.calls[0]![0];
    expect(arg.data.siteId).toBe('site-1');
    expect(arg.data.invitedById).toBe('user-1');
  });
});
