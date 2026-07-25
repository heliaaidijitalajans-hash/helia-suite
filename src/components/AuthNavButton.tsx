"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  getHeliaAccessToken,
  setHeliaAccessToken,
} from "@/lib/cloud/session";
import { logoutHeliaCloud } from "@/services/cloud/auth";
import { cn } from "@/lib/cn";

const btnClass =
  "inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-medium text-white/80 transition-colors hover:border-accent/35 hover:bg-white/[0.06] hover:text-white md:px-5 md:text-sm";

/**
 * Public-site auth CTAs: Login when signed out; Dashboard + Logout when signed in.
 */
export function AuthNavButton({
  loginLabel,
  dashboardLabel,
  logoutLabel = "Logout",
  className,
}: {
  loginLabel: string;
  dashboardLabel: string;
  logoutLabel?: string;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sync = () => {
      const token = getHeliaAccessToken();
      if (token) {
        setHeliaAccessToken(token);
      }
      setAuthed(Boolean(token));
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("helia-auth-changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("helia-auth-changed", sync);
    };
  }, []);

  async function handleLogout() {
    if (busy) return;
    setBusy(true);
    try {
      await logoutHeliaCloud();
      router.replace("/login");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (authed === null) {
    return (
      <span
        className={cn(btnClass, "pointer-events-none opacity-0", className)}
        aria-hidden
      >
        {loginLabel}
      </span>
    );
  }

  if (!authed) {
    return (
      <Link href="/login" className={cn(btnClass, className)}>
        {loginLabel}
      </Link>
    );
  }

  const onDashboard =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  return (
    <div className={cn("flex items-center gap-1.5 sm:gap-2", className)}>
      {!onDashboard ? (
        <Link href="/dashboard" className={btnClass}>
          {dashboardLabel}
        </Link>
      ) : (
        <Link href="/dashboard/profile" className={btnClass}>
          Profile
        </Link>
      )}
      <button
        type="button"
        onClick={() => void handleLogout()}
        disabled={busy}
        className={cn(
          btnClass,
          "border-white/15 text-white/70 hover:border-red-400/35 hover:text-red-100/90 disabled:opacity-60"
        )}
      >
        {busy ? "…" : logoutLabel}
      </button>
    </div>
  );
}
