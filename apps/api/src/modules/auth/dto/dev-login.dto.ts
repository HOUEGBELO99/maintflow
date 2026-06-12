import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class DevLoginDto {
  @ApiProperty({ example: 'l.moreau@usine.fr' })
  @IsEmail()
  email!: string;
}
