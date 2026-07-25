/**
 * Tool Router — maps intents → service tools (supports multi-tool calls).
 */

import type { ConversationMemory, HeliaIntent, ToolCall, ToolResult } from "./types";
import { executeTool } from "./tools";

const INTENT_TO_TOOL: Record<HeliaIntent, ToolCall["tool"]> = {
  API_KEYS: "ApiKeyService",
  PROJECTS: "ProjectService",
  ORGANIZATIONS: "OrganizationService",
  USAGE: "UsageService",
  LOGS: "LogService",
  HEALTH: "HealthService",
  DOCUMENTATION: "DocumentationService",
  ANALYTICS: "AnalyticsService",
  INTEGRATIONS: "IntegrationService",
  CODE_GENERATION: "CodeGenerationService",
  SECURITY: "SecurityService",
  GENERAL: "GeneralAssistant",
  UNKNOWN: "GeneralAssistant",
};

export function planToolCalls(intents: HeliaIntent[]): ToolCall[] {
  const seen = new Set<string>();
  const calls: ToolCall[] = [];
  for (const intent of intents) {
    const tool = INTENT_TO_TOOL[intent];
    const key = `${tool}:${intent}`;
    if (seen.has(key)) continue;
    seen.add(key);
    calls.push({ tool, intent, args: {} });
  }
  return calls;
}

export async function routeTools(
  intents: HeliaIntent[],
  userId: string,
  message: string,
  memory: ConversationMemory
): Promise<ToolResult[]> {
  const calls = planToolCalls(intents);
  const results = await Promise.all(
    calls.map((call) => executeTool(call.intent, userId, message, memory))
  );
  return results;
}
