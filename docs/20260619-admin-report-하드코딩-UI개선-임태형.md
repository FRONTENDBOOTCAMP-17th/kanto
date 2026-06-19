# 20260619 — admin 신고내역 하드코딩 상수화 및 UI 정리

## 담당자 : 임태형

---

## 1. 작업 개요

`bug/report-action-hardcoding` 브랜치에서 진행한 작업. 크게 두 갈래로 나뉜다.

1. **하드코딩 상수화** — admin 영역 전반에서 `"common_reports"` 테이블명과 `"pending"/"resolved"/"dismissed"` 상태값이 여러 파일에 문자열 그대로 흩어져 있던 것을 한 곳의 상수로 통합.
2. **신고내역(`/admin/reports`) 테이블 UI 정리** — 헤더/셀 정렬 불일치, 액션 버튼 위치, 컬럼 간격 불균등 문제 수정 및 사이드바 하단의 미사용 관리자 프로필 블록 제거.

---

## 2. 작업 내용

### 2-1. 하드코딩 상수화

기존에 `"common_reports"`, `"pending"` 등이 8개 파일에 중복 하드코딩되어 있었음 (오타 시 컴파일 타임에 잡히지 않는 문제).

새 파일 `src/constants/report.ts` 추가:

```ts
import type { Status } from "@/type/admin";

export const REPORTS_TABLE = "common_reports";

export const REPORT_STATUS = {
  PENDING: "pending",
  RESOLVED: "resolved",
  DISMISSED: "dismissed",
} as const satisfies Record<string, Status>;
```

다음 8개 파일에서 하드코딩된 문자열을 위 상수로 교체:

- `src/app/(admin)/layout.tsx`
- `src/app/(admin)/admin/page.tsx`
- `src/app/(admin)/admin/reports/page.tsx`
- `src/app/(admin)/admin/reports/_lib/actions.ts`
- `src/app/(admin)/admin/reports/_components/ReportsClient.tsx`
- `src/services/report.ts`
- `src/services/admin/adminUsers.ts`
- `src/services/getUserLikeReportStatus.ts`

> payment 도메인의 `"pending"`(결제 상태)은 신고 상태와 다른 도메인이라 의도적으로 그대로 유지.

### 2-2. 신고내역 테이블 UI 정리 (`ReportsClient.tsx`)

- **헤더/셀 정렬 불일치 수정**: `유형 / 신고 사유 / 신고일 / 상태 / 액션` 헤더와 본문 셀을 모두 `text-center`로 통일 (`대상`만 텍스트 길이 특성상 `text-left` 유지). 기존엔 헤더는 좌측, 액션 헤더만 우측 정렬이라 컬럼별로 제목과 본문 위치가 어긋나 있었음.
- **액션 버튼 위치 수정**: `justify-end`(우측 고정) → `justify-center`로 변경해 컬럼 중앙에 위치하도록 수정.
- **컬럼 간격 불균등 수정**: 테이블이 `table-layout: auto`라 컬럼 너비가 행마다 들쑥날쑥했던 게 간격 불균등의 원인. `table-fixed` + `<colgroup>` 적용 후, 최초엔 컬럼별로 다른 비율(12/28/16/14/14/16%)을 줬다가 최종적으로 6개 컬럼 모두 `w-1/6`(균등 비율)로 통일.
- `대상` 셀의 `truncate` 처리는 고정폭(`max-w-[320px]`) 대신 컬럼 자체 너비에 맞춰 잘리도록 변경.

### 2-3. AdminSidebar 정리 (`_components/AdminSidebar.tsx`)

- 사이드바 하단의 관리자 프로필 박스(아바타 이니셜 `관`, `관리자`, `admin@kanto.ph`, 동작하지 않는 로그아웃 버튼) 제거. 실제 로그인 사용자 정보와 연결된 DB 쿼리/서비스 호출이 전혀 없는 순수 정적 텍스트였음 (코드베이스 전체 검색으로 확인, 제거 대상 쿼리 없음).
- 위 블록에서만 쓰이던 `LogOut` 아이콘 import 제거.

---

## 3. 파일 구조 및 각 파일의 역할

```
src/
├── constants/
│   └── report.ts                      # (신규) REPORTS_TABLE, REPORT_STATUS 상수 — 신고 테이블명/상태값 단일 소스
│
├── type/
│   └── admin.ts                       # admin 도메인 타입: Status, Sanction, Report, DashboardData 등
│
├── services/
│   ├── report.ts                      # 신고 등록(submitReport)/중복 신고 확인(checkReported) — 유저 페이지에서 호출
│   ├── getUserLikeReportStatus.ts     # 게시글 상세에서 현재 유저의 좋아요/신고 여부 조회
│   └── admin/
│       └── adminUsers.ts              # admin 유저 관리 페이지용 유저 목록/상세/게시글 + 신고 누적 수 조회
│
└── app/(admin)/
    ├── layout.tsx                      # admin 레이아웃. pending 신고 수를 조회해 AdminSidebar에 배지로 전달
    ├── _components/
    │   └── AdminSidebar.tsx            # admin 사이드바 네비게이션(대시보드/글/유저/신고/채팅) + 모바일 헤더
    └── admin/
        ├── page.tsx                     # 대시보드 페이지. KPI, 신고 배너, 신고 유형 분포 등 집계 쿼리
        ├── _lib/
        │   └── constants.ts             # 대시보드용 카테고리/색상 매핑 (POST_TYPE_LABEL, CAT_ORDER 등)
        └── reports/
            ├── page.tsx                  # 신고 목록 서버 컴포넌트. common_reports + 대상 게시글/유저 join해서 Report[] 구성
            ├── _lib/
            │   ├── constants.ts          # 신고 사유/카테고리/상태 스타일 매핑(REASON_STYLE, STATUS_STYLE 등), PAGE_SIZE
            │   └── actions.ts            # Server Actions: resolveReport / dismissReport / updateReportResolution
            └── _components/
                └── ReportsClient.tsx     # 신고내역 테이블 + 상세 드로어 클라이언트 컴포넌트 (이번 UI 수정 대상)
```

---

## 4. 검증

- `npx tsc --noEmit` — 변경 전부터 존재하던 `nodemailer` 타입 선언 누락 오류(무관) 외 신규 오류 없음.
- 코드베이스 전체에서 `"common_reports"` / 신고 상태 리터럴 잔존 여부 grep으로 재확인 — `src/constants/report.ts`(정의부)만 남음.
