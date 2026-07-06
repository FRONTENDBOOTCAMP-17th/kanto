# E2E 테스트 수정 작업 보고서 — 2026-07-06

## 최종 결과

| 구분 | 수 |
|------|-----|
| 통과 | **23** |
| 스킵 | 2 |
| 실패 | **0** |

---

## 수정된 파일 목록

### 테스트 코드
| 파일 | 수정 내용 |
|------|----------|
| `tests/kanto.spec.ts` | 로그인 UI 개편 반영 — "이메일로 로그인" 버튼 클릭 제거, `#email`/`#password` ID 셀렉터 사용 |
| `tests/kanto-2nd.spec.ts` | heading `"방렌트"` → `"Rentals"` 수정 / 구인구직 글쓰기 테스트 `test.skip` 처리 |
| `tests/kanto-2nd-auth.spec.ts` | 로그인 헬퍼 셀렉터 수정 / 구인구직 글쓰기 테스트 `test.skip` 처리 |
| `tests/kanto-3rd.spec.ts` | 검색창 placeholder `"검색어를 입력해주세요"` → `"Enter a search term"` 수정 |

### 환경 설정
| 파일 | 내용 |
|------|------|
| `.gitignore` | `node_modules/`, `test-results/*`, `report/` 추가 — VS Code에서 ~242개 변경사항으로 표시되던 문제 해결 |
| `tsconfig.json` | 신규 추가 — `@types/node` 타입 인식 설정 |
| `package.json` | `@types/node` devDependency 추가 |

---

## 수정 사유별 분류

### 1. 로그인 UI 개편 (1차~2차 리뷰 이후 변경)
- **변경 전:** "이메일로 로그인" 버튼 클릭 → 이메일 폼 펼치기
- **변경 후:** 이메일/비밀번호 폼이 처음부터 바로 표시됨
- 테스트 계정: `whrqkfdlwhgdk12@gmail.com / kanto0000`

### 2. 텍스트 한→영 변경 (다국어 locale 변경)
- 방렌트 목록 heading: `"방렌트"` → `"Rentals"`
- 검색창 placeholder: `"검색어를 입력해주세요"` → `"Enter a search term"`

### 3. `/job/create` 인증 가드 (skip 처리)
- `/job/create`는 `identity_verified === true` (카카오/구글 OAuth) 계정만 접근 가능
- 이메일 가입 계정으로는 `/create`(본인인증)로 리다이렉트됨
- Playwright로 카카오 OAuth 자동화 불가 → `test.skip` 처리
- 해당 테스트: `kanto-2nd.spec.ts`, `kanto-2nd-auth.spec.ts`

---

## 스킵된 테스트 (2개)

| 테스트 | 이유 |
|--------|------|
| `kanto-2nd-auth >> 로그인 후 구인 글쓰기 폼 렌더링` | `identity_verified` 필요 (카카오/구글 OAuth만 가능) |
| `kanto-2nd >> 구인구직 글쓰기 페이지 렌더링` | 동일 |
