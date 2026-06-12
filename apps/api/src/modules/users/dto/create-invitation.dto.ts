import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';

import { UserRole } from '@maintflow/shared';

export class CreateInvitationDto {
  @ApiProperty({ example: 'prenom.nom@entreprise.fr' })
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: Object.values(UserRole) })
  @IsEnum(Object.values(UserRole))
  role!: UserRole;

  @ApiProperty({ example: 'Atelier A' })
  @IsString()
  @MinLength(1)
  workshop!: string;
}
