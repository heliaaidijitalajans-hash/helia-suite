/**
 * Authentication service — register, login, verify, reset, JWT, sessions.
 */

import { createId } from '../../utils/id';
import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../utils/errors';
import type { CloudConfig } from '../config';
import { signJwt, verifyJwt } from '../crypto/jwt';
import { hashPassword, verifyPassword } from '../crypto/password';
import type { CloudDatabase } from '../persistence/cloudDatabase';
import type {
  AuthTokens,
  CloudSession,
  CloudUser,
  JwtAccessPayload,
  PublicUser,
} from '../types';
import { addDaysIso, hashToken, randomToken, toPublicUser } from '../utils';
import { cleanEnvValue } from '@/server/helia/env';

export class AuthService {
  constructor(
    private readonly db: CloudDatabase,
    private readonly config: CloudConfig,
  ) {}

  async register(input: {
    email: string;
    password: string;
    displayName: string;
  }): Promise<{ user: PublicUser; verificationToken?: string; tokens?: AuthTokens }> {
    const email = normalizeEmail(input.email);
    const password = input.password.trim();
    if (!email.includes('@')) throw new ValidationError('Invalid email');
    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }
    const existing = await this.db.users.query((u) => u.email === email);
    if (existing.length > 0) throw new AppError('Email already registered', { statusCode: 409, code: 'EMAIL_TAKEN' });

    const now = new Date().toISOString();
    const verificationToken = randomToken();
    const user: CloudUser = {
      id: createId('usr'),
      email,
      passwordHash: await hashPassword(password),
      displayName: input.displayName.trim() || email.split('@')[0]!,
      emailVerified: !this.config.requireEmailVerification,
      role: 'user',
      ...(this.config.requireEmailVerification
        ? { emailVerificationToken: hashToken(verificationToken) }
        : {}),
      createdAt: now,
      updatedAt: now,
    };
    await this.db.users.upsert(user);

    if (this.config.requireEmailVerification) {
      return { user: toPublicUser(user), verificationToken };
    }

