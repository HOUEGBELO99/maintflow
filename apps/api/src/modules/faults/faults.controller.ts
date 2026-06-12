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

import { FaultSeverity, FaultStatus, FaultType, Permission } from '@maintflow/shared';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CreateFaultDto } from './dto/create-fault.dto';
import { UpdateFaultDto } from './dto/update-fault.dto';
import { FaultsService } from './faults.service';

@ApiTags('faults')
@ApiBearerAuth()
@Controller('faults')
export class FaultsController {
  constructor(private readonly faults: FaultsService) {}

  @Get()
  @RequirePermission(Permission.VIEW_MACHINES)
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: FaultStatus,
    @Query('machineId') machineId?: string,
    @Query('severity') severity?: FaultSeverity,
    @Query('type') type?: FaultType,
  ) {
    return this.faults.findAll(user.siteId, { status, machineId, severity, type });
  }

  @Get(':id')
  @RequirePermission(Permission.VIEW_MACHINES)
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.faults.findOne(user.siteId, id);
  }

  @Post()
  @RequirePermission(Permission.REPORT_FAULTS)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateFaultDto) {
    return this.faults.create(user.siteId, user.id, dto);
  }

  @Patch(':id')
  @RequirePermission(Permission.MANAGE_INTERVENTIONS)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFaultDto,
  ) {
    return this.faults.update(user.siteId, id, dto);
  }

  @Delete(':id')
  @RequirePermission(Permission.MANAGE_INTERVENTIONS)
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.faults.remove(user.siteId, id);
  }
}
