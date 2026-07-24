/**
 * API Key lifecycle — create, rotate, disable, delete, usage metadata.
 */

import { createId } from '../../utils/id.js';
import { AppError, NotFoundError, ValidationError } from '../../utils/errors.js';
import type { CloudConfig } from '../config.js';
import {
  generateApiKeyMaterial,
  hashApiKey,
  parseApiKeyEnvironment,
  verifyApiKeyHash,
} from '../crypto/apiKey.js';
import { getPlan } from '../plans/catalog.js';
import type { CloudDatabase } from '../persistence/cloudDatabase.js';
import type { ApiKeyEnvironment, ApiKeyRecord } from '../types.js';
import type { OrganizationService } from './organizationService.js';

export interface ApiKeyCreated {
  record: ApiKeyRecord;
  /** Plaintext shown once at creation/rotation only. */
  secret: string;
}

export class ApiKeyService {
  constructor(
    private readonly db: CloudDatabase,
    private readonly organizations: OrganizationService,
    private readonly config: CloudConfig,
  ) {}

  async create(input: {
    userId: string;
    projectId: string;
    name: string;
    keyEnvironment?: ApiKeyEnvironment;
    expiresAt?: string;
    permissions?: string[];
  }): Promise<ApiKeyCreated> {
    const project = await this.db.projects.findById(input.projectId);
    if (!project) throw new NotFoundError('Project', input.projectId);
    await this.organizations.requireMembership(project.organizationId, input.userId, 'admin');

    const org = await this.db.organizations.findById(project.organizationId);
    if (!org) throw new NotFoundError('Organization', project.organizationId);
    const plan = getPlan(org.planId);
    const existing = await this.db.apiKeys.query(
      (k) => k.projectId === input.projectId && k.enabled,
    );
    if (existing.length >= plan.limits.maxApiKeysPerProject) {
      throw new AppError('API key limit reached for current plan', {
        statusCode: 402,
        code: 'PLAN_LIMIT',
      });
    }

    const name = input.name.trim();
    if (!name) throw new ValidationError('API key name is required');

    const env =
      input.keyEnvironment ??
      (project.environment === 'production' ? 'live' : 'test');
    const material = generateApiKeyMaterial(env);
    const now = new Date().toISOString();
    const record: ApiKeyRecord = {
      id: createId('key'),
      organizationId: project.organizationId,
      projectId: project.id,
      name,
      prefix: material.prefix,
      keyEnvironment: env,
      secretHash: hashApiKey(material.fullKey, this.config.apiKeyPepper),
      lastFour: material.lastFour,
      enabled: true,
      ...(input.expiresAt !== undefined ? { expiresAt: input.expiresAt } : {}),
      createdAt: now,
      createdByUserId: input.userId,
      usageCount: 0,
      permissions: input.permissions ?? ['*'],
    };
    await this.db.apiKeys.upsert(record);
    return { record: sanitize(record), secret: material.fullKey };
  }

  async listForProject(projectId: string, userId: string): Promise<ApiKeyRecord[]> {
    const project = await this.db.projects.findById(projectId);
    if (!project) throw new NotFoundError('Project', projectId);
    await this.organizations.requireMembership(project.organizationId, userId);
    const keys = await this.db.apiKeys.query((k) => k.projectId === projectId);
    return keys.map(sanitize);
  }

  async listForUser(userId: string): Promise<ApiKeyRecord[]> {
    const memberships = await this.db.memberships.query((m) => m.userId === userId);
    const orgIds = new Set(memberships.map((m) => m.organizationId));
    const keys = await this.db.apiKeys.query((k) => orgIds.has(k.organizationId));
    return keys.map(sanitize);
  }

  async rotate(input: {
    userId: string;
    apiKeyId: string;
  }): Promise<ApiKeyCreated> {
    const existing = await this.requireKeyAdmin(input.apiKeyId, input.userId);
    await this.db.apiKeys.patch(existing.id, {
      enabled: false,
      disabledAt: new Date().toISOString(),
    });

    const material = generateApiKeyMaterial(existing.keyEnvironment);
    const now = new Date().toISOString();
    const record: ApiKeyRecord = {
      id: createId('key'),
      organizationId: existing.organizationId,
      projectId: existing.projectId,
      name: existing.name,
      prefix: material.prefix,
      keyEnvironment: existing.keyEnvironment,
      secretHash: hashApiKey(material.fullKey, this.config.apiKeyPepper),
      lastFour: material.lastFour,
      enabled: true,
      ...(existing.expiresAt !== undefined ? { expiresAt: existing.expiresAt } : {}),
      createdAt: now,
      createdByUserId: input.userId,
      rotatedFromId: existing.id,
      usageCount: 0,
      permissions: existing.permissions,
    };
    await this.db.apiKeys.upsert(record);
    return { record: sanitize(record), secret: material.fullKey };
  }

  async disable(apiKeyId: string, userId: string): Promise<ApiKeyRecord> {
    await this.requireKeyAdmin(apiKeyId, userId);
    const updated = await this.db.apiKeys.patch(apiKeyId, {
      enabled: false,
      disabledAt: new Date().toISOString(),
    });
    if (!updated) throw new NotFoundError('ApiKey', apiKeyId);
    return sanitize(updated);
  }

  async delete(apiKeyId: string, userId: string): Promise<void> {
    await this.requireKeyAdmin(apiKeyId, userId);
    await this.db.apiKeys.delete(apiKeyId);
  }

  async authenticateBearer(rawToken: string): Promise<ApiKeyRecord> {
    const token = rawToken.trim();
    const env = parseApiKeyEnvironment(token);
    if (!env) throw new AppError('Invalid API key format', { statusCode: 401, code: 'INVALID_API_KEY' });

    const candidates = await this.db.apiKeys.query(
      (k) => k.keyEnvironment === env && k.enabled,
    );
    for (const candidate of candidates) {
      if (!verifyApiKeyHash(token, candidate.secretHash, this.config.apiKeyPepper)) continue;
      if (candidate.expiresAt && candidate.expiresAt < new Date().toISOString()) {
        throw new AppError('API key expired', { statusCode: 401, code: 'API_KEY_EXPIRED' });
      }
      const patched = await this.db.apiKeys.patch(candidate.id, {
        lastUsedAt: new Date().toISOString(),
        usageCount: candidate.usageCount + 1,
      });
      return sanitize(patched ?? candidate);
    }
    throw new AppError('Invalid API key', { statusCode: 401, code: 'INVALID_API_KEY' });
  }

  private async requireKeyAdmin(apiKeyId: string, userId: string): Promise<ApiKeyRecord> {
    const key = await this.db.apiKeys.findById(apiKeyId);
    if (!key) throw new NotFoundError('ApiKey', apiKeyId);
    await this.organizations.requireMembership(key.organizationId, userId, 'admin');
    return key;
  }
}

function sanitize(record: ApiKeyRecord): ApiKeyRecord {
  // secretHash remains server-side; responses should omit it at the route layer.
  return { ...record };
}
