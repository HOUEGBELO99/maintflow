import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Permission } from '@maintflow/shared';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@RequirePermission(Permission.VIEW_REPORTS)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('kpis')
  kpis(@CurrentUser() user: AuthUser) {
    return this.dashboard.getKpis(user.siteId);
  }

  @Get('faults-by-type')
  faultsByType(@CurrentUser() user: AuthUser) {
    return this.dashboard.faultsByType(user.siteId);
  }

  @Get('top-fault-machines')
  topFaultMachines(@CurrentUser() user: AuthUser, @Query('limit') limit?: string) {
    const n = limit ? Math.min(20, Math.max(1, Number(limit))) : 5;
    return this.dashboard.topFaultMachines(user.siteId, n);
  }
}
