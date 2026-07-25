/**
 * Password hashing — scrypt via Node crypto (no external auth deps).
 * Salt is hex-decoded to Buffer for stable cross-platform verification.
 */

import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb);
const KEYLEN = 64;

async function scryptHash(
  password: string,
  saltBuf: Buffer
): Promise<Buffer> {
  return (await scrypt(password, saltBuf, KEYLEN)) as Buffer;
}

export async function hashPassword(password: string): Promise<string> {
  const saltBuf = randomBytes(16);
  const derived = await scryptHash(password, saltBuf);
  return `scrypt$${saltBuf.toString("hex")}$${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  encoded: string
): Promise<boolean> {
  const parts = encoded.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const saltHex = parts[1]!;
  const hashHex = parts[2]!;
  if (!saltHex || !hashHex || hashHex.length % 2 !== 0) return false;

  const saltBuf = Buffer.from(saltHex, "hex");
  if (saltBuf.length === 0) return false;

  // New format: salt hex → bytes
  const derived = await scryptHash(password, saltBuf);
  const expected = Buffer.from(hashHex, "hex");
  if (expected.length === derived.length && timingSafeEqual(expected, derived)) {
    return true;
  }

  // Legacy format: salt string used as UTF-8 (older builds)
  const legacyDerived = (await scrypt(password, saltHex, KEYLEN)) as Buffer;
  if (
    expected.length === legacyDerived.length &&
    timingSafeEqual(expected, legacyDerived)
  ) {
    return true;
  }

  return false;
}
