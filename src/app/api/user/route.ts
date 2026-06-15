import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const HIDE_POST_TYPES = ["used_goods", "jobs", "rental"];

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "인증되지 않은 요청입니다." }, { status: 401 });
  }

  const { data: userData, error: userError } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (userError || !userData) {
    return NextResponse.json({ error: "사용자 정보를 찾을 수 없습니다." }, { status: 404 });
  }

  // 중고거래, 구인구직, 방렌트 게시글 즉시 비공개 처리
  const { error: postError } = await supabaseAdmin
    .from("posts")
    .update({ status: "inactive" })
    .eq("user_id", userData.id)
    .in("post_type", HIDE_POST_TYPES);

  if (postError) {
    return NextResponse.json({ error: "게시글 비공개 처리에 실패했습니다." }, { status: 500 });
  }

  // deleted_at 기록
  const { error: markError } = await supabaseAdmin
    .from("users")
    .update({ deleted_at: new Date().toISOString() })
    .eq("auth_id", user.id);

  if (markError) {
    return NextResponse.json({ error: "계정 삭제 요청에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "인증되지 않은 요청입니다." }, { status: 401 });
  }

  const { data: userData, error: userError } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (userError || !userData) {
    return NextResponse.json({ error: "사용자 정보를 찾을 수 없습니다." }, { status: 404 });
  }

  // deleted_at 초기화 (탈퇴 철회)
  const { error: restoreError } = await supabaseAdmin
    .from("users")
    .update({ deleted_at: null })
    .eq("auth_id", user.id);

  if (restoreError) {
    return NextResponse.json({ error: "탈퇴 철회에 실패했습니다." }, { status: 500 });
  }

  // 비공개 처리된 게시글 복구
  const { error: postError } = await supabaseAdmin
    .from("posts")
    .update({ status: "active" })
    .eq("user_id", userData.id)
    .in("post_type", HIDE_POST_TYPES)
    .eq("status", "inactive");

  if (postError) {
    return NextResponse.json({ error: "게시글 복구에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
