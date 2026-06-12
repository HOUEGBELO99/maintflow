import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { InterventionKind, InterventionStatus } from '@maintflow/shared';
import { PrismaService } from '../prisma/prisma.service';
import { InterventionsService } from './interventions.service';

interface UpdateData {
  status?: InterventionStatus;
  startedAt?: Date;
  completedAt?: Date;
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
    },
    machine: { findFirst: jest.fn() },
    user: { findFirst: jest.fn() },
    fault: { findFirst: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
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
});
