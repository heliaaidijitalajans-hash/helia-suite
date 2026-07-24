/**
 * Secure Helia API key generation and hashing.
 * Formats: hl_live_… / hl_test_…
 */

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { ApiKeyEnvironment } from '../types';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function randomSecret(length = 32): string {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[bytes[i]! % ALPHABET.length]!;
  }
  return out;
}

export function generateApiKeyMaterial(env: ApiKeyEnvironment): {
  fullKey: string;
  prefix: string;
  lastFour: string;
} {
  const secret = randomSecret(36);
  const fullKey = `hl_${env}_${secret}`;
  const prefix = `hl_${env}_${secret.slice(0, 4)}`;
  return {
    fullKey,
    prefix,
    lastFour: secret.slice(-4),
  };
}

export function hashApiKey(fullKey: string, pepper: string): string {
  return createHmac('sha256', pepper).update(fullKey).digest('hex');
}

export function verifyApiKeyHash(fullKey: string, hash: string, pepper: string): boolean {
  const computed = Buffer.from(hashApiKey(fullKey, pepper), 'hex');
  const expected = Buffer.from(hash, 'hex');
  if (computed.length !== expected.length) return false;
  return timingSafeEqual(computed, expected);
}

export function parseApiKeyEnvironment(fullKey: string): ApiKeyEnvironment | undefined {
  if (fullKey.startsWith('hl_live_')) return 'live';
  if (fullKey.startsWith('hl_test_')) return 'test';
  return undefined;
}
