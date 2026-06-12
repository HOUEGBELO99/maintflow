import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import type { UserRole } from '@maintflow/shared';
import { PrismaService } from '../prisma/prisma.service';

export interface DevLoginResult {
  accessToken: string;
  user: { id: string; email: string; name: string; role: UserRole; siteId: string };
}

/**
 * Local-dev helper service. In production, tokens are issued by Supabase Auth
 * and the API only verifies them — devLogin must never be reachable in prod
 * (the controller guards on NODE_ENV).
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async devLogin(email: string): Promise<DevLoginResult> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException(`No user with email ${email}`);

    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, aud: this.config.get<string>('ACCESS_TOKEN_AUDIENCE') ?? 'authenticated', role: 'authenticated' },
      { secret: this.config.getOrThrow<string>('SUPABASE_JWT_SECRET'), algorithm: 'HS256', expiresIn: '12h' },
    );

    return {
      accessToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role as UserRole, siteId: user.siteId },
    };
  }
}
