import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const postId = Number(id);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  
  const { data: publicUser } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!publicUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  
  const { data: post, error: postFetchError } = await supabaseAdmin
    .from("posts")
    .select("user_id, post_type")
    .eq("id", postId)
    .single();

  if (postFetchError || !post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (post.user_id !== publicUser.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from("posts")
    .update({ status: "deleted", deleted_at: new Date().toISOString() })
    .eq("id", postId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
