/**
 * Helia Suite Admin Panel — platform-wide operations (not customer dashboard).
 */

import { createId } from "../../utils/id";
import {
  AppError,
  NotFoundError,
  ValidationError,
} from "../../utils/errors";
import type { CloudConfig } from "../config";
import {
  generateApiKeyMaterial,
  hashApiKey,
} from "../crypto/apiKey";
import { hashPassword } from "../crypto/password";
import { getPlan } from "../plans/catalog";
import type { CloudDatabase } from "../persistence/cloudDatabase";
import type {
  AdminSettingsRecord,
  ApiKeyRecord,
  CloudUser,
  Organization,
  PlanId,
  PlatformRole,
  PublicUser,
} from "../types";
import {
  resolveOrganizationStatus,
  resolvePlatformRole,
  toPublicUser,
} from "../utils";
import type { AuditLogService } from "./auditLogService";
import { buildAccessPolicy } from "@/lib/api-keys";
import { cleanEnvValue } from "@/server/helia/env";
import os from "node:os";

function omitSecretHash<T extends { secretHash: string }>(
  record: T
): Omit<T, "secretHash"> {
  const { secretHash: _secretHash, ...rest } = record;
  return rest;
}

function startOfUtcDay(d = new Date()): string {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  ).toISOString();
}

function sanitizeKey(record: ApiKeyRecord): Omit<ApiKeyRecord, "secretHash"> {
  const access = buildAccessPolicy({
    applicationType:
      record.applicationType ??
      (record.permissions.includes("*") ? "internal_platform" : "backend"),
    capabilities: record.capabilities,
    permissions: record.permissions,
  });
  const normalized: ApiKeyRecord = {
    ...record,
    applicationType: record.applicationType ?? access.applicationType,
    capabilities: record.capabilities?.length
      ? record.capabilities
      : access.capabilities,
    permissions: record.permissions.includes("*")
      ? access.permissions
      : record.permissions.length
        ? record.permissions
        : access.permissions,
  };
  return omitSecretHash(normalized);
}

export class AdminService {
  constructor(
    private readonly db: CloudDatabase,
    private readonly config: CloudConfig,
    private readonly audit: AuditLogService
  ) {}

