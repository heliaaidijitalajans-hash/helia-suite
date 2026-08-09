import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type LeadBody = {
  name?: unknown;
  email?: unknown;
  service?: unknown;
  message?: unknown;
};

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as LeadBody | null;
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const service = typeof body?.service === "string" ? body.service.trim() : "";
    const message =
      typeof body?.message === "string" ? body.message.trim() : "";

    if (!name || !email || !email.includes("@")) {
      return NextResponse.json(
        { ok: false, error: "Name and a valid email are required." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Lead storage is not configured." },
        { status: 503 }
      );
    }

    const { error } = await supabase.from("leads").insert({
      name,
      email,
      service: service || null,
      message: message || null,
    });

    if (error) {
      console.error("[api/leads]", error.message);
      return NextResponse.json(
        { ok: false, error: "Could not save your message. Please try WhatsApp." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/leads]", err);
    return NextResponse.json(
      { ok: false, error: "Could not send your message. Please try again." },
      { status: 500 }
    );
  }
}
