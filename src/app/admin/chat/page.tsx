"use client";

import HeliaChatPageClient from "@/app/dashboard/helia-chat/HeliaChatPageClient";

/**
 * Admin-only Helia Chat — reuses existing ChatLayout / Brain / persistence.
 * Gated by /admin layout (platform admin role).
 */
export default function AdminChatPage() {
  return (
    <HeliaChatPageClient
      intro="Ask Helia Brain about platform usage, errors, API keys, and health. Answers use live Admin data when available — never invented metrics."
      emptyTitle="Ask Helia Brain"
      emptyDescription="Try: “Show today's API usage”, “How many active API Keys exist?”, or “Is the platform healthy?”"
    />
  );
}
