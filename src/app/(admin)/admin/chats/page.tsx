import { getAdminChatRooms } from "@/services/admin/adminChats";
import SearchChat from "./_components/SearchChat";

export const dynamic = "force-dynamic";

export default async function AdminChatsPage() {
  const chats = await getAdminChatRooms();
  return <SearchChat chats={chats} />;
}
