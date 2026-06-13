import { Controller, ForbiddenException, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Permission } from '@maintflow/shared';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminService } from './admin.service';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly config: ConfigService,
  ) {}

  /**
   * DEV ONLY. Wipes the demo tenant and re-seeds the prototype dataset. Disabled
   * in production (real tenants must never be reset from the UI).
   */
  @Post('reset-demo')
  @RequirePermission(Permission.MANAGE_USERS)
  @ApiOperation({ summary: 'Dev-only: reset the demo tenant to the example dataset (non-prod)' })
  resetDemo() {
    if (this.config.get<string>('NODE_ENV') === 'production') {
      throw new ForbiddenException('Demo reset is disabled in production');
    }
    return this.admin.resetDemo();
  }
}
