# SearchBar & FilterDropdown 개선 (2026-06-17)

**작업자:** DoHyuk-Centric

## 변경 배경

목록 페이지(중고거래·구인구직·방렌트)의 검색바에 들어있는 카테고리 필터가
모바일에서 UX가 불편하고, 선택 즉시 카드 목록이 바뀌는 동작이 의도와 달랐음.

---

## 변경 내용

### 1. FilterDropdown — 모바일 바텀시트 모달 추가

**파일:** `src/components/common/FilterDropdown.tsx`

- `label` prop 추가 (모달 헤더 타이틀용)
- 모바일(`md:hidden`): 버튼 탭 시 지역 선택과 동일한 바텀시트 모달 오픈
- 데스크탑(`hidden md:block`): 기존 드롭다운 유지
- 바텀시트 오픈 시 `document.body.style.overflow = "hidden"` 처리

### 2. 카테고리 필터 — 검색 시점에만 적용

**파일:**
- `src/app/(user)/usedgoods/_components/UsedGoodsFilters.tsx`
- `src/app/(user)/rental/_components/RentalFilters.tsx`
- `src/app/(user)/job/_components/JobFilters.tsx`

**변경 전:** 카테고리 선택 즉시 `updateParams` 호출 → 카드 목록 즉시 변경

**변경 후:** 카테고리 선택은 로컬 상태(`pendingCategory` 등)로만 저장,
검색 버튼 클릭 시 검색어·지역·카테고리를 한 번에 URL에 반영

```
카테고리 선택 → 로컬 상태만 업데이트 (카드 변화 없음)
검색 버튼 클릭 → search + location + category 일괄 적용
```

### 3. SearchBar 지역 드롭다운 — 포지션 수정

**파일:** `src/components/common/SearchBar.tsx`

- 데스크탑 지역 드롭다운을 `fixed` + `getBoundingClientRect` 방식에서
  `absolute top-full` 방식으로 변경 (MainSearchBar와 동일한 패턴)
- 스크롤 시 드롭다운이 뷰포트에 고정되어 떠다니던 문제 해결

---

## 최종 동작 요약

| 상황 | 동작 |
|------|------|
| 모바일에서 카테고리 버튼 탭 | 바텀시트 모달 오픈 |
| 데스크탑에서 카테고리 버튼 클릭 | 드롭다운 오픈 |
| 카테고리 선택 | 로컬 상태만 변경, 카드 목록 유지 |
| 검색 버튼 클릭 | 검색어 + 지역 + 카테고리 일괄 필터링 |
| 드롭다운 열린 상태에서 스크롤 | 드롭다운이 버튼과 함께 자연스럽게 이동 |
