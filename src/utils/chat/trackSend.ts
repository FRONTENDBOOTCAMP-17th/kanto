/** 전송이 느리다고 보고 "전송 중"을 표시하는 시간. 느린 네트워크 대응 (Nielsen: 1초) */
export const SEND_SLOW_MS = 1000;
/** 응답이 없을 때 실패 여부를 판단하는 시간. 사용자가 기다리다 이탈하는 한계 (Nielsen: 10초) */
export const SEND_TIMEOUT_MS = 10000;

interface Params<T> {
  send: () => Promise<T>;
  /** 서버에 이미 저장됐는지 확인한다. 저장돼 있으면 그 메시지를 반환한다. */
  findSaved: () => Promise<T | null>;
  onSlow: () => void;
  onSaved: (saved: T) => void;
  /** error가 없으면 타임아웃, 있으면 요청 자체가 실패한 경우다. */
  onFailed: (error?: unknown) => void;
  /** 재전송처럼 이미 저장됐을 가능성이 있을 때 보내기 전에 먼저 확인한다. */
  checkFirst?: boolean;
}

/**
 * 메시지 전송을 추적한다.
 * - 1초가 넘으면 onSlow
 * - 요청이 실패하거나 10초 안에 응답이 없으면 서버 저장 여부를 확인한 뒤 onSaved 또는 onFailed
 * - 실패 처리 이후에 응답이 뒤늦게 도착해도 onSaved로 정정한다.
 */
export async function trackSend<T>({
  send,
  findSaved,
  onSlow,
  onSaved,
  onFailed,
  checkFirst = false,
}: Params<T>) {
  if (checkFirst) {
    const found = await findSaved().catch(() => null);
    if (found) {
      onSaved(found);
      return;
    }
  }

  let saved = false;
  const timers: ReturnType<typeof setTimeout>[] = [];
  const clearTimers = () => timers.forEach(clearTimeout);

  const markSaved = (value: T) => {
    if (saved) return;
    saved = true;
    clearTimers();
    onSaved(value);
  };

  const confirmOrFail = async (error?: unknown) => {
    const found = await findSaved().catch(() => null);
    if (found) markSaved(found);
    else if (!saved) onFailed(error);
  };

  timers.push(
    setTimeout(onSlow, SEND_SLOW_MS),
    setTimeout(() => confirmOrFail(), SEND_TIMEOUT_MS),
  );

  send().then(markSaved, (error) => {
    if (saved) return;
    clearTimers();
    confirmOrFail(error);
  });
}
