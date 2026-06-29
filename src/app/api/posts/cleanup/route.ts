import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Called by an external cron (e.g. Vercel Cron Jobs) to permanently delete
// posts that have been soft-deleted for over 30 days.
// Protect with a shared secret: set CRON_SECRET in env vars and pass it as
// Authorization: Bearer <CRON_SECRET>
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { error, count } = await supabaseAdmin
    .from("posts")
    .delete({ count: "exact" })
    .eq("status", "deleted")
    .lt("deleted_at", cutoff);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: count ?? 0 });
}
