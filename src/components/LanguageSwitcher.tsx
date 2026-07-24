"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { defaultLocale, isLocale, type Locale } from "@/config/i18n";

const options: { code: Locale; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "tr", label: "TR" },
];

/**
 * Builds a language-switch href without breaking dashboard routes.
 * /dashboard/api-keys → /tr/dashboard/api-keys
 * /en/dashboard/profile → /tr/dashboard/profile
 * /en/pricing → /tr/pricing
 * Never produces /tr/api-keys or /en/profile.
 */
export function languageSwitchHref(
  pathname: string,
  targetLocale: Locale
): string {
  const segments = pathname.split("/").filter(Boolean);
  const currentLocale =
    segments[0] && isLocale(segments[0]) ? segments[0] : null;
  const rest = currentLocale ? segments.slice(1) : segments;

  if (rest[0] === "dashboard") {
    return `/${targetLocale}/${rest.join("/")}`;
  }

  if (currentLocale) {
    const tail = rest.join("/");
    return tail ? `/${targetLocale}/${tail}` : `/${targetLocale}`;
  }

  const tail = segments.join("/");
  return tail ? `/${targetLocale}/${tail}` : `/${targetLocale}`;
}

function activeLocaleFromPath(pathname: string): Locale {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] && isLocale(segments[0])) return segments[0];
  // Bare /dashboard/* is treated as default locale until redirected.
  return defaultLocale;
}

export function LanguageSwitcher({ className }: { className?: string }) {
  const pathname = usePathname();
  const active = activeLocaleFromPath(pathname);

  return (
    <div
      className={cn(
        "flex items-center rounded-full border border-white/10 bg-surface/80 p-0.5 text-xs font-medium backdrop-blur",
        className
      )}
      role="group"
      aria-label="Language"
    >
      {options.map(({ code, label }) => {
        const href = languageSwitchHref(pathname, code);
        return (
          <Link
            key={code}
            href={href}
            className={cn(
              "rounded-full px-2.5 py-1 transition-colors",
              active === code
                ? "bg-white/10 text-foreground"
                : "text-white/50 hover:text-white/80"
            )}
            hrefLang={code}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
