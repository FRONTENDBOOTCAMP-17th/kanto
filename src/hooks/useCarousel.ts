
import { useState, useRef } from "react";

type Direction = "left" | "right";

export function useCarousel(length: number) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState<Direction>("right");
  const [isAnimating, setIsAnimating] = useState(false);
  const dragStartX = useRef<number | null>(null);

  const navigate = (dir: Direction, targetIndex?: number) => {
    if (isAnimating) return;
    const next =
      targetIndex ??
      (dir === "right"
        ? (currentIndex + 1) % length
        : (currentIndex - 1 + length) % length);
    if (next === currentIndex) return;

    setPrevIndex(currentIndex);
    setDirection(dir);
    setCurrentIndex(next);
    setIsAnimating(true);

    setTimeout(() => {
      setPrevIndex(null);
      setIsAnimating(false);
    }, 300);
  };

  const onDragStart = (clientX: number) => {
    dragStartX.current = clientX;
  };

  const onDragEnd = (clientX: number) => {
    if (dragStartX.current === null) return;
    const diff = dragStartX.current - clientX;
    if (Math.abs(diff) > 50) navigate(diff > 0 ? "right" : "left");
    dragStartX.current = null;
  };

  return {
    currentIndex,
    prevIndex,
    direction,
    isAnimating,
    navigate,
    dragHandlers: {
      onMouseDown: (e: React.MouseEvent) => onDragStart(e.clientX),
      onMouseUp: (e: React.MouseEvent) => onDragEnd(e.clientX),
      onTouchStart: (e: React.TouchEvent) => onDragStart(e.touches[0].clientX),
      onTouchEnd: (e: React.TouchEvent) => onDragEnd(e.changedTouches[0].clientX),
    },
  };
}
