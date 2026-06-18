# 모바일 헤더 스크롤 숨김/표시 구현

**작업자:** DoHyuk-Centric  
**날짜:** 2026-06-17  
**관련 파일:**
- `src/components/common/Header.tsx`
- `src/components/common/GlobalLayout.tsx`

---

## 요구사항

모바일에서 최상단일 때는 헤더를 항상 표시하고, 스크롤을 내리면 헤더가 위로 사라지며, 다시 위로 올리면 헤더가 내려와 표시되도록 구현.  
데스크탑은 기존 동작(`sticky`) 유지.

---

## 구현 방식

### position 전략

| 환경 | 변경 전 | 변경 후 |
|------|---------|---------|
| 모바일 | `sticky top-0` | `fixed top-0 w-full` |
| 데스크탑 | `sticky top-0` | `md:sticky` (유지) |

`fixed`로 변경하면서 헤더가 document flow에서 벗어나기 때문에, `GlobalLayout`에 spacer div를 추가해 콘텐츠가 헤더 뒤로 가리지 않도록 처리.

### 스크롤 방향 감지 (Header.tsx)

```ts
const HEADER_HEIGHT = 48; // 모바일 헤더 높이(h-12)

useEffect(() => {
  const handleScroll = () => {
    const currentScrollY = window.scrollY;
    if (currentScrollY <= HEADER_HEIGHT) {
      setIsVisible(true);       // 최상단 부근 → 항상 표시
    } else if (currentScrollY > prevScrollY.current) {
      setIsVisible(false);      // 아래로 스크롤 → 숨김
    } else if (currentScrollY < prevScrollY.current) {
      setIsVisible(true);       // 위로 스크롤 → 표시
    }
    prevScrollY.current = currentScrollY;
  };
  window.addEventListener("scroll", handleScroll, { passive: true });
  return () => window.removeEventListener("scroll", handleScroll);
}, []);
```

- `scrollY ≤ 48(HEADER_HEIGHT)` 구간에서는 스크롤 방향과 무관하게 항상 표시
- `passive: true`로 스크롤 성능 최적화

### 애니메이션 (Header.tsx)

```tsx
<header
  className={`fixed md:sticky top-0 z-50 w-full bg-white border-b border-gray-200
    transition-transform duration-300 ${
      isVisible || isMobileOpen
        ? "translate-y-0"
        : "-translate-y-full md:translate-y-0"
    }`}
>
```

- `transition-transform duration-300`으로 슬라이드 애니메이션
- `isMobileOpen`(모바일 메뉴 열림) 상태에서는 강제로 표시 유지
- `-translate-y-full md:translate-y-0`: 데스크탑은 항상 `translate-y-0` 유지

### Spacer (GlobalLayout.tsx)

```tsx
<div className="h-12 md:h-0" />
```

- 모바일: `h-12`(48px) — `fixed` 헤더가 차지하는 공간을 document flow에 확보
- 데스크탑: `md:h-0` — `sticky` 헤더는 flow에 포함되므로 spacer 불필요
- 기존 `<main>`의 `pt-12 md:pt-0` 대신 이 div가 spacer 역할을 대신하여 `<main>`은 `flex-1`만 유지

---

## 검토했던 대안

### IntersectionObserver 방식

sentinel 요소(높이 0)를 최상단에 두고 viewport 이탈 여부로 헤더 표시를 제어하는 방식.  
scroll 이벤트보다 성능이 좋고 코드가 간결하지만, **"최상단에서만 표시"** 동작만 구현 가능하고 "위로 올리면 즉시 표시"는 구현 불가하여 채택하지 않음.

---

## 개선 과정

이 문서는 위 내용을 최종 구현으로 서술하고 있으나, 실제로 처음 적용(Sonnet 작업)되어 있던 코드는 **IntersectionObserver 방식**이었다. 즉 문서 설명과 실제 구현이 서로 반대였다.

IntersectionObserver 방식은 `#header-sentinel` 요소가 viewport에 보이는지(=페이지 최상단 근처인지)만 감지했기 때문에, 동작이 "최상단 근처면 표시 / 아니면 숨김"이라는 이분법에 그쳤다. 그 결과 **스크롤을 위로 올려도 최상단 부근에 닿기 전까지는 헤더가 다시 나타나지 않아** 일반적인 모바일 웹앱과 다른 어색한 사용감을 주었다.

이 불편함을 개선하기 위해 **Opus 플랜 모드**로, 기존 이분법(최상단 여부) 방식이 아닌 **스크롤 방향 감지** 방식으로 개선해 달라고 요청·해결했다.

1. 스크롤 방향이 아래(아래 컨텐츠 보기)이고 헤더 높이 이상 내려간 상태 → 헤더 숨김
2. 스크롤 방향이 위(위 컨텐츠 보기) → 헤더 즉시 재표시

해결은 위 "구현 방식"에 정리된 **스크롤 방향 감지** 로직으로 `IntersectionObserver`를 교체하는 것이었다. 동시에 spacer 역할만 남은 `<div>`에서 더 이상 관찰에 쓰이지 않는 `id="header-sentinel"`을 제거했다. 이로써 비로소 실제 코드가 본 문서의 설명과 일치하게 되었다.

**변경 요약**
- `Header.tsx`: `IntersectionObserver` useEffect → `prevScrollY` ref 기반 스크롤 방향 감지 useEffect로 교체 (기존 `ScrollToTop.tsx`의 패턴 재사용)
- `GlobalLayout.tsx`: spacer `<div>`는 유지하되 미사용이 된 `id="header-sentinel"` 제거