    const tokens = await this.issueSession(user);
    return { user: toPublicUser(user), tokens };
  }

  async login(input: {
    email: string;
    password: string;
    userAgent?: string;
    ip?: string;
  }): Promise<{ user: PublicUser; tokens: AuthTokens }> {
    const email = normalizeEmail(input.email);
    const password = input.password.trim();
    if (!email || !password) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Always re-read users before auth (avoids stale in-memory cache).
    await this.db.users.reload();

    const users = await this.db.users.query((u) => u.email === email);
    const user = users[0];
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedError('Invalid email or password');
    }
    return this.completeLogin(user, input.userAgent, input.ip);
  }

  /**
   * Issue a session for an already-authenticated CloudUser
   * (e.g. admin env credential match — skip password hash).
   */
  async loginAsUser(
    user: CloudUser,
    opts?: { userAgent?: string; ip?: string },
  ): Promise<{ user: PublicUser; tokens: AuthTokens }> {
    return this.completeLogin(user, opts?.userAgent, opts?.ip);
  }

  private async completeLogin(
    user: CloudUser,
    userAgent?: string,
    ip?: string,
  ): Promise<{ user: PublicUser; tokens: AuthTokens }> {
    if (user.disabledAt) {
      throw new AppError('Account disabled', { statusCode: 403, code: 'ACCOUNT_DISABLED' });
    }
    if (this.config.requireEmailVerification && !user.emailVerified) {
      throw new AppError('Email not verified', { statusCode: 403, code: 'EMAIL_UNVERIFIED' });
    }
    const tokens = await this.issueSession(user, userAgent, ip);
    await this.db.users.patch(user.id, {
      lastLoginAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const fresh = (await this.db.users.findById(user.id)) ?? user;
    return { user: toPublicUser(fresh), tokens };
  }

  async verifyEmail(token: string): Promise<PublicUser> {
    const hashed = hashToken(token);
    const users = await this.db.users.query((u) => u.emailVerificationToken === hashed);
    const user = users[0];
    if (!user) throw new ValidationError('Invalid verification token');
    const updated: CloudUser = {
      ...user,
      emailVerified: true,
      updatedAt: new Date().toISOString(),
    };
    delete updated.emailVerificationToken;
    await this.db.users.upsert(updated);
    return toPublicUser(updated);
  }

  async requestPasswordReset(emailRaw: string): Promise<{ resetToken?: string }> {
    const email = normalizeEmail(emailRaw);
    const users = await this.db.users.query((u) => u.email === email);
    const user = users[0];
    // Always opaque success to avoid account enumeration in production responses;
    // return token only for local/dev delivery until mailer is wired.
    if (!user) return {};
    const resetToken = randomToken();
    await this.db.users.patch(user.id, {
      passwordResetToken: hashToken(resetToken),
      passwordResetExpiresAt: addDaysIso(1),
      updatedAt: new Date().toISOString(),
    });
    return { resetToken };
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (newPassword.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }
    const hashed = hashToken(token);
    const users = await this.db.users.query((u) => u.passwordResetToken === hashed);
    const user = users[0];
    if (!user?.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date().toISOString()) {
      throw new ValidationError('Invalid or expired reset token');
    }
    const updated: CloudUser = {
      ...user,
      passwordHash: await hashPassword(newPassword),
      updatedAt: new Date().toISOString(),
    };
    delete updated.passwordResetToken;
    delete updated.passwordResetExpiresAt;
    await this.db.users.upsert(updated);
    const sessions = await this.db.sessions.query((s) => s.userId === user.id && !s.revokedAt);
    for (const session of sessions) {
      await this.db.sessions.patch(session.id, { revokedAt: new Date().toISOString() });
    }
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const hashed = hashToken(refreshToken);
    const sessions = await this.db.sessions.query(
      (s) => s.refreshTokenHash === hashed && !s.revokedAt,
    );
    const session = sessions[0];
    if (!session || session.expiresAt < new Date().toISOString()) {
      throw new UnauthorizedError('Invalid refresh token');
    }
    const user = await this.db.users.findById(session.userId);
    if (!user) throw new UnauthorizedError('User not found');

    await this.db.sessions.patch(session.id, { revokedAt: new Date().toISOString() });
    return this.issueSession(user, session.userAgent, session.ip);
  }

  async logout(refreshToken: string): Promise<void> {
    const hashed = hashToken(refreshToken);
    const sessions = await this.db.sessions.query((s) => s.refreshTokenHash === hashed);
    const session = sessions[0];
    if (session) {
      await this.db.sessions.patch(session.id, { revokedAt: new Date().toISOString() });
    }
  }

  async authenticateAccessToken(token: string): Promise<{ user: CloudUser; session: CloudSession }> {
    let payload: JwtAccessPayload;
    try {
      payload = verifyJwt<JwtAccessPayload & Record<string, unknown>>(
        token,
        this.config.jwtAccessSecret,
      );
    } catch {
      throw new UnauthorizedError('Invalid access token');
    }
    if (payload.typ !== 'access') throw new UnauthorizedError('Invalid access token type');

    // Re-read disk — Vercel /tmp is per-instance; memory can be empty after cold start.
    await this.db.users.reload();
    await this.db.sessions.reload();

    let session = await this.db.sessions.findById(payload.sid);
    if (session?.revokedAt) {
      throw new UnauthorizedError('Session expired');
    }
    // Access JWT is source of truth for TTL; recreate wiped/expired session rows.
    if (session && session.expiresAt < new Date().toISOString()) {
      session = undefined;
    }

    let user: CloudUser | undefined =
      (session ? await this.db.users.findById(session.userId) : undefined) ??
      (await this.db.users.findById(payload.sub));

    if (!user && typeof payload.email === "string" && payload.email) {
      const email = normalizeEmail(payload.email);
      const found = await this.db.users.query((u) => u.email === email);
      user = found[0];
    }

    // Serverless recovery: JWT still valid but /tmp user+session wiped.
    if (!user) {
      user =
        (await this.rehydrateUserFromAccessPayload(payload)) ?? undefined;
    }
    if (!user) throw new UnauthorizedError("User not found");
    if (user.disabledAt) {
      throw new AppError("Account disabled", {
        statusCode: 403,
        code: "ACCOUNT_DISABLED",
      });
    }

    if (!session) {
      session = await this.rehydrateSessionFromAccessPayload(payload, user);
    }

    await this.db.sessions.patch(session.id, { lastUsedAt: new Date().toISOString() });
    return { user, session };
  }

  private listedAdminEmails(): string[] {
    const primary = cleanEnvValue(this.config.adminEmail).toLowerCase();
    const listed = cleanEnvValue(this.config.adminEmails)
      .split(',')
      .map((e) => cleanEnvValue(e).toLowerCase())
      .filter(Boolean);
    return [...new Set([primary, ...listed].filter(Boolean))];
  }

  private isAdminAccessPayload(payload: JwtAccessPayload): boolean {
    if (payload.role === 'admin') return true;
    const email =
      typeof payload.email === 'string' ? normalizeEmail(payload.email) : '';
    return Boolean(email && this.listedAdminEmails().includes(email));
  }

  /**
   * Recreate the admin (or listed) user with the JWT `sub` so the access
   * token keeps working after ephemeral storage wipe.
   */
  private async rehydrateUserFromAccessPayload(
    payload: JwtAccessPayload,
  ): Promise<CloudUser | null> {
    if (!this.isAdminAccessPayload(payload)) return null;
    const email =
      typeof payload.email === 'string' ? normalizeEmail(payload.email) : '';
    if (!email || !payload.sub) return null;

    const password = cleanEnvValue(
      this.config.adminPassword || this.config.adminBootstrapSecret || '',
    );
    const passwordHash = await hashPassword(
      password.length >= 8 ? password : randomToken(24),
    );
    const now = new Date().toISOString();
    const user: CloudUser = {
      id: payload.sub,
      email,
      passwordHash,
      displayName: 'Helia Admin',
      emailVerified: true,
      role: 'admin',
      createdAt: now,
      updatedAt: now,
    };
    await this.db.users.upsert(user);
    return user;
  }

  private async rehydrateSessionFromAccessPayload(
    payload: JwtAccessPayload,
    user: CloudUser,
  ): Promise<CloudSession> {
    const now = new Date().toISOString();
    const session: CloudSession = {
      id: payload.sid || createId('sess'),
      userId: user.id,
      refreshTokenHash: hashToken(randomToken(48)),
      createdAt: now,
      expiresAt: new Date(
        Date.now() + this.config.jwtRefreshTtlSeconds * 1000,
      ).toISOString(),
      lastUsedAt: now,
    };
    await this.db.sessions.upsert(session);
    return session;
  }

  async getUser(userId: string): Promise<PublicUser> {
    const user = await this.db.users.findById(userId);
    if (!user) throw new NotFoundError('User', userId);
    return toPublicUser(user);
  }

  private async issueSession(
    user: CloudUser,
    userAgent?: string,
    ip?: string,
  ): Promise<AuthTokens> {
    const refreshToken = randomToken(48);
    const session: CloudSession = {
      id: createId('sess'),
      userId: user.id,
      refreshTokenHash: hashToken(refreshToken),
      ...(userAgent !== undefined ? { userAgent } : {}),
      ...(ip !== undefined ? { ip } : {}),
      createdAt: new Date().toISOString(),
      expiresAt: new Date(
        Date.now() + this.config.jwtRefreshTtlSeconds * 1000,
      ).toISOString(),
      lastUsedAt: new Date().toISOString(),
    };
    await this.db.sessions.upsert(session);

    const accessToken = signJwt(
      {
        sub: user.id,
        email: user.email,
        typ: 'access',
        sid: session.id,
        role: user.role === 'admin' ? 'admin' : 'user',
      } satisfies JwtAccessPayload,
      this.config.jwtAccessSecret,
      this.config.jwtAccessTtlSeconds,
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: this.config.jwtAccessTtlSeconds,
      tokenType: 'Bearer',
    };
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
