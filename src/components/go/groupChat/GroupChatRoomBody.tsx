"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, Users } from "lucide-react";
import {
  getRoomByMeetup,
  getRoomMessages,
  postGroupMessage,
  markRoomRead,
  getRoomLastReadAt,
  getRoomMembers,
  getRoomBlockedIds,
  blockMemberInRoom,
  unblockMemberInRoom,
} from "@/services/go/groupChat";
import {
  blockMemberAction,
  unblockMemberAction,
} from "@/components/go/groupChat/blockMemberAction";
import { useGroupChatRealtime } from "@/hooks/go/useGroupChatRealtime";
import { useSpamPrevention } from "@/hooks/chat/useSpamPrevention";
import { useSpamConfig } from "@/hooks/useSpamConfig";
import ReportModal, {
  USER_REPORT_CATEGORIES,
} from "@/components/common/ReportModal";
import { useChatStore } from "@/store/chatStore";
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
  const [reportTarget, setReportTarget] = useState<{
    id: number;
    type: "message" | "user";
  } | null>(null);
  const [blockTarget, setBlockTarget] = useState<number | null>(null);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const initialScrollDoneRef = useRef(false);
  const initialUnreadMessageIdRef = useRef<number | null>(null);
  const wasNearBottomRef = useRef(true);
  const pendingSmoothScrollRef = useRef(false);

  const t = useTranslations("Go");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const spamConfig = useSpamConfig();
  const { isCooldown, cooldownSeconds, recordSend } = useSpamPrevention({
    windowMs: spamConfig.chat_window_sec * 1000,
    maxCount: spamConfig.chat_max_count,
    cooldownSec: spamConfig.chat_cooldown_sec,
  });
  const refreshGroupRoomsList = useChatStore((s) => s.refreshGroupRoomsList);

  const markCurrentRoomRead = useCallback(async () => {
    if (roomId === null) return;
    await markRoomRead(roomId);
    refreshGroupRoomsList();
  }, [refreshGroupRoomsList, roomId]);

  const handleBack = async () => {
    await markCurrentRoomRead();
    onBack();
  };

  useEffect(() => {
    let active = true;
    Promise.all([getRoomByMeetup(meetupPostId), getRoomMembers(meetupPostId)])
      .then(async ([room, memberList]) => {
        if (!active) return;
        setMembers(memberList);
        setRoomId(room?.id ?? null);
        if (room) {
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
          initialUnreadMessageIdRef.current = firstUnread?.id ?? null;
          setBlockedIds(blocked);
          setMessages(msgs);
          setHasMore(msgs.length === 50);
          await markRoomRead(room.id);
          refreshGroupRoomsList();
        }
        setLoaded(true);
      })
      .catch(() => {
        if (!active) return;
        setMembers([]);
        setRoomId(null);
        setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [meetupPostId, currentUser.id, refreshGroupRoomsList]);

  useLayoutEffect(() => {
    if (!loaded || roomId === null) return;
    const el = scrollContainerRef.current;

    const scrollToLatest = (behavior: ScrollBehavior = "instant") => {
      if (behavior === "smooth") {
        messagesEndRef.current?.scrollIntoView({ block: "end", behavior });
        return;
      }
      if (el) el.scrollTop = el.scrollHeight;
      messagesEndRef.current?.scrollIntoView({ block: "end" });
    };

    const scrollToInitialPosition = () => {
      const unreadId = initialUnreadMessageIdRef.current;
      const target =
        unreadId == null
          ? null
          : scrollContainerRef.current?.querySelector<HTMLElement>(
              `[data-group-message-id="${unreadId}"]`,
            );
      if (target) {
        target.scrollIntoView({ block: "start" });
        wasNearBottomRef.current = false;
        return;
      }
      scrollToLatest();
    };

    const scroll = () => {
      if (!initialScrollDoneRef.current) {
        scrollToInitialPosition();
        initialScrollDoneRef.current = true;
        return true;
      }
      if (wasNearBottomRef.current) {
        const shouldSmooth = pendingSmoothScrollRef.current;
        pendingSmoothScrollRef.current = false;
        scrollToLatest(shouldSmooth ? "smooth" : "instant");
        return !shouldSmooth;
      }
      return true;
    };

    const shouldRunFollowUpScroll = scroll();
    if (!shouldRunFollowUpScroll) return;
    const frame = window.requestAnimationFrame(scroll);
    return () => window.cancelAnimationFrame(frame);
  }, [loaded, messages.length, roomId]);

  useGroupChatRealtime({
    roomId,
    currentUser,
    blockedIds,
    setMessages,
    onMessageInserted: () => {
      if (wasNearBottomRef.current) {
        markCurrentRoomRead();
      } else {
        setShowJumpToLatest(true);
      }
    },
  });

  const jumpToLatest = async () => {
    messagesEndRef.current?.scrollIntoView({
      block: "end",
      behavior: "smooth",
    });
    wasNearBottomRef.current = true;
    setShowJumpToLatest(false);
    await markCurrentRoomRead();
  };

  const scrollToLatestNow = () => {
    pendingSmoothScrollRef.current = true;
    wasNearBottomRef.current = true;
    setShowJumpToLatest(false);
  };

  const visibleMessages = messages.filter(
    (m) => m.type === "system" || !blockedIds.has(m.sender_id),
  );

  const handleLoadMore = async () => {
    if (!hasMore || isLoadingMore || roomId === null || messages.length === 0)
      return;
    const scrollEl = scrollContainerRef.current;
    const prevScrollHeight = scrollEl?.scrollHeight ?? 0;
    const prevScrollTop = scrollEl?.scrollTop ?? 0;
    setIsLoadingMore(true);
    try {
      const oldest = messages[0].created_at;
      const older = await getRoomMessages(roomId, oldest);
      wasNearBottomRef.current = false;
      setMessages((prev) => [...older, ...prev]);
      setHasMore(older.length === 50);
      window.requestAnimationFrame(() => {
        if (!scrollEl) return;
        scrollEl.scrollTop =
          prevScrollTop + (scrollEl.scrollHeight - prevScrollHeight);
      });
    } catch {
      setSendError(t("chat.sendFailed"));
      setTimeout(() => setSendError(""), 3000);
    } finally {
      setIsLoadingMore(false);
    }
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
    scrollToLatestNow();

    try {
      const saved = await postGroupMessage(roomId, content);
      setMessages((prev) =>
        prev.map((m) =>
          m.tempId === tempId ? { ...saved, tempId: undefined } : m,
        ),
      );
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.tempId !== tempId));
      setSendError(e instanceof Error ? e.message : t("chat.sendFailed"));
      setTimeout(() => setSendError(""), 3000);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  };

  // 멤버 신고 — 탈퇴 회원이면 신고 대신 안내 토스트
  const handleReportUser = (userId: number) => {
    const member = members.find((m) => m.user_id === userId);
    if (member?.is_deleted) {
      showToast(t("toast.withdrawn"));
      return;
    }
    setReportTarget({ id: userId, type: "user" });
  };

  const handleBlockUser = (userId: number) => {
    setBlockTarget(userId);
  };

  const confirmBlock = async (mode: "room" | "global") => {
    if (blockTarget === null || roomId === null) return;
    const userId = blockTarget;
    setBlockTarget(null);
    try {
      if (mode === "room") {
        await blockMemberInRoom(roomId, userId);
        showToast(t("chat.blockedRoom"));
      } else {
        await blockMemberAction(userId);
        showToast(t("chat.blockedGlobal"));
      }
      setBlockedIds((prev) => new Set(prev).add(userId));
    } catch {
      showToast(t("toast.error"));
    }
  };

  const handleUnblockUser = async (userId: number) => {
    if (roomId === null) return;
    try {
      await Promise.all([
        unblockMemberInRoom(roomId, userId),
        unblockMemberAction(userId),
      ]);
      setBlockedIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      showToast(t("chat.unblocked"));
    } catch {
      showToast(t("toast.error"));
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            onClick={handleBack}
            aria-label={t("chat.back")}
            className="text-gray-400 hover:text-gray-600 shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-gray-900 truncate">
              {meetupTitle}
            </h2>
            <span className="text-xs text-gray-400">{t("chat.title")}</span>
          </div>
        </div>
        <button
          onClick={() => setShowMemberList(true)}
          aria-label={t("chat.membersAria")}
          className="flex h-8 w-8 items-center justify-center rounded-[9px] text-gray-500 hover:bg-gray-100 shrink-0"
        >
          <Users className="h-4 w-4" strokeWidth={2.2} />
        </button>
      </div>

      {!loaded ? (
        <div
          className="flex-1 min-h-0 overflow-hidden px-4 py-4 flex flex-col gap-3"
          aria-hidden="true"
        >
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className={`flex flex-col gap-1 ${i % 3 === 0 ? "items-end" : "items-start"}`}
            >
              {i % 3 !== 0 && (
                <div className="ml-1 h-2.5 w-16 rounded bg-gray-100 animate-pulse" />
              )}
              <div
                className={`h-9 rounded-2xl bg-gray-100 animate-pulse ${
                  i % 3 === 0 ? "w-32 rounded-tr-sm" : "w-44 rounded-tl-sm"
                }`}
              />
            </div>
          ))}
        </div>
      ) : roomId === null ? (
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400 px-6 text-center">
          {t("chat.notFound")}
        </div>
      ) : (
        <div className="relative flex min-h-0 flex-1 flex-col">
          <GroupMessageList
            messages={visibleMessages}
            currentUser={currentUser}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={handleLoadMore}
            onNearBottomChange={(nearBottom) => {
              const wasNearBottom = wasNearBottomRef.current;
              wasNearBottomRef.current = nearBottom;
              if (nearBottom && !wasNearBottom) {
                setShowJumpToLatest(false);
                markCurrentRoomRead();
              }
            }}
            messagesEndRef={messagesEndRef}
            scrollContainerRef={scrollContainerRef}
          />
          {showJumpToLatest && (
            <button
              type="button"
              onClick={jumpToLatest}
              className="absolute bottom-16.5 left-1/2 z-10 -translate-x-1/2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 shadow-md hover:bg-teal-100"
            >
              {t("chat.jumpToLatest")}
            </button>
          )}
          <GroupChatInput
            input={input}
            onChange={setInput}
            onSend={handleSend}
            isCooldown={isCooldown}
            cooldownSeconds={cooldownSeconds}
          />
        </div>
      )}

      {showMemberList && (
        <GroupMemberList
          members={members}
          currentUserId={currentUser.id}
          blockedIds={blockedIds}
          onClose={() => setShowMemberList(false)}
          onReportUser={handleReportUser}
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
            <p className="text-base font-semibold text-gray-800">
              {t("chat.blockHow")}
            </p>
            <p className="text-xs text-gray-400 leading-relaxed">
              {t("chat.blockDescRoom")}
              <br />
              {t("chat.blockDescGlobal")}
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => confirmBlock("room")}
                className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {t("chat.blockRoomOnly")}
              </button>
              <button
                onClick={() => confirmBlock("global")}
                className="w-full rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors"
              >
                {t("chat.blockGlobal")}
              </button>
              <button
                onClick={() => setBlockTarget(null)}
                className="w-full rounded-xl py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
              >
                {t("chat.cancel")}
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
        onToast={(msg) => showToast(msg)}
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
