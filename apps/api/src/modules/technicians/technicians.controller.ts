import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Permission } from '@maintflow/shared';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { TechniciansService } from './technicians.service';

@ApiTags('technicians')
@ApiBearerAuth()
@Controller('technicians')
export class TechniciansController {
  constructor(private readonly technicians: TechniciansService) {}

  @Get()
  @RequirePermission(Permission.MANAGE_INTERVENTIONS)
  findAll(@CurrentUser() user: AuthUser) {
    return this.technicians.findAll(user.siteId);
  }

  @Get(':id')
  @RequirePermission(Permission.MANAGE_INTERVENTIONS)
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.technicians.findOne(user.siteId, id);
  }
}
