"use client";

import { useMarketBasePath, withMarketBasePath } from "@/lib/market-base-path";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotionHydrationSafe } from "@/hooks/use-reduced-motion-hydration-safe";
import { Bot, ChevronDown, SendHorizontal, Sparkles } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const sectionEase = [0.16, 1, 0.3, 1] as const;

const sectionReveal = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: sectionEase },
  },
} as const;

type Role = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: Role;
  content: string;
};

const SEED_MESSAGES: ChatMessage[] = [
  {
    id: "m1",
    role: "user",
    content: "Write a product description for sneakers",
  },
  {
    id: "m2",
    role: "assistant",
    content:
      "Here’s a high-converting product description: lead with the feeling (lightweight, all-day comfort), stack 3 proof-backed benefits (cushioning, grip, breathability), add one credibility line (tested miles / athletes), and close with a crisp CTA. Want a shorter version for PDP vs Instagram?",
  },
];

function nextId() {
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function staticAssistantReply(userText: string): string {
  const t = userText.toLowerCase();
  if (t.includes("sneaker") || (t.includes("product") && t.includes("description")))
    return "Here’s a high-converting product description: open with the outcome, add 3 benefit bullets, include social proof, and end with a clear CTA — static demo response.";
  if (t.includes("ad") || t.includes("copy"))
    return "Ad copy draft: headline with the big promise, a short benefit line, and a single CTA. Pick a channel (Meta, Google, TikTok) in production — demo only.";
  if (t.includes("summarize") || t.includes("summary"))
    return "Summary: key point → supporting details → next step. Paste the text you want summarized (demo).";
  if (t.includes("idea") || t.includes("ideas"))
    return "Business ideas: choose one niche, one acquisition channel, and one retention loop. Tell me your industry for five tailored angles (demo).";
  if (t.includes("generate") || t.includes("content"))
    return "Content pack: three hooks, one narrative arc, and a six-post outline. Share your product + ICP for a tighter draft (demo).";
  return "Helia AI (demo): ask for copy, summaries, or ideas — static responses only, no backend.";
}

const QUICK_ACTIONS = ["Generate content", "Business ideas", "Ad copy", "Summarize text"] as const;

export function AIHome() {
  const reduce = useReducedMotionHydrationSafe();
  const basePath = useMarketBasePath();
  const [messages, setMessages] = useState<ChatMessage[]>(SEED_MESSAGES);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const chatAnchorRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [reduce]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, pending, scrollToBottom]);

  const scrollToChat = useCallback(() => {
    chatAnchorRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, [reduce]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || pending) return;
    const userMsg: ChatMessage = { id: nextId(), role: "user", content: text };
    setDraft("");
    setMessages((prev) => [...prev, userMsg]);
    setPending(true);
    window.setTimeout(() => {
      const reply = staticAssistantReply(text);
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: "assistant", content: reply },
      ]);
      setPending(false);
    }, reduce ? 0 : 520);
  };

  const runQuickAction = (label: string) => {
    if (pending) return;
    setDraft(label);
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-gradient-to-b from-[#07060f] via-zinc-950 to-zinc-100">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_-30%,rgba(124,58,237,0.35),transparent_55%),radial-gradient(ellipse_80%_60%_at_100%_20%,rgba(59,130,246,0.22),transparent_50%),radial-gradient(ellipse_70%_50%_at_0%_70%,rgba(167,139,250,0.12),transparent_45%)]"
      />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        {/* Premium hero */}
        <section className="relative shrink-0 overflow-hidden px-6 pb-6 pt-[3.35rem]">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-24 top-0 h-56 w-56 rounded-full bg-violet-500/25 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 top-24 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl"
          />
          <div className="relative">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-300/90">
                Helia AI
              </p>
              <Link
                href={withMarketBasePath(basePath, "/tools")}
                className="-mt-1 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/95 shadow-lg shadow-black/20 ring-1 ring-white/10 backdrop-blur-md transition duration-300 hover:border-white/25 hover:bg-white/15 active:scale-[0.98]"
              >
                <Sparkles className="h-3.5 w-3.5 text-violet-200" strokeWidth={2} aria-hidden />
                Tools
              </Link>
            </div>
            <h1 className="mt-4 max-w-[16.5rem] text-balance text-[1.65rem] font-semibold leading-[1.12] tracking-[-0.03em] text-white sm:text-[1.85rem]">
              AI-Powered App Experience
            </h1>
            <p className="mt-3 max-w-[18.5rem] text-[13px] leading-relaxed text-zinc-400 sm:text-[14px]">
              Simulate a real AI assistant built for business, content, and automation
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={scrollToChat}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-blue-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_16px_40px_-12px_rgba(124,58,237,0.55)] ring-1 ring-white/20 transition hover:brightness-110 active:scale-[0.98]"
              >
                Try Demo
              </button>
              <Link
                href={withMarketBasePath(basePath, "/tools")}
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-[13px] font-semibold text-white ring-1 ring-white/10 backdrop-blur-md transition hover:border-white/30 hover:bg-white/15 active:scale-[0.98]"
              >
                Explore Features
              </Link>
            </div>
          </div>
        </section>

        {/* Preview card */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={
            reduce ? { duration: 0 } : { type: "spring", stiffness: 280, damping: 28, delay: 0.08 }
          }
          className="shrink-0 px-6 pb-5"
        >
          <div className="relative">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-3 rounded-[1.35rem] bg-gradient-to-br from-violet-500/45 via-fuchsia-500/25 to-blue-500/40 opacity-80 blur-2xl"
            />
            <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-zinc-950/50 p-1 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.65)] ring-1 ring-white/10 backdrop-blur-xl">
              <div className="relative overflow-hidden rounded-[14px] bg-gradient-to-b from-zinc-900/90 to-zinc-950/95 px-3 pb-3 pt-2.5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Live preview
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                </div>
                <div className="relative h-[5.75rem] overflow-hidden rounded-xl border border-white/5 bg-black/30">
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.35),transparent_55%),radial-gradient(circle_at_80%_60%,rgba(59,130,246,0.25),transparent_50%)]"
                  />
                  <div className="absolute inset-0 backdrop-blur-md" />
                  <div className="relative flex h-full flex-col justify-end gap-2 p-2.5 opacity-90">
                    <div className="ml-auto w-[78%] rounded-lg bg-white/15 px-2 py-1.5 text-[9px] leading-snug text-white/90 ring-1 ring-white/10">
                      Write launch email…
                    </div>
                    <div className="mr-auto w-[82%] rounded-lg bg-violet-500/25 px-2 py-1.5 text-[9px] leading-snug text-violet-100 ring-1 ring-violet-400/20">
                      Draft ready — subject + 3 sections…
                    </div>
                  </div>
                </div>
                <p className="mt-2 flex items-center justify-center gap-1 text-[10px] font-medium text-zinc-500">
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-500" strokeWidth={2} aria-hidden />
                  Scroll for full workspace
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Full chat — reveals on scroll into view */}
        <motion.div
          ref={chatAnchorRef}
          id="ai-chat"
          initial={reduce ? false : { opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px -8% 0px" }}
          transition={
            reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 32, delay: 0.04 }
          }
          className="flex min-h-0 flex-1 flex-col px-6 pb-3"
        >
          <motion.div
            variants={sectionReveal}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-5% 0px" }}
            transition={{ delay: reduce ? 0 : 0.06 }}
            className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.45rem] border border-white/55 bg-white/50 shadow-[0_28px_70px_-36px_rgba(79,70,229,0.55),0_0_0_1px_rgba(255,255,255,0.65)_inset] ring-1 ring-violet-200/30 backdrop-blur-2xl"
          >
              <div className="flex shrink-0 items-center gap-2.5 border-b border-violet-100/80 bg-gradient-to-r from-white/70 via-violet-50/30 to-blue-50/30 px-4 py-3 backdrop-blur-md">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-500/35 ring-2 ring-white/50">
                  <Bot className="h-4 w-4" strokeWidth={2} aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold tracking-tight text-zinc-900">Helia AI</p>
                  <p className="truncate text-[11px] text-zinc-500">Chat · static preview</p>
                </div>
                <span className="rounded-full border border-emerald-200/70 bg-emerald-50/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-emerald-800">
                  Ready
                </span>
              </div>

              <div
                ref={listRef}
                className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 py-4"
              >
                <AnimatePresence initial={false}>
                  {messages.map((m, index) => (
                    <motion.div
                      key={m.id}
                      layout
                      initial={reduce ? false : { opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={
                        reduce
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 380, damping: 30, delay: index * 0.02 }
                      }
                      className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={
                          m.role === "user"
                            ? "max-w-[88%] rounded-2xl rounded-br-md bg-gradient-to-br from-violet-600 via-violet-600 to-blue-600 px-3.5 py-2.5 text-[13px] leading-relaxed text-white shadow-[0_14px_36px_-20px_rgba(79,70,229,0.65)] ring-1 ring-white/25"
                            : "max-w-[92%] rounded-2xl rounded-bl-md border border-white/60 bg-white/75 px-3.5 py-2.5 text-[13px] leading-relaxed text-zinc-800 shadow-sm ring-1 ring-violet-100/60 backdrop-blur-sm"
                        }
                      >
                        {m.content}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {pending ? (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-white/60 bg-white/70 px-3 py-2.5 shadow-sm backdrop-blur-sm">
                      <span className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <motion.span
                            key={i}
                            className="h-1.5 w-1.5 rounded-full bg-violet-400"
                            animate={{ opacity: [0.35, 1, 0.35] }}
                            transition={{
                              duration: 1.1,
                              repeat: Infinity,
                              delay: i * 0.18,
                              ease: "easeInOut",
                            }}
                          />
                        ))}
                      </span>
                      <span className="text-[11px] font-medium text-zinc-500">Thinking…</span>
                    </div>
                  </motion.div>
                ) : null}
              </div>

              <div className="shrink-0 border-t border-violet-100/70 bg-white/40 px-3 pb-3 pt-3 backdrop-blur-md">
                <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {QUICK_ACTIONS.map((label, i) => (
                    <motion.button
                      key={label}
                      type="button"
                      onClick={() => runQuickAction(label)}
                      initial={reduce ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={reduce ? undefined : { scale: 1.04 }}
                      whileTap={reduce ? undefined : { scale: 0.98 }}
                      transition={
                        reduce
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 420, damping: 32, delay: 0.02 + i * 0.03 }
                      }
                      className="shrink-0 snap-start rounded-full border border-white/60 bg-white/55 px-3.5 py-2 text-[11px] font-semibold tracking-tight text-violet-950 shadow-[0_8px_24px_-16px_rgba(79,70,229,0.35)] ring-1 ring-violet-200/40 backdrop-blur-md transition-[background-color,box-shadow] duration-300 hover:border-violet-300/70 hover:bg-white/75 hover:shadow-[0_12px_32px_-18px_rgba(79,70,229,0.45)]"
                    >
                      {label}
                    </motion.button>
                  ))}
                </div>
              </div>

              <form
                onSubmit={onSubmit}
                className="shrink-0 border-t border-violet-100/70 bg-gradient-to-b from-white/55 to-violet-50/20 p-3 backdrop-blur-xl"
              >
                <div className="flex items-center gap-2 rounded-2xl border border-white/60 bg-white/60 px-3 py-1.5 shadow-inner ring-1 ring-violet-100/50 backdrop-blur-md transition focus-within:border-violet-300/80 focus-within:ring-violet-200/70">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Message Helia AI…"
                    className="min-w-0 flex-1 bg-transparent py-2 text-[13px] text-zinc-900 outline-none placeholder:text-zinc-400"
                    aria-label="Message"
                  />
                  <button
                    type="submit"
                    disabled={!draft.trim() || pending}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-md shadow-violet-500/30 transition enabled:hover:brightness-110 enabled:active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Send"
                  >
                    <SendHorizontal className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
                <p className="mt-2 px-0.5 text-center text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-400">
                  Static demo — no data leaves this preview
                </p>
              </form>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
