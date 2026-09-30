import { Database } from "@/type/supabase";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const LOGIN_FAIL_LIMIT = 5;
const LOGIN_FAIL_WINDOW_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { global: { headers: { "X-Forwarded-For": ip } } },
  );

  const windowStart = new Date(Date.now() - LOGIN_FAIL_WINDOW_MS).toISOString();

  await supabase
    .from("rate_limit_events")
    .delete()
    .eq("scope", "login_fail")
    .eq("identifier", ip)
    .lt("created_at", windowStart);

  const { count: fails } = await supabase
    .from("rate_limit_events")
    .select("id", { count: "exact", head: true })
    .eq("scope", "login_fail")
    .eq("identifier", ip)
    .gte("created_at", windowStart);

  if ((fails ?? 0) >= LOGIN_FAIL_LIMIT) {
    return NextResponse.json(
      { code: "too_many_requests", failedAttempts: LOGIN_FAIL_LIMIT },
      { status: 429 },
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    await supabase
      .from("rate_limit_events")
      .insert({ scope: "login_fail", identifier: ip });

    return NextResponse.json(
      { code: error.code, failedAttempts: (fails ?? 0) + 1 },
      { status: error.status ?? 400 },
    );
  }

  await supabase
    .from("rate_limit_events")
    .delete()
    .eq("scope", "login_fail")
    .eq("identifier", ip);

  return NextResponse.json({ session: data.session });
}
