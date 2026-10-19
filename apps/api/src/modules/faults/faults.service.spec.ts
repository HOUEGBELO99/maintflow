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
      count: jest.fn(),
    },
    intervention: { count: jest.fn() },
    machine: { findFirst: jest.fn(), updateMany: jest.fn() },
    $transaction: jest.fn(),
  };
  // Interactive transactions run the callback against the same mock.
  prisma.$transaction.mockImplementation((fn: (tx: unknown) => unknown) => fn(prisma));

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation((fn: (tx: unknown) => unknown) => fn(prisma));
    prisma.fault.count.mockResolvedValue(0);
    prisma.intervention.count.mockResolvedValue(0);
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
      include: {
        reportedBy: { select: { name: true } },
        _count: { select: { attachments: true } },
      },
    });
  });

  it('serializes to the shared contract (reporter name + hasPhoto)', async () => {
    prisma.fault.findMany.mockResolvedValue([
      {
        id: 'f-1',
        reportedById: 'u-1',
        reportedBy: { name: 'L. Moreau' },
        _count: { attachments: 2 },
        takenAt: null,
      },
    ]);
    const [fault] = await service.findAll('site-1');
    expect(fault).toMatchObject({ reportedBy: 'L. Moreau', hasPhoto: true });
    expect(fault).not.toHaveProperty('_count');
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

  it('stops the machine when a critical fault is declared', async () => {
    prisma.machine.findFirst.mockResolvedValue({ id: 'm-1' });
    prisma.fault.create.mockResolvedValue({ id: 'f-1' });
    prisma.fault.count.mockResolvedValue(1); // the new critical fault is open
    await service.create('site-1', 'user-1', {
      machineId: 'm-1',
      type: FaultType.MECANIQUE,
      description: 'roulement HS',
      severity: FaultSeverity.CRITICAL,
    });
    expect(prisma.machine.updateMany).toHaveBeenCalledWith({
      where: { id: 'm-1', siteId: 'site-1' },
      data: { state: 'fault' },
    });
  });

  it('puts the machine back to ok once its fault is resolved', async () => {
    prisma.fault.findFirst.mockResolvedValue({
      id: 'f-1',
      status: FaultStatus.IN_PROGRESS,
      takenAt: new Date(),
      machineId: 'm-1',
    });
    prisma.fault.update.mockResolvedValue({});
    await service.update('site-1', 'f-1', { status: FaultStatus.RESOLVED });
    expect(prisma.machine.updateMany).toHaveBeenCalledWith({
      where: { id: 'm-1', siteId: 'site-1' },
      data: { state: 'ok' },
    });
  });
});
