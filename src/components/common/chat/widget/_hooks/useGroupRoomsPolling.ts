import { useCallback, useEffect, useRef, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { useGroupRoomsRealtime } from "@/hooks/go/useGroupRoomsRealtime";
import { getMyRooms } from "@/services/go/groupChat";
import type { MyGroupRoom } from "@/type/groupChat";

export function useGroupRoomsPolling(isLoggedIn: boolean) {
  const isOpen = useChatStore((s) => s.isOpen);
  const view = useChatStore((s) => s.view);
  const groupRoomsVersion = useChatStore((s) => s.groupRoomsVersion);
  const [groupRooms, setGroupRooms] = useState<MyGroupRoom[]>([]);

  const refreshGroupRooms = useCallback(() => {
    getMyRooms()
      .then(setGroupRooms)
      .catch(() => {});
  }, []);

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedRefreshGroupRooms = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(refreshGroupRooms, 400);
  }, [refreshGroupRooms]);
  useEffect(
    () => () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!isLoggedIn) return;
    refreshGroupRooms();
  }, [isLoggedIn, groupRoomsVersion, refreshGroupRooms]);

  useEffect(() => {
    if (!isLoggedIn || !isOpen || view !== "list") return;
    refreshGroupRooms();
  }, [isLoggedIn, isOpen, refreshGroupRooms, view]);

  useEffect(() => {
    if (!isLoggedIn || !isOpen || view !== "list") return;
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") refreshGroupRooms();
    };
    const id = window.setInterval(refreshIfVisible, 10000);
    document.addEventListener("visibilitychange", refreshIfVisible);
    window.addEventListener("focus", refreshGroupRooms);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", refreshIfVisible);
      window.removeEventListener("focus", refreshGroupRooms);
    };
  }, [isLoggedIn, isOpen, refreshGroupRooms, view]);

  useGroupRoomsRealtime(isLoggedIn, debouncedRefreshGroupRooms);

  return { groupRooms, refreshGroupRooms };
}
