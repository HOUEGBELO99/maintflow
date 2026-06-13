import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import { UserRole } from '@maintflow/shared';

const USER_STATUS = ['active', 'inactive'] as const;
type UserStatus = (typeof USER_STATUS)[number];

/** Admin edit of a team member: change role or revoke/restore access. */
export class UpdateUserDto {
  @ApiPropertyOptional({ enum: Object.values(UserRole) })
  @IsOptional()
  @IsEnum(Object.values(UserRole))
  role?: UserRole;

  @ApiPropertyOptional({ enum: USER_STATUS })
  @IsOptional()
  @IsEnum(USER_STATUS)
  status?: UserStatus;
}
