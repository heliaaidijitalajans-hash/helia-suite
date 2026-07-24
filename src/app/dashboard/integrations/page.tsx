"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const INTEGRATIONS = [
  {
    name: "Internal Platform",
    stack: "Full-access application",
    install: [
      "Create a project for your internal application.",
      "Generate an API key with Application Type = Internal Platform (full capabilities).",
      "Store the secret in your server env as HELIA_API_KEY.",
      "Call Helia REST endpoints with Authorization: Bearer $HELIA_API_KEY.",
    ],
  },
  {
    name: "Next.js",
    stack: "App Router / Route Handlers",
    install: [
      "Add HELIA_API_KEY to .env.local (server only).",
      "Call Helia from Route Handlers or Server Actions — never from the browser.",
      "Use fetch('…/api/…') against your Helia Suite domain with the Bearer header.",
      "Map capabilities to the features your app enables.",
    ],
  },
  {
    name: "Node.js",
    stack: "Backend service",
    install: [
      "npm install (or use native fetch on Node 18+).",
      "export HELIA_API_KEY=hl_live_…",
      "Send JSON POST/GET with Authorization: Bearer process.env.HELIA_API_KEY.",
      "Handle 401/429 and rotate keys from the dashboard when needed.",
    ],
  },
  {
    name: "Express",
    stack: "Node HTTP API",
    install: [
      "Create a server-side Helia client module.",
      "Proxy mobile/web clients through Express — do not ship the key to devices.",
      "Forward capability-scoped requests to Helia Suite /api routes.",
      "Log correlation IDs for monitoring.",
    ],
  },
  {
    name: "Flutter",
    stack: "Mobile",
    install: [
      "Do not embed Helia API keys in the app binary.",
      "Call your backend; backend calls Helia with the project key.",
      "Surface Helia Chat or monitoring via your own API responses.",
      "Use test keys during development.",
    ],
  },
  {
    name: "React Native",
    stack: "Mobile",
    install: [
      "Same pattern as Flutter: backend-held secrets.",
      "Authenticate end users with your app auth; Helia key stays server-side.",
      "Optional: open Helia Chat inside the dashboard for operators only.",
      "Promote live keys after staging validation.",
    ],
  },
  {
    name: "Custom REST",
    stack: "Any HTTPS client",
    install: [
      "Create Project → Create API Key with the capabilities you need.",
      "Base URL: your Helia Suite deployment origin.",
      "Header: Authorization: Bearer <key>.",
      "Follow Documentation for auth, rate limits, and Brain ask.",
    ],
  },
] as const;

export default function IntegrationsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-white">
          Integrations
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-white/50">
          Installation guides for connecting applications to Helia. Start with{" "}
          <Link href="/dashboard/projects" className="text-accent hover:underline">
            Create Project
          </Link>{" "}
          and an API key before wiring code.
        </p>
      </div>

      <div className="space-y-4">
        {INTEGRATIONS.map((item, i) => (
          <motion.article
            key={item.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.35 }}
            className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#161618]/90"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/[0.06] px-5 py-4">
              <h3 className="text-sm font-semibold text-white">{item.name}</h3>
              <span className="text-[11px] uppercase tracking-[0.12em] text-white/35">
                {item.stack}
              </span>
            </div>
            <ol className="space-y-2 px-5 py-4 text-sm leading-relaxed text-white/60">
              {item.install.map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="shrink-0 font-medium text-accent/90">
                    {index + 1}.
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
