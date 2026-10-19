import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Permission } from '@maintflow/shared';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CreatePlanRuleDto } from './dto/create-plan-rule.dto';
import { UpdatePlanRuleDto } from './dto/update-plan-rule.dto';
import { PlanningService } from './planning.service';

@ApiTags('planning')
@ApiBearerAuth()
@Controller('planning')
export class PlanningController {
  constructor(private readonly planning: PlanningService) {}

  @Get('rules')
  @RequirePermission(Permission.VIEW_REPORTS)
  listRules(@CurrentUser() user: AuthUser) {
    return this.planning.listRules(user.siteId);
  }

  @Get('reminders')
  @RequirePermission(Permission.VIEW_REPORTS)
  listReminders(@CurrentUser() user: AuthUser) {
    return this.planning.listReminders(user.siteId);
  }

  @Get('upcoming')
  @RequirePermission(Permission.VIEW_REPORTS)
  upcoming(@CurrentUser() user: AuthUser) {
    return this.planning.upcoming(user.siteId);
  }

  @Post('rules')
  @RequirePermission(Permission.PLAN_INTERVENTIONS)
  createRule(@CurrentUser() user: AuthUser, @Body() dto: CreatePlanRuleDto) {
    return this.planning.createRule(user.siteId, dto);
  }

  @Patch('rules/:id')
  @RequirePermission(Permission.PLAN_INTERVENTIONS)
  updateRule(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlanRuleDto,
  ) {
    return this.planning.updateRule(user.siteId, id, dto);
  }

  @Post('rules/:id/schedule')
  @RequirePermission(Permission.PLAN_INTERVENTIONS)
  scheduleNow(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.planning.scheduleNow(user.siteId, id);
  }

  @Delete('rules/:id')
  @RequirePermission(Permission.PLAN_INTERVENTIONS)
  deleteRule(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.planning.deleteRule(user.siteId, id);
  }
}
