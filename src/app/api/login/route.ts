import { Redis } from "@upstash/redis";
import { Database } from "@/type/supabase";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const key = `login_fail:${ip}`;
  const fails = (await redis.get<number>(key)) ?? 0;
  if (fails >= 5) {
    return NextResponse.json({ code: "too_many_requests" }, { status: 429 });
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { global: { headers: { "X-Forwarded-For": ip } } },
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    await redis.incr(key);
    await redis.expire(key, 60 * 15);
    return NextResponse.json(
      { code: error.code },
      { status: error.status ?? 400 },
    );
  }

  await redis.del(key);
  return NextResponse.json({ session: data.session });
}
