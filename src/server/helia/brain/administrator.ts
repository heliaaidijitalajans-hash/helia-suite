/**
 * Helia Suite AI Administrator — orchestrates policy, live data, docs, and code help.
 */

import type { BrainAnswer } from "@/lib/api/brain-types";
import { createId } from "@/server/helia/utils/id";
import { answerApiKeyHelp } from "./api-key-help";
import { generateCodeExample } from "./code-examples";
import { searchDocumentation } from "./documentation-index";
import { analyzeError } from "./error-analysis";
import { answerFromPlatformData } from "./platform-context";
import { formatAdminSections } from "./response-format";
import { matchSecurityPolicy } from "./security-policy";
import {
  HELIA_ADMINISTRATOR_SYSTEM_PROMPT,
  NO_LIVE_DATA_MESSAGE,
  OUT_OF_SCOPE_MESSAGE,
} from "./system-prompt";

export type AdministratorAskInput = {
  text: string;
  conversationId: string;
  questionId?: string;
  answerId?: string;
};

const HELIA_SCOPE =
  /\b(helia|api|platform|organization|project|usage|log|monitor|deploy|integration|webhook|documentation|dashboard|admin|permission|capability|brain|suite|request|error|health|key)\b/i;

function isLikelyOutOfScope(text: string): boolean {
  if (HELIA_SCOPE.test(text)) return false;
  // Casual / general assistant prompts
  return /\b(write (a )?poem|tell me a joke|weather|capital of|chatgpt|who (are|r) you)\b/i.test(
    text
  );
}

