import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from 'nestjs-pino';

import { validateEnv } from './config/configuration';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { MachinesModule } from './modules/machines/machines.module';
import { FaultsModule } from './modules/faults/faults.module';
import { InterventionsModule } from './modules/interventions/interventions.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { UsersModule } from './modules/users/users.module';
// import the remaining feature modules as they are implemented:
// PlanningModule, PartsModule, TechniciansModule,
// ReportsModule, NotificationsModule, FilesModule

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      // Shared monorepo env at the repo root, with a local override if present.
      envFilePath: ['.env', '../../.env'],
      validate: validateEnv,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
        // Never log auth headers or bodies with secrets.
        redact: ['req.headers.authorization', 'req.headers.cookie'],
      },
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    MachinesModule,
    FaultsModule,
    InterventionsModule,
    DashboardModule,
    UsersModule,
  ],
  providers: [
    // Auth is ON by default everywhere; opt out per-route with @Public().
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
