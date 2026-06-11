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

import { Permission } from '@maintflow/shared';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CreateMachineDto } from './dto/create-machine.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';
import { MachinesService } from './machines.service';

@ApiTags('machines')
@ApiBearerAuth()
@Controller('machines')
export class MachinesController {
  constructor(private readonly machines: MachinesService) {}

  @Get()
  @RequirePermission(Permission.VIEW_MACHINES)
  findAll(@CurrentUser() user: AuthUser, @Query('workshop') workshop?: string) {
    return this.machines.findAll(user.siteId, workshop);
  }

  @Get(':id')
  @RequirePermission(Permission.VIEW_MACHINES)
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.machines.findOne(user.siteId, id);
  }

  @Post()
  @RequirePermission(Permission.EDIT_MACHINES)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateMachineDto) {
    return this.machines.create(user.siteId, dto);
  }

  @Patch(':id')
  @RequirePermission(Permission.EDIT_MACHINES)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMachineDto,
  ) {
    return this.machines.update(user.siteId, id, dto);
  }

  @Delete(':id')
  @RequirePermission(Permission.EDIT_MACHINES)
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.machines.remove(user.siteId, id);
  }
}
