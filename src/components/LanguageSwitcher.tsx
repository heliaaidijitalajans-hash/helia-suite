"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { defaultLocale, isLocale, type Locale } from "@/config/i18n";
import { setUiLocaleCookie } from "@/lib/platform-locale";
import { usePlatformLocaleOptional } from "@/components/platform/PlatformLocaleProvider";

const options: { code: Locale; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "tr", label: "TR" },
];

function isPlatformPath(pathname: string): boolean {
  return (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/login" ||
    pathname.startsWith("/login/")
  );
}

/**
 * Language switch without breaking dashboard/admin routes.
 * Public: /en/pricing ↔ /tr/pricing
 * Platform: same path + helia_ui_locale cookie + refresh
 */
export function languageSwitchHref(
  pathname: string,
  targetLocale: Locale
): string {
  const segments = pathname.split("/").filter(Boolean);

  if (isPlatformPath(pathname)) {
    return pathname.startsWith("/") ? pathname : `/${pathname}`;
  }

  const currentLocale =
    segments[0] && isLocale(segments[0]) ? segments[0] : null;
  const rest = currentLocale ? segments.slice(1) : segments;
  const tail = rest.join("/");
  return tail ? `/${targetLocale}/${tail}` : `/${targetLocale}`;
}

function activeLocaleFromPath(pathname: string): Locale {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] && isLocale(segments[0])) return segments[0];
  return defaultLocale;
}

export function LanguageSwitcher({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const platform = usePlatformLocaleOptional();
  const onPlatform = isPlatformPath(pathname);
  const active = onPlatform
    ? (platform?.locale ?? defaultLocale)
    : activeLocaleFromPath(pathname);

  function switchTo(code: Locale) {
    if (onPlatform) {
      if (platform) {
        platform.setLocale(code);
      } else {
        setUiLocaleCookie(code);
        router.refresh();
      }
      return;
    }
    // public pages use Link href
  }

  return (
    <div
      className={cn(
        "flex items-center rounded-full border border-white/10 bg-surface/80 p-0.5 text-xs font-medium backdrop-blur",
        className
      )}
      role="group"
      aria-label={platform?.ui.shell.language ?? "Language"}
    >
      {options.map(({ code, label }) => {
        const href = languageSwitchHref(pathname, code);
        const isActive = active === code;

        if (onPlatform) {
          return (
            <button
              key={code}
              type="button"
              onClick={() => switchTo(code)}
              className={cn(
                "rounded-full px-2.5 py-1 transition-colors",
                isActive
                  ? "bg-white/10 text-foreground"
                  : "text-white/50 hover:text-white/80"
              )}
              aria-pressed={isActive}
              lang={code}
            >
              {label}
            </button>
          );
        }

        return (
          <Link
            key={code}
            href={href}
            className={cn(
              "rounded-full px-2.5 py-1 transition-colors",
              isActive
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
