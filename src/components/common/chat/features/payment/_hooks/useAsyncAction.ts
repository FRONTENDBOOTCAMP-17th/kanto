import { useState } from "react";

/** 비동기 액션 실행 중 로딩·에러 상태를 관리한다. */
export function useAsyncAction() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<unknown>) => {
    setIsLoading(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "처리에 실패했습니다.");
      setIsLoading(false);
    }
  };

  return { isLoading, setIsLoading, error, run };
}
