# 20260706 — 모바일 헤더가 컨텐츠를 덮는 버그 수정

브랜치: `fix/header-eat-contents`
작성: `THLIMM`

---

## 1. 버그 개요

### 증상

모바일(md 미만, ~768px 이하) 화면에서 페이지를 열고 스크롤을 맨 위로 올리면, `fixed`로 떠 있는 헤더가 본문 상단 콘텐츠를 그대로 덮어버리는 문제.

### 원인

`src/components/common/GlobalLayout.tsx`에서 모바일 `fixed` 헤더 아래 공간을 확보하기 위해 spacer(`<div className="h-12 md:h-0" />`)를 헤더 바로 다음에 두고 있는데, 이 spacer는 내용이 비어 있어 flex 아이템의 기본 `min-height: auto` 규칙의 영향을 받는다.

`#scroll-root`(flex column, `overflow-y-auto`)의 자식들(spacer, main, footer 등) 전체 높이가 뷰포트보다 넘칠 때, 브라우저는 flex-shrink 알고리즘으로 남는 공간을 마이너스 처리하는데, `main`/`footer`는 실제 콘텐츠가 있어 그 이하로는 줄어들지 않지만(자동 최소 크기 > 0), 내용이 없는 spacer는 자동 최소 크기가 0이라 가장 먼저, 그리고 완전히 0으로 줄어들었다. 그 결과 헤더 높이만큼의 여백이 사라지고 헤더가 본문 위에 겹쳐 보인 것.

Playwright로 실제 렌더된 DOM의 `getComputedStyle`을 확인해 spacer의 실측 높이가 `48px`가 아닌 `0px`임을 확인해 원인을 특정했다.

### 수정 내용

`src/components/common/GlobalLayout.tsx`의 spacer에 `shrink-0`을 추가해 flex-shrink 대상에서 제외했다.

```diff
- {!hideGlobalUI && <div className="h-12 md:h-0" aria-hidden="true" />}
+ {!hideGlobalUI && <div className="h-12 md:h-0 shrink-0" aria-hidden="true" />}
```

---

## 2. 지금까지 완성된 기능/작업

- 모바일에서 스크롤을 맨 위로 올렸을 때 `fixed` 헤더가 본문 콘텐츠를 덮던 문제 수정 (본 문서)
