import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

/**
 * Global so JwtService is available to JwtAuthGuard (registered as APP_GUARD).
 * Token issuance itself is handled by Supabase Auth; the API only *verifies*.
 * The dev-login route (AuthController) is a local-dev convenience, gated off in
 * production.
 */
@Global()
@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [JwtModule],
})
export class AuthModule {}
