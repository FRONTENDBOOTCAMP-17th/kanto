import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getChatDetail } from "@/services/chat/chat";
import { getMessageList } from "@/services/chat/message";
import ChatRoomClient from "./_components/ChatRoomClient";

export default async function ChatRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: currentUser } = await supabase
    .from("users")
    .select("id, name, avatar_url, created_at")
    .eq("auth_id", user.id)
    .single();

  if (!currentUser) redirect("/login");

  const chatId = Number(id);
  const [chatRoom, messages] = await Promise.all([
    getChatDetail(chatId, supabase),
    getMessageList(chatId, supabase),
  ]);

  const partner =
    chatRoom.user_id_1 === currentUser.id ? chatRoom.user2 : chatRoom.user1;

  return (
    <ChatRoomClient
      initialMessages={messages}
      currentUser={currentUser}
      chatId={chatId}
      postId={chatRoom.post_id}
      partner={partner}
      postTitle={chatRoom.posts?.title ?? ""}
    />
  );
}
