import { useEffect, useState } from "react";
import type { SpamConfig } from "@/services/admin/adminContent";

const DEFAULT: SpamConfig = {
  chat_window_sec: 3,
  chat_max_count: 5,
  chat_cooldown_sec: 10,
  post_window_sec: 60,
  post_max_count: 3,
  max_urls_per_post: 3,
  profanity_strike_max: 3,
  report_strike_max: 5,
  auto_sanction_enabled: false,
  updated_at: "",
};

export function useSpamConfig() {
  const [config, setConfig] = useState<SpamConfig>(DEFAULT);

  useEffect(() => {
    fetch("/api/admin/spam-config")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) setConfig(data);
      })
      .catch(() => {});
  }, []);

  return config;
}
