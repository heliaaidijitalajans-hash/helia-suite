/**
 * API Key create body validation — applicationType must be a backend enum.
 */

import { z } from "zod";
import {
  APPLICATION_TYPES,
  toApplicationTypeEnum,
  type ApplicationType,
} from "./catalog";

/**
 * Accept enum values or known UI labels, always output a backend enum.
 * Labels are normalized here so the stored/forwarded value is never display text.
 */
export const ApplicationTypeSchema = z.string().transform((value, ctx) => {
  try {
    return toApplicationTypeEnum(value) as ApplicationType;
  } catch (error) {
    ctx.addIssue({
      code: "custom",
      message:
        error instanceof Error
          ? error.message
          : `Invalid applicationType. Expected one of: ${APPLICATION_TYPES.join(", ")}`,
    });
    return z.NEVER;
  }
});

export const CreateApiKeyBodySchema = z.object({
  projectId: z.string().min(1, "projectId is required"),
  name: z.string().min(1, "API key name is required"),
  keyEnvironment: z.enum(["live", "test"]).optional(),
  expiresAt: z.string().optional(),
  applicationType: ApplicationTypeSchema.optional(),
  capabilities: z.array(z.string()).optional(),
  permissions: z.array(z.string()).optional(),
});

export type CreateApiKeyBody = z.infer<typeof CreateApiKeyBodySchema>;

export function parseCreateApiKeyBody(input: unknown): CreateApiKeyBody {
  const result = CreateApiKeyBodySchema.safeParse(input);
  if (!result.success) {
    const message = result.error.issues
      .map((issue) => {
        const path = issue.path.length ? `${issue.path.join(".")}: ` : "";
        return `${path}${issue.message}`;
      })
      .join("; ");
    throw new Error(message || "Invalid API key create payload");
  }
  return result.data;
}
