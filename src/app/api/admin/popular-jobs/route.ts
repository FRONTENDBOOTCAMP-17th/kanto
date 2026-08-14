import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { insertAuditLog } from "@/services/admin/auditLog";
import { requireSuperAdminOrApiError } from "../_lib/requireAdmin";

export async function GET(req: NextRequest) {
  const admin = await requireSuperAdminOrApiError();
  if (admin instanceof NextResponse) return admin;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";

  let query = supabaseAdmin
    .from("posts")
    .select("id, title, created_at, jobs!inner(id, company_name, popular_count)")
    .eq("post_type", "jobs")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}

export async function PATCH(req: NextRequest) {
  const admin = await requireSuperAdminOrApiError();
  if (admin instanceof NextResponse) return admin;

  const body = await req.json();
  const { job_id, popular_count, post_title } = body as {
    job_id: number;
    popular_count: number | null;
    post_title?: string;
  };

  if (typeof job_id !== "number") {
    return NextResponse.json({ error: "job_id가 필요합니다." }, { status: 400 });
  }

  if (popular_count !== null && (popular_count < 1 || popular_count > 5)) {
    return NextResponse.json({ error: "popular_count는 1~5 사이여야 합니다." }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("jobs")
    .update({ popular_count })
    .eq("id", job_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await insertAuditLog(admin, "update_job_popular_count", {
    targetType: "post",
    targetId: job_id,
    detail: { popular_count, _label: post_title ?? `job #${job_id}` },
  });

  return NextResponse.json({ ok: true });
}
