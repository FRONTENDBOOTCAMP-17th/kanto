import {
  useLayoutEffect,
  useRef,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";

interface Params {
  roomId: number;
  messagesLength: number;
  initialUnreadMessageId: number | null;
  markCurrentRoomRead: () => Promise<void>;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  wasNearBottomRef: RefObject<boolean>;
  setShowJumpToLatest: Dispatch<SetStateAction<boolean>>;
}

/** 초기 진입 시 안읽은 메시지 위치로 스크롤하고, 이후엔 최하단 근접 여부에 따라 자동 스크롤과 "최신으로 점프" 버튼을 관리한다. */
export function useGroupScrollAnchor({
  roomId,
  messagesLength,
  initialUnreadMessageId,
  markCurrentRoomRead,
  messagesEndRef,
  scrollContainerRef,
  wasNearBottomRef,
  setShowJumpToLatest,
}: Params) {
  const initialScrollDoneRef = useRef(false);
  const pendingSmoothScrollRef = useRef(false);

  useLayoutEffect(() => {
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
      const unreadId = initialUnreadMessageId;
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
  }, [
    messagesLength,
    roomId,
    initialUnreadMessageId,
    messagesEndRef,
    scrollContainerRef,
    wasNearBottomRef,
  ]);

  const jumpToLatest = async () => {
    messagesEndRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
    wasNearBottomRef.current = true;
    setShowJumpToLatest(false);
    await markCurrentRoomRead();
  };

  const notifyMessageSent = () => {
    pendingSmoothScrollRef.current = true;
    wasNearBottomRef.current = true;
    setShowJumpToLatest(false);
  };

  const handleNearBottomChange = (nearBottom: boolean) => {
    const wasNearBottom = wasNearBottomRef.current;
    wasNearBottomRef.current = nearBottom;
    if (nearBottom && !wasNearBottom) {
      setShowJumpToLatest(false);
      markCurrentRoomRead();
    }
  };

  return { jumpToLatest, notifyMessageSent, handleNearBottomChange };
}
