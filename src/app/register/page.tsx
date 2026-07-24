import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { SITE_NAME } from "@/config/site";
import { defaultLocale } from "@/config/i18n";

export const metadata: Metadata = {
  title: `Register — ${SITE_NAME}`,
  description: "Create your Helia Suite account",
};

export default function RegisterPage() {
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
          <h1 className="mt-6 text-3xl font-semibold tracking-tight">Register</h1>
          <p className="mt-3 text-sm text-white/50">
            Create a Helia Cloud account to access your workspace.
          </p>
        </div>
        <Suspense fallback={<p className="text-center text-sm text-white/45">Loading…</p>}>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  );
}
