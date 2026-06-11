import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { Criticality, MachineState } from '@maintflow/shared';

export class CreateMachineDto {
  @ApiProperty({ example: 'MCH-001' })
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  code!: string;

  @ApiProperty({ example: 'Compresseur Atlas A7' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 'compresseur' })
  @IsString()
  type!: string;

  @ApiProperty({ example: 'Atelier A' })
  @IsString()
  workshop!: string;

  @ApiProperty({ example: '2021-04-18' })
  @IsDateString()
  installedAt!: string;

  @ApiProperty({ enum: Object.values(MachineState), default: MachineState.OK })
  @IsEnum(Object.values(MachineState))
  state: MachineState = MachineState.OK;

  @ApiProperty({ enum: Object.values(Criticality), default: Criticality.MEDIUM })
  @IsEnum(Object.values(Criticality))
  criticality: Criticality = Criticality.MEDIUM;

  @ApiProperty({ example: 1200, description: '€ per hour of downtime' })
  @IsInt()
  @Min(0)
  hourlyCost = 0;

  @ApiProperty({ example: 12 })
  @IsInt()
  @Min(1)
  lifespanYears = 10;
}
