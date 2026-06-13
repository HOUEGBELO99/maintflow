import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { PlanRule, Prisma } from '@prisma/client';

import type { UpcomingReminder } from '@maintflow/shared';
import { InterventionKind, InterventionStatus } from '@maintflow/shared';
import { PrismaService } from '../prisma/prisma.service';
import { addWeeksISO, daysUntil, minusDaysISO, toISODate } from '../../common/scenario-clock';
import type { CreatePlanRuleDto } from './dto/create-plan-rule.dto';
import type { UpdatePlanRuleDto } from './dto/update-plan-rule.dto';

const REMINDER_CHANNEL = 'Notification + e-mail';

/**
 * Preventive-maintenance planning, ported from the prototype's PlanningScreen:
 * recurring rules, automatic reminders, and one-click work-order generation.
 * All queries are scoped by `siteId` (multi-tenant), taken from the auth user.
 * Relative dates are anchored to the seeded scenario (see scenario-clock).
 */
@Injectable()
export class PlanningService {
  constructor(private readonly prisma: PrismaService) {}

  listRules(siteId: string) {
    return this.prisma.planRule.findMany({ where: { siteId }, orderBy: { code: 'asc' } });
  }

  listReminders(siteId: string) {
    return this.prisma.reminder.findMany({ where: { siteId }, orderBy: { firedAt: 'desc' } });
  }

  /** Active rules whose next reminder window is open or approaching, soonest first. */
  async upcoming(siteId: string): Promise<UpcomingReminder[]> {
    const rules = await this.prisma.planRule.findMany({ where: { siteId, active: true } });
    return rules
      .map((r) => {
        const due = toISODate(r.nextDue);
        const remindOn = minusDaysISO(due, r.reminderLead);
        return {
          rule: r as unknown as UpcomingReminder['rule'],
          remindOn,
          dueIn: daysUntil(due),
          remindIn: daysUntil(remindOn),
        };
      })
      .sort((a, b) => a.dueIn - b.dueIn);
  }

  async createRule(siteId: string, dto: CreatePlanRuleDto): Promise<PlanRule> {
    await this.assertMachine(siteId, dto.machineId);
    await this.assertTechnician(siteId, dto.technicianId);

    const code = await this.nextCode(siteId);
    const due = dto.nextDue.slice(0, 10);

    // Create the rule, its first work order, and a scheduled reminder atomically.
    return this.prisma.$transaction(async (tx) => {
      const rule = await tx.planRule.create({
        data: {
          siteId,
          code,
          machineId: dto.machineId,
          title: dto.title,
          everyWeeks: dto.everyWeeks,
          technicianId: dto.technicianId,
          duration: dto.duration,
          nextDue: new Date(due),
          reminderLead: dto.reminderLead,
        },
      });
      await tx.intervention.create({
        data: this.workOrderData(siteId, rule, dto.technicianId, due),
      });
      await tx.reminder.create({
        data: this.reminderData(siteId, rule, dto.technicianId, due, 'scheduled'),
      });
      return rule;
    });
  }

  async updateRule(siteId: string, id: string, dto: UpdatePlanRuleDto): Promise<PlanRule> {
    await this.findRule(siteId, id);
    if (dto.technicianId) await this.assertTechnician(siteId, dto.technicianId);

    const data: Prisma.PlanRuleUpdateInput = {
      ...(dto.active !== undefined ? { active: dto.active } : {}),
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.everyWeeks !== undefined ? { everyWeeks: dto.everyWeeks } : {}),
      ...(dto.duration !== undefined ? { duration: dto.duration } : {}),
      ...(dto.reminderLead !== undefined ? { reminderLead: dto.reminderLead } : {}),
      ...(dto.nextDue !== undefined ? { nextDue: new Date(dto.nextDue.slice(0, 10)) } : {}),
      ...(dto.technicianId !== undefined
        ? { technician: { connect: { id: dto.technicianId } } }
        : {}),
    };
    return this.prisma.planRule.update({ where: { id }, data });
  }

  /**
   * "Planifier maintenant": create the due work order, log a sent reminder, and
   * advance the rule's next due date by its recurrence.
   */
  async scheduleNow(siteId: string, id: string): Promise<PlanRule> {
    const rule = await this.findRule(siteId, id);
    if (!rule.active) throw new BadRequestException('Rule is suspended');
    if (!rule.technicianId) throw new BadRequestException('Rule has no assigned technician');

    const due = toISODate(rule.nextDue);
    const technicianId = rule.technicianId;

    return this.prisma.$transaction(async (tx) => {
      await tx.intervention.create({ data: this.workOrderData(siteId, rule, technicianId, due) });
      await tx.reminder.create({ data: this.reminderData(siteId, rule, technicianId, due, 'sent') });
      return tx.planRule.update({
        where: { id: rule.id },
        data: { nextDue: new Date(addWeeksISO(due, rule.everyWeeks)) },
      });
    });
  }

  // ── Builders ──────────────────────────────────────────────────────────────
  private workOrderData(
    siteId: string,
    rule: PlanRule,
    technicianId: string,
    due: string,
  ): Prisma.InterventionUncheckedCreateInput {
    return {
      siteId,
      machineId: rule.machineId,
      technicianId,
      kind: InterventionKind.PREVENTIVE,
      description: rule.title,
      scheduledFor: new Date(due),
      duration: rule.duration,
      status: InterventionStatus.PLANNED,
      planRuleId: rule.id,
    };
  }

  private reminderData(
    siteId: string,
    rule: PlanRule,
    technicianId: string,
    due: string,
    status: 'scheduled' | 'sent',
  ): Prisma.ReminderUncheckedCreateInput {
    return {
      siteId,
      ruleId: rule.id,
      title: rule.title,
      machineId: rule.machineId,
      technicianId,
      dueDate: new Date(due),
      firedAt: new Date(`${minusDaysISO(due, rule.reminderLead)}T08:00:00.000Z`),
      lead: rule.reminderLead,
      channel: REMINDER_CHANNEL,
      status,
    };
  }

  /** Next sequential rule reference for the tenant (PM-01, PM-02, …). */
  private async nextCode(siteId: string): Promise<string> {
    const rules = await this.prisma.planRule.findMany({ where: { siteId }, select: { code: true } });
    const max = rules.reduce((m, r) => Math.max(m, Number.parseInt(r.code.replace(/\D/g, ''), 10) || 0), 0);
    return `PM-${String(max + 1).padStart(2, '0')}`;
  }

  // ── Tenant-scoped referential checks ──────────────────────────────────────
  private async findRule(siteId: string, id: string): Promise<PlanRule> {
    const rule = await this.prisma.planRule.findFirst({ where: { id, siteId } });
    if (!rule) throw new NotFoundException(`Plan rule ${id} not found`);
    return rule;
  }

  private async assertMachine(siteId: string, machineId: string): Promise<void> {
    const m = await this.prisma.machine.findFirst({ where: { id: machineId, siteId }, select: { id: true } });
    if (!m) throw new NotFoundException(`Machine ${machineId} not found`);
  }

  private async assertTechnician(siteId: string, technicianId: string): Promise<void> {
    const u = await this.prisma.user.findFirst({ where: { id: technicianId, siteId }, select: { id: true } });
    if (!u) throw new BadRequestException(`Technician ${technicianId} is not a member of this site`);
  }
}
