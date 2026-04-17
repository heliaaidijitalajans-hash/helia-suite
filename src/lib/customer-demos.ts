import type { Locale } from "@/config/i18n";
import manifest from "@/data/customer-demos.json";

export type CustomerDemoEntry = {
  slug: string;
  title: string;
  titleTr: string;
  description: string;
  descriptionTr: string;
  /** Same-origin interactive route under `/demo/*` (allowlisted). */
  embedUrl?: string;
};

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Built-in Helia demo shells embedded from this Next app. */
const ALLOWED_EMBED_URLS = new Set([
  "/demo/ai",
  "/demo/market",
  "/demo/learn",
  "/demo/health",
]);

function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug);
}

function isValidEntry(e: CustomerDemoEntry): boolean {
  if (!isValidSlug(e.slug)) return false;
  if (e.embedUrl && !ALLOWED_EMBED_URLS.has(e.embedUrl)) return false;
  return true;
}

export function listCustomerDemos(): CustomerDemoEntry[] {
  return (manifest as CustomerDemoEntry[]).filter(isValidEntry);
}

export function getCustomerDemo(slug: string): CustomerDemoEntry | undefined {
  if (!isValidSlug(slug)) return undefined;
  const entry = (manifest as CustomerDemoEntry[]).find((e) => e.slug === slug);
  if (!entry || !isValidEntry(entry)) return undefined;
  return entry;
}

/** Static HTML under `public/customer-demos/<slug>/index.html`. */
export function customerDemoIndexUrl(slug: string): string {
  return `/customer-demos/${slug}/index.html`;
}

export function customerDemoPreviewSrc(entry: CustomerDemoEntry): string {
  if (entry.embedUrl && ALLOWED_EMBED_URLS.has(entry.embedUrl)) {
    return entry.embedUrl;
  }
  return customerDemoIndexUrl(entry.slug);
}

export function isInteractiveEmbed(entry: CustomerDemoEntry): boolean {
  return Boolean(entry.embedUrl && ALLOWED_EMBED_URLS.has(entry.embedUrl));
}

export function demoLocalizedTitle(entry: CustomerDemoEntry, locale: Locale) {
  return locale === "tr" ? entry.titleTr : entry.title;
}

export function demoLocalizedDescription(
  entry: CustomerDemoEntry,
  locale: Locale
) {
  return locale === "tr" ? entry.descriptionTr : entry.description;
}
