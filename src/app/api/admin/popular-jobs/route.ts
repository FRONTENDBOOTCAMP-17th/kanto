import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { insertAuditLog } from "@/services/admin/auditLog";

async function getAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data } = await supabaseAdmin
    .from("users")
    .select("id, role")
    .eq("auth_id", user.id)
    .single();

  if (!data || data.role !== "super_admin") return null;
  return data as { id: number; role: string };
}

export async function GET(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

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
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

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

  insertAuditLog(admin, "update_job_popular_count", {
    targetType: "post",
    targetId: job_id,
    detail: { popular_count, _label: post_title ?? `job #${job_id}` },
  });

  return NextResponse.json({ ok: true });
}
