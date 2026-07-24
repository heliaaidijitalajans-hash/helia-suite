import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { SITE_NAME } from "@/config/site";
import { defaultLocale } from "@/config/i18n";

export const metadata: Metadata = {
  title: `Login — ${SITE_NAME}`,
  description: "Sign in to your Helia Suite dashboard",
};

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-[#0A0A0B] text-white">
      <div className="container-main flex flex-1 flex-col justify-center px-4 py-16">
        <div className="mx-auto mb-10 max-w-md text-center">
          <Link
            href={`/${defaultLocale}`}
            className="text-sm font-semibold tracking-tight text-white/80 hover:text-white"
          >
            {SITE_NAME}
          </Link>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight">Login</h1>
          <p className="mt-3 text-sm text-white/50">
            Sign in with your Helia Cloud account to open the dashboard.
          </p>
        </div>
        <Suspense fallback={<p className="text-center text-sm text-white/45">Loading…</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
