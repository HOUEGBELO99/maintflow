import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

import type { UserRole } from '@maintflow/shared';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PrismaService } from '../../modules/prisma/prisma.service';

/**
 * Verifies the Supabase-issued JWT (HS256, signed with SUPABASE_JWT_SECRET),
 * then loads the application profile to attach { id, email, role, siteId }.
 * Routes are protected by default; use @Public() to opt out.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest();
    const token = this.extractToken(req.headers.authorization);
    if (!token) throw new UnauthorizedException('Missing bearer token');

    let payload: { sub: string; email?: string };
    try {
      payload = await this.jwt.verifyAsync(token, {
        secret: this.config.getOrThrow<string>('SUPABASE_JWT_SECRET'),
        audience: this.config.get<string>('ACCESS_TOKEN_AUDIENCE'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const profile = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, siteId: true, status: true },
    });
    if (!profile || profile.status !== 'active') {
      throw new UnauthorizedException('User not found or inactive');
    }

    req.user = {
      id: profile.id,
      email: profile.email,
      role: profile.role as UserRole,
      siteId: profile.siteId,
    };
    return true;
  }

  private extractToken(header?: string): string | null {
    if (!header) return null;
    const [scheme, value] = header.split(' ');
    return scheme === 'Bearer' && value ? value : null;
  }
}
