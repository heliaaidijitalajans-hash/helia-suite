import type { Locale } from "@/config/i18n";
import type { Dictionary } from "@/lib/dictionaries/types";
import { en } from "@/lib/dictionaries/en";
import { tr } from "@/lib/dictionaries/tr";

/**
 * Single source for locale payloads: `{ en: {...}, tr: {...} }`.
 * Per-locale content lives in `src/lib/dictionaries/*.ts` for maintainability.
 */
export const dictionary: Record<Locale, Dictionary> = {
  en,
  tr,
};

export type { Dictionary };
