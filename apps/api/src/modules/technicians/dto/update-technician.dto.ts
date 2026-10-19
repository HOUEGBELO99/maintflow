import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateTechnicianDto {
  @ApiPropertyOptional({ example: false, description: 'Disponible pour de nouvelles interventions' })
  @IsOptional()
  @IsBoolean()
  available?: boolean;

  @ApiPropertyOptional({ example: ['mécanique', 'hydraulique'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MinLength(2, { each: true })
  @MaxLength(30, { each: true })
  specialties?: string[];

  @ApiPropertyOptional({ example: 'Technicien sénior' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  title?: string;
}
