import { Module } from '@nestjs/common';

import { SupabaseAuthAdminService } from './supabase-auth-admin.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, SupabaseAuthAdminService],
  exports: [UsersService],
})
export class UsersModule {}
