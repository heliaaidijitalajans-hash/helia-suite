"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AdminEmpty,
  AdminPanel,
  adminBtnDanger,
  adminBtnSecondary,
  adminInputClass,
} from "@/components/admin/ui";
import { adminFetch } from "@/services/admin/http";
import { cn } from "@/lib/cn";

type AdminUser = {
  id: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  role: "user" | "admin";
  createdAt: string;
  lastLoginAt?: string;
  disabledAt?: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ q, role, status });
      const res = await adminFetch<{ users: AdminUser[] }>(
        `/api/admin/users?${params}`
      );
      setUsers(res.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [q, role, status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function patchUser(
    id: string,
    body: Record<string, unknown>
  ) {
    setBusyId(id);
    setError(null);
    try {
      await adminFetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function resetPassword(id: string) {
    const password = window.prompt("New password (min 8 characters)");
    if (!password) return;
    setBusyId(id);
    setError(null);
    try {
      await adminFetch(`/api/admin/users/${id}/reset-password`, {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      window.alert("Password reset. Active sessions revoked.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteUser(id: string) {
    if (!window.confirm("Delete this user permanently?")) return;
    setBusyId(id);
    setError(null);
    try {
      await adminFetch(`/api/admin/users/${id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPanel
        title="Users"
        description="Search, filter, and manage Helia platform accounts."
        actions={
          <div className="flex flex-wrap gap-2">
            <input
              className={cn(adminInputClass, "min-w-[12rem] sm:w-56")}
              placeholder="Search email or name"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select
              className={adminInputClass}
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="all">All roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <select
              className={adminInputClass}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
        }
      >
        {error ? (
          <p className="mb-4 text-sm text-red-100/90">{error}</p>
        ) : null}
        {loading ? (
          <p className="text-sm text-white/45">Loading users…</p>
        ) : users.length === 0 ? (
          <AdminEmpty
            title="No users found"
            description="Registered accounts will appear here. Nothing is fabricated."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-white/40">
                <tr className="border-b border-white/[0.06]">
                  <th className="pb-3 pr-4 font-medium">User</th>
                  <th className="pb-3 pr-4 font-medium">Role</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Last login</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-white/[0.04] align-top"
                  >
                    <td className="py-3 pr-4">
                      <p className="font-medium text-white">{u.displayName}</p>
                      <p className="text-xs text-white/45">{u.email}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <select
                        className={cn(adminInputClass, "max-w-[8rem]")}
                        value={u.role}
                        disabled={busyId === u.id}
                        onChange={(e) =>
                          void patchUser(u.id, {
                            role: e.target.value as "user" | "admin",
                          })
                        }
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={
                          u.disabledAt
                            ? "text-amber-200/90"
                            : "text-emerald-200/90"
                        }
                      >
                        {u.disabledAt ? "Disabled" : "Active"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-xs text-white/45">
                      {u.lastLoginAt
                        ? new Date(u.lastLoginAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className={adminBtnSecondary}
                          disabled={busyId === u.id}
                          onClick={() =>
                            void patchUser(u.id, {
                              disabled: !u.disabledAt,
                            })
                          }
                        >
                          {u.disabledAt ? "Enable" : "Disable"}
                        </button>
                        <button
                          type="button"
                          className={adminBtnSecondary}
                          disabled={busyId === u.id}
                          onClick={() => void resetPassword(u.id)}
                        >
                          Reset password
                        </button>
                        <button
                          type="button"
                          className={adminBtnDanger}
                          disabled={busyId === u.id}
                          onClick={() => void deleteUser(u.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>
    </div>
  );
}
