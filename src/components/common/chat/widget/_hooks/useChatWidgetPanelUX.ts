import { useEffect, type RefObject } from "react";
import { lockScroll, unlockScroll } from "@/utils/lockScroll";
import { useChatStore } from "@/store/chatStore";

export function useChatWidgetPanelUX(
  rootRef: RefObject<HTMLDivElement | null>,
  panelRef: RefObject<HTMLDivElement | null>,
  onOutsideClick: () => void,
) {
  const isOpen = useChatStore((s) => s.isOpen);

  useEffect(() => {
    if (isOpen && window.innerWidth < 768) {
      lockScroll();
      return () => { unlockScroll(); };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (rootRef.current?.contains(target)) return;
      if (
        target instanceof Element &&
        target.closest("[data-radix-popper-content-wrapper], [data-radix-portal]")
      ) {
        return;
      }

      onOutsideClick();
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [onOutsideClick, isOpen, rootRef]);

  useEffect(() => {
    const el = panelRef.current;
    if (!el || !isOpen) return;
    const onWheel = (e: WheelEvent) => {
      const scrollable = (e.target as HTMLElement).closest<HTMLElement>(
        "[data-chat-scroll]",
      );
      if (scrollable) {
        const { scrollTop, scrollHeight, clientHeight } = scrollable;
        const atTop = e.deltaY < 0 && scrollTop <= 0;
        const atBottom =
          e.deltaY > 0 && scrollTop + clientHeight >= scrollHeight;
        if (!atTop && !atBottom) return;
      }
      e.preventDefault();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [isOpen, panelRef]);
}
