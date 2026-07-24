import type { Metadata } from "next";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { defaultLocale } from "@/config/i18n";
import { getDictionary } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Helia Platform",
  description: "Helia API Platform — API keys, chat, and monitoring",
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
      <DashboardShell
        footer={<Footer locale={defaultLocale} dict={dict} />}
      >
        {children}
      </DashboardShell>
      <FloatingWhatsApp ariaLabel={dict.header.whatsappCta} />
    </>
  );
}
