/**
 * Shared helpers for Helia Cloud services.
 */

import { createHash, randomBytes } from "node:crypto";
import { createId } from "../utils/id";
import type {
  CloudUser,
  Organization,
  OrganizationStatus,
  PlatformRole,
  PublicUser,
} from "./types";

export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base.length > 0 ? base : `org-${createId("s").slice(-8)}`;
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function toPublicUser(user: CloudUser): PublicUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    emailVerified: user.emailVerified,
    role: user.role === "admin" ? "admin" : "user",
    createdAt: user.createdAt,
    ...(user.lastLoginAt ? { lastLoginAt: user.lastLoginAt } : {}),
    ...(user.disabledAt ? { disabledAt: user.disabledAt } : {}),
  };
}

export function resolvePlatformRole(user: CloudUser): PlatformRole {
  return user.role === "admin" ? "admin" : "user";
}

export function resolveOrganizationStatus(
  org: Pick<Organization, "status"> & { status?: OrganizationStatus }
): OrganizationStatus {
  return org.status === "suspended" ? "suspended" : "active";
}

export function currentMonthKey(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function addDaysIso(days: number, from = new Date()): string {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}
