"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  registerWithHeliaCloud,
  safeAuthNextPath,
} from "@/services/cloud/auth";

export function RegisterForm() {
  const searchParams = useSearchParams();
  const nextPath = useMemo(
    () => safeAuthNextPath(searchParams.get("next")),
    [searchParams]
  );

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const user = await registerWithHeliaCloud({
        email,
        password,
        displayName,
      });
      window.dispatchEvent(new Event("helia-auth-changed"));
      const target =
        user.role === "admin"
          ? nextPath.startsWith("/admin")
            ? nextPath
            : "/admin"
          : nextPath;
      // Full navigation so the HttpOnly session cookie is applied (same as Login).
      window.location.assign(target);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="mx-auto w-full max-w-md space-y-5">
      {error ? (
        <p
          className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-100/90"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <label className="block space-y-1.5">
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-white/40">
          Display name
        </span>
        <input
          type="text"
          autoComplete="name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-[#121214] px-3 py-2.5 text-sm text-white outline-none focus:border-accent/40"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-white/40">
          Email
        </span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-[#121214] px-3 py-2.5 text-sm text-white outline-none focus:border-accent/40"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-white/40">
          Password
        </span>
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-[#121214] px-3 py-2.5 text-sm text-white outline-none focus:border-accent/40"
        />
      </label>

      <Button type="submit" disabled={busy} className="w-full min-h-11">
        {busy ? "Creating account…" : "Register"}
      </Button>

      <p className="text-center text-sm text-white/45">
        Already have an account?{" "}
        <Link
          href={`/login?next=${encodeURIComponent(nextPath)}`}
          className="text-accent hover:underline"
        >
          Login
        </Link>
      </p>
    </form>
  );
}
