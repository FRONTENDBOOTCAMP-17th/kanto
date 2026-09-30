import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  const { email } = (await req.json()) as { email?: string };

  if (!email?.trim()) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "check_failed" }, { status: 500 });
  }

  return NextResponse.json({ exists: !!data });
}
