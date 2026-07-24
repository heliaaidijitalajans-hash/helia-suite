/**
 * Minimal HMAC-SHA256 JWT implementation for Helia Cloud.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

function b64url(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function b64urlJson(value: unknown): string {
  return b64url(JSON.stringify(value));
}

function decodeB64url(value: string): Buffer {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  return Buffer.from(padded + pad, 'base64');
}

export function signJwt(
  payload: Record<string, unknown>,
  secret: string,
  expiresInSeconds: number,
): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };
  const unsigned = `${b64urlJson(header)}.${b64urlJson(body)}`;
  const sig = createHmac('sha256', secret).update(unsigned).digest();
  return `${unsigned}.${b64url(sig)}`;
}

export function verifyJwt<T extends Record<string, unknown>>(
  token: string,
  secret: string,
): T {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }
  const [headerB64, payloadB64, sigB64] = parts as [string, string, string];
  const unsigned = `${headerB64}.${payloadB64}`;
  const expected = createHmac('sha256', secret).update(unsigned).digest();
  const actual = decodeB64url(sigB64);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new Error('Invalid token signature');
  }
  const header = JSON.parse(decodeB64url(headerB64).toString('utf8')) as { alg?: string };
  if (header.alg !== 'HS256') {
    throw new Error('Unsupported JWT algorithm');
  }
  const payload = JSON.parse(decodeB64url(payloadB64).toString('utf8')) as T & {
    exp?: number;
  };
  if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }
  return payload;
}
