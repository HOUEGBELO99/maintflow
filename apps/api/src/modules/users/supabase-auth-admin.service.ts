import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { WebSocket as WsWebSocket } from 'ws';

// @supabase/supabase-js needs a global WebSocket at construction (realtime),
// absent on Node 20 (Render). Polyfill from `ws` — same as StorageService.
const globalWithWs = globalThis as unknown as { WebSocket?: unknown };
if (!globalWithWs.WebSocket) {
  globalWithWs.WebSocket = WsWebSocket;
}

export interface InvitedAuthUser {
  id: string;
  email: string;
}

/**
 * Thin seam over the Supabase Auth admin API (service-role, server-only).
 * Used to invite new members: Supabase creates the auth user and emails a
 * password-setup link pointing back at the web app. Behind this interface so
 * [UsersService] stays unit-testable with a mock.
 *
 * NOTE: email delivery requires SMTP configured on the Supabase project and the
 * redirect URL allow-listed (Auth → URL Configuration). Without SMTP the invite
 * call fails and the error is surfaced to the caller.
 */
@Injectable()
export class SupabaseAuthAdminService {
  private readonly client: SupabaseClient;
  private readonly redirectTo: string;

  constructor(config: ConfigService) {
    this.client = createClient(
      config.getOrThrow<string>('SUPABASE_URL'),
      config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    this.redirectTo = `${config.getOrThrow<string>('WEB_URL')}/auth/set-password`;
  }

  /**
   * Invite a new member by email. Creates the (unconfirmed) auth user and sends
   * the setup email. Returns the new auth user id so the app row can be aligned
   * (JWT `sub` must equal `public.users.id`).
   */
  async invite(email: string, metadata: Record<string, unknown>): Promise<InvitedAuthUser> {
    const { data, error } = await this.client.auth.admin.inviteUserByEmail(email, {
      data: metadata,
      redirectTo: this.redirectTo,
    });
    if (error) throw error;
    return { id: data.user.id, email: data.user.email ?? email };
  }
}
