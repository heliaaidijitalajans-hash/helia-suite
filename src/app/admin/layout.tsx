import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { getCloudContainer } from "@/server/helia/runtime";
import { resolvePlatformRole } from "@/server/helia/cloud/utils";

export const metadata: Metadata = {
  title: "Helia Admin",
  description: "Helia Suite internal admin console",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

async function assertAdmin() {
  const jar = await cookies();
  const token = jar.get("helia_access_token")?.value?.trim();
  if (!token) redirect("/login?next=/admin");

  try {
    const container = await getCloudContainer();
    const { user } = await container.auth.authenticateAccessToken(
      decodeURIComponent(token)
    );
    if (resolvePlatformRole(user) !== "admin") {
      redirect("/dashboard");
    }
  } catch {
    redirect("/login?next=/admin");
  }
}

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await assertAdmin();
  return <AdminShell>{children}</AdminShell>;
}
