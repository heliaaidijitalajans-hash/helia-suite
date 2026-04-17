import type { Locale } from "@/config/i18n";
import manifest from "@/data/customer-demos.json";

export type CustomerDemoEntry = {
  slug: string;
  title: string;
  titleTr: string;
  description: string;
  descriptionTr: string;
};

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug);
}

export function listCustomerDemos(): CustomerDemoEntry[] {
  return (manifest as CustomerDemoEntry[]).filter((e) => isValidSlug(e.slug));
}

export function getCustomerDemo(slug: string): CustomerDemoEntry | undefined {
  if (!isValidSlug(slug)) return undefined;
  return (manifest as CustomerDemoEntry[]).find((e) => e.slug === slug);
}

/** Static file URL under `public/customer-demos/<slug>/index.html` */
export function customerDemoIndexUrl(slug: string): string {
  return `/customer-demos/${slug}/index.html`;
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
