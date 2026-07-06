let lockCount = 0;

function applyLock() {
  const container = document.getElementById("scroll-root") as HTMLDivElement | null;
  if (!container) return;
  const scrollbarWidth = container.offsetWidth - container.clientWidth;
  container.style.overflow = "hidden";
  if (scrollbarWidth > 0) container.style.paddingRight = `${scrollbarWidth}px`;
}

function releaseLock() {
  const container = document.getElementById("scroll-root") as HTMLDivElement | null;
  if (!container) return;
  container.style.overflow = "";
  container.style.paddingRight = "";
}

export function lockScroll() {
  lockCount += 1;
  if (lockCount === 1) applyLock();
}

export function unlockScroll() {
  if (lockCount === 0) return;
  lockCount -= 1;
  if (lockCount === 0) releaseLock();
}
