import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getChatList } from "@/services/chat/chat";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: currentUser } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!currentUser) return NextResponse.json({ error: "not found" }, { status: 404 });

  const chatList = await getChatList(currentUser.id);

  return NextResponse.json({ chatList, currentUserId: currentUser.id });
}
