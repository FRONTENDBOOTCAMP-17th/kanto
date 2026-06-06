import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getChatList } from "@/services/chat/chat";
import ChatListClient from "./_components/ChatListClient";

export default async function ChatListPage() {
  const supabase = await createSupabaseServerClient();

  // 1. 로그인 유저 확인 (getUser는 서버에서 토큰 유효성까지 검증)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2. auth_id(uuid)로 users 테이블에서 int8 id 조회
  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!userData) redirect("/login");

  // 3. 채팅 목록 조회
  const chatList = await getChatList(userData.id);

  return <ChatListClient initialData={chatList} currentUserId={userData.id} />;
}
