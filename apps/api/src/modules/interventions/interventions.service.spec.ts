import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { FaultStatus, InterventionKind, InterventionStatus } from '@maintflow/shared';
import { PrismaService } from '../prisma/prisma.service';
import { InterventionsService } from './interventions.service';

interface UpdateData {
  status?: InterventionStatus;
  startedAt?: Date;
  completedAt?: Date;
  checkInLat?: number;
  checkInLng?: number;
}

const baseDto = {
  machineId: 'm-1',
  technicianId: 'u-1',
  kind: InterventionKind.CORRECTIVE,
  description: 'Remplacement roulement',
  scheduledFor: '2026-05-21',
  duration: 4,
};

describe('InterventionsService', () => {
  let service: InterventionsService;
  const prisma = {
    intervention: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn() as jest.Mock<Promise<unknown>, [{ where: unknown; data: UpdateData }]>,
      count: jest.fn(),
    },
    machine: { findFirst: jest.fn(), updateMany: jest.fn() },
    user: { findFirst: jest.fn() },
    fault: {
      findFirst: jest.fn(),
      update: jest.fn() as jest.Mock<Promise<unknown>, [{ where: unknown; data: Record<string, unknown> }]>,
      count: jest.fn(),
    },
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
      providers: [InterventionsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(InterventionsService);
  });

  it('scopes findAll by siteId with filters', async () => {
    prisma.intervention.findMany.mockResolvedValue([]);
    await service.findAll('site-1', { status: InterventionStatus.PLANNED, technicianId: 'u-1' });
    expect(prisma.intervention.findMany).toHaveBeenCalledWith({
      where: { siteId: 'site-1', status: InterventionStatus.PLANNED, technicianId: 'u-1' },
      orderBy: { scheduledFor: 'asc' },
    });
  });

  it('throws when an intervention is not found in the tenant', async () => {
    prisma.intervention.findFirst.mockResolvedValue(null);
    await expect(service.findOne('site-1', 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('refuses creation on a machine outside the tenant', async () => {
    prisma.machine.findFirst.mockResolvedValue(null);
    await expect(service.create('site-1', baseDto)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('refuses creation with a technician outside the tenant', async () => {
    prisma.machine.findFirst.mockResolvedValue({ id: 'm-1' });
    prisma.user.findFirst.mockResolvedValue(null);
    await expect(service.create('site-1', baseDto)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('stamps startedAt when moving to in_progress', async () => {
    prisma.intervention.findFirst.mockResolvedValue({
      id: 'i-1',
      siteId: 'site-1',
      status: InterventionStatus.PLANNED,
      startedAt: null,
    });
    prisma.intervention.update.mockResolvedValue({});
    await service.update('site-1', 'i-1', { status: InterventionStatus.IN_PROGRESS });
    const arg = prisma.intervention.update.mock.calls[0]![0];
    expect(arg.data.status).toBe(InterventionStatus.IN_PROGRESS);
    expect(arg.data.startedAt).toBeInstanceOf(Date);
  });

  it('stamps completedAt when completing', async () => {
    prisma.intervention.findFirst.mockResolvedValue({
      id: 'i-1',
      siteId: 'site-1',
      status: InterventionStatus.IN_PROGRESS,
      startedAt: new Date(),
    });
    prisma.intervention.update.mockResolvedValue({});
    await service.update('site-1', 'i-1', {
      status: InterventionStatus.COMPLETED,
      actualDuration: 2.25,
      rating: 5,
    });
    const arg = prisma.intervention.update.mock.calls[0]![0];
    expect(arg.data.completedAt).toBeInstanceOf(Date);
  });

  it('persists the check-in location on start', async () => {
    prisma.intervention.findFirst.mockResolvedValue({
      id: 'i-1',
      siteId: 'site-1',
      status: InterventionStatus.PLANNED,
      startedAt: null,
    });
    prisma.intervention.update.mockResolvedValue({});
    await service.update('site-1', 'i-1', {
      status: InterventionStatus.IN_PROGRESS,
      checkInLat: 48.8566,
      checkInLng: 2.3522,
    });
    const arg = prisma.intervention.update.mock.calls[0]![0];
    expect(arg.data.checkInLat).toBe(48.8566);
    expect(arg.data.checkInLng).toBe(2.3522);
  });

  it('completing a corrective intervention resolves its linked fault and frees the machine', async () => {
    prisma.intervention.findFirst.mockResolvedValue({
      id: 'i-1',
      siteId: 'site-1',
      machineId: 'm-1',
      linkedFaultId: 'f-1',
      status: InterventionStatus.IN_PROGRESS,
      startedAt: new Date(),
    });
    prisma.intervention.update.mockResolvedValue({});
    prisma.fault.findFirst.mockResolvedValue({ status: FaultStatus.IN_PROGRESS, takenAt: new Date() });
    await service.update('site-1', 'i-1', { status: InterventionStatus.COMPLETED });

    const faultArg = prisma.fault.update.mock.calls[0]![0];
    expect(faultArg.where).toEqual({ id: 'f-1' });
    expect(faultArg.data.status).toBe(FaultStatus.RESOLVED);
    expect(faultArg.data.resolvedAt).toBeInstanceOf(Date);
    expect(prisma.machine.updateMany).toHaveBeenCalledWith({
      where: { id: 'm-1', siteId: 'site-1' },
      data: { state: 'ok' },
    });
  });

  it('starting the work takes a pending linked fault in charge', async () => {
    prisma.intervention.findFirst.mockResolvedValue({
      id: 'i-1',
      siteId: 'site-1',
      machineId: 'm-1',
      linkedFaultId: 'f-1',
      status: InterventionStatus.PLANNED,
      startedAt: null,
    });
    prisma.intervention.update.mockResolvedValue({});
    prisma.fault.findFirst.mockResolvedValue({ status: FaultStatus.PENDING, takenAt: null });
    prisma.intervention.count.mockResolvedValue(1);
    await service.update('site-1', 'i-1', { status: InterventionStatus.IN_PROGRESS });

    const faultArg = prisma.fault.update.mock.calls[0]![0];
    expect(faultArg.data.status).toBe(FaultStatus.IN_PROGRESS);
    expect(faultArg.data.takenAt).toBeInstanceOf(Date);
    expect(prisma.machine.updateMany).toHaveBeenCalledWith({
      where: { id: 'm-1', siteId: 'site-1' },
      data: { state: 'maintenance' },
    });
  });

  it('does not touch the fault or machine when the status is unchanged', async () => {
    prisma.intervention.findFirst.mockResolvedValue({
      id: 'i-1',
      siteId: 'site-1',
      machineId: 'm-1',
      linkedFaultId: 'f-1',
      status: InterventionStatus.IN_PROGRESS,
      startedAt: new Date(),
    });
    prisma.intervention.update.mockResolvedValue({});
    await service.update('site-1', 'i-1', { description: 'note' });
    expect(prisma.fault.update).not.toHaveBeenCalled();
    expect(prisma.machine.updateMany).not.toHaveBeenCalled();
  });
});
