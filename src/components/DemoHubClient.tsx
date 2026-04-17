"use client";

import { WhatsAppLeadLink } from "@/components/WhatsAppLeadLink";
import { motion } from "framer-motion";
import Link from "next/link";

const MotionLink = motion(Link);

const systems = [
  {
    kind: "live" as const,
    title: "Helia AI",
    tagline: "AI-powered assistant app",
    description: "",
    badge: "new" as const,
    readyDemo: true,
    href: "/demo/ai",
    accent: "from-violet-500/22 via-white/0 to-blue-500/18",
    glow: "hover:shadow-[0_32px_100px_-32px_rgba(99,102,241,0.48)]",
  },
  {
    kind: "live" as const,
    title: "Helia Market",
    tagline: "AI-Powered App Systems",
    description: "Commerce, catalog, cart, and admin — full mobile preview.",
    readyDemo: true,
    href: "/demo/market",
    accent: "from-violet-600/18 via-white/0 to-fuchsia-600/14",
    glow: "hover:shadow-[0_28px_90px_-28px_rgba(139,92,246,0.42)]",
  },
  {
    kind: "live" as const,
    title: "Helia Learn",
    description: "AI-powered education app",
    tagline: "Create your own learning platform",
    readyDemo: true,
    href: "/demo/learn",
    accent: "from-sky-500/14 via-white/0 to-emerald-500/10",
    glow: "hover:shadow-[0_28px_90px_-28px_rgba(56,189,248,0.38)]",
  },
  {
    kind: "live" as const,
    title: "Helia Health",
    description: "AI fitness & wellness system",
    tagline: "Guided programs your members will actually finish",
    readyDemo: true,
    href: "/demo/health",
    accent: "from-rose-500/14 via-white/0 to-orange-500/10",
    glow: "hover:shadow-[0_28px_90px_-28px_rgba(244,63,94,0.32)]",
  },
] as const;

const cardHover = {
  whileHover: { scale: 1.025, y: -5 },
  whileTap: { scale: 0.992 },
  transition: { type: "spring", stiffness: 420, damping: 28 },
} as const;

const cardHoverFeatured = {
  whileHover: { scale: 1.035, y: -6 },
  whileTap: { scale: 0.99 },
  transition: { type: "spring", stiffness: 400, damping: 26 },
} as const;

