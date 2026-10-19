import type { PrismaService } from '../../modules/prisma/prisma.service';
import { AuthProfileCache } from './auth-profile.cache';

describe('AuthProfileCache', () => {
  const profile = { id: 'u1', email: 'a@b.fr', role: 'technicien', siteId: 's1', status: 'active' };
  const prisma = { user: { findUnique: jest.fn() } };
  let cache: AuthProfileCache;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    cache = new AuthProfileCache(prisma as unknown as PrismaService);
  });

  it('hits the database once per user within the TTL', async () => {
    prisma.user.findUnique.mockResolvedValue(profile);
    await cache.get('u1');
    await cache.get('u1');
    await cache.get('u1');
    expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
  });

  it('reloads after the TTL expires', async () => {
    jest.useFakeTimers({ now: 0 });
    prisma.user.findUnique.mockResolvedValue(profile);
    await cache.get('u1');
    jest.setSystemTime(AuthProfileCache.TTL_MS + 1);
    await cache.get('u1');
    expect(prisma.user.findUnique).toHaveBeenCalledTimes(2);
  });

  it('invalidate() applies a role/status change on the next request', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(profile).mockResolvedValueOnce({ ...profile, status: 'inactive' });
    await cache.get('u1');
    cache.invalidate('u1');
    await expect(cache.get('u1')).resolves.toMatchObject({ status: 'inactive' });
  });

  it('never caches an unknown user (a new member can sign in right away)', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(profile);
    await expect(cache.get('u1')).resolves.toBeNull();
    await expect(cache.get('u1')).resolves.toEqual(profile);
  });
});
