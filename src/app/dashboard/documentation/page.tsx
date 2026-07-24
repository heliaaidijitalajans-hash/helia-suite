"use client";

import { motion } from "framer-motion";

const SECTIONS = [
  {
    id: "authentication",
    title: "Authentication",
    body: "Authenticate dashboard users with Helia Cloud login. Application traffic uses project API keys as Bearer tokens (hl_live_… / hl_test_…). Never embed secrets in client-side public repos.",
    points: [
      "User session: JWT from /api/auth/login",
      "App access: Authorization: Bearer <api_key>",
      "Rotate keys from API Keys when credentials leak",
    ],
  },
  {
    id: "rest-api",
    title: "REST API",
    body: "Same-origin Suite routes expose Cloud and Brain surfaces for your workspace.",
    points: [
      "POST /api/auth/login · POST /api/auth/register",
      "GET/POST /api/organizations · GET/POST /api/projects",
      "GET/POST /api/apikeys · POST /api/brain/ask",
    ],
  },
  {
    id: "sdk",
    title: "SDK",
    body: "Use thin HTTP clients in your stack. Prefer environment variables for API keys and call Helia over HTTPS from your backend.",
    points: [
      "Node / Next.js: fetch with Authorization header",
      "Mobile: proxy through your backend when possible",
      "Capability checks: respect key permissions and capabilities",
    ],
  },
  {
    id: "webhooks",
    title: "Webhooks",
    body: "Webhook delivery is capability-gated. Issue keys with the Webhooks capability, then register your HTTPS endpoint from Integrations once your app is connected.",
    points: [
      "Require HTTPS endpoints",
      "Verify signatures when enabled for your project",
      "Retry on non-2xx with exponential backoff on your side",
    ],
  },
  {
    id: "examples",
    title: "Examples",
    body: "Start with Create Project → Create API Key → call whoami / track / brain from your server.",
    points: [
      "SnapSell: Internal Platform key with full capabilities",
      "Next.js Route Handler: server-side Bearer calls",
      "Custom REST: any language that can send HTTPS JSON",
    ],
  },
  {
    id: "rate-limits",
    title: "Rate Limits",
    body: "Usage is metered per organization and project. Watch Usage for requests, Brain requests, monitoring, and errors. Plan limits apply when quotas are exceeded.",
    points: [
      "Monitor monthly buckets under Usage",
      "Separate live and test keys by environment",
      "Contact Support if you need higher plan limits",
    ],
  },
] as const;

export default function DocumentationPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-white">
          Documentation
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-white/50">
          Official guides for authenticating, calling the Helia API, and
          operating keys in production.
        </p>
      </div>

      <div className="space-y-4">
        {SECTIONS.map((section, i) => (
          <motion.section
            key={section.id}
            id={section.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.35 }}
            className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#161618]/90"
          >
            <div className="border-b border-white/[0.06] px-5 py-4">
              <h3 className="text-sm font-semibold text-white">
                {section.title}
              </h3>
            </div>
            <div className="space-y-3 px-5 py-4">
              <p className="text-sm leading-relaxed text-white/55">
                {section.body}
              </p>
              <ul className="space-y-1.5 text-sm text-white/70">
                {section.points.map((point) => (
                  <li key={point} className="flex gap-2">
                    <span className="text-accent" aria-hidden>
                      •
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.section>
        ))}
      </div>
    </div>
  );
}
