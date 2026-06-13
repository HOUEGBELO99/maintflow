import { Test } from '@nestjs/testing';

import { BadRequestException, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { PlanningService } from './planning.service';

describe('PlanningService', () => {
  let service: PlanningService;
  const prisma = {
    planRule: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn() as jest.Mock<Promise<unknown>, [{ where: unknown; data: { nextDue: Date } }]>,
      delete: jest.fn(),
    },
    reminder: {
      findMany: jest.fn(),
      create: jest.fn() as jest.Mock<Promise<unknown>, [{ data: { status: string } }]>,
    },
    intervention: { create: jest.fn() },
    machine: { findFirst: jest.fn() },
    user: { findFirst: jest.fn() },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [PlanningService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(PlanningService);
  });

  it('scopes rule listing to the site', async () => {
    prisma.planRule.findMany.mockResolvedValue([]);
    await service.listRules('site-1');
    expect(prisma.planRule.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { siteId: 'site-1' } }),
    );
  });

  it('computes upcoming reminders for active rules, anchored to the scenario date', async () => {
    // Scenario "today" is 2026-05-21; PM-01 is due 2026-05-23 with a 2-day lead.
    prisma.planRule.findMany.mockResolvedValue([
      { id: 'r1', code: 'PM-01', nextDue: new Date('2026-05-23T00:00:00.000Z'), reminderLead: 2, active: true },
    ]);
    const [u] = await service.upcoming('site-1');
    expect(prisma.planRule.findMany).toHaveBeenCalledWith({ where: { siteId: 'site-1', active: true } });
    expect(u).toMatchObject({ remindOn: '2026-05-21', dueIn: 2, remindIn: 0 });
  });

  it('advances the due date by the recurrence when scheduling now', async () => {
    const rule = {
      id: 'r1',
      siteId: 'site-1',
      code: 'PM-05',
      machineId: 'm1',
      technicianId: 'u1',
      title: 'Lubrification',
      duration: 1,
      everyWeeks: 4,
      reminderLead: 2,
      active: true,
      nextDue: new Date('2026-05-28T00:00:00.000Z'),
    };
    prisma.planRule.findFirst.mockResolvedValue(rule);
    prisma.$transaction.mockImplementation((cb: (tx: typeof prisma) => unknown) => cb(prisma));
    prisma.planRule.update.mockResolvedValue({ ...rule, nextDue: new Date('2026-06-25T00:00:00.000Z') });

    await service.scheduleNow('site-1', 'r1');

    expect(prisma.intervention.create).toHaveBeenCalled();
    expect(prisma.reminder.create.mock.calls[0]![0].data.status).toBe('sent');
    // 2026-05-28 + 4 weeks = 2026-06-25.
    expect(prisma.planRule.update.mock.calls[0]![0].data.nextDue).toEqual(new Date('2026-06-25'));
  });

  it('refuses to schedule a suspended rule', async () => {
    prisma.planRule.findFirst.mockResolvedValue({ id: 'r1', active: false, technicianId: 'u1' });
    await expect(service.scheduleNow('site-1', 'r1')).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('throws when updating a rule outside the tenant', async () => {
    prisma.planRule.findFirst.mockResolvedValue(null);
    await expect(service.updateRule('site-1', 'missing', { active: false })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deletes a rule scoped to the tenant', async () => {
    prisma.planRule.findFirst.mockResolvedValue({ id: 'r1', siteId: 'site-1' });
    prisma.planRule.delete.mockResolvedValue({ id: 'r1' });
    await expect(service.deleteRule('site-1', 'r1')).resolves.toEqual({ id: 'r1', deleted: true });
    expect(prisma.planRule.delete).toHaveBeenCalledWith({ where: { id: 'r1' } });
  });

  it('throws when deleting a rule outside the tenant', async () => {
    prisma.planRule.findFirst.mockResolvedValue(null);
    await expect(service.deleteRule('site-1', 'missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.planRule.delete).not.toHaveBeenCalled();
  });
});
