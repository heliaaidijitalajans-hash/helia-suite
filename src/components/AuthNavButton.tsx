"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  getHeliaAccessToken,
  setHeliaAccessToken,
} from "@/lib/cloud/session";
import { defaultLocale, isLocale } from "@/config/i18n";
import { cn } from "@/lib/cn";

/**
 * Public-site auth CTA: Login when signed out, Dashboard when signed in.
 */
export function AuthNavButton({
  loginLabel,
  dashboardLabel,
  className,
}: {
  loginLabel: string;
  dashboardLabel: string;
  className?: string;
}) {
  const pathname = usePathname();
  const [authed, setAuthed] = useState(false);
  const first = pathname.split("/").filter(Boolean)[0];
  const locale = first && isLocale(first) ? first : defaultLocale;

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

  return (
    <Link
      href={authed ? `/${locale}/dashboard` : "/login"}
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-medium text-white/80 transition-colors hover:border-accent/35 hover:bg-white/[0.06] hover:text-white md:px-5 md:text-sm",
        className
      )}
    >
      {authed ? dashboardLabel : loginLabel}
    </Link>
  );
}
