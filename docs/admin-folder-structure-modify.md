# Admin 폴더 구조 - THLIMM

## 전체 구조

```
src/
├── constants/
│   └── routes.ts              # 프로젝트 전체 라우트 상수 (admin 라우트 포함)
├── type/
│   ├── admin.ts               # admin 전용 타입 모음
│   └── ...                    # 기타 도메인 타입
└── app/(admin)/admin/
    ├── _components/           # 대시보드 UI 컴포넌트
    │   ├── Card.tsx
    │   ├── DashboardClient.tsx
    │   ├── HeaderSection.tsx
    │   ├── KpiCards.tsx
    │   ├── RegionAndTopPosts.tsx
    │   ├── ReportQueue.tsx
    │   ├── ReportTypes.tsx
    │   ├── TrendAndDonut.tsx
    │   └── UrgentReportBanner.tsx
    ├── _lib/
    │   ├── constants.ts       # 대시보드 순수 상수
    │   └── utils.ts           # 대시보드 유틸 함수
    ├── page.tsx               # 대시보드 페이지 (서버 컴포넌트)
    └── reports/
        ├── _components/
        │   └── ReportsClient.tsx  # 신고 관리 UI (클라이언트 컴포넌트)
        ├── _lib/
        │   ├── constants.ts       # 신고 관련 순수 상수
        │   └── actions.ts         # 신고 처리 서버 액션
        └── page.tsx               # 신고 관리 페이지 (서버 컴포넌트)
```

---

## 파일별 역할

### `src/constants/routes.ts`

프로젝트 전체에서 사용하는 라우트 경로 상수.

| 키             | 경로             |
| -------------- | ---------------- |
| `admin`        | `/admin`         |
| `adminReports` | `/admin/reports` |

---

### `src/type/admin.ts`

admin 기능에서 사용하는 모든 TypeScript 타입 정의.

| 이름            | 종류        | 설명                                  |
| --------------- | ----------- | ------------------------------------- |
| `Category`      | `type`      | 게시글 카테고리 유니온 타입           |
| `ReportedUser`  | `interface` | 신고된 유저 데이터 구조               |
| `ReportedPost`  | `interface` | 신고된 게시글 데이터 구조             |
| `DashboardData` | `interface` | 대시보드 클라이언트 컴포넌트 props    |
| `ReportType`    | `type`      | 신고 대상 종류 (`"post"` \| `"user"`) |
| `Status`        | `type`      | 신고 처리 상태                        |
| `Sanction`      | `type`      | 제재 종류                             |
| `Outcome`       | `interface` | 신고 처리 결과                        |
| `Report`        | `interface` | 신고 항목 전체 데이터 구조            |

---

### `admin/_lib/constants.ts`

대시보드에서 사용하는 순수 상수만 보관.

| 이름              | 설명                                 |
| ----------------- | ------------------------------------ |
| `POST_TYPE_LABEL` | DB `post_type` 값 → 한글 레이블 매핑 |
| `CATEGORY`        | 카테고리별 색상 (fg/bg)              |
| `CAT_ORDER`       | 카테고리 표시 순서                   |
| `REPORT_COLORS`   | 신고 유형별 차트 색상                |

---

### `admin/_lib/utils.ts`

대시보드 전용 유틸 함수.

| 이름              | 설명                                        |
| ----------------- | ------------------------------------------- |
| `normalizeReason` | 신고 카테고리 문자열 → 정규화된 표시명 변환 |
| `fillDailyGaps`   | 일별 데이터 배열에서 빈 날짜를 0으로 채움   |
| `daysSince`       | ISO 날짜 문자열 → 경과 일수 계산            |

---

### `admin/reports/_lib/constants.ts`

신고 관리 페이지 전용 상수 및 유틸.

| 이름                    | 설명                                    |
| ----------------------- | --------------------------------------- |
| `REASON_STYLE`          | 신고 사유별 뱃지 색상                   |
| `CATEGORY_STYLE`        | 카테고리별 뱃지 색상                    |
| `STATUS_STYLE`          | 신고 상태별 레이블·색상                 |
| `SANCTION_LABEL`        | 제재 종류 → 한글 레이블                 |
| `PAGE_SIZE`             | 신고 목록 페이지당 항목 수 (12)         |
| `normalizeReportReason` | 신고 사유 문자열 → 정규화된 분류명 변환 |

---

### `admin/reports/_lib/actions.ts`

신고 처리 서버 액션 (처리 완료, 무시, 수정).

---

## import 경로 가이드

```ts
// 타입
import type { Category, Report, Status } from "@/type/admin";

// 대시보드 상수
import {
  POST_TYPE_LABEL,
  CATEGORY,
  CAT_ORDER,
  REPORT_COLORS,
} from "./_lib/constants";

// 대시보드 유틸
import { normalizeReason, fillDailyGaps, daysSince } from "./_lib/utils";

// 신고 관리 상수
import { REASON_STYLE, STATUS_STYLE, PAGE_SIZE } from "./_lib/constants";

// 라우트
import { ROUTES } from "@/constants/routes";
// ROUTES.admin        → "/admin"
// ROUTES.adminReports → "/admin/reports"
```
