/**
 * Supabase client for durable Helia Cloud persistence (production).
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function getSupabaseCloudClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function hasSupabaseCloudCredentials(): boolean {
  return Boolean(getSupabaseCloudClient());
}

/**
 * Production (NODE_ENV=production or Vercel) must use Supabase.
 * Local development defaults to the JSON document store.
 * Override with HELIA_CLOUD_STORE=supabase|file (file blocked on Vercel).
 */
export function shouldUseSupabaseCloudStore(): boolean {
  const mode = (process.env.HELIA_CLOUD_STORE || "").trim().toLowerCase();
  if (mode === "file") {
    if (process.env.VERCEL) {
      throw new Error(
        "HELIA_CLOUD_STORE=file is not allowed on Vercel (ephemeral filesystem)."
      );
    }
    return false;
  }
  if (mode === "supabase") {
    if (!hasSupabaseCloudCredentials()) {
      throw new Error(
        "HELIA_CLOUD_STORE=supabase but NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are missing"
      );
    }
    return true;
  }
  const isProductionRuntime =
    Boolean(process.env.VERCEL) || process.env.NODE_ENV === "production";
  if (isProductionRuntime) {
    if (!hasSupabaseCloudCredentials()) {
      throw new Error(
        "Production Helia Cloud requires Supabase credentials (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY). JSON file stores are not allowed."
      );
    }
    return true;
  }
  return false;
}
