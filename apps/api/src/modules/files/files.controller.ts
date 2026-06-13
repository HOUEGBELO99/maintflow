import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';

import { Permission } from '@maintflow/shared';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { FilesService, type UploadedFileLike } from './files.service';

@ApiTags('files')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Post('faults/:faultId')
  @ApiConsumes('multipart/form-data')
  @RequirePermission(Permission.REPORT_FAULTS)
  @UseInterceptors(FileInterceptor('file'))
  uploadFaultPhoto(
    @CurrentUser() user: AuthUser,
    @Param('faultId', ParseUUIDPipe) faultId: string,
    @UploadedFile() file: UploadedFileLike,
  ) {
    return this.files.attachToFault(user.siteId, faultId, file);
  }

  @Post('interventions/:interventionId')
  @ApiConsumes('multipart/form-data')
  @RequirePermission(Permission.MANAGE_INTERVENTIONS)
  @UseInterceptors(FileInterceptor('file'))
  uploadInterventionPhoto(
    @CurrentUser() user: AuthUser,
    @Param('interventionId', ParseUUIDPipe) interventionId: string,
    @UploadedFile() file: UploadedFileLike,
  ) {
    return this.files.attachToIntervention(user.siteId, interventionId, file);
  }

  @Get(':id/url')
  @RequirePermission(Permission.VIEW_MACHINES)
  signedUrl(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.files.signedUrl(user.siteId, id);
  }
}
