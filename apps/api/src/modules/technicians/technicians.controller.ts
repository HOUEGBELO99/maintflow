import { Body, Controller, Get, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Permission } from '@maintflow/shared';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { UpdateTechnicianDto } from './dto/update-technician.dto';
import { TechniciansService } from './technicians.service';

@ApiTags('technicians')
@ApiBearerAuth()
@Controller('technicians')
export class TechniciansController {
  constructor(private readonly technicians: TechniciansService) {}

  @Get()
  @RequirePermission(Permission.VIEW_REPORTS)
  findAll(@CurrentUser() user: AuthUser) {
    return this.technicians.findAll(user.siteId);
  }

  @Get(':id')
  @RequirePermission(Permission.VIEW_REPORTS)
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.technicians.findOne(user.siteId, id);
  }

  @Patch(':id')
  @RequirePermission(Permission.MANAGE_TECHNICIANS)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTechnicianDto,
  ) {
    return this.technicians.update(user.siteId, id, dto);
  }
}
