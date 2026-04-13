import type { MetadataRoute } from "next";
import { locales, type Locale } from "@/config/i18n";
import { localizedPaths } from "@/config/paths";
import { SITE_URL } from "@/config/site";

function languageAlternates(path: string): Record<string, string> {
  const base = SITE_URL.replace(/\/$/, "");
  const suffix = path === "" ? "" : path;
  return Object.fromEntries(
    locales.map((locale: Locale) => [
      locale,
      `${base}/${locale}${suffix}`,
    ])
  ) as Record<string, string>;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_URL.replace(/\/$/, "");
  const lastModified = new Date();

  const entries: MetadataRoute.Sitemap = [];

  for (const path of localizedPaths) {
    const suffix = path === "" ? "" : path;
    for (const locale of locales) {
      entries.push({
        url: `${base}/${locale}${suffix}`,
        lastModified,
        changeFrequency: path === "" ? "weekly" : "monthly",
        priority: path === "" ? 1 : 0.7,
        alternates: {
          languages: languageAlternates(path),
        },
      });
    }
  }

  return entries;
}
