"use client";

import { useParams } from "next/navigation";
import { dictionary } from "@/config/dictionary";
import { defaultLocale, isLocale } from "@/config/i18n";
import type { Dictionary } from "@/lib/dictionaries/types";

/** Current route locale (`/[locale]/...`) → matching dictionary. No i18n library. */
export function useDictionary(): Dictionary {
  const params = useParams();
  const raw = params?.locale;
  const locale =
    typeof raw === "string" && isLocale(raw) ? raw : defaultLocale;
  return dictionary[locale];
}