  async bootstrapAdmins(): Promise<void> {
    await this.ensureAdminCredentialsAccount();
    await this.promoteListedAdminEmails();

    // Normalize legacy users missing role
    const allUsers = await this.db.users.findAll();
    for (const user of allUsers) {
      if (!user.role) {
        await this.db.users.patch(user.id, {
          role: "user",
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // Normalize legacy orgs missing status
    const orgs = await this.db.organizations.findAll();
    for (const org of orgs) {
      if (!org.status) {
        await this.db.organizations.patch(org.id, {
          status: "active",
          updatedAt: new Date().toISOString(),
        });
      }
    }

    const existing = await this.db.settings.findById("system");
    if (!existing) {
      await this.db.settings.upsert(defaultSettings());
    }
  }

  /**
   * Create/update the platform admin from env credentials.
   * Password resolution order:
   *   HELIA_ADMIN_PASSWORD → HELIA_ADMIN_BOOTSTRAP_SECRET
   * Email resolution order:
   *   HELIA_ADMIN_EMAIL → first HELIA_ADMIN_EMAILS entry
   * Called on boot and before every login (Vercel /tmp wipe safe).
   */
  async ensureAdminCredentialsAccount(): Promise<CloudUser | null> {
    const emailFromEnv = cleanEnvValue(
      process.env.HELIA_ADMIN_EMAIL ?? this.config.adminEmail ?? ""
    ).toLowerCase();
    const password = cleanEnvValue(
      process.env.HELIA_ADMIN_PASSWORD ??
        this.config.adminPassword ??
        process.env.HELIA_ADMIN_BOOTSTRAP_SECRET ??
        this.config.adminBootstrapSecret ??
        ""
    );
    const email = emailFromEnv || this.listedAdminEmails()[0] || "";

    if (!email || password.length < 8) {
      return null;
    }

    // Always re-read users from disk before mutating (avoids stale memory).
    await this.db.users.reload();

    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();
    const found = await this.db.users.query((u) => u.email === email);
    const current = found[0];

    if (!current) {
      const user: CloudUser = {
        id: createId("usr"),
        email,
        passwordHash,
        displayName: "Helia Admin",
        emailVerified: true,
        role: "admin",
        createdAt: now,
        updatedAt: now,
      };
      await this.db.users.upsert(user);
      await this.audit.write({
        category: "admin",
        message: `Created platform admin account ${email}`,
        actorUserId: user.id,
      });
      return user;
    }

    const next: CloudUser = {
      ...current,
      passwordHash,
      role: "admin",
      emailVerified: true,
      updatedAt: now,
    };
    delete next.disabledAt;
    await this.db.users.upsert(next);
    return next;
  }

  /** True when email/password match the configured admin env credentials. */
  matchesAdminEnvCredentials(emailRaw: string, passwordRaw: string): boolean {
    const emailFromEnv = cleanEnvValue(
      process.env.HELIA_ADMIN_EMAIL ?? this.config.adminEmail ?? ""
    ).toLowerCase();
    const adminEmail = emailFromEnv || this.listedAdminEmails()[0] || "";
    const adminPassword = cleanEnvValue(
      process.env.HELIA_ADMIN_PASSWORD ??
        this.config.adminPassword ??
        process.env.HELIA_ADMIN_BOOTSTRAP_SECRET ??
        this.config.adminBootstrapSecret ??
        ""
    );
    const email = cleanEnvValue(emailRaw).toLowerCase();
    const password = cleanEnvValue(passwordRaw);
    if (!adminEmail || adminPassword.length < 8) return false;
    return email === adminEmail && password === adminPassword;
  }

  /** Always read live env so `.env.local` / Vercel updates apply without stale cache gaps. */
  listedAdminEmails(): string[] {
    const raw = cleanEnvValue(
      process.env.HELIA_ADMIN_EMAILS ?? this.config.adminEmails ?? ""
    );
    return raw
      .split(",")
      .map((e) => cleanEnvValue(e).toLowerCase())
      .filter(Boolean);
  }

  /**
   * Promote every existing account whose email is in HELIA_ADMIN_EMAILS.
   * Safe to call on login and on every /admin gate — idempotent.
   */
  async promoteListedAdminEmails(): Promise<string[]> {
    const emails = this.listedAdminEmails();
    const promoted: string[] = [];
    for (const email of emails) {
      const users = await this.db.users.query((u) => u.email === email);
      const user = users[0];
      if (!user) continue;
      if (resolvePlatformRole(user) === "admin") continue;
      await this.db.users.patch(user.id, {
        role: "admin",
        updatedAt: new Date().toISOString(),
      });
      await this.audit.write({
        category: "admin",
        message: `Promoted ${email} to platform admin (HELIA_ADMIN_EMAILS)`,
        actorUserId: user.id,
      });
      promoted.push(email);
    }
    return promoted;
  }

  /** Ensure this user is admin if their email is listed — returns fresh user record. */
  async ensureListedAdmin(userId: string): Promise<CloudUser> {
    await this.promoteListedAdminEmails();
    const user = await this.db.users.findById(userId);
    if (!user) throw new NotFoundError("User", userId);
    return user;
  }

  async countAdmins(): Promise<number> {
    const users = await this.db.users.findAll();
    return users.filter((u) => resolvePlatformRole(u) === "admin").length;
  }

  /**
   * Secure self-promote: logged-in user + HELIA_ADMIN_BOOTSTRAP_SECRET.
   * Use when no admin exists yet or env email list was missed.
   */
  async promoteWithBootstrapSecret(
    userId: string,
    secret: string
  ): Promise<PublicUser> {
    const expected = (
      process.env.HELIA_ADMIN_BOOTSTRAP_SECRET ||
      this.config.adminBootstrapSecret ||
      ""
    ).trim();
    if (expected.length < 16) {
      throw new AppError(
        "Admin bootstrap secret is not configured (HELIA_ADMIN_BOOTSTRAP_SECRET).",
        { statusCode: 503, code: "BOOTSTRAP_UNAVAILABLE" }
      );
    }
    if (!secret || secret !== expected) {
      throw new AppError("Invalid bootstrap secret", {
        statusCode: 403,
        code: "FORBIDDEN",
      });
    }

    const user = await this.db.users.findById(userId);
    if (!user) throw new NotFoundError("User", userId);
    if (user.disabledAt) {
      throw new AppError("Account disabled", {
        statusCode: 403,
        code: "ACCOUNT_DISABLED",
      });
    }

    if (resolvePlatformRole(user) !== "admin") {
      await this.db.users.patch(user.id, {
        role: "admin",
        updatedAt: new Date().toISOString(),
      });
      await this.audit.write({
        category: "admin",
        level: "warning",
        message: `Promoted ${user.email} via bootstrap secret`,
        actorUserId: user.id,
      });
    }

    const refreshed = await this.db.users.findById(userId);
    if (!refreshed) throw new NotFoundError("User", userId);
    return toPublicUser(refreshed);
  }

  async getOverview() {
    const [users, orgs, projects, keys, usage, logs] = await Promise.all([
      this.db.users.findAll(),
      this.db.organizations.findAll(),
      this.db.projects.findAll(),
      this.db.apiKeys.findAll(),
      this.db.usage.findAll(),
      this.audit.list({ limit: 25 }),
    ]);

    const activeKeys = keys.filter((k) => k.enabled);
    const month = new Date().toISOString().slice(0, 7);
    const monthBuckets = usage.filter((u) => u.month === month);
    let monthRequests = 0;
    let monthErrors = 0;
    for (const b of monthBuckets) {
      monthRequests += b.requests;
      monthErrors += b.errors;
    }

    const dayStart = startOfUtcDay();
    const requestsToday = await this.audit.countSince(dayStart, "request");
    const errorRate =
      monthRequests > 0
        ? Number(((monthErrors / monthRequests) * 100).toFixed(2))
        : 0;

    const activity = [
      ...users
        .filter((u) => u.lastLoginAt)
        .map((u) => ({
          at: u.lastLoginAt!,
          type: "auth" as const,
          summary: `${u.email} last login`,
        })),
      ...keys
        .filter((k) => k.lastUsedAt)
        .map((k) => ({
          at: k.lastUsedAt!,
          type: "api" as const,
          summary: `API key ${k.name} (${k.prefix}…${k.lastFour}) used`,
        })),
      ...logs.map((l) => ({
        at: l.createdAt,
        type: l.category,
        summary: l.message,
      })),
    ]
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 20);

    return {
      totals: {
        users: users.length,
        organizations: orgs.length,
        projects: projects.length,
        activeApiKeys: activeKeys.length,
        apiKeys: keys.length,
      },
      requestsToday,
      monthRequests,
      monthErrors,
      errorRate,
      uptimeSeconds: Math.floor(process.uptime()),
      latestActivity: activity,
      recentDeployments: [] as Array<{
        id: string;
        label: string;
        at: string;
      }>,
      platformVersion: this.config.version,
    };
  }

  async listUsers(input?: {
    q?: string;
    role?: PlatformRole | "all";
    status?: "active" | "disabled" | "all";
  }): Promise<PublicUser[]> {
    const q = input?.q?.trim().toLowerCase() ?? "";
    let users = await this.db.users.findAll();
    users.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    if (input?.role && input.role !== "all") {
      users = users.filter((u) => resolvePlatformRole(u) === input.role);
    }
    if (input?.status === "active") {
      users = users.filter((u) => !u.disabledAt);
    } else if (input?.status === "disabled") {
      users = users.filter((u) => Boolean(u.disabledAt));
    }
    if (q) {
      users = users.filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          u.displayName.toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(q)
      );
    }
    return users.map(toPublicUser);
  }

  async updateUser(
    actorId: string,
    userId: string,
    patch: {
      displayName?: string;
      role?: PlatformRole;
      disabled?: boolean;
    }
  ): Promise<PublicUser> {
    const user = await this.db.users.findById(userId);
    if (!user) throw new NotFoundError("User", userId);

    const next: Partial<typeof user> = {
      updatedAt: new Date().toISOString(),
    };
    if (typeof patch.displayName === "string") {
      const name = patch.displayName.trim();
      if (!name) throw new ValidationError("Display name is required");
      next.displayName = name;
    }
    if (patch.role) {
      if (userId === actorId && patch.role !== "admin") {
        throw new ValidationError("Cannot demote your own admin role");
      }
      next.role = patch.role;
    }
    if (patch.disabled === true) {
      if (userId === actorId) {
        throw new ValidationError("Cannot disable your own account");
      }
      next.disabledAt = new Date().toISOString();
    } else if (patch.disabled === false) {
      next.disabledAt = undefined;
    }

    const updated = await this.db.users.patch(userId, next);
    if (!updated) throw new NotFoundError("User", userId);

    // Clear disabledAt properly when re-enabling
    if (patch.disabled === false && updated.disabledAt) {
      const cleared = { ...updated };
      delete cleared.disabledAt;
      cleared.updatedAt = new Date().toISOString();
      await this.db.users.upsert(cleared);
      await this.audit.write({
        category: "admin",
        message: `Re-enabled user ${updated.email}`,
        actorUserId: actorId,
      });
      return toPublicUser(cleared);
    }

    await this.audit.write({
      category: "admin",
      message: `Updated user ${updated.email}`,
      actorUserId: actorId,
      meta: patch as Record<string, unknown>,
    });
    return toPublicUser(updated);
  }

  async deleteUser(actorId: string, userId: string): Promise<void> {
    if (actorId === userId) {
      throw new ValidationError("Cannot delete your own account");
    }
    const user = await this.db.users.findById(userId);
    if (!user) throw new NotFoundError("User", userId);

    const owned = await this.db.organizations.query(
      (o) => o.ownerUserId === userId
    );
    if (owned.length > 0) {
      throw new AppError(
        "User owns organizations. Reassign or delete them first.",
        { statusCode: 409, code: "USER_OWNS_ORGS" }
      );
    }

    const memberships = await this.db.memberships.query(
      (m) => m.userId === userId
    );
    for (const m of memberships) {
      await this.db.memberships.delete(m.id);
    }
    const sessions = await this.db.sessions.query((s) => s.userId === userId);
    for (const s of sessions) {
      await this.db.sessions.delete(s.id);
    }
    await this.db.users.delete(userId);
    await this.audit.write({
      category: "admin",
      level: "warning",
      message: `Deleted user ${user.email}`,
      actorUserId: actorId,
    });
  }

  async resetUserPassword(
    actorId: string,
    userId: string,
    newPassword: string
  ): Promise<void> {
    if (newPassword.length < 8) {
      throw new ValidationError("Password must be at least 8 characters");
    }
    const user = await this.db.users.findById(userId);
    if (!user) throw new NotFoundError("User", userId);
    await this.db.users.patch(userId, {
      passwordHash: await hashPassword(newPassword),
      updatedAt: new Date().toISOString(),
    });
    const sessions = await this.db.sessions.query(
      (s) => s.userId === userId && !s.revokedAt
    );
    for (const s of sessions) {
      await this.db.sessions.patch(s.id, {
        revokedAt: new Date().toISOString(),
      });
    }
    await this.audit.write({
      category: "admin",
      level: "warning",
      message: `Reset password for ${user.email}`,
      actorUserId: actorId,
    });
  }

  async listOrganizations(input?: { q?: string; status?: string }) {
    const q = input?.q?.trim().toLowerCase() ?? "";
    let orgs = await this.db.organizations.findAll();
    orgs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (input?.status === "active" || input?.status === "suspended") {
      orgs = orgs.filter(
        (o) => resolveOrganizationStatus(o) === input.status
      );
    }
    if (q) {
      orgs = orgs.filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.slug.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q)
      );
    }

    const result = [];
    for (const org of orgs) {
      result.push(await this.enrichOrganization(org));
    }
    return result;
  }

