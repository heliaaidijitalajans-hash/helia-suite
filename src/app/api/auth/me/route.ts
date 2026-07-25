import { jsonError, requireCloudUser } from "@/server/helia/http";
import { toPublicUser, resolvePlatformRole } from "@/server/helia/cloud/utils";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Current session identity.
 * Auth: Authorization Bearer JWT OR helia_access_token cookie.
 */
export async function GET(request: Request) {
  try {
    const { container, user } = await requireCloudUser(request);
    const ensured = await container.admin.ensureListedAdmin(user.id);
    const role = resolvePlatformRole(ensured);
    const publicUser = toPublicUser(ensured);

    const memberships = await container.db.memberships.query(
      (m) => m.userId === ensured.id
    );
    const organizations = [];
    for (const membership of memberships) {
      const org = await container.db.organizations.findById(
        membership.organizationId
      );
      if (!org) continue;
      organizations.push({
        id: org.id,
        name: org.name,
        slug: org.slug,
        planId: org.planId,
        status: org.status ?? "active",
        role: membership.role,
        permissions: orgRolePermissions(membership.role),
      });
    }

    const primary = organizations[0] ?? null;
    const projects = await container.projects.listForUser(ensured.id);

    return NextResponse.json({
      ok: true,
      user: publicUser,
      email: publicUser.email,
      role,
      adminAccess: {
        role,
        isAdmin: role === "admin",
        listedAdminEmailsConfigured:
          container.admin.listedAdminEmails().length > 0,
        adminCount: await container.admin.countAdmins(),
      },
      organization: primary,
      organizations,
      permissions: primary?.permissions ?? (role === "admin" ? ["admin"] : []),
      projects,
    });
  } catch (error) {
    return jsonError(error);
  }
}

function orgRolePermissions(role: string): string[] {
  switch (role) {
    case "owner":
      return ["read", "write", "execute", "admin", "billing"];
    case "admin":
      return ["read", "write", "execute", "admin"];
    case "member":
      return ["read", "write", "execute"];
    case "viewer":
      return ["read"];
    default:
      return ["read"];
  }
}
