"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { getActiveMeetups } from "@/services/go/go";
import type { Meetup } from "@/type/go";
import type { MeetupTopicKey } from "@/constants/meetupTopics";

interface UseLiveMeetupsOptions {
  topicFilter?: MeetupTopicKey | "all";
  initialData?: Meetup[];
}

export function useLiveMeetups({ topicFilter, initialData }: UseLiveMeetupsOptions = {}) {
  const [meetups, setMeetups] = useState<Meetup[]>(initialData ?? []);
  const [loading, setLoading] = useState(initialData === undefined);
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

  
  useEffect(() => {
    const id = setTimeout(load, 0);
    return () => clearTimeout(id);
  }, [load]);

  
  
  
  
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

  
  const filtered =
    !topicFilter || topicFilter === "all"
      ? meetups
      : meetups.filter((m) => m.topic === topicFilter);

  return { meetups: filtered, allMeetups: meetups, loading, error, refetch: load };
}
