import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Permission } from '@maintflow/shared';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @RequirePermission(Permission.VIEW_MACHINES)
  findAll(@CurrentUser() user: AuthUser) {
    return this.users.findAll(user.siteId);
  }

  @Get('invitations')
  @RequirePermission(Permission.MANAGE_USERS)
  listInvitations(@CurrentUser() user: AuthUser) {
    return this.users.listInvitations(user.siteId);
  }

  @Post('invitations')
  @RequirePermission(Permission.MANAGE_USERS)
  createInvitation(@CurrentUser() user: AuthUser, @Body() dto: CreateInvitationDto) {
    return this.users.createInvitation(user.siteId, user.id, dto);
  }

  @Patch(':id')
  @RequirePermission(Permission.MANAGE_USERS)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.users.update(user.siteId, id, dto);
  }
}
