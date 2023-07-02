import { Injectable } from '@nestjs/common';
import { createRemoteJWKSet, JWTPayload, jwtVerify, type JWTVerifyGetKey } from 'jose';
import { Issuer, type BaseClient } from 'openid-client';

@Injectable()
export class AuthService {
  static async initialize(): Promise<AuthService> {
    const issuer = await Issuer.discover(process.env.AUTH_ISSUER_URL);
    console.log(`issuer=${JSON.stringify(issuer.metadata)}`);
    const client = new issuer.Client({
      client_id: process.env.AUTH_CLIENT_ID,
      client_secret: process.env.AUTH_CLIENT_SECRET,
      redirect_uris: [process.env.AUTH_REDIRECT_URI],
      response_types: ['code'],
    });
    if (issuer.metadata.jwks_uri == null) {
      throw new Error('issuer.metadata.jwks_uri is null');
    }
    const jwks = createRemoteJWKSet(new URL(issuer.metadata.jwks_uri));
    return new AuthService(client, jwks);
  }

  private constructor(private client: BaseClient, private jwks: JWTVerifyGetKey) {}

  authorizationUrl(obj: unknown): string {
    const state = Buffer.from(JSON.stringify(obj)).toString('base64');
    return this.client.authorizationUrl({ state });
  }

  parseState(state: string): unknown {
    const obj = JSON.parse(Buffer.from(state, 'base64').toString());
    return obj;
  }

  async callback(code: string): Promise<{ accessToken: string; idToken: string; refreshToken: string }> {
    const tokenSet = await this.client.callback(process.env.AUTH_REDIRECT_URI, { code });
    if (tokenSet.access_token && tokenSet.id_token && tokenSet.refresh_token) {
      return {
        accessToken: tokenSet.access_token,
        idToken: tokenSet.id_token,
        refreshToken: tokenSet.refresh_token,
      };
    }
    throw new Error('tokens has empty');
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string; idToken: string; refreshToken?: string }> {
    const tokenSet = await this.client.refresh(refreshToken);
    if (tokenSet.access_token && tokenSet.id_token) {
      return {
        accessToken: tokenSet.access_token,
        idToken: tokenSet.id_token,
        refreshToken: tokenSet.refresh_token,
      };
    }
    throw new Error('tokens has empty');
  }

  async verify(idToken: string): Promise<JWTPayload> {
    const result = await jwtVerify(idToken, this.jwks, {
      maxTokenAge: process.env.AUTH_MAX_TOKEN_AGE,
    });
    return result.payload;
  }
}
