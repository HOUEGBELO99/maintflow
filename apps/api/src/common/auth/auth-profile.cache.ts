import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../modules/prisma/prisma.service';

export interface AuthProfile {
  id: string;
  email: string;
  role: string;
  siteId: string;
  status: string;
}

/**
 * Short-lived cache of the profile the auth guard attaches to every request.
 *
 * Without it each API call pays one extra database round-trip before doing any
 * work — ~140 ms when the API and Supabase sit on different continents. A
 * 30 s TTL bounds how long a role/status change takes to apply, and
 * {@link invalidate} applies it at once when it happens through the API.
 * Unknown users are never cached, so a freshly invited member signs in at once.
 */
@Injectable()
export class AuthProfileCache {
  static readonly TTL_MS = 30_000;
  private static readonly MAX_ENTRIES = 5_000;

  private readonly entries = new Map<string, { profile: AuthProfile; expiresAt: number }>();

  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string): Promise<AuthProfile | null> {
    const now = Date.now();
    const hit = this.entries.get(userId);
    if (hit && hit.expiresAt > now) return hit.profile;

    const profile = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, siteId: true, status: true },
    });
    if (!profile) {
      this.entries.delete(userId);
      return null;
    }
    if (this.entries.size >= AuthProfileCache.MAX_ENTRIES) this.entries.clear();
    this.entries.set(userId, { profile, expiresAt: now + AuthProfileCache.TTL_MS });
    return profile;
  }

  /** Forget a user so the next request reloads their role/status. */
  invalidate(userId: string): void {
    this.entries.delete(userId);
  }
}
