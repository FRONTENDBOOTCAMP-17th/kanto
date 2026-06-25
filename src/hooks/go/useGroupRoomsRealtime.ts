import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

// 내가 속한 모든 모임 채팅방의 새 메시지를 전역 구독한다.
// 방을 열지 않아도(목록/닫힘 상태) unread·마지막 메시지·종료 제거가 실시간 갱신되도록,
// 이벤트 수신 시 onChange로 "내 모임 채팅" 목록을 재조회한다.
// RLS가 멤버인 방의 이벤트만 전달하므로 별도 필터는 두지 않는다.
// 주의: publication 적용 전 테이블을 같은 채널에 추가하면 채널 전체가 깨질 수 있어
// meetup_chat_messages만 구독하고, 방 삭제 반영은 종료 직전 system 메시지 + 목록 폴링으로 보완한다.
export function useGroupRoomsRealtime(enabled: boolean, onChange: () => void) {
  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel("my-group-rooms")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "meetup_chat_messages" },
        () => onChange(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, onChange]);
}
