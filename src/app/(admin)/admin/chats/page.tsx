import { getAdminChatRooms } from "@/services/admin/adminChats";
import SearchChat from "./_components/SearchChat";

export const dynamic = "force-dynamic";

export default async function AdminChatsPage() {
  const chats = await getAdminChatRooms();

  return (
    <div>
      <h1 className="text-4xl font-bold">채팅 기록</h1>
      <p className="my-4">총 {chats.length}개의 채팅방이 있습니다.</p>
      <SearchChat chats={chats} />
    </div>
  );
}
