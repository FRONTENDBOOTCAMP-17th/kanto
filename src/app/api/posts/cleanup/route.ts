import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function extractStoragePath(url: string): string | null {
  const marker = "/storage/v1/object/public/images/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: expiredPosts, error: fetchError } = await supabaseAdmin
    .from("posts")
    .select("id, post_type")
    .eq("status", "deleted")
    .lt("deleted_at", cutoff);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!expiredPosts || expiredPosts.length === 0) {
    return NextResponse.json({ deleted: 0, imagesDeleted: 0 });
  }

  const postIds = expiredPosts.map((p) => p.id);
  const imageUrls: string[] = [];

  const byType = (type: string) =>
    expiredPosts.filter((p) => p.post_type === type).map((p) => p.id);

  const jobPostIds = byType("jobs");
  const rentalPostIds = byType("rental");
  const usedGoodsPostIds = byType("used_goods");

  if (jobPostIds.length > 0) {
    const { data } = await supabaseAdmin
      .from("jobs")
      .select("images, company_logo")
      .in("post_id", jobPostIds);
    for (const row of data ?? []) {
      if (row.images) imageUrls.push(...(row.images as string[]));
      if (row.company_logo) imageUrls.push(row.company_logo);
    }
  }

  if (rentalPostIds.length > 0) {
    const { data } = await supabaseAdmin
      .from("rentals")
      .select("images")
      .in("post_id", rentalPostIds);
    for (const row of data ?? []) {
      if (row.images) imageUrls.push(...(row.images as string[]));
    }
  }

  if (usedGoodsPostIds.length > 0) {
    const { data } = await supabaseAdmin
      .from("used_goods")
      .select("images")
      .in("post_id", usedGoodsPostIds);
    for (const row of data ?? []) {
      if (row.images) imageUrls.push(...(row.images as string[]));
    }
  }

  const storagePaths = imageUrls
    .map(extractStoragePath)
    .filter((p): p is string => p !== null);

  if (storagePaths.length > 0) {
    await supabaseAdmin.storage.from("images").remove(storagePaths);
  }

  const { error, count } = await supabaseAdmin
    .from("posts")
    .delete({ count: "exact" })
    .in("id", postIds);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: count ?? 0, imagesDeleted: storagePaths.length });
}
