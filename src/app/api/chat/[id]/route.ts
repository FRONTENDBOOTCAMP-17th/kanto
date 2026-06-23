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
  const [{ data: chat, error }, messages] = await Promise.all([
    supabase
      .from("chats")
      .select(`
        *,
        user1:users!chats_user_id_1_fkey(id, name, avatar_url, created_at),
        user2:users!chats_user_id_2_fkey(id, name, avatar_url, created_at),
        posts(title, post_type, user_id, is_reserved, used_goods(price), rentals(price))
      `)
      .eq("id", chatId)
      .single(),
    getMessageList(chatId, supabase),
  ]);

  if (error || !chat)
    return NextResponse.json({ error: "not found" }, { status: 404 });

  const partner =
    chat.user_id_1 === currentUser.id ? chat.user2 : chat.user1;

  const posts = chat.posts as {
    title: string;
    post_type: string;
    user_id: number;
    is_reserved: boolean;
    used_goods: { price: number }[];
    rentals: { price: number | null }[];
  } | null;

  const postPrice =
    posts?.post_type === "used_goods"
      ? (posts.used_goods[0]?.price ?? null)
      : posts?.post_type === "rentals"
        ? (posts.rentals[0]?.price ?? null)
        : null;

  return NextResponse.json({
    messages,
    currentUser,
    chatId,
    postId: chat.post_id,
    partner,
    postTitle: posts?.title ?? "",
    postType: posts?.post_type ?? "",
    sellerId: posts?.user_id ?? null,
    postPrice,
    isReserved: posts?.is_reserved ?? false,
  });
}
