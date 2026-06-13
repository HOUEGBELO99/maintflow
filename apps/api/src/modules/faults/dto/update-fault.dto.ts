import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { FaultStatus } from '@maintflow/shared';
import { CreateFaultDto } from './create-fault.dto';

/**
 * PATCH semantics. The machine a fault belongs to is immutable, so it is
 * omitted. `status` drives the lifecycle (the service stamps takenAt/resolvedAt).
 */
export class UpdateFaultDto extends PartialType(OmitType(CreateFaultDto, ['machineId'] as const)) {
  @ApiPropertyOptional({ enum: Object.values(FaultStatus) })
  @IsOptional()
  @IsEnum(Object.values(FaultStatus))
  status?: FaultStatus;

  @ApiPropertyOptional({ example: 'usure', description: 'Diagnosed root cause' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  rootCause?: string;
}
