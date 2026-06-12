"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function useCurrentUserId() {
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      supabase
        .from("users")
        .select("id")
        .eq("auth_id", session.user.id)
        .single()
        .then(({ data }) => {
          if (data) setCurrentUserId(data.id);
        });
    });
  }, []);

  return currentUserId;
}
