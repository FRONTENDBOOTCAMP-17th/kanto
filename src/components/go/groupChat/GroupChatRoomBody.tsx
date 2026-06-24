"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Users } from "lucide-react";
import {
  getRoomByMeetup,
  getRoomMessages,
  postGroupMessage,
  markRoomRead,
  getRoomMembers,
  getRoomBlockedIds,
  blockMemberInRoom,
  unblockMemberInRoom,
} from "@/services/go/groupChat";
import { blockMemberAction, unblockMemberAction } from "@/components/go/groupChat/blockMemberAction";
import { useGroupChatRealtime } from "@/hooks/go/useGroupChatRealtime";
import { useSpamPrevention } from "@/hooks/chat/useSpamPrevention";
import ReportModal, { USER_REPORT_CATEGORIES } from "@/components/common/ReportModal";
import GroupMessageList from "./GroupMessageList";
import GroupChatInput from "./GroupChatInput";
import GroupMemberList from "./GroupMemberList";
import type { GroupMessageWithSender } from "@/type/groupChat";
import type { MeetupParticipant } from "@/type/go";
import type { SellerInfo } from "@/type/user";

interface Props {
  meetupPostId: number;
  meetupTitle: string;
  currentUser: SellerInfo;
  onBack: () => void;
}

export default function GroupChatRoomBody({
  meetupPostId,
  meetupTitle,
  currentUser,
  onBack,
}: Props) {
  const [roomId, setRoomId] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [messages, setMessages] = useState<GroupMessageWithSender[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [members, setMembers] = useState<MeetupParticipant[]>([]);
  const [blockedIds, setBlockedIds] = useState<Set<number>>(new Set());
  const [showMemberList, setShowMemberList] = useState(false);
  const [input, setInput] = useState("");
  const [sendError, setSendError] = useState("");
  const [toast, setToast] = useState("");
  const [reportTarget, setReportTarget] = useState<{ id: number; type: "message" | "user" } | null>(null);
  const [blockTarget, setBlockTarget] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { isCooldown, cooldownSeconds, recordSend } = useSpamPrevention();

  useEffect(() => {
    let active = true;
    setLoaded(false);
    Promise.all([getRoomByMeetup(meetupPostId), getRoomMembers(meetupPostId)]).then(
      async ([room, memberList]) => {
        if (!active) return;
        setMembers(memberList);
        setRoomId(room?.id ?? null);
        if (room) {
          const [blocked, msgs] = await Promise.all([
            getRoomBlockedIds(room.id, currentUser.id),
            getRoomMessages(room.id),
          ]);
          if (!active) return;
          setBlockedIds(blocked);
          setMessages(msgs);
          setHasMore(msgs.length === 50);
          markRoomRead(room.id);
        }
        setLoaded(true);
      },
    );
    return () => {
      active = false;
    };
  }, [meetupPostId, currentUser.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
  }, [messages.length]);

  useGroupChatRealtime({ roomId, currentUser, blockedIds, setMessages });

  const visibleMessages = messages.filter(
    (m) => m.type === "system" || !blockedIds.has(m.sender_id),
  );

  const handleLoadMore = async () => {
    if (!hasMore || isLoadingMore || roomId === null || messages.length === 0) return;
    setIsLoadingMore(true);
    const oldest = messages[0].created_at;
    const older = await getRoomMessages(roomId, oldest);
    setMessages((prev) => [...older, ...prev]);
    setHasMore(older.length === 50);
    setIsLoadingMore(false);
  };

  const handleSend = async () => {
    if (!input.trim() || roomId === null) return;
    if (recordSend()) {
      setInput("");
      return;
    }
    const content = input.trim();
    setInput("");

    const tempId = Date.now();
    const optimistic: GroupMessageWithSender = {
      id: tempId,
      room_id: roomId,
      sender_id: currentUser.id,
      content,
      type: "text",
      created_at: new Date().toISOString(),
      sender: currentUser,
      tempId,
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const saved = await postGroupMessage(roomId, content);
      setMessages((prev) =>
        prev.map((m) => (m.tempId === tempId ? { ...saved, tempId: undefined } : m)),
      );
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.tempId !== tempId));
      setSendError(e instanceof Error ? e.message : "메시지를 보낼 수 없습니다.");
      setTimeout(() => setSendError(""), 3000);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  };

  const handleBlockUser = (userId: number) => {
    setBlockTarget(userId);
  };

  const confirmBlock = async (mode: "room" | "global") => {
    if (blockTarget === null || roomId === null) return;
    const userId = blockTarget;
    setBlockTarget(null);
    if (mode === "room") {
      await blockMemberInRoom(roomId, userId);
      showToast("이 채팅에서 차단했습니다");
    } else {
      await blockMemberAction(userId);
      showToast("사용자를 차단했습니다");
    }
    setBlockedIds((prev) => new Set(prev).add(userId));
  };

  const handleUnblockUser = async (userId: number) => {
    if (roomId === null) return;
    await Promise.all([unblockMemberInRoom(roomId, userId), unblockMemberAction(userId)]);
    setBlockedIds((prev) => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });
    showToast("차단을 해제했습니다");
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            onClick={onBack}
            aria-label="목록으로"
            className="text-gray-400 hover:text-gray-600 shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-gray-900 truncate">{meetupTitle}</h2>
            <span className="text-xs text-gray-400">모임 채팅</span>
          </div>
        </div>
        <button
          onClick={() => setShowMemberList(true)}
          aria-label="참여자 목록"
          className="flex h-8 w-8 items-center justify-center rounded-[9px] text-gray-500 hover:bg-gray-100 shrink-0"
        >
          <Users className="h-4 w-4" strokeWidth={2.2} />
        </button>
      </div>

      {!loaded ? (
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
          불러오는 중...
        </div>
      ) : roomId === null ? (
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400 px-6 text-center">
          채팅방을 찾을 수 없습니다. 모임 참여 상태를 확인해주세요.
        </div>
      ) : (
        <>
          <GroupMessageList
            messages={visibleMessages}
            currentUser={currentUser}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={handleLoadMore}
            messagesEndRef={messagesEndRef}
            scrollContainerRef={scrollContainerRef}
            onReport={(msg) => setReportTarget({ id: msg.id, type: "message" })}
            onBlockUser={handleBlockUser}
          />
          <GroupChatInput
            input={input}
            onChange={setInput}
            onSend={handleSend}
            isCooldown={isCooldown}
            cooldownSeconds={cooldownSeconds}
          />
        </>
      )}

      {showMemberList && (
        <GroupMemberList
          members={members}
          currentUserId={currentUser.id}
          blockedIds={blockedIds}
          onClose={() => setShowMemberList(false)}
          onReportUser={(userId) => setReportTarget({ id: userId, type: "user" })}
          onBlockUser={handleBlockUser}
          onUnblockUser={handleUnblockUser}
        />
      )}

      {blockTarget !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setBlockTarget(null)}
        >
          <div
            className="w-full max-w-sm mx-4 bg-white rounded-2xl shadow-xl p-6 flex flex-col gap-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-base font-semibold text-gray-800">어떻게 차단할까요?</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              이 채팅에서만 차단하면 다른 모임 채팅에서는 계속 보입니다.
              <br />
              완전히 차단하면 모든 채팅·서비스에서 이 사용자를 볼 수 없고, 프로필 &gt; 차단한 사용자 목록에 추가됩니다.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => confirmBlock("room")}
                className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                이 채팅에서만 차단
              </button>
              <button
                onClick={() => confirmBlock("global")}
                className="w-full rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors"
              >
                완전히 차단
              </button>
              <button
                onClick={() => setBlockTarget(null)}
                className="w-full rounded-xl py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      <ReportModal
        isOpen={reportTarget !== null}
        onClose={() => setReportTarget(null)}
        postId={reportTarget?.id ?? 0}
        userId={currentUser.id}
        initialReported={false}
        categories={USER_REPORT_CATEGORIES}
        targetType={reportTarget?.type ?? "user"}
      />

      {sendError && (
        <div className="fixed bottom-7 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-xl bg-gray-900 px-5 py-3.5 text-[13.5px] font-semibold text-white shadow-2xl">
          {sendError}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-7 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-xl bg-gray-900 px-5 py-3.5 text-[13.5px] font-semibold text-white shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}