  async getOrganization(orgId: string) {
    const org = await this.db.organizations.findById(orgId);
    if (!org) throw new NotFoundError("Organization", orgId);
    return this.enrichOrganization(org);
  }

  private async enrichOrganization(org: Organization) {
    const [projects, keys, memberships, usage] = await Promise.all([
      this.db.projects.query((p) => p.organizationId === org.id),
      this.db.apiKeys.query((k) => k.organizationId === org.id),
      this.db.memberships.query((m) => m.organizationId === org.id),
      this.db.usage.query((u) => u.organizationId === org.id),
    ]);
    const month = new Date().toISOString().slice(0, 7);
    const monthUsage = usage.filter((u) => u.month === month);
    const requests = monthUsage.reduce((s, b) => s + b.requests, 0);
    const errors = monthUsage.reduce((s, b) => s + b.errors, 0);
    return {
      ...org,
      status: resolveOrganizationStatus(org),
      projectCount: projects.length,
      apiKeyCount: keys.length,
      memberCount: memberships.length,
      usage: { month, requests, errors },
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        environment: p.environment,
        createdAt: p.createdAt,
      })),
      apiKeys: keys.map(sanitizeKey),
    };
  }

  async updateOrganization(
    actorId: string,
    orgId: string,
    patch: {
      name?: string;
      planId?: PlanId;
      status?: "active" | "suspended";
    }
  ) {
    const org = await this.db.organizations.findById(orgId);
    if (!org) throw new NotFoundError("Organization", orgId);
    const next: Partial<Organization> = {
      updatedAt: new Date().toISOString(),
    };
    if (typeof patch.name === "string") {
      const name = patch.name.trim();
      if (name.length < 2) throw new ValidationError("Name is required");
      next.name = name;
    }
    if (patch.planId) {
      getPlan(patch.planId);
      next.planId = patch.planId;
      const subs = await this.db.subscriptions.query(
        (s) => s.organizationId === orgId
      );
      for (const sub of subs) {
        await this.db.subscriptions.patch(sub.id, {
          planId: patch.planId,
          updatedAt: new Date().toISOString(),
        });
      }
    }
    if (patch.status) next.status = patch.status;
    const updated = await this.db.organizations.patch(orgId, next);
    if (!updated) throw new NotFoundError("Organization", orgId);
    await this.audit.write({
      category: "admin",
      message: `Updated organization ${updated.name}`,
      actorUserId: actorId,
      organizationId: orgId,
      meta: patch as Record<string, unknown>,
    });
    return this.enrichOrganization(updated);
  }

  async deleteOrganization(actorId: string, orgId: string): Promise<void> {
    const org = await this.db.organizations.findById(orgId);
    if (!org) throw new NotFoundError("Organization", orgId);

    const projects = await this.db.projects.query(
      (p) => p.organizationId === orgId
    );
    for (const p of projects) {
      const keys = await this.db.apiKeys.query((k) => k.projectId === p.id);
      for (const k of keys) await this.db.apiKeys.delete(k.id);
      await this.db.projects.delete(p.id);
    }
    const memberships = await this.db.memberships.query(
      (m) => m.organizationId === orgId
    );
    for (const m of memberships) await this.db.memberships.delete(m.id);
    const subs = await this.db.subscriptions.query(
      (s) => s.organizationId === orgId
    );
    for (const s of subs) await this.db.subscriptions.delete(s.id);
    const usage = await this.db.usage.query((u) => u.organizationId === orgId);
    for (const u of usage) await this.db.usage.delete(u.id);
    await this.db.organizations.delete(orgId);

    await this.audit.write({
      category: "admin",
      level: "warning",
      message: `Deleted organization ${org.name}`,
      actorUserId: actorId,
      organizationId: orgId,
    });
  }

  /** Applications = API keys connected to Helia API (named integrations). */
  async listApplications(input?: { q?: string; status?: string }) {
    const q = input?.q?.trim().toLowerCase() ?? "";
    let keys = await this.db.apiKeys.findAll();
    keys.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (input?.status === "enabled") keys = keys.filter((k) => k.enabled);
    if (input?.status === "disabled") keys = keys.filter((k) => !k.enabled);
    if (q) {
      keys = keys.filter(
        (k) =>
          k.name.toLowerCase().includes(q) ||
          k.prefix.toLowerCase().includes(q) ||
          (k.applicationType ?? "").toLowerCase().includes(q) ||
          k.id.toLowerCase().includes(q)
      );
    }

    const orgs = await this.db.organizations.findAll();
    const orgMap = new Map(orgs.map((o) => [o.id, o]));
    return keys.map((k) => {
      const org = orgMap.get(k.organizationId);
      return {
        id: k.id,
        name: k.name,
        status: k.enabled ? "enabled" : "disabled",
        organizationId: k.organizationId,
        organizationName: org?.name ?? "Unknown",
        apiKeyPrefix: `${k.prefix}…${k.lastFour}`,
        applicationType: k.applicationType ?? null,
        lastActivity: k.lastUsedAt ?? null,
        requests: k.usageCount,
        createdAt: k.createdAt,
        projectId: k.projectId,
        permissions: sanitizeKey(k).permissions,
        capabilities: sanitizeKey(k).capabilities,
      };
    });
  }

  async setApplicationEnabled(
    actorId: string,
    keyId: string,
    enabled: boolean
  ) {
    const key = await this.db.apiKeys.findById(keyId);
    if (!key) throw new NotFoundError("Application", keyId);
    const updated = await this.db.apiKeys.patch(keyId, {
      enabled,
      ...(enabled
        ? {}
        : { disabledAt: new Date().toISOString() }),
    });
    if (!updated) throw new NotFoundError("Application", keyId);
    if (enabled && updated.disabledAt) {
      const cleared = { ...updated };
      delete cleared.disabledAt;
      await this.db.apiKeys.upsert(cleared);
    }
    await this.audit.write({
      category: "application",
      message: `${enabled ? "Enabled" : "Disabled"} application ${key.name}`,
      actorUserId: actorId,
      apiKeyId: keyId,
      organizationId: key.organizationId,
    });
    return (await this.listApplications()).find((a) => a.id === keyId);
  }

  async rotateApplicationKey(actorId: string, keyId: string) {
    const existing = await this.db.apiKeys.findById(keyId);
    if (!existing) throw new NotFoundError("Application", keyId);
    await this.db.apiKeys.patch(existing.id, {
      enabled: false,
      disabledAt: new Date().toISOString(),
    });
    const material = generateApiKeyMaterial(existing.keyEnvironment);
    const access = buildAccessPolicy({
      applicationType: existing.applicationType,
      capabilities: existing.capabilities,
      permissions: existing.permissions,
    });
    const now = new Date().toISOString();
    const record: ApiKeyRecord = {
      id: createId("key"),
      organizationId: existing.organizationId,
      projectId: existing.projectId,
      name: existing.name,
      prefix: material.prefix,
      keyEnvironment: existing.keyEnvironment,
      secretHash: hashApiKey(material.fullKey, this.config.apiKeyPepper),
      lastFour: material.lastFour,
      enabled: true,
      ...(existing.expiresAt ? { expiresAt: existing.expiresAt } : {}),
      createdAt: now,
      createdByUserId: actorId,
      rotatedFromId: existing.id,
      usageCount: 0,
      permissions: access.permissions,
      applicationType: access.applicationType,
      capabilities: access.capabilities,
    };
    await this.db.apiKeys.upsert(record);
    await this.audit.write({
      category: "application",
      level: "warning",
      message: `Rotated API key for application ${existing.name}`,
      actorUserId: actorId,
      apiKeyId: record.id,
      organizationId: existing.organizationId,
    });
    return { record: sanitizeKey(record), secret: material.fullKey };
  }

  async deleteApplication(actorId: string, keyId: string) {
    const key = await this.db.apiKeys.findById(keyId);
    if (!key) throw new NotFoundError("Application", keyId);
    await this.db.apiKeys.delete(keyId);
    await this.audit.write({
      category: "application",
      level: "warning",
      message: `Deleted application ${key.name}`,
      actorUserId: actorId,
      organizationId: key.organizationId,
    });
  }

  async listApiKeys(input?: { q?: string; status?: string }) {
    const apps = await this.listApplications(input);
    const owners = await this.db.users.findAll();
    const ownerMap = new Map(owners.map((u) => [u.id, u]));
    const keys = await this.db.apiKeys.findAll();
    const keyMap = new Map(keys.map((k) => [k.id, k]));

    return apps.map((app) => {
      const raw = keyMap.get(app.id);
      const owner = raw ? ownerMap.get(raw.createdByUserId) : undefined;
      return {
        ...app,
        ownerEmail: owner?.email ?? null,
        ownerUserId: raw?.createdByUserId ?? null,
        keyEnvironment: raw?.keyEnvironment ?? null,
        capabilities: app.capabilities,
        permissions: app.permissions,
      };
    });
  }

  async getAnalytics() {
    const [users, keys, usage, logs] = await Promise.all([
      this.db.users.findAll(),
      this.db.apiKeys.findAll(),
      this.db.usage.findAll(),
      this.audit.list({ limit: 500 }),
    ]);
    const month = new Date().toISOString().slice(0, 7);
    const monthBuckets = usage.filter((u) => u.month === month);
    const byMonth = new Map<
      string,
      { requests: number; errors: number; brainRequests: number }
    >();
    for (const b of usage) {
      const cur = byMonth.get(b.month) ?? {
        requests: 0,
        errors: 0,
        brainRequests: 0,
      };
      cur.requests += b.requests;
      cur.errors += b.errors;
      cur.brainRequests += b.brainRequests;
      byMonth.set(b.month, cur);
    }
    const series = [...byMonth.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([monthKey, totals]) => ({ month: monthKey, ...totals }));

    const dayStart = startOfUtcDay();
    const requestsToday = logs.filter(
      (l) => l.category === "request" && l.createdAt >= dayStart
    ).length;
    const authEvents = logs.filter((l) => l.category === "auth").length;
    const errorLogs = logs.filter((l) => l.level === "error").length;

    const monthRequests = monthBuckets.reduce((s, b) => s + b.requests, 0);
    const monthErrors = monthBuckets.reduce((s, b) => s + b.errors, 0);

    return {
      users: users.length,
      apiKeys: keys.length,
      activeApiKeys: keys.filter((k) => k.enabled).length,
      requestsToday,
      monthRequests,
      monthErrors,
      errorRate:
        monthRequests > 0
          ? Number(((monthErrors / monthRequests) * 100).toFixed(2))
          : 0,
      authEvents,
      errorLogs,
      series,
      topKeys: [...keys]
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 10)
        .map((k) => ({
          id: k.id,
          name: k.name,
          usageCount: k.usageCount,
          lastUsedAt: k.lastUsedAt ?? null,
        })),
    };
  }

  async getHealth() {
    const mem = process.memoryUsage();
    let database: "ok" | "error" = "ok";
    try {
      await this.db.users.findAll();
    } catch {
      database = "error";
    }

    let brain: "ok" | "error" = "ok";
    try {
      const { getEmbeddedBrainHealth } = await import(
        "@/server/helia/brain/embedded"
      ).catch(() => ({ getEmbeddedBrainHealth: null }));
      if (typeof getEmbeddedBrainHealth === "function") {
        brain = getEmbeddedBrainHealth() ? "ok" : "error";
      } else {
        brain = "ok";
      }
    } catch {
      brain = "ok";
    }

    return {
      status: database === "ok" ? "healthy" : "degraded",
      checkedAt: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      services: {
        api: "ok" as const,
        database,
        authentication: "ok" as const,
        storage: database,
        brain,
        queue: "ok" as const,
      },
      memory: {
        rssBytes: mem.rss,
        heapUsedBytes: mem.heapUsed,
        heapTotalBytes: mem.heapTotal,
        externalBytes: mem.external,
      },
      cpu: {
        loadAverage: os.loadavg(),
      },
      platformVersion: this.config.version,
      nodeEnv: this.config.nodeEnv,
    };
  }

  async getSettings(): Promise<AdminSettingsRecord> {
    const row = await this.db.settings.findById("system");
    return row ?? defaultSettings();
  }

  async updateSettings(
    actorId: string,
    patch: Partial<
      Omit<AdminSettingsRecord, "id" | "updatedAt" | "updatedByUserId">
    >
  ): Promise<AdminSettingsRecord> {
    const current = await this.getSettings();
    const next: AdminSettingsRecord = {
      ...current,
      ...patch,
      id: "system",
      updatedAt: new Date().toISOString(),
      updatedByUserId: actorId,
    };
    await this.db.settings.upsert(next);
    await this.audit.write({
      category: "admin",
      message: "Updated admin system settings",
      actorUserId: actorId,
    });
    return next;
  }
}

function defaultSettings(): AdminSettingsRecord {
  return {
    id: "system",
    systemName: "Helia Suite",
    supportEmail: "support@helia.suite",
    jwtAccessTtlSeconds: 900,
    rateLimitMax: 300,
    requireEmailVerification: false,
    brandingAccent: "#D4AF37",
    monthlyRequestSoftLimit: 100_000,
    updatedAt: new Date().toISOString(),
  };
}
