import { useRef, useState } from "react";

type ToastType = "success" | "error";
type ToastIcon = "check" | "x" | "alert";

/** 하단 토스트를 보여주고, 재호출 시 이전 타이머를 취소한 뒤 3초 뒤 자동으로 지운다. */
export function useBottomToast() {
  const [showToast, setShowToast] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<ToastType>("success");
  const [icon, setIcon] = useState<ToastIcon>("check");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showBottomToast = (
    msg: string,
    nextType: ToastType = "success",
    nextIcon: ToastIcon = nextType === "error" ? "alert" : "check",
  ) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessage(msg);
    setType(nextType);
    setIcon(nextIcon);
    setShowToast(true);
    timerRef.current = setTimeout(() => setShowToast(false), 3000);
  };

  return { showToast, message, type, icon, showBottomToast };
}
