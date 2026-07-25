"use client";

import HeliaChatPageClient from "@/app/dashboard/helia-chat/HeliaChatPageClient";

/**
 * Admin-only Helia Chat — reuses existing ChatLayout / Brain / persistence.
 * Gated by /admin layout (platform admin role).
 */
export default function AdminChatPage() {
  return (
    <HeliaChatPageClient
      intro="Helia Suite AI Administrator — platform operations, APIs, documentation, and integrations. Answers use live Admin data when available."
      emptyTitle="Helia Suite AI Administrator"
      emptyDescription="Ask about usage, health, API Keys, errors, documentation, or request production-ready integration code."
    />
  );
}
