import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PrismaService } from '../../modules/prisma/prisma.service';
import { SupabaseTokenVerifier } from '../auth/supabase-token.verifier';
import { JwtAuthGuard } from './jwt-auth.guard';

/**
 * The guard is the single entry point for tenant identity: it must reject any
 * request it cannot tie to an active user, and attach { siteId, role } from the
 * DB profile — never from the token claims or the client.
 */
describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  const reflector = { getAllAndOverride: jest.fn() };
  const tokens = { verify: jest.fn() };
  const prisma = { user: { findUnique: jest.fn() } };

  const activeProfile = {
    id: 'user-1',
    email: 'tech@site.fr',
    role: 'technicien',
    siteId: 'site-1',
    status: 'active',
  };

  const ctxWith = (authorization?: string): { ctx: ExecutionContext; req: { user?: unknown } } => {
    const req: { headers: { authorization?: string }; user?: unknown } = {
      headers: authorization ? { authorization } : {},
    };
    const ctx = {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({ getRequest: () => req }),
    } as unknown as ExecutionContext;
    return { ctx, req };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new JwtAuthGuard(
      reflector as unknown as Reflector,
      tokens as unknown as SupabaseTokenVerifier,
      prisma as unknown as PrismaService,
    );
  });

  it('allows @Public() routes without a token', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const { ctx } = ctxWith();
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(tokens.verify).not.toHaveBeenCalled();
  });

  it('rejects a request with no bearer token', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const { ctx } = ctxWith();
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects an invalid/expired token', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    tokens.verify.mockRejectedValue(new UnauthorizedException('bad signature'));
    const { ctx } = ctxWith('Bearer tampered');
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects when the user is unknown or inactive', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    tokens.verify.mockResolvedValue({ sub: 'user-1' });
    prisma.user.findUnique.mockResolvedValue({ ...activeProfile, status: 'inactive' });
    const { ctx } = ctxWith('Bearer valid');
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('attaches the DB profile (siteId/role) for a valid active user', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    tokens.verify.mockResolvedValue({ sub: 'user-1', email: 'tech@site.fr' });
    prisma.user.findUnique.mockResolvedValue(activeProfile);
    const { ctx, req } = ctxWith('Bearer valid');

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(req.user).toEqual({
      id: 'user-1',
      email: 'tech@site.fr',
      role: 'technicien',
      siteId: 'site-1',
    });
  });
});
