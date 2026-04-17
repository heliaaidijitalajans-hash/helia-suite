"use client";

import { LandingDemoScroll } from "@/components/LandingDemoScroll";
import { WhatsAppLeadLink } from "@/components/WhatsAppLeadLink";
import { motion } from "framer-motion";
import { useReducedMotionHydrationSafe } from "@/hooks/use-reduced-motion-hydration-safe";
import { ArrowRight, Smartphone, Sparkles, Store } from "lucide-react";
import Link from "next/link";

const ease = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.55, ease },
  }),
};

export function LandingPage() {
  const reduce = useReducedMotionHydrationSafe();

  return (
    <main className="relative min-h-full overflow-x-hidden bg-zinc-950 text-zinc-50">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.35),transparent),radial-gradient(ellipse_60%_40%_at_100%_0%,rgba(251,146,60,0.12),transparent),radial-gradient(ellipse_50%_35%_at_0%_100%,rgba(56,189,248,0.1),transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E\")",
        }}
      />

      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight text-white transition hover:text-zinc-200"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 text-[13px] font-bold text-white shadow-lg shadow-violet-500/25">
            H
          </span>
          Helia
        </Link>
        <Link
          href="/demo"
          className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold tracking-wide text-white ring-1 ring-white/15 backdrop-blur-md transition hover:bg-white/15"
        >
          Open demo
        </Link>
      </header>

      {/* 1. Hero */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-16 pt-2 text-center sm:px-10 sm:pb-20 sm:pt-0">
        <motion.p
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-400"
        >
          AI-Powered App Systems
        </motion.p>
        <motion.h1
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mt-5 text-balance bg-gradient-to-b from-white via-white to-zinc-400 bg-clip-text text-4xl font-semibold leading-[1.08] tracking-tight text-transparent sm:text-6xl sm:leading-[1.06]"
        >
          Build AI-Powered Mobile App Systems
        </motion.h1>
        <motion.p
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-zinc-400 sm:text-lg"
        >
          Marketplace, Education, Fitness and more — all powered by AI
        </motion.p>
        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            href="/demo#demos"
            className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-zinc-950 shadow-[0_20px_60px_-24px_rgba(255,255,255,0.45)] ring-1 ring-white/20 transition hover:bg-zinc-100 active:scale-[0.99]"
          >
            Explore Demos
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <WhatsAppLeadLink className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-7 py-3.5 text-sm font-semibold text-white ring-1 ring-white/15 backdrop-blur-md transition hover:bg-white/15 active:scale-[0.99] [&_svg]:text-[#25D366]">
            Get Your App
          </WhatsAppLeadLink>
          <Link
            href="/demo"
            className="text-sm font-semibold text-zinc-400 underline-offset-4 transition hover:text-white hover:underline"
          >
            View all demos
          </Link>
        </motion.div>
      </section>

      {/* 2. Demo — scroll-driven motion */}
      <LandingDemoScroll />

      {/* 3. Features */}
      <section className="relative z-10 border-t border-white/[0.06] bg-black/20 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-6 sm:px-10">
          <motion.h2
            initial={reduce ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease }}
            className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500"
          >
            Platform
          </motion.h2>
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease, delay: 0.05 }}
            className="mx-auto mt-3 max-w-2xl text-center text-2xl font-semibold tracking-tight text-white sm:text-3xl"
          >
            Everything you need to ship AI-Powered App Systems
          </motion.p>
          <div className="mt-14 grid gap-5 sm:grid-cols-3">
            {[
              {
                title: "AI product recommendations",
                body: "Rails, rankings, and discovery surfaces that feel personal from day one — across verticals.",
                Icon: Sparkles,
              },
              {
                title: "Composable stacks",
                body: "Modular shells for commerce, learning, wellness, and assistants — scale from pilot to product.",
                Icon: Store,
              },
              {
                title: "Mobile-first design",
                body: "Native-feel layouts, motion, and tap targets tuned for real daily use on phones.",
                Icon: Smartphone,
              },
            ].map(({ title, body, Icon }, i) => (
              <motion.div
                key={title}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.08, duration: 0.5, ease }}
                whileHover={reduce ? undefined : { y: -4, transition: { type: "spring", stiffness: 400, damping: 28 } }}
                className="group rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6 ring-1 ring-white/[0.1] backdrop-blur-sm transition hover:from-white/[0.08] hover:ring-violet-500/20"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/10 ring-1 ring-white/15 transition group-hover:shadow-lg group-hover:shadow-violet-500/10">
                  <Icon className="h-5 w-5 text-violet-100" strokeWidth={1.75} />
                </div>
                <h3 className="mt-5 text-lg font-semibold tracking-tight text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Results */}
      <section className="relative z-10 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-6 sm:px-10">
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45, ease }}
            className="mb-10 text-center text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500"
          >
            Outcomes
          </motion.p>
          <div className="grid gap-px overflow-hidden rounded-3xl bg-white/[0.08] ring-1 ring-white/10 sm:grid-cols-2">
            {[
              {
                headline: "+27% conversion increase",
                hint: "Illustrative lift vs. baseline mobile web in comparable pilots.",
              },
              {
                headline: "+18% lift in repeat sessions",
                hint: "Driven by smarter discovery and habit-forming flows in-session (illustrative).",
              },
            ].map((item, i) => (
              <motion.div
                key={item.headline}
                initial={reduce ? false : { opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5, ease }}
                className="bg-gradient-to-br from-zinc-900/90 to-zinc-950/95 p-10 text-center sm:p-12 sm:text-left"
              >
                <p className="text-2xl font-semibold leading-snug tracking-tight text-white sm:text-3xl">
                  {item.headline}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-zinc-500">{item.hint}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Explore demos */}
      <section className="relative z-10 border-t border-white/[0.06] bg-black/10 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-6 sm:px-10">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, ease }}
            className="mx-auto max-w-3xl text-center"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
              Demos
            </p>
            <h2 className="mt-3 text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Explore Real Product Demos
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              Jump into the demo hub and explore full, mobile-first experiences across verticals.
            </p>
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, ease, delay: 0.05 }}
            className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-3"
          >
            <Link
              href="/demo"
              className="inline-flex items-center justify-center rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/15 backdrop-blur-md transition hover:bg-white/15 active:scale-[0.99]"
            >
              Marketplace
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center justify-center rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/15 backdrop-blur-md transition hover:bg-white/15 active:scale-[0.99]"
            >
              Education
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center justify-center rounded-full bg-white/5 px-5 py-2.5 text-sm font-semibold text-zinc-200 ring-1 ring-white/10 backdrop-blur-md transition hover:bg-white/10 active:scale-[0.99]"
            >
              Health
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 5. CTA */}
      <section className="relative z-10 border-t border-white/[0.06] pb-24 pt-16 sm:pb-32 sm:pt-24">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease }}
          className="relative mx-auto max-w-3xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-600/25 via-zinc-900/80 to-fuchsia-600/20 px-8 py-14 text-center ring-1 ring-white/10 sm:px-14 sm:py-16"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -left-24 top-0 h-64 w-64 rounded-full bg-violet-500/30 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 bottom-0 h-56 w-56 rounded-full bg-fuchsia-500/20 blur-3xl"
          />
          <h2 className="relative text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Build with AI-Powered App Systems
          </h2>
          <p className="relative mx-auto mt-4 max-w-md text-sm leading-relaxed text-zinc-400 sm:text-base">
            Open the demos, explore each vertical shell, then adapt layouts, tone, and modules to your brand.
          </p>
          <WhatsAppLeadLink className="relative mt-10 inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-semibold text-zinc-950 shadow-[0_24px_70px_-28px_rgba(139,92,246,0.45)] ring-1 ring-white/25 transition hover:bg-zinc-100 active:scale-[0.99] [&_svg]:text-[#25D366]">
            Get Your App
          </WhatsAppLeadLink>
        </motion.div>
      </section>

      <footer className="relative z-10 border-t border-white/[0.06] py-10 text-center text-[12px] text-zinc-500">
        ©{" "}
        <span suppressHydrationWarning>{new Date().getFullYear()}</span> Helia — demo experience. No
        affiliation with third-party brands or platforms.
      </footer>
    </main>
  );
}
