import { useEffect, useState } from "react";
import type { Transaction } from "@/type/transaction";

export const PENDING_TIMEOUT_MS = 24 * 60 * 60 * 1000;

/** 거래가 pending 상태로 24시간을 넘겼는지 1분마다 갱신해 추적한다. */
export function useExpiryStatus(transaction: Transaction) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (transaction.status !== "pending") return;
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, [transaction.status]);

  const isTimedOut =
    transaction.status === "pending" &&
    now - new Date(transaction.created_at).getTime() > PENDING_TIMEOUT_MS;

  return { isTimedOut };
}
