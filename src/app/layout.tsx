import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { HtmlLang } from "@/components/HtmlLang";
import { SITE_NAME, SITE_URL } from "@/config/site";
import { en } from "@/lib/dictionaries/en";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans-var",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: en.seo.defaultDescription,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <HtmlLang />
        {children}
      </body>
    </html>
  );
}
