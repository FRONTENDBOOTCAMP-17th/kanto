// 스크롤 잠금은 참조 카운트로 관리한다. 여러 컴포넌트가 동시에 잠글 수 있어(예: 모달 위에
// 셀렉트가 열리는 경우), 먼저 닫히는 쪽이 잠금을 풀어버리면 뒤에 남은 쪽의 스크롤이 되살아난다.
// 그래서 첫 잠금에서만 스타일을 걸고, 마지막 잠금이 풀릴 때만 해제한다.
// 전제: 모든 호출자는 lockScroll() 한 번당 unlockScroll() 한 번을 짝지어 호출한다.
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
