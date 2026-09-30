import type { ChatWithUsers } from "@/type/chat/chat";
import type { MyGroupRoom } from "@/type/groupChat";

export type ListEntry =
  | { kind: "direct"; time: string; chat: ChatWithUsers }
  | { kind: "group"; time: string; room: MyGroupRoom };

/** 1:1 채팅과 그룹채팅 목록을 하나로 합쳐 최신순으로 정렬한다. */
export function buildListEntries(
  chats: ChatWithUsers[],
  groupRooms: MyGroupRoom[],
): ListEntry[] {
  return [
    ...chats.map((chat) => ({
      kind: "direct" as const,
      time: chat.last_message_at ?? chat.created_at ?? "",
      chat,
    })),
    ...groupRooms.map((room) => ({
      kind: "group" as const,
      time: room.last_message_at ?? "",
      room,
    })),
  ].sort((a, b) => (b.time > a.time ? 1 : b.time < a.time ? -1 : 0));
}
