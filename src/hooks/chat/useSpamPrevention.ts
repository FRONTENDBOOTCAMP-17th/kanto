/** 도배 방지 훅 */

import { useRef, useState } from "react";

export function useSpamPrevention() {
  const [isCooldown, setIsCooldown] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(10);
  const sendTimestamps = useRef<number[]>([]);

  const recordSend = (): boolean => {
    const now = Date.now();
    sendTimestamps.current.push(now);
    sendTimestamps.current = sendTimestamps.current.filter(
      (t) => now - t < 1500,
    );

    if (sendTimestamps.current.length >= 5) {
      setIsCooldown(true);
      setCooldownSeconds(10);

      const interval = setInterval(() => {
        setCooldownSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
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
