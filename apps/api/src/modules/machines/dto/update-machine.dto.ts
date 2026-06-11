import { PartialType } from '@nestjs/swagger';

import { CreateMachineDto } from './create-machine.dto';

/** All fields optional — PATCH semantics. */
export class UpdateMachineDto extends PartialType(CreateMachineDto) {}
