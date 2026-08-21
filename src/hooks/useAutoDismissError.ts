import { useState } from "react";

/** 에러 메시지를 보여주고 3초 뒤 자동으로 지운다. */
export function useAutoDismissError(durationMs = 3000) {
  const [error, setError] = useState("");

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(""), durationMs);
  };

  return [error, showError] as const;
}
