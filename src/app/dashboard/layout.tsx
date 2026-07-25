import type { Metadata } from "next";
import { Suspense } from "react";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AdminForbiddenBanner } from "@/components/dashboard/AdminForbiddenBanner";
import { defaultLocale } from "@/config/i18n";
import { getDictionary } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Helia Platform",
  description: "Helia API Platform — API keys, usage, and integrations",
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const dict = getDictionary(defaultLocale);

  return (
    <>
      <Header locale={defaultLocale} dict={dict} />
      <DashboardShell footer={<Footer locale={defaultLocale} dict={dict} />}>
        <Suspense fallback={null}>
          <AdminForbiddenBanner />
        </Suspense>
        {children}
      </DashboardShell>
      <FloatingWhatsApp ariaLabel={dict.header.whatsappCta} />
    </>
  );
}
