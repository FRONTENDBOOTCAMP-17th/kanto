import { useEffect, useRef, useState } from "react";

interface SpamPreventionConfig {
  windowMs?: number;
  maxCount?: number;
  cooldownSec?: number;
}

export function useSpamPrevention(config?: SpamPreventionConfig) {
  const windowMs = config?.windowMs ?? 3000;
  const maxCount = config?.maxCount ?? 5;
  const cooldownSec = config?.cooldownSec ?? 10;

  const [isCooldown, setIsCooldown] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(cooldownSec);
  const sendTimestamps = useRef<number[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const recordSend = (): boolean => {
    const now = Date.now();
    sendTimestamps.current.push(now);
    sendTimestamps.current = sendTimestamps.current.filter(
      (t) => now - t < windowMs,
    );

    if (sendTimestamps.current.length >= maxCount) {
      setIsCooldown(true);
      setCooldownSeconds(cooldownSec);

      intervalRef.current = setInterval(() => {
        setCooldownSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
            setIsCooldown(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return true;
    }
    return false;
  };

  return { isCooldown, cooldownSeconds, recordSend };
}
