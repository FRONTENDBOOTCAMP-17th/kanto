import { getChatDetail } from "@/services/chat/chat";
import { getMessageList } from "@/services/chat/message";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: currentUser } = await supabase
    .from("users")
    .select("id, name, avatar_url, created_at")
    .eq("auth_id", user.id)
    .single();

  if (!currentUser)
    return NextResponse.json({ error: "not found" }, { status: 404 });

  const chatId = Number(id);
  const [chatRoom, messages] = await Promise.all([
    getChatDetail(chatId, supabase),
    getMessageList(chatId, supabase),
  ]);

  const partner =
    chatRoom.user_id_1 === currentUser.id ? chatRoom.user2 : chatRoom.user1;

  return NextResponse.json({
    messages,
    currentUser,
    chatId,
    postId: chatRoom.post_id,
    partner,
    postTitle: chatRoom.posts?.title ?? "",
  });
}
