"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/config/i18n";
import { getPlatformUi, type PlatformUiDict } from "@/lib/platform-ui-dict";
import { setUiLocaleCookie } from "@/lib/platform-locale";

type PlatformLocaleContextValue = {
  locale: Locale;
  ui: PlatformUiDict;
  setLocale: (locale: Locale) => void;
};

const PlatformLocaleContext = createContext<PlatformLocaleContextValue | null>(
  null
);

export function PlatformLocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const router = useRouter();
  const ui = useMemo(() => getPlatformUi(locale), [locale]);

  const setLocale = useCallback(
    (next: Locale) => {
      if (next === locale) return;
      setUiLocaleCookie(next);
      router.refresh();
    },
    [locale, router]
  );

  const value = useMemo(
    () => ({ locale, ui, setLocale }),
    [locale, ui, setLocale]
  );

  return (
    <PlatformLocaleContext.Provider value={value}>
      {children}
    </PlatformLocaleContext.Provider>
  );
}

export function usePlatformLocale(): PlatformLocaleContextValue {
  const ctx = useContext(PlatformLocaleContext);
  if (!ctx) {
    throw new Error("usePlatformLocale must be used within PlatformLocaleProvider");
  }
  return ctx;
}

/** Safe for components that may render outside the provider (falls back to EN). */
export function usePlatformLocaleOptional(): PlatformLocaleContextValue | null {
  return useContext(PlatformLocaleContext);
}
