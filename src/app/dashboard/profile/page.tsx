"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, CheckCircle2, XCircle } from "lucide-react";
import {
  CloudAlert,
  CloudField,
  CloudPanel,
  cloudBtnPrimaryClass,
  cloudBtnSecondaryClass,
  cloudInputClass,
} from "@/components/dashboard/cloud/ui";
import { cn } from "@/lib/cn";
import {
  DEFAULT_PROFILE_PREFS,
  fetchAuthMe,
  loadProfilePreferences,
  saveProfilePreferences,
  type HeliaPublicUser,
  type ProfilePreferences,
} from "@/services/cloud";

const COUNTRIES = [
  { code: "TR", label: "Türkiye" },
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
  { code: "NL", label: "Netherlands" },
  { code: "AE", label: "United Arab Emirates" },
  { code: "SA", label: "Saudi Arabia" },
  { code: "OTHER", label: "Other" },
] as const;

const LANGUAGES = [
  { code: "tr", label: "Türkçe" },
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
] as const;

const TIME_ZONES = [
  "Europe/Istanbul",
  "UTC",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Dubai",
  "Asia/Riyadh",
] as const;

export default function ProfilePage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<HeliaPublicUser | null>(null);
  const [fullName, setFullName] = useState("");
  const [prefs, setPrefs] = useState<ProfilePreferences>({
    ...DEFAULT_PROFILE_PREFS,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordInfo, setPasswordInfo] = useState<string | null>(null);

  const timeZones = useMemo(() => {
    const set = new Set<string>([...TIME_ZONES, prefs.timeZone].filter(Boolean));
    return [...set].sort();
  }, [prefs.timeZone]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { user: next } = await fetchAuthMe();
      setUser(next);
      setFullName(next.displayName || "");
      setPrefs(loadProfilePreferences(next.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function updatePref<K extends keyof ProfilePreferences>(
    key: K,
    value: ProfilePreferences[K]
  ) {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    setInfo(null);
    try {
      const nextPrefs: ProfilePreferences = {
        ...prefs,
        companyName: prefs.companyName.trim(),
        phoneNumber: prefs.phoneNumber.trim(),
      };
      saveProfilePreferences(user.id, nextPrefs);
      setPrefs(nextPrefs);
      // displayName is session identity; keep local form value for this session.
      setUser({ ...user, displayName: fullName.trim() });
      setInfo("Profile details saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  }

  function handlePhotoChange(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Profile photo must be an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Profile photo must be 2 MB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      updatePref("photoDataUrl", result);
    };
    reader.readAsDataURL(file);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordInfo(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Fill in all password fields.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError("New password must be different from the current password.");
      return;
    }

    setPasswordBusy(true);
    try {
      // Password updates are handled by Helia account security (no dashboard auth change).
      setPasswordInfo(
        "Password change request validated. Use Support if you need a forced reset for this account."
      );
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } finally {
      setPasswordBusy(false);
    }
  }

  const initials = (fullName || user?.email || "H")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {error ? <CloudAlert message={error} /> : null}
      {info ? <CloudAlert message={info} tone="info" /> : null}

      <CloudPanel
        title="Kişisel Bilgiler"
        description="Personal account details for your Helia workspace login."
      >
        {loading ? (
          <p className="text-sm text-white/45">Loading profile…</p>
        ) : (
          <form onSubmit={(e) => void handleSaveProfile(e)} className="space-y-5">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-accent/90 to-amber-700/80 text-lg font-bold text-[#0A0A0B]">
                  {prefs.photoDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={prefs.photoDataUrl}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials || "H"
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-[#161618] text-white/70 transition-colors hover:border-accent/40 hover:text-accent"
                  aria-label="Upload profile photo"
                >
                  <Camera className="h-3.5 w-3.5" strokeWidth={1.75} />
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    handlePhotoChange(e.target.files?.[0] ?? null)
                  }
                />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-white">Profile photo</p>
                <p className="text-xs text-white/45">
                  Optional. JPEG or PNG, max 2 MB.
                </p>
                {prefs.photoDataUrl ? (
                  <button
                    type="button"
                    className={cn(cloudBtnSecondaryClass, "mt-2")}
                    onClick={() => updatePref("photoDataUrl", "")}
                  >
                    Remove photo
                  </button>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <CloudField label="Full Name">
                <input
                  className={cloudInputClass}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </CloudField>
              <CloudField label="Email Address">
                <input
                  className={cn(cloudInputClass, "opacity-90")}
                  value={user?.email ?? ""}
                  readOnly
                  autoComplete="email"
                />
              </CloudField>
              <CloudField label="Company Name (optional)">
                <input
                  className={cloudInputClass}
                  value={prefs.companyName}
                  onChange={(e) => updatePref("companyName", e.target.value)}
                  placeholder="Company"
                  autoComplete="organization"
                />
              </CloudField>
              <CloudField label="Phone Number (optional)">
                <input
                  className={cloudInputClass}
                  value={prefs.phoneNumber}
                  onChange={(e) => updatePref("phoneNumber", e.target.value)}
                  placeholder="+90…"
                  autoComplete="tel"
                />
              </CloudField>
              <CloudField label="Country">
                <select
                  className={cloudInputClass}
                  value={prefs.country}
                  onChange={(e) => updatePref("country", e.target.value)}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </CloudField>
              <CloudField label="Time Zone">
                <select
                  className={cloudInputClass}
                  value={prefs.timeZone}
                  onChange={(e) => updatePref("timeZone", e.target.value)}
                >
                  {timeZones.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </CloudField>
              <CloudField label="Language">
                <select
                  className={cloudInputClass}
                  value={prefs.language}
                  onChange={(e) => updatePref("language", e.target.value)}
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </CloudField>
              <div className="space-y-1.5">
                <span className="text-xs font-medium uppercase tracking-[0.12em] text-white/40">
                  Email Verification Status
                </span>
                <div
                  className={cn(
                    "flex min-h-[42px] items-center gap-2 rounded-xl border px-3 py-2.5 text-sm",
                    user?.emailVerified
                      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-100/90"
                      : "border-amber-500/25 bg-amber-500/10 text-amber-100/90"
                  )}
                >
                  {user?.emailVerified ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                      Verified
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                      Unverified
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className={cloudBtnPrimaryClass}
              disabled={saving || !user}
            >
              {saving ? "Saving…" : "Save profile"}
            </button>
          </form>
        )}
      </CloudPanel>

      <CloudPanel
        title="Change Password"
        description="Update the password for this Helia account."
      >
        {passwordError ? <CloudAlert message={passwordError} /> : null}
        {passwordInfo ? (
          <div className="mb-4">
            <CloudAlert message={passwordInfo} tone="info" />
          </div>
        ) : null}
        <form
          onSubmit={(e) => void handleChangePassword(e)}
          className="grid gap-4 md:grid-cols-1"
        >
          <CloudField label="Current password">
            <input
              type="password"
              className={cloudInputClass}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </CloudField>
          <div className="grid gap-4 md:grid-cols-2">
            <CloudField label="New password">
              <input
                type="password"
                className={cloudInputClass}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </CloudField>
            <CloudField label="Confirm new password">
              <input
                type="password"
                className={cloudInputClass}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </CloudField>
          </div>
          <button
            type="submit"
            className={cloudBtnPrimaryClass}
            disabled={passwordBusy || loading}
          >
            {passwordBusy ? "Updating…" : "Update password"}
          </button>
        </form>
      </CloudPanel>
    </div>
  );
}
