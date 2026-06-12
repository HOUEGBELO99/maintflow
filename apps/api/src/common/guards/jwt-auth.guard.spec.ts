import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

import { PrismaService } from '../../modules/prisma/prisma.service';
import { JwtAuthGuard } from './jwt-auth.guard';

/**
 * The guard is the single entry point for tenant identity: it must reject any
 * request it cannot tie to an active user, and attach { siteId, role } from the
 * DB profile — never from the token claims or the client.
 */
describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  const reflector = { getAllAndOverride: jest.fn() };
  const jwt = { verifyAsync: jest.fn() };
  const config = { getOrThrow: jest.fn().mockReturnValue('secret'), get: jest.fn() };
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
      jwt as unknown as JwtService,
      config as unknown as ConfigService,
      prisma as unknown as PrismaService,
    );
  });

  it('allows @Public() routes without a token', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const { ctx } = ctxWith();
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(jwt.verifyAsync).not.toHaveBeenCalled();
  });

  it('rejects a request with no bearer token', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const { ctx } = ctxWith();
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects an invalid/expired token', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    jwt.verifyAsync.mockRejectedValue(new Error('bad signature'));
    const { ctx } = ctxWith('Bearer tampered');
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects when the user is unknown or inactive', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    jwt.verifyAsync.mockResolvedValue({ sub: 'user-1' });
    prisma.user.findUnique.mockResolvedValue({ ...activeProfile, status: 'inactive' });
    const { ctx } = ctxWith('Bearer valid');
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('attaches the DB profile (siteId/role) for a valid active user', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    jwt.verifyAsync.mockResolvedValue({ sub: 'user-1', email: 'tech@site.fr' });
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
