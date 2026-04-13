import type { Locale } from "@/config/i18n";
import { defaultLocale, isLocale } from "@/config/i18n";
import { dictionary } from "@/config/dictionary";
import type { Dictionary } from "@/lib/dictionaries/types";

export type { Dictionary };

export function getDictionary(locale: string): Dictionary {
  if (isLocale(locale)) {
    return dictionary[locale];
  }
  return dictionary[defaultLocale];
}
