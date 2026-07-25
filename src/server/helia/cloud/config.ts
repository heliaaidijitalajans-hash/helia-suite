/**
 * Helia Cloud configuration — embedded in Helia Suite (Next.js / Vercel).
 * Business defaults preserved from Helia Cloud; no separate Cloud server/ports.
 */

import { z } from "zod";
import path from "node:path";
import os from "node:os";

const booleanFromEnv = z
  .union([z.boolean(), z.string()])
  .transform((value) => {
    if (typeof value === "boolean") return value;
    return ["1", "true", "yes", "on"].includes(value.toLowerCase());
  });

function defaultDataDir(): string {
  if (process.env.CLOUD_DATA_DIR) return process.env.CLOUD_DATA_DIR;
  // Vercel: writable temp; local: project data folder
  if (process.env.VERCEL) {
    return path.join(os.tmpdir(), "helia-cloud");
  }
  return path.join(process.cwd(), "data", "cloud");
}

const CloudConfigSchema = z.object({
  nodeEnv: z.enum(["development", "test", "production"]).default("development"),
  port: z.coerce.number().int().positive().default(3000),
  host: z.string().default("0.0.0.0"),
  dataDir: z.string(),
  jwtAccessSecret: z.string().min(16),
  jwtRefreshSecret: z.string().min(16),
  jwtAccessTtlSeconds: z.coerce.number().int().positive().default(900),
  jwtRefreshTtlSeconds: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 60 * 24 * 30),
  apiKeyPepper: z.string().min(8),
  publicBaseUrl: z.string().default(""),
  corsOrigins: z.string().default("*"),
  rateLimitWindowMs: z.coerce.number().int().positive().default(60_000),
  rateLimitMax: z.coerce.number().int().positive().default(300),
  requireEmailVerification: booleanFromEnv.default(false),
  /** Comma-separated emails promoted to platform admin on boot / login. */
  adminEmails: z.string().default(""),
  /**
   * Optional one-time / emergency promote secret for POST /api/admin/bootstrap-promote.
   * Min 16 chars when set. Never commit the real value.
   */
  adminBootstrapSecret: z.string().default(""),
  version: z.string().default("1.0.0"),
});

export type CloudConfig = z.infer<typeof CloudConfigSchema>;

let cached: CloudConfig | undefined;

export function loadCloudConfig(): CloudConfig {
  if (cached) return cached;

  const parsed = CloudConfigSchema.safeParse({
    nodeEnv: process.env.CLOUD_NODE_ENV ?? process.env.NODE_ENV ?? "development",
    port: process.env.PORT ?? 3000,
    host: process.env.CLOUD_HOST ?? "0.0.0.0",
    dataDir: defaultDataDir(),
    jwtAccessSecret:
      process.env.CLOUD_JWT_ACCESS_SECRET ??
      "dev-cloud-access-secret-change-me",
    jwtRefreshSecret:
      process.env.CLOUD_JWT_REFRESH_SECRET ??
      "dev-cloud-refresh-secret-change-me",
    jwtAccessTtlSeconds: process.env.CLOUD_JWT_ACCESS_TTL ?? 900,
    jwtRefreshTtlSeconds: process.env.CLOUD_JWT_REFRESH_TTL ?? 2_592_000,
    apiKeyPepper: process.env.CLOUD_API_KEY_PEPPER ?? "dev-cloud-pepper",
    publicBaseUrl: process.env.CLOUD_PUBLIC_BASE_URL ?? "",
    corsOrigins: process.env.CLOUD_CORS_ORIGINS ?? "*",
    rateLimitWindowMs: process.env.CLOUD_RATE_LIMIT_WINDOW_MS ?? 60_000,
    rateLimitMax: process.env.CLOUD_RATE_LIMIT_MAX ?? 300,
    requireEmailVerification:
      process.env.CLOUD_REQUIRE_EMAIL_VERIFICATION ?? false,
    adminEmails: process.env.HELIA_ADMIN_EMAILS ?? "",
    adminBootstrapSecret: process.env.HELIA_ADMIN_BOOTSTRAP_SECRET ?? "",
    version: process.env.CLOUD_VERSION ?? "1.0.0",
  });

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid Helia Cloud configuration:\n${details}`);
  }

  cached = parsed.data;
  return cached;
}

export function resetCloudConfigCache(): void {
  cached = undefined;
}
