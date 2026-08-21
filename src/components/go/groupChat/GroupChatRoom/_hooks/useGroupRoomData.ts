import { useEffect, useState } from "react";
import {
  getRoomByMeetup,
  getRoomMembers,
  getRoomBlockedIds,
  getRoomMessages,
  getRoomLastReadAt,
  markRoomRead,
} from "@/services/go/groupChat";
import { useChatStore } from "@/store/chatStore";
import type { GroupMessageWithSender } from "@/type/groupChat";
import type { MeetupParticipant } from "@/type/go";
import type { SellerInfo } from "@/type/user";

interface GroupRoomData {
  loaded: boolean;
  roomId: number | null;
  members: MeetupParticipant[];
  blockedIds: Set<number>;
  initialMessages: GroupMessageWithSender[];
  initialHasMore: boolean;
  initialUnreadMessageId: number | null;
}

const EMPTY: Omit<GroupRoomData, "loaded"> = {
  roomId: null,
  members: [],
  blockedIds: new Set(),
  initialMessages: [],
  initialHasMore: false,
  initialUnreadMessageId: null,
};

/** 모임 채팅방·멤버·초기 메시지·차단목록을 불러오고, 로드에 성공하면 읽음 처리한다. */
export function useGroupRoomData(meetupPostId: number, currentUser: SellerInfo): GroupRoomData {
  const [state, setState] = useState<GroupRoomData>({ loaded: false, ...EMPTY });
  const refreshGroupRoomsList = useChatStore((s) => s.refreshGroupRoomsList);

  useEffect(() => {
    let active = true;
    Promise.all([getRoomByMeetup(meetupPostId), getRoomMembers(meetupPostId)])
      .then(async ([room, memberList]) => {
        if (!active) return;
        if (!room) {
          setState({ loaded: true, ...EMPTY, members: memberList });
          return;
        }
        const [blocked, msgs, lastReadAt] = await Promise.all([
          getRoomBlockedIds(room.id, currentUser.id),
          getRoomMessages(room.id),
          getRoomLastReadAt(room.id),
        ]);
        if (!active) return;
        const firstUnread = msgs.find(
          (m) =>
            m.sender_id !== currentUser.id &&
            (!lastReadAt || m.created_at > lastReadAt),
        );
        setState({
          loaded: true,
          roomId: room.id,
          members: memberList,
          blockedIds: blocked,
          initialMessages: msgs,
          initialHasMore: msgs.length === 50,
          initialUnreadMessageId: firstUnread?.id ?? null,
        });
        await markRoomRead(room.id);
        refreshGroupRoomsList();
      })
      .catch(() => {
        if (!active) return;
        setState({ loaded: true, ...EMPTY });
      });
    return () => {
      active = false;
    };
  }, [meetupPostId, currentUser.id, refreshGroupRoomsList]);

  return state;
}
