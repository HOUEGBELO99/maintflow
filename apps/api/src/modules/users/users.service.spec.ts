import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  const prisma = { user: { findMany: jest.fn() } };

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
});
