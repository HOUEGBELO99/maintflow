import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { FaultSeverity, FaultStatus, FaultType } from '@maintflow/shared';
import { PrismaService } from '../prisma/prisma.service';
import { FaultsService } from './faults.service';

interface UpdateData {
  status?: FaultStatus;
  takenAt?: Date;
  resolvedAt?: Date;
}

describe('FaultsService', () => {
  let service: FaultsService;
  const prisma = {
    fault: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn() as jest.Mock<Promise<unknown>, [{ data: Record<string, unknown> }]>,
      update: jest.fn() as jest.Mock<Promise<unknown>, [{ where: unknown; data: UpdateData }]>,
    },
    machine: { findFirst: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [FaultsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(FaultsService);
  });

  it('scopes findAll by siteId and applies filters', async () => {
    prisma.fault.findMany.mockResolvedValue([]);
    await service.findAll('site-1', { status: FaultStatus.PENDING, machineId: 'm-1' });
    expect(prisma.fault.findMany).toHaveBeenCalledWith({
      where: { siteId: 'site-1', status: FaultStatus.PENDING, machineId: 'm-1' },
      orderBy: { reportedAt: 'desc' },
    });
  });

  it('throws when a fault is not found in the tenant', async () => {
    prisma.fault.findFirst.mockResolvedValue(null);
    await expect(service.findOne('site-1', 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('refuses to create a fault on a machine outside the tenant', async () => {
    prisma.machine.findFirst.mockResolvedValue(null);
    await expect(
      service.create('site-1', 'user-1', {
        machineId: 'foreign',
        type: FaultType.MECANIQUE,
        description: 'boom',
        severity: FaultSeverity.LOW,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.fault.create).not.toHaveBeenCalled();
  });

  it('attaches siteId + reporter when creating', async () => {
    prisma.machine.findFirst.mockResolvedValue({ id: 'm-1' });
    prisma.fault.create.mockResolvedValue({ id: 'f-1' });
    await service.create('site-1', 'user-1', {
      machineId: 'm-1',
      type: FaultType.ELECTRIQUE,
      description: 'disjoncteur saute',
      severity: FaultSeverity.MEDIUM,
    });
    const data = prisma.fault.create.mock.calls[0]![0].data;
    expect(data).toMatchObject({ siteId: 'site-1', machineId: 'm-1', reportedById: 'user-1' });
  });

  it('stamps takenAt when moving to in_progress', async () => {
    prisma.fault.findFirst.mockResolvedValue({
      id: 'f-1',
      siteId: 'site-1',
      status: FaultStatus.PENDING,
      takenAt: null,
    });
    prisma.fault.update.mockResolvedValue({});
    await service.update('site-1', 'f-1', { status: FaultStatus.IN_PROGRESS });
    const arg = prisma.fault.update.mock.calls[0]![0];
    expect(arg.data.status).toBe(FaultStatus.IN_PROGRESS);
    expect(arg.data.takenAt).toBeInstanceOf(Date);
  });

  it('stamps resolvedAt when resolving', async () => {
    prisma.fault.findFirst.mockResolvedValue({
      id: 'f-1',
      siteId: 'site-1',
      status: FaultStatus.IN_PROGRESS,
      takenAt: new Date(),
    });
    prisma.fault.update.mockResolvedValue({});
    await service.update('site-1', 'f-1', { status: FaultStatus.RESOLVED });
    const arg = prisma.fault.update.mock.calls[0]![0];
    expect(arg.data.resolvedAt).toBeInstanceOf(Date);
  });
});
