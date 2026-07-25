import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { PlatformLocaleProvider } from "@/components/platform/PlatformLocaleProvider";
import {
  HELIA_UI_LOCALE_COOKIE,
  parseUiLocale,
} from "@/lib/platform-locale";
import { getCloudContainer } from "@/server/helia/runtime";
import { resolvePlatformRole } from "@/server/helia/cloud/utils";

export const metadata: Metadata = {
  title: "Helia Admin",
  description: "Helia Suite internal admin console",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function readAccessToken(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;
  const trimmed = raw.trim();
  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}

async function assertAdmin() {
  const jar = await cookies();
  const token = readAccessToken(jar.get("helia_access_token")?.value);
  if (!token) redirect("/login?next=/admin");

  try {
    const container = await getCloudContainer();
    // Keep admin account present on this instance before JWT/session checks
    // (Vercel /tmp is empty on cold starts / other regions).
    await container.admin.ensureAdminCredentialsAccount();

    const { user } = await container.auth.authenticateAccessToken(token);

    // Re-apply HELIA_ADMIN_EMAILS on every gate (fixes "registered after boot").
    const ensured = await container.admin.ensureListedAdmin(user.id);

    if (resolvePlatformRole(ensured) !== "admin") {
      redirect("/dashboard?forbidden=admin");
    }
  } catch {
    redirect("/login?next=/admin");
  }
}

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await assertAdmin();
  const jar = await cookies();
  const locale = parseUiLocale(jar.get(HELIA_UI_LOCALE_COOKIE)?.value);
  return (
    <PlatformLocaleProvider locale={locale}>
      <AdminShell>{children}</AdminShell>
    </PlatformLocaleProvider>
  );
}
