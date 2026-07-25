/**
 * Append-only audit / request log for Admin Panel.
 */

import { createId } from "../../utils/id";
import type { CloudDatabase } from "../persistence/cloudDatabase";
import type {
  AuditLogCategory,
  AuditLogLevel,
  AuditLogRecord,
} from "../types";

export class AuditLogService {
  constructor(private readonly db: CloudDatabase) {}

  async write(input: {
    level?: AuditLogLevel;
    category: AuditLogCategory;
    message: string;
    actorUserId?: string;
    organizationId?: string;
    projectId?: string;
    apiKeyId?: string;
    meta?: Record<string, unknown>;
  }): Promise<AuditLogRecord> {
    const record: AuditLogRecord = {
      id: createId("log"),
      level: input.level ?? "info",
      category: input.category,
      message: input.message,
      ...(input.actorUserId ? { actorUserId: input.actorUserId } : {}),
      ...(input.organizationId ? { organizationId: input.organizationId } : {}),
      ...(input.projectId ? { projectId: input.projectId } : {}),
      ...(input.apiKeyId ? { apiKeyId: input.apiKeyId } : {}),
      ...(input.meta ? { meta: input.meta } : {}),
      createdAt: new Date().toISOString(),
    };
    await this.db.auditLogs.upsert(record);
    return record;
  }

  async list(input?: {
    q?: string;
    level?: AuditLogLevel | "all";
    category?: AuditLogCategory | "all";
    limit?: number;
  }): Promise<AuditLogRecord[]> {
    const q = input?.q?.trim().toLowerCase() ?? "";
    const limit = Math.min(Math.max(input?.limit ?? 200, 1), 1000);
    let rows = await this.db.auditLogs.findAll();
    rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    if (input?.level && input.level !== "all") {
      rows = rows.filter((r) => r.level === input.level);
    }
    if (input?.category && input.category !== "all") {
      rows = rows.filter((r) => r.category === input.category);
    }
    if (q) {
      rows = rows.filter(
        (r) =>
          r.message.toLowerCase().includes(q) ||
          r.category.includes(q) ||
          r.level.includes(q) ||
          r.organizationId?.toLowerCase().includes(q) ||
          r.apiKeyId?.toLowerCase().includes(q)
      );
    }
    return rows.slice(0, limit);
  }

  async countSince(isoStart: string, category?: AuditLogCategory): Promise<number> {
    const rows = await this.db.auditLogs.query(
      (r) =>
        r.createdAt >= isoStart &&
        (category ? r.category === category : true)
    );
    return rows.length;
  }
}
