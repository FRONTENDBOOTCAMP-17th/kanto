# 어드민 운영관리 하위 페이지 뒤로가기 버튼 scale 고정

작성: `박소유`
일자: 2026-07-06
근거 커밋: `8c89909`

## 1. 배경

어드민 운영관리 하위 페이지의 `← 운영 관리` 뒤로가기 링크가 클릭 시 `globals.css`의 전역 `active:scale-[1.05]` 영향을 받아 과하게 움직였다. 작은 텍스트 링크에 5% 확대는 어색하게 느껴졌다.

## 2. 처리

각 하위 페이지의 `← 운영 관리` Link에 `active:scale-100`을 추가해 전역 scale 효과를 덮어씌움. hover 시 색상 변화(`hover:text-slate-600`)만 남긴다.

## 3. 변경 파일

| 파일 | 변경 내용 |
|---|---|
| `src/app/(admin)/admin/operation/content/page.tsx` | active:scale-100 추가 |
| `src/app/(admin)/admin/operation/notices/page.tsx` | active:scale-100 추가 |
| `src/app/(admin)/admin/operation/maintenance/page.tsx` | active:scale-100 추가 |
| `src/app/(admin)/admin/operation/spam-config/page.tsx` | active:scale-100 추가 |
| `src/app/(admin)/admin/operation/popular-jobs/_components/PopularJobsClient.tsx` | active:scale-100 추가 |
| `src/app/(admin)/admin/operation/permissions/_components/PermissionsClient.tsx` | active:scale-100 추가 |
| `src/app/(admin)/admin/operation/audit-logs/_components/AuditLogsClient.tsx` | active:scale-100 추가 |
