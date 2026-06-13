import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createRemoteJWKSet,
  decodeProtectedHeader,
  jwtVerify,
  type JWTVerifyGetKey,
} from 'jose';

/** The claims the API relies on after verifying a Supabase access token. */
export interface VerifiedToken {
  sub: string;
  email?: string;
}

/**
 * Verifies Supabase-issued access tokens. Supabase now signs with asymmetric
 * JWT signing keys (ECC P-256 / RSA), exposed via the project JWKS endpoint, so
 * that is the primary path. HS256 (the legacy shared secret) is still accepted
 * so the local `dev-login` / `mint-dev-token` helpers keep working.
 */
@Injectable()
export class SupabaseTokenVerifier {
  private jwks?: JWTVerifyGetKey;

  constructor(private readonly config: ConfigService) {}

  async verify(token: string): Promise<VerifiedToken> {
    const audience = this.config.get<string>('ACCESS_TOKEN_AUDIENCE');
    try {
      const { alg } = decodeProtectedHeader(token);
      const { payload } =
        alg === 'HS256'
          ? await jwtVerify(token, this.hmacKey(), { audience })
          : await jwtVerify(token, this.getJwks(), { audience });

      if (typeof payload.sub !== 'string') {
        throw new UnauthorizedException('Token has no subject');
      }
      return {
        sub: payload.sub,
        email: typeof payload.email === 'string' ? payload.email : undefined,
      };
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /** Legacy HS256 shared secret — local dev-login tokens. */
  private hmacKey(): Uint8Array {
    return new TextEncoder().encode(
      this.config.getOrThrow<string>('SUPABASE_JWT_SECRET'),
    );
  }

  /** Remote key set for the asymmetric signing keys (built once, then cached). */
  private getJwks(): JWTVerifyGetKey {
    if (!this.jwks) {
      const base = this.config.getOrThrow<string>('SUPABASE_URL');
      this.jwks = createRemoteJWKSet(
        new URL('/auth/v1/.well-known/jwks.json', base),
      );
    }
    return this.jwks;
  }
}
