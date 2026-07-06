# 20260706 — 클릭 가능한 요소에 커서 포인터 전역 적용

브랜치: `fix/cursor-pointer`
작성: `THLIMM`

---

## 1. 작업 개요

### 문제

Tailwind 프리플라이트와 전역 CSS 어디에도 `button`에 대한 `cursor: pointer` 규칙이 없어, 버튼을 비롯한 클릭 가능한 시맨틱 요소들이 기본 커서(포인터 아님)로 표시되는 문제가 있었다. 그동안 컴포넌트마다 개별적으로 `cursor-pointer` 클래스를 붙여왔지만 누락된 곳이 많았다.

### 범위

전역 CSS로 커버 가능한 시맨틱 요소(`button`, `a`, `select`, `summary`, `label[for]`, `[role="button"]`)에 한정했다. `onClick`이 걸린 비시맨틱 커스텀 요소(div/span 등)는 CSS 셀렉터로 감지할 수 없어 이번 범위에서 제외했다.

## 2. 수정 내용

`src/app/globals.css`의 `@layer base`에 시맨틱 인터랙션 요소에 대한 전역 `cursor: pointer` 규칙을 추가하고, 비활성화된 버튼은 `cursor: not-allowed`로 처리했다.

```diff
   button:not(:disabled),
   a {
+    cursor: pointer;
     @apply transition-transform duration-100 active:scale-[1.05];
   }
+  button:disabled {
+    cursor: not-allowed;
+  }
+  select,
+  summary,
+  label[for],
+  [role="button"]:not([aria-disabled="true"]) {
+    cursor: pointer;
+  }
```

---

## 3. 지금까지 완성된 기능/작업

- 모바일에서 스크롤을 맨 위로 올렸을 때 `fixed` 헤더가 본문 콘텐츠를 덮던 문제 수정 ([20260706-mobile-header-overlap-임태린.md](./20260706-mobile-header-overlap-임태린.md))
- 클릭 가능한 시맨틱 요소(button, a, select, summary, label, role=button)에 전역 커서 포인터 적용 (본 문서)
