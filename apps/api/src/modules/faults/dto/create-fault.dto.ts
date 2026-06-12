import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

import { FaultSeverity, FaultType } from '@maintflow/shared';

export class CreateFaultDto {
  @ApiProperty({ format: 'uuid', description: 'Machine the fault was observed on' })
  @IsUUID()
  machineId!: string;

  @ApiProperty({ enum: Object.values(FaultType) })
  @IsEnum(Object.values(FaultType))
  type!: FaultType;

  @ApiProperty({ example: 'Roulement palier moteur en surchauffe, vibrations anormales' })
  @IsString()
  @MinLength(4)
  @MaxLength(500)
  description!: string;

  @ApiProperty({ enum: Object.values(FaultSeverity), default: FaultSeverity.MEDIUM })
  @IsEnum(Object.values(FaultSeverity))
  severity: FaultSeverity = FaultSeverity.MEDIUM;
}
