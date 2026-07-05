export function lockScroll() {
  const container = document.getElementById("scroll-root") as HTMLDivElement | null;
  if (!container) return;
  const scrollbarWidth = container.offsetWidth - container.clientWidth;
  container.style.overflow = "hidden";
  if (scrollbarWidth > 0) container.style.paddingRight = `${scrollbarWidth}px`;
}

export function unlockScroll() {
  const container = document.getElementById("scroll-root") as HTMLDivElement | null;
  if (!container) return;
  container.style.overflow = "";
  container.style.paddingRight = "";
}
