import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { UserRole } from '@maintflow/shared';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { AuthenticatedRequest } from '../decorators/current-user.decorator';
import { SupabaseTokenVerifier } from '../auth/supabase-token.verifier';
import { AuthProfileCache } from '../auth/auth-profile.cache';

/**
 * Verifies the Supabase-issued access token (asymmetric signing keys via JWKS,
 * or the legacy HS256 secret for local dev-login), then loads the application
 * profile to attach { id, email, role, siteId }. Routes are protected by
 * default; use @Public() to opt out.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: SupabaseTokenVerifier,
    private readonly profiles: AuthProfileCache,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(req.headers.authorization);
    if (!token) throw new UnauthorizedException('Missing bearer token');

    const payload = await this.tokens.verify(token);

    // Cached briefly: saves a database round-trip on every request.
    const profile = await this.profiles.get(payload.sub);
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
