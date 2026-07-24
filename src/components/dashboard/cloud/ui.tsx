"use client";

import { cn } from "@/lib/cn";

export function CloudPanel({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-white/[0.08] bg-[#161618]/90 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.85)] backdrop-blur-sm",
        className
      )}
    >
      <div className="flex flex-col gap-3 border-b border-white/[0.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
        <div>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          {description ? (
            <p className="mt-1 text-xs text-white/45">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      <div className="p-5 md:p-6">{children}</div>
    </section>
  );
}

export function CloudAlert({
  message,
  tone = "error",
}: {
  message: string;
  tone?: "error" | "info" | "success";
}) {
  const styles =
    tone === "error"
      ? "border-red-500/25 bg-red-500/10 text-red-100/90"
      : tone === "success"
        ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-100/90"
        : "border-white/10 bg-white/[0.04] text-white/70";

  return (
    <div
      className={cn("rounded-xl border px-4 py-3 text-sm leading-relaxed", styles)}
      role="status"
    >
      {message}
    </div>
  );
}

export function CloudField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium uppercase tracking-[0.12em] text-white/40">
        {label}
      </span>
      {children}
    </label>
  );
}

export const cloudInputClass =
  "w-full rounded-xl border border-white/10 bg-[#121214] px-3 py-2.5 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-accent/40";

export const cloudBtnPrimaryClass =
  "inline-flex items-center justify-center rounded-full bg-accent px-4 py-2 text-xs font-semibold text-[#0A0A0B] transition-colors hover:brightness-110 disabled:opacity-50";

export const cloudBtnSecondaryClass =
  "inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-medium text-white/75 transition-colors hover:border-white/20 hover:bg-white/[0.06] hover:text-white disabled:opacity-50";

export const cloudBtnDangerClass =
  "inline-flex items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-medium text-red-100/90 transition-colors hover:bg-red-500/20 disabled:opacity-50";
