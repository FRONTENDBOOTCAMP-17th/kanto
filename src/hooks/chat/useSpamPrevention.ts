

import { useEffect, useRef, useState } from "react";

export function useSpamPrevention() {
  const [isCooldown, setIsCooldown] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(10);
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
      (t) => now - t < 3000,
    );

    if (sendTimestamps.current.length >= 5) {
      setIsCooldown(true);
      setCooldownSeconds(10);

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
