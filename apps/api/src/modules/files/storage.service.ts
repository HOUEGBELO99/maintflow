import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { WebSocket as WsWebSocket } from 'ws';

// Node < 22 has no global WebSocket, which @supabase/supabase-js's realtime
// client requires at construction — even though we only use Storage here.
// Polyfill it from `ws` so the client can be created on Node 20 (Render).
const globalWithWs = globalThis as unknown as { WebSocket?: unknown };
if (!globalWithWs.WebSocket) {
  globalWithWs.WebSocket = WsWebSocket;
}

/**
 * Thin wrapper over Supabase Storage using the service-role key (server-only).
 * Kept behind this seam so [FilesService] can be unit-tested with a mock.
 */
@Injectable()
export class StorageService {
  private readonly client: ReturnType<typeof createClient>;
  private readonly bucket: string;

  constructor(config: ConfigService) {
    this.client = createClient(
      config.getOrThrow<string>('SUPABASE_URL'),
      config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    this.bucket = config.get<string>('SUPABASE_STORAGE_BUCKET') ?? 'maintflow-files';
  }

  async upload(path: string, data: Buffer, contentType: string): Promise<void> {
    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(path, data, { contentType, upsert: false });
    if (error) throw new Error(`Storage upload failed: ${error.message}`);
  }

  async signedUrl(path: string, expiresInSeconds = 3600): Promise<string> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUrl(path, expiresInSeconds);
    if (error || !data) {
      throw new Error(`Signed URL failed: ${error?.message ?? 'unknown error'}`);
    }
    return data.signedUrl;
  }
}