export async function askHeliaAdministrator(
  input: AdministratorAskInput
): Promise<BrainAnswer> {
  const askedAt = new Date().toISOString();
  const answeredAt = new Date().toISOString();
  const text = input.text.trim();
  const questionId = input.questionId || createId("brainq");
  const answerId = input.answerId || createId("brainans");

  const base = {
    id: answerId,
    conversationId: input.conversationId,
    questionId,
    askedAt,
    answeredAt,
    resolvedQuestion: text,
    personality: "professional_calm_sre" as const,
    suggestedFollowUps: [
      "Show today's API usage",
      "How many active API Keys exist?",
      "Is the platform healthy?",
      "Explain API key permissions",
      "Generate a TypeScript example",
    ],
  };

  // Identity is always applied (system prompt constant kept for audits / future LLM wiring).
  void HELIA_ADMINISTRATOR_SYSTEM_PROMPT;

  const blocked = matchSecurityPolicy(text);
  if (blocked) {
    return {
      ...base,
      intent: "security_policy",
      summary: blocked,
      reasoning: "Matched Helia Administrator security policy.",
      evidence: [
        {
          source: "security_policy",
          reference: "blocked_operation",
          detail: "Dangerous or secret-disclosure request",
          observedAt: answeredAt,
        },
      ],
      confidence: 1,
      recommendedAction: "Ask about Helia APIs, usage, health, or documentation instead.",
      businessImpact: "Secrets and destructive ops remain protected.",
      technicalImpact: "Request short-circuited before platform data access.",
      insufficientData: false,
    };
  }

  if (isLikelyOutOfScope(text)) {
    return {
      ...base,
      intent: "out_of_scope",
      summary: formatAdminSections({
        status: "Out of scope",
        summary: OUT_OF_SCOPE_MESSAGE,
        recommendation:
          "Ask about Helia Suite APIs, API Keys, organizations, usage, logs, health, or integrations.",
        nextStep: "Example: “Show today's API usage” or “Generate a Node.js example”.",
      }),
      reasoning: "Question is outside Helia Suite administrator scope.",
      evidence: [],
      confidence: 1,
      recommendedAction: "",
      businessImpact: "",
      technicalImpact: "",
      insufficientData: false,
    };
  }

  // Priority: live platform → errors → api keys → code → docs
  try {
    const platform = await answerFromPlatformData(text);
    if (platform) {
      return {
        ...base,
        intent: platform.intent,
        summary: platform.summary,
        reasoning: platform.insufficientData
          ? "Live platform stores did not contain the requested metric."
          : "Answered from live Helia Cloud admin platform data.",
        evidence: platform.evidence,
        confidence: platform.confidence,
        recommendedAction: platform.recommendedAction ?? "",
        businessImpact: platform.insufficientData
          ? "No operational decision without observed data."
          : "Operators can act on observed platform metrics.",
        technicalImpact: platform.insufficientData
          ? NO_LIVE_DATA_MESSAGE
          : "Values read from embedded Cloud stores.",
        insufficientData: platform.insufficientData,
      };
    }
  } catch {
    // Continue to other handlers; surface live-data miss only if clearly requested.
    if (
      /\b(how many|show|list|usage|health|errors?|organizations?|projects?|deploy)\b/i.test(
        text
      )
    ) {
      return {
        ...base,
        intent: "live_data_unavailable",
        summary: formatAdminSections({
          status: "Live data",
          summary: NO_LIVE_DATA_MESSAGE,
          recommendation: "Retry shortly or open Admin → System Health.",
          nextStep: "If the issue persists, inspect Admin → Logs.",
        }),
        reasoning: "Platform data lookup failed.",
        evidence: [
          {
            source: "platform",
            reference: "lookup",
            detail: "Exception while reading admin platform data",
            observedAt: answeredAt,
          },
        ],
        confidence: 1,
        recommendedAction: "",
        businessImpact: "",
        technicalImpact: "",
        insufficientData: true,
      };
    }
  }

  const errorAnswer = analyzeError(text);
  if (errorAnswer) {
    return {
      ...base,
      intent: "error_analysis",
      summary: errorAnswer,
      reasoning: "Matched Helia/HTTP error analysis playbook.",
      evidence: [],
      confidence: 0.85,
      recommendedAction: "",
      businessImpact: "",
      technicalImpact: "",
      insufficientData: false,
    };
  }

  const apiKeyAnswer = answerApiKeyHelp(text);
  if (apiKeyAnswer) {
    return {
      ...base,
      intent: "api_key_help",
      summary: apiKeyAnswer,
      reasoning: "Answered from Helia API key catalog and lifecycle policy.",
      evidence: [
        {
          source: "api-keys/catalog",
          reference: "capabilities_permissions",
          detail: "Static product catalog",
          observedAt: answeredAt,
        },
      ],
      confidence: 0.95,
      recommendedAction: "",
      businessImpact: "",
      technicalImpact: "",
      insufficientData: false,
    };
  }

  const codeAnswer = generateCodeExample(text);
  if (codeAnswer) {
    return {
      ...base,
      intent: "code_generation",
      summary: codeAnswer,
      reasoning: "Generated production-ready Helia integration example.",
      evidence: [],
      confidence: 0.9,
      recommendedAction: "",
      businessImpact: "",
      technicalImpact: "",
      insufficientData: false,
    };
  }

  const docsAnswer = searchDocumentation(text);
  if (docsAnswer) {
    const missing = docsAnswer.includes("No documentation found.");
    return {
      ...base,
      intent: missing ? "documentation_missing" : "documentation",
      summary: docsAnswer,
      reasoning: missing
        ? "Documentation index had no match."
        : "Answered from Helia documentation index.",
      evidence: missing
        ? []
        : [
            {
              source: "documentation-index",
              reference: "HELIA_DOC_INDEX",
              detail: "Official Helia Suite documentation snippets",
              observedAt: answeredAt,
            },
          ],
      confidence: missing ? 1 : 0.9,
      recommendedAction: "",
      businessImpact: "",
      technicalImpact: "",
      insufficientData: missing,
    };
  }

  // Project structure / admin orientation
  if (/\b(project structure|admin panel|what can you do|help)\b/i.test(text)) {
    return {
      ...base,
      intent: "orientation",
      summary: formatAdminSections({
        status: "Helia Suite AI Administrator",
        summary:
          "I operate as the platform AI administrator for Helia Suite: APIs, API Keys, organizations, usage, logs, health, documentation, and integrations.",
        extraSections: [
          {
            title: "I can",
            body: `Explain APIs and docs, generate integration code, analyze Helia errors, report live usage/health when available, and guide API key policies.`,
          },
          {
            title: "I will not",
            body: `Reveal secrets, run shell commands, dump databases, or answer unrelated general chat.`,
          },
        ],
        recommendation: "Ask a concrete platform question or request a language-specific example.",
        nextStep: "Try: “Is the platform healthy?” or “Generate a Python example”.",
      }),
      reasoning: "Orientation response from system identity.",
      evidence: [],
      confidence: 1,
      recommendedAction: "",
      businessImpact: "",
      technicalImpact: "",
      insufficientData: false,
    };
  }

  return {
    ...base,
    intent: "insufficient",
    summary: formatAdminSections({
      status: "Unable to answer",
      summary: NO_LIVE_DATA_MESSAGE,
      recommendation:
        "Rephrase as a Helia Suite platform, API, documentation, or integration question.",
      nextStep:
        "Examples: usage today, active API keys, recent errors, health, or “Generate a Go example”.",
    }),
    reasoning:
      "No live-data intent, documentation match, code request, or error pattern matched.",
    evidence: [],
    confidence: 1,
    recommendedAction: "",
    businessImpact: "",
    technicalImpact: "",
    insufficientData: true,
  };
}
