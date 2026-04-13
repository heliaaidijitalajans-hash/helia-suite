import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { isLocale } from "@/config/i18n";
import { SITE_NAME, SITE_URL } from "@/config/site";
import { getDictionary } from "@/lib/i18n";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "tr" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(locale);

  return {
    metadataBase: new URL(SITE_URL),
    title: dict.seo.defaultTitle,
    description: dict.seo.defaultDescription,
    openGraph: {
      title: dict.seo.defaultTitle,
      description: dict.seo.defaultDescription,
      siteName: SITE_NAME,
      type: "website",
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dict = getDictionary(locale);

  return (
    <>
      <Header locale={locale} dict={dict} />
      <main className="flex-1">{children}</main>
      <Footer locale={locale} dict={dict} />
      <FloatingWhatsApp ariaLabel={dict.header.whatsappCta} />
    </>
  );
}
