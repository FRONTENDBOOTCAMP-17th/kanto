# 로그아웃 확인창이 헤더 영역에 갇혀 뜨는 버그 수정

**작업자:** DoHyuk-Centric  
**날짜:** 2026-06-17  
**관련 파일:**
- `src/components/common/ConfirmModal.tsx` (수정)
- `src/components/common/Header.tsx` (원인 발생 위치, 변경 없음)

---

## 증상

로그아웃 버튼(데스크탑 프로필 드롭다운 / 모바일 메뉴)을 누르면, 확인창(`ConfirmModal`)이 화면 정중앙이 아니라 **헤더 영역 안에 갇혀서** 떴다.

---

## 원인

`ConfirmModal`은 `fixed inset-0 ... flex items-center justify-center`로, 원래는 **뷰포트 전체를 덮고 정중앙**에 떠야 한다.

그런데 CSS 규칙상 `position: fixed` 요소는 조상 중에 `transform`이 걸린 요소가 있으면, **뷰포트가 아니라 그 transform 조상 박스를 기준**으로 위치가 잡힌다.

`ConfirmModal`은 `Header.tsx`에서 `<header>` 태그 안에 렌더링되고 있었다. 그리고 헤더에는 스크롤 숨김 애니메이션을 위해 `transition-transform` + `translate-y-*`(= transform)이 적용되어 있다. 그 결과 모달의 `fixed inset-0`이 뷰포트가 아닌 **헤더 박스 기준**으로 갇혀버렸다.

### 버그가 들어온 시점

| 커밋 | 날짜 | 내용 | 상태 |
|------|------|------|------|
| `a702798` | 2026-06-14 | `ConfirmModal`을 `<header>` 안에 추가 | 헤더에 transform 없어 정상 동작 |
| `fc9b0cb` | 2026-06-17 | 모바일 헤더 스크롤 숨김/표시 구현 — 헤더에 `transition-transform` + `translate-y-*` 추가 | **증상 발생 (헤더가 transform 조상이 됨)** |

즉 모달 코드 자체의 문제가 아니라, 헤더에 transform이 추가되면서 그 안에 있던 모달이 영향을 받은 것이다. (`fc9b0cb` 작업 내용은 `docs/20260617-header-hide-on-scroll.md` 참고)

---

## 해결

`ConfirmModal`을 `createPortal`로 **`document.body` 직속에 렌더링**하도록 변경. 모달이 더 이상 헤더의 자식이 아니게 되어, transform 조상의 영향에서 완전히 벗어난다.

```tsx
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// ...
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);

if (!isOpen || !mounted) return null;

return createPortal(
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40" ...>
    {/* ... 기존 내용 그대로 ... */}
  </div>,
  document.body,
);
```

- `mounted` 가드: Next.js SSR 환경에서 `document` 접근 전 마운트 여부 확인 (hydration 안전)
- JSX 구조·스타일·props는 그대로 두고 **렌더링 위치만 body로** 이동
- 호출하는 `Header.tsx`, `DeleteButton.tsx`는 변경 없음

---

## 채택 이유 (vs 헤더 밖으로 빼기)

대안으로 `Header.tsx`에서 모달만 `<header>` 바깥 Fragment로 빼는 방법(변경 최소)도 있었으나, 포털 방식을 택했다.

- transform / overflow / stacking-context 영향을 **구조적으로 차단** → 같은 원인의 버그 재발 방지
- `ConfirmModal` 한 곳만 고치면 모든 사용처(`Header`, `DeleteButton`)가 함께 안전해짐
- 모달은 의미상 "헤더의 일부"가 아니라 화면 전체 오버레이이므로 body 직속이 더 자연스러움

### Fragment 방식을 택했다면 (대안의 결과)

`Header.tsx`의 `return`을 Fragment로 감싸 `<header>...</header>` **뒤에** `ConfirmModal`을 두는 형태:

```tsx
return (
  <>
    <header className="... transition-transform ...">
      {/* ... */}
    </header>
    <ConfirmModal isOpen={isLogoutModalOpen} ... />
  </>
);
```

- **이 화면(로그아웃 모달)은 정상화됨.** 모달이 더 이상 transform이 걸린 `<header>`의 자식이 아니게 되어 뷰포트 기준 정중앙에 뜬다.
- **하지만 근본 원인은 그대로 남는다.** "transform 조상 안에 `fixed` 모달을 두면 안 된다"는 제약을 `ConfirmModal`을 **쓰는 쪽이 매번 기억하고 회피**해야 한다. 컴포넌트 자체는 여전히 조상 영향에 취약하다.
- **다른 사용처는 보호되지 않는다.** `DeleteButton` 등 현재·미래의 다른 사용처가 transform/overflow 조상 안에 놓이면 같은 버그가 다시 발생한다. 즉 이번 한 곳만 막고 동일 유형의 버그 재발 가능성은 남긴다.
- 변경 파일 수는 더 적지만(`Header.tsx` 한 곳), **수정 책임이 호출부로 분산**되어 장기적으로는 관리 비용이 더 크다.

정리하면 Fragment 방식은 "지금 이 증상"만 빠르게 덮는 국소 수정이고, 포털 방식은 **버그의 원인 유형 자체를 컴포넌트 레벨에서 제거**하는 차이가 있다.

---

## 검증

- 로그아웃 확인창이 화면 정중앙에 표시됨 (데스크탑 드롭다운 / 모바일 메뉴 둘 다)
- 게시글 삭제 확인창(`DeleteButton`)도 정상 동작
- ESC / 배경 클릭으로 닫힘 정상
