"use client";

// 지도에 표시할 진행 중 모임 목록 — Supabase Realtime 구독

import { useEffect, useState, useCallback, useRef } from "react";
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
  const inFlightRef = useRef(false);
  const queuedRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    if (inFlightRef.current) {
      queuedRef.current = true;
      return;
    }
    inFlightRef.current = true;
    do {
      try {
        queuedRef.current = false;
        const data = await getActiveMeetups();
        setMeetups(data);
        setError(null);
      } catch (e) {
        setError(e as Error);
      }
    } while (queuedRef.current);
    inFlightRef.current = false;
    setLoading(false);
  }, []);

  const scheduleLoad = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(load, 180);
  }, [load]);

  // 초기 로드
  useEffect(() => {
    const id = setTimeout(load, 0);
    return () => clearTimeout(id);
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
        scheduleLoad,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "meetup_participants" },
        scheduleLoad,
      )
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [scheduleLoad]);

  // 클라이언트 사이드 필터
  const filtered =
    !topicFilter || topicFilter === "all"
      ? meetups
      : meetups.filter((m) => m.topic === topicFilter);

  return { meetups: filtered, allMeetups: meetups, loading, error, refetch: load };
}
