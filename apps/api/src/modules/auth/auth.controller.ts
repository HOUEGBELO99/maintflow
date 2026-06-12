import { Body, Controller, ForbiddenException, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { DevLoginDto } from './dto/dev-login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  /**
   * DEV ONLY. Issues a Supabase-shaped token for a seeded user so the web/mobile
   * clients can authenticate locally without a real Supabase project. Disabled
   * whenever NODE_ENV is 'production'. In prod, login goes straight to Supabase.
   */
  @Public()
  @Post('dev-login')
  @ApiOperation({ summary: 'Dev-only: mint a token for a seeded user (non-prod)' })
  devLogin(@Body() dto: DevLoginDto) {
    if (this.config.get<string>('NODE_ENV') === 'production') {
      throw new ForbiddenException('dev-login is disabled in production');
    }
    return this.auth.devLogin(dto.email);
  }
}
