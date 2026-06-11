import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

/**
 * Global so JwtService is available to JwtAuthGuard (registered as APP_GUARD).
 * Token issuance itself is handled by Supabase Auth; the API only *verifies*.
 */
@Global()
@Module({
  imports: [JwtModule.register({})],
  exports: [JwtModule],
})
export class AuthModule {}
