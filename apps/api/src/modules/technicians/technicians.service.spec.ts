import { Test } from '@nestjs/testing';

import { NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { TechniciansService } from './technicians.service';

describe('TechniciansService', () => {
  let service: TechniciansService;
  const prisma = {
    technician: { findMany: jest.fn(), findFirst: jest.fn() },
    intervention: { groupBy: jest.fn(), aggregate: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [TechniciansService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(TechniciansService);
  });

  it('scopes the listing to the site and merges live workload', async () => {
    prisma.technician.findMany.mockResolvedValue([
      {
        id: 't1',
        userId: 'u1',
        title: 'Technicien sénior',
        specialties: ['mécanique'],
        available: true,
        onTime: 94,
        rating: 4.8,
        doneThisMonth: 14,
        user: { name: 'Laurent Moreau', color: '#00C24A' },
      },
    ]);
    prisma.intervention.groupBy.mockResolvedValue([
      { technicianId: 'u1', _count: { _all: 2 }, _sum: { duration: 7 } },
    ]);

    const result = await service.findAll('site-1');

    expect(prisma.technician.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { user: { siteId: 'site-1' } } }),
    );
    expect(prisma.intervention.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { siteId: 'site-1', status: { in: ['planned', 'in_progress'] } } }),
    );
    expect(result[0]).toMatchObject({ name: 'L. Moreau', title: 'Technicien sénior', activeCount: 2, activeHours: 7 });
  });

  it('defaults workload to zero when the technician has no active interventions', async () => {
    prisma.technician.findMany.mockResolvedValue([
      { id: 't2', userId: 'u2', title: 'Technicien', specialties: [], available: true, onTime: 0, rating: 0, doneThisMonth: 0, user: { name: 'Sophie Diallo', color: null } },
    ]);
    prisma.intervention.groupBy.mockResolvedValue([]);

    const [tech] = await service.findAll('site-1');

    expect(tech).toMatchObject({ name: 'S. Diallo', activeCount: 0, activeHours: 0 });
  });

  it('throws when a technician is not found in the tenant', async () => {
    prisma.technician.findFirst.mockResolvedValue(null);
    await expect(service.findOne('site-1', 'missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.intervention.aggregate).not.toHaveBeenCalled();
  });
});
