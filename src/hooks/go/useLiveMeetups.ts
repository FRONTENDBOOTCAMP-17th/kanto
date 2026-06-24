"use client";

// 지도에 표시할 진행 중 모임 목록 — Supabase Realtime 구독

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { getActiveMeetups } from "@/services/go/go";
import type { Meetup } from "@/type/go";
import type { MeetupTopicKey } from "@/constants/meetupTopics";

interface UseLiveMeetupsOptions {
  /** 주제 필터. undefined 또는 "all" 이면 전체 */
  topicFilter?: MeetupTopicKey | "all";
}

export function useLiveMeetups({ topicFilter }: UseLiveMeetupsOptions = {}) {
  const [meetups, setMeetups] = useState<Meetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getActiveMeetups();
      setMeetups(data);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 초기 로드
  useEffect(() => {
    load();
  }, [load]);

  // Realtime 구독 — meetups / meetup_participants 변경 시 재조회
  // 주의: posts 테이블은 supabase_realtime publication에 없음 — 구독하면 채널 전체가 깨짐.
  // 종료(posts.status 변경) 시에는 hostEndMeetup/adminForceEndMeetup이 meetups 행도
  // 함께 touch하여 이 구독으로 갱신을 트리거함.
  useEffect(() => {
    const channel = supabase
      .channel("live-meetups")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "meetups" },
        load,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "meetup_participants" },
        load,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  // 클라이언트 사이드 필터
  const filtered =
    !topicFilter || topicFilter === "all"
      ? meetups
      : meetups.filter((m) => m.topic === topicFilter);

  return { meetups: filtered, allMeetups: meetups, loading, error, refetch: load };
}
