"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import type { ChatWithUsers } from "@/type/chat/chat";
import type { MyGroupRoom } from "@/type/groupChat";
import ChatListItem from "./ChatListItem";
import GroupChatListItem from "./GroupChatListItem";

interface Props {
  chats: ChatWithUsers[];
  groupRooms: MyGroupRoom[];
  currentUserId: number;
  onChatSelect: (id: number) => void;
  onGroupSelect: (meetupPostId: number, title: string) => void;
}

type ListEntry =
  | { kind: "direct"; time: string; chat: ChatWithUsers }
  | { kind: "group"; time: string; room: MyGroupRoom };

export default function ChatListClient({
  chats,
  groupRooms,
  currentUserId,
  onChatSelect,
  onGroupSelect,
}: Props) {
  onClose: () => void;
}

export default function ChatListClient({ chats, currentUserId, onChatSelect, onClose }: Props) {
  const t = useTranslations("Chat");
  const tc = useTranslations("Common");
  const [search, setSearch] = useState("");

  const filteredChats = chats.filter((chat) => {
    const other = chat.user_id_1 === currentUserId ? chat.user2 : chat.user1;
    return other?.name?.includes(search);
  });
  const filteredGroupRooms = groupRooms.filter((room) => room.title.includes(search));

  const entries: ListEntry[] = [
    ...filteredChats.map((chat) => ({
      kind: "direct" as const,
      time: chat.last_message_at ?? chat.created_at ?? "",
      chat,
    })),
    ...filteredGroupRooms.map((room) => ({
      kind: "group" as const,
      time: room.last_message_at ?? "",
      room,
    })),
  ].sort((a, b) => (b.time > a.time ? 1 : b.time < a.time ? -1 : 0));

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-100 shrink-0 flex items-center justify-between gap-2">
        <h2 className="text-base md:text-sm font-semibold text-gray-900">{t("title")}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={tc("close")}
          className="md:hidden p-1 -mr-1 text-gray-500 hover:text-gray-800 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="px-3 py-2 border-b border-gray-100 shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 md:w-3.5 md:h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder={t("search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 md:pl-8 pr-3 py-2 md:py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-sm md:text-xs outline-none focus:border-teal-400 focus:bg-white transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain" data-chat-scroll>
        {entries.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-xs">
            {t("empty")}
          </div>
        ) : (
          entries.map((entry, index) =>
            entry.kind === "direct" ? (
              <ChatListItem
                key={`chat-${entry.chat.id}`}
                chat={entry.chat}
                currentUserId={currentUserId}
                isLast={index === entries.length - 1}
                onClick={() => onChatSelect(entry.chat.id)}
              />
            ) : (
              <GroupChatListItem
                key={`group-${entry.room.room_id}`}
                room={entry.room}
                isLast={index === entries.length - 1}
                onClick={() => onGroupSelect(entry.room.meetup_post_id, entry.room.title)}
              />
            ),
          )
        )}
      </div>
    </div>
  );
}