export function DemoHubClient() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_-20%,rgba(124,58,237,0.32),transparent),radial-gradient(ellipse_65%_55%_at_100%_10%,rgba(244,63,94,0.12),transparent),radial-gradient(ellipse_60%_45%_at_0%_90%,rgba(34,211,238,0.10),transparent)]"
      />

      <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-14 sm:px-10 sm:pt-16">
        <header className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-400">
            AI-Powered App Systems
          </p>
          <h1 className="mt-5 text-balance bg-gradient-to-b from-white via-white to-zinc-400 bg-clip-text text-4xl font-semibold leading-[1.08] tracking-tight text-transparent sm:text-5xl">
            Build AI-Powered Mobile App Systems
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-zinc-400 sm:text-lg">
            Marketplace, Education, Fitness and more — all powered by AI
          </p>
          <div className="mx-auto mt-8 flex flex-wrap items-center justify-center gap-3 sm:mt-10">
            <a
              href="#demos"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-950 shadow-[0_20px_60px_-24px_rgba(255,255,255,0.35)] ring-1 ring-white/20 transition hover:bg-zinc-100 active:scale-[0.99]"
            >
              Explore Demos
            </a>
            <WhatsAppLeadLink className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/15 backdrop-blur-md transition hover:bg-white/15 active:scale-[0.99] [&_svg]:text-[#25D366]">
              Get Your App
            </WhatsAppLeadLink>
          </div>
        </header>

        <section
          id="demos"
          className="mx-auto mt-12 grid max-w-5xl scroll-mt-24 gap-5 sm:mt-14 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-5 lg:gap-y-6"
        >
          {systems.map((demo) => {
            const isFeaturedAi = demo.href === "/demo/ai";

            const className = [
              "group relative overflow-hidden bg-white/[0.045] backdrop-blur-md",
              isFeaturedAi
                ? "rounded-[22px] p-7 sm:p-8 ring-1 ring-white/[0.14]"
                : "rounded-3xl p-6 ring-1 ring-white/[0.10]",
              "shadow-[0_22px_60px_-34px_rgba(0,0,0,0.65)] will-change-transform",
              "transition-[box-shadow,background-color,transform] duration-300 ease-out",
              demo.glow,
              demo.kind === "live"
                ? "hover:bg-white/[0.07] hover:ring-white/[0.2]"
                : "hover:bg-white/[0.055] hover:ring-white/[0.16]",
            ].join(" ");

            const inner = (
              <>
                <div
                  aria-hidden
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${demo.accent}`}
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(ellipse 90% 70% at 50% 0%, rgba(255,255,255,0.14), transparent 55%)",
                  }}
                />
                <div className="relative">
                  <div className="flex items-start justify-between gap-3">
                    <h2
                      className={`font-semibold tracking-tight text-white ${isFeaturedAi ? "text-xl sm:text-2xl" : "text-lg"}`}
                    >
                      {demo.title}
                    </h2>
                    {"badge" in demo && demo.badge === "new" && isFeaturedAi ? (
                      <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-2">
                        <span className="rounded-full border border-violet-400/45 bg-violet-500/25 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-violet-100 ring-1 ring-violet-400/35">
                          NEW
                        </span>
                        <span className="rounded-full bg-gradient-to-r from-violet-400/90 to-blue-400/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-sm ring-1 ring-white/25">
                          AI
                        </span>
                      </div>
                    ) : "badge" in demo && demo.badge === "new" ? (
                      <span className="shrink-0 rounded-full border border-violet-400/40 bg-violet-500/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-violet-100 ring-1 ring-violet-400/30">
                        NEW
                      </span>
                    ) : demo.readyDemo ? (
                      <span className="shrink-0 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-100 ring-1 ring-emerald-400/25">
                        Ready Demo
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full border border-white/15 bg-black/35 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-300 ring-1 ring-white/10">
                        Soon
                      </span>
                    )}
                  </div>
                  <p
                    className={`mt-2.5 font-medium leading-snug tracking-tight text-zinc-200 ${isFeaturedAi ? "text-[14px] sm:text-[15px]" : "text-[13px]"}`}
                  >
                    {demo.tagline}
                  </p>
                  {demo.description ? (
                    <p className="mt-2 text-[12px] leading-relaxed text-zinc-500">{demo.description}</p>
                  ) : null}
                  <div className={`${isFeaturedAi ? "mt-7" : "mt-6"}`}>
                    {demo.kind === "live" ? (
                      <span
                        className={`inline-flex items-center rounded-full border border-white/15 bg-white/10 font-semibold tracking-wide text-white ring-1 ring-white/15 transition group-hover:bg-white/18 ${isFeaturedAi ? "px-5 py-2.5 text-sm" : "px-4 py-2 text-xs"}`}
                      >
                        {(demo as { ctaLabel?: string }).ctaLabel?.trim() || "View Demo"}
                      </span>
                    ) : (
                      <WhatsAppLeadLink className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold tracking-wide text-white ring-1 ring-white/15 transition hover:bg-white/18 [&_svg]:text-[#25D366]">
                        Join Early Access
                      </WhatsAppLeadLink>
                    )}
                  </div>
                </div>
              </>
            );

            return demo.kind === "live" ? (
              isFeaturedAi ? (
                <div
                  key={demo.title}
                  className="rounded-3xl bg-gradient-to-br from-violet-500 via-violet-400 to-blue-500 p-[1.5px] shadow-[0_28px_90px_-36px_rgba(99,102,241,0.55)]"
                >
                  <MotionLink
                    href={demo.href}
                    className={className}
                    {...cardHoverFeatured}
                  >
                    {inner}
                  </MotionLink>
                </div>
              ) : (
                <MotionLink key={demo.title} href={demo.href} className={className} {...cardHover}>
                  {inner}
                </MotionLink>
              )
            ) : (
              <motion.div key={demo.title} className={className} {...cardHover}>
                {inner}
              </motion.div>
            );
          })}
        </section>

        <div className="mx-auto mt-12 max-w-5xl text-center text-[12px] leading-relaxed text-zinc-500">
          Helia Market, Learn, Health, and AI are interactive previews — static data, no backend.
        </div>
      </div>
    </main>
  );
}
