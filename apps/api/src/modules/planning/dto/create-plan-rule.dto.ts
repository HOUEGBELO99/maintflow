import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNumber, IsString, IsUUID, Max, Min, MinLength } from 'class-validator';

export class CreatePlanRuleDto {
  @ApiProperty({ example: 'Lubrification mensuelle convoyeur' })
  @IsString()
  @MinLength(3)
  title!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  machineId!: string;

  @ApiProperty({ format: 'uuid', description: 'Assigned technician (a user of the site)' })
  @IsUUID()
  technicianId!: string;

  @ApiProperty({ example: 4, description: 'Recurrence in weeks' })
  @IsInt()
  @Min(1)
  @Max(520)
  everyWeeks!: number;

  @ApiProperty({ example: 2, description: 'Planned duration in hours' })
  @IsNumber()
  @Min(0)
  duration!: number;

  @ApiProperty({ example: '2026-05-28', description: 'First due date (ISO)' })
  @IsDateString()
  nextDue!: string;

  @ApiProperty({ example: 2, description: 'Days before the due date the reminder fires' })
  @IsInt()
  @Min(0)
  @Max(60)
  reminderLead!: number;
}
