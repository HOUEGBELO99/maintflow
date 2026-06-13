import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { InterventionKind, InterventionStatus, Permission } from '@maintflow/shared';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CreateInterventionDto } from './dto/create-intervention.dto';
import { UpdateInterventionDto } from './dto/update-intervention.dto';
import { InterventionsService } from './interventions.service';

@ApiTags('interventions')
@ApiBearerAuth()
@Controller('interventions')
export class InterventionsController {
  constructor(private readonly interventions: InterventionsService) {}

  @Get()
  @RequirePermission(Permission.VIEW_MACHINES)
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: InterventionStatus,
    @Query('technicianId') technicianId?: string,
    @Query('machineId') machineId?: string,
    @Query('kind') kind?: InterventionKind,
  ) {
    return this.interventions.findAll(user.siteId, { status, technicianId, machineId, kind });
  }

  @Get(':id')
  @RequirePermission(Permission.VIEW_MACHINES)
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.interventions.findOne(user.siteId, id);
  }

  @Post()
  @RequirePermission(Permission.MANAGE_INTERVENTIONS)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateInterventionDto) {
    return this.interventions.create(user.siteId, dto);
  }

  @Patch(':id')
  @RequirePermission(Permission.MANAGE_INTERVENTIONS)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInterventionDto,
  ) {
    return this.interventions.update(user.siteId, id, dto);
  }

  @Delete(':id')
  @RequirePermission(Permission.MANAGE_INTERVENTIONS)
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.interventions.remove(user.siteId, id);
  }
}
