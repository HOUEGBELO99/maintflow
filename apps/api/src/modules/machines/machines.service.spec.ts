import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { MachinesService } from './machines.service';

describe('MachinesService', () => {
  let service: MachinesService;
  const prisma = {
    machine: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [MachinesService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(MachinesService);
  });

  it('scopes findAll by siteId', async () => {
    prisma.machine.findMany.mockResolvedValue([]);
    await service.findAll('site-1');
    expect(prisma.machine.findMany).toHaveBeenCalledWith({
      where: { siteId: 'site-1' },
      orderBy: { code: 'asc' },
    });
  });

  it('throws when a machine is not found in the tenant', async () => {
    prisma.machine.findFirst.mockResolvedValue(null);
    await expect(service.findOne('site-1', 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
