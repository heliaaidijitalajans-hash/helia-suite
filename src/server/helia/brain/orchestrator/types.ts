/**
 * Helia AI Orchestrator — shared types.
 * Platform answers come ONLY from tool JSON; the LLM only formats.
 */

export type HeliaIntent =
  | "API_KEYS"
  | "PROJECTS"
  | "ORGANIZATIONS"
  | "USAGE"
  | "HEALTH"
  | "LOGS"
  | "DOCUMENTATION"
  | "INTEGRATIONS"
  | "ANALYTICS"
  | "CODE_GENERATION"
  | "SECURITY"
  | "GENERAL"
  | "UNKNOWN";

export type IntentScore = {
  intent: HeliaIntent;
  score: number;
};

export type ConversationEntityBag = {
  apiKeys?: Array<{
    id: string;
    name: string;
    enabled: boolean;
    keyEnvironment: string;
    usageCount: number;
    lastUsedAt?: string | null;
  }>;
  projects?: Array<{ id: string; name: string; environment: string }>;
  organizations?: Array<{ id: string; name: string; planId: string }>;
  newestApiKeyId?: string;
};

export type ConversationMemory = {
  conversationId: string;
  userId: string;
  turns: Array<{ role: "user" | "assistant"; content: string; at: string }>;
  lastIntents: HeliaIntent[];
  entities: ConversationEntityBag;
  lastToolPayloads: Record<string, unknown>;
};

export type ToolName =
  | "ApiKeyService"
  | "ProjectService"
  | "OrganizationService"
  | "UsageService"
  | "LogService"
  | "HealthService"
  | "DocumentationService"
  | "AnalyticsService"
  | "IntegrationService"
  | "CodeGenerationService"
  | "SecurityService"
  | "GeneralAssistant";

export type ToolCall = {
  tool: ToolName;
  intent: HeliaIntent;
  args: Record<string, unknown>;
};

export type ToolResult = {
  tool: ToolName;
  intent: HeliaIntent;
  ok: boolean;
  data: Record<string, unknown>;
  error?: string;
};

export type OrchestratorInput = {
  text: string;
  conversationId: string;
  userId: string;
  recentMessages?: Array<{ role: "user" | "assistant"; content: string }>;
};

export type OrchestratorOutput = {
  intents: HeliaIntent[];
  toolResults: ToolResult[];
  formattedText: string;
  reasoning: string;
  insufficientData: boolean;
};
