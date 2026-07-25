import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AdminForbiddenBanner } from "@/components/dashboard/AdminForbiddenBanner";
import { PlatformLocaleProvider } from "@/components/platform/PlatformLocaleProvider";
import {
  HELIA_UI_LOCALE_COOKIE,
  parseUiLocale,
} from "@/lib/platform-locale";
import { getDictionary } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Helia Platform",
  description: "Helia API Platform — API keys, usage, and integrations",
};

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jar = await cookies();
  const locale = parseUiLocale(jar.get(HELIA_UI_LOCALE_COOKIE)?.value);
  const dict = getDictionary(locale);

  return (
    <PlatformLocaleProvider locale={locale}>
      <Header locale={locale} dict={dict} />
      <DashboardShell footer={<Footer locale={locale} dict={dict} />}>
        <Suspense fallback={null}>
          <AdminForbiddenBanner />
        </Suspense>
        {children}
      </DashboardShell>
      <FloatingWhatsApp ariaLabel={dict.header.whatsappCta} />
    </PlatformLocaleProvider>
  );
}
