"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

const STEPS_EN = [
  "Understanding your request…",
  "Scanning related platform services…",
  "Gathering live data…",
  "Preparing answer…",
];

const STEPS_TR = [
  "İsteğinizi anlıyorum…",
  "İlgili platform servislerini tarıyorum…",
  "Canlı verileri topluyorum…",
  "Yanıtı hazırlıyorum…",
];

export function TypingIndicator({
  className,
  language = "en",
}: {
  className?: string;
  language?: "tr" | "en";
}) {
  const steps = language === "tr" ? STEPS_TR : STEPS_EN;
  const [step, setStep] = useState(0);

  useEffect(() => {
    setStep(0);
    const id = window.setInterval(() => {
      setStep((s) => (s + 1) % steps.length);
    }, 1400);
    return () => window.clearInterval(id);
  }, [steps.length, language]);

  return (
    <div
      className={cn("flex items-start gap-3 px-1", className)}
      role="status"
      aria-live="polite"
      aria-label={steps[step]}
    >
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-accent/25 bg-accent/10 text-[10px] font-bold text-accent">
        H
      </div>
      <div className="min-w-[12rem] max-w-[min(100%,22rem)] rounded-2xl rounded-tl-md border border-white/[0.08] bg-[#161618]/95 px-4 py-3 shadow-[0_12px_40px_-28px_rgba(0,0,0,0.8)]">
        <div className="mb-2 flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent/70"
              style={{ animationDelay: `${i * 160}ms` }}
            />
          ))}
        </div>
        <p className="text-xs leading-relaxed text-white/55 transition-opacity duration-300">
          {steps[step]}
        </p>
      </div>
    </div>
  );
}
