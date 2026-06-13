import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  Min,
  ValidateNested,
} from 'class-validator';

import { InterventionKind } from '@maintflow/shared';

export class ChecklistItemDto {
  @ApiProperty({ example: 'Consignation électrique (LOTO)' })
  @IsString()
  @MinLength(1)
  label!: string;

  @ApiProperty({ default: false })
  @IsBoolean()
  done = false;
}

export class CreateInterventionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  machineId!: string;

  @ApiProperty({ format: 'uuid', description: 'Assigned technician (a user of the site)' })
  @IsUUID()
  technicianId!: string;

  @ApiProperty({ enum: Object.values(InterventionKind) })
  @IsEnum(Object.values(InterventionKind))
  kind!: InterventionKind;

  @ApiProperty({ example: 'Remplacement roulement palier moteur' })
  @IsString()
  @MinLength(4)
  description!: string;

  @ApiProperty({ example: '2026-05-21', description: 'Scheduled date (ISO)' })
  @IsDateString()
  scheduledFor!: string;

  @ApiProperty({ example: 4, description: 'Planned duration in hours' })
  @IsNumber()
  @Min(0)
  duration!: number;

  @ApiPropertyOptional({ format: 'uuid', description: 'Fault this intervention resolves' })
  @IsOptional()
  @IsUUID()
  linkedFaultId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Preventive plan rule that generated it' })
  @IsOptional()
  @IsUUID()
  planRuleId?: string;

  @ApiPropertyOptional({ type: [ChecklistItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  checklist?: ChecklistItemDto[];
}
