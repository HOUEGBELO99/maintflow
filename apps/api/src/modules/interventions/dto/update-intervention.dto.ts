import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

import { InterventionStatus } from '@maintflow/shared';
import { CreateInterventionDto } from './create-intervention.dto';

/**
 * PATCH semantics. The machine is immutable. `status` drives the lifecycle and
 * the closure fields (actualDuration/rating/signedBy) are set when completing.
 */
export class UpdateInterventionDto extends PartialType(
  OmitType(CreateInterventionDto, ['machineId'] as const),
) {
  @ApiPropertyOptional({ enum: Object.values(InterventionStatus) })
  @IsOptional()
  @IsEnum(Object.values(InterventionStatus))
  status?: InterventionStatus;

  @ApiPropertyOptional({ example: 2.25, description: 'Actual hours spent (on closure)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  actualDuration?: number;

  @ApiPropertyOptional({ example: 5, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ example: 'L. Moreau' })
  @IsOptional()
  @IsString()
  signedBy?: string;
}
