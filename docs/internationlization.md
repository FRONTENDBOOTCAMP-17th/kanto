# 국제화(i18n) 가이드

Kanto의 다국어 지원 설계·구현·진행 현황을 한 곳에 모은 문서입니다.

- **라이브러리**: [`next-intl`](https://next-intl.dev) v4
- **지원 언어**: 한국어 `ko` · 영어 `en` · 타갈로그 `ta`
- **방식**: **쿠키 기반(URL 변경 없음)** — `/main` 등 기존 URL 유지, 선택 언어를 쿠키에 저장
- **기본 언어**: `ko`

---

## 1. 결정 사항 & 범위

### 결정
- **next-intl + 쿠키 기반**: 기존 `(admin)`/`(user)` 라우트 구조와 Supabase 미들웨어를 건드리지 않기 위해 `[locale]` URL 세그먼트 대신 쿠키로 로케일을 관리한다.
- **번역 대상은 "정적 UI 틀"만**: 버튼·라벨·placeholder·안내문·빈 상태·aria-label·카테고리/상태 라벨 등.
- **번역하지 않는 것**: 사용자가 작성한 DB 콘텐츠(게시글 제목·내용, 가격, 채팅 메시지, 작성자 이름)는 작성 언어 그대로 유지된다. 예) 한국어로 올라온 매물은 English 모드에서도 제목·설명이 한국어로 보인다.
- **제외 영역**: 관리자(`(admin)`) 대시보드는 내부 운영자용이라 번역 대상에서 제외.

### ⚠️ `ta`(타갈로그) vs 타밀어 주의
앱 내부 로케일 키 `ta`는 **타갈로그**를 의미하지만, BCP-47 표준에서 `ta`는 **타밀어**다.
그래서 `Intl` 포맷과 `<html lang>`에는 `src/i18n/config.ts`의 `BCP47_LOCALE`로 **`fil`(필리핀어)**에 매핑한다.
메시지 파일명·쿠키 값은 `ta`를 유지한다.

```ts
// src/i18n/config.ts
export const BCP47_LOCALE: Record<Locale, string> = {
  ko: "ko-KR",
  en: "en-US",
  ta: "fil", // ← 타밀어(ta) 아님, 타갈로그/필리핀어
};
```

---

## 2. 아키텍처 / 파일 구성

```
next.config.ts                              # createNextIntlPlugin 래핑
src/i18n/config.ts                          # 로케일 목록·기본값·쿠키명·BCP47 매핑
src/i18n/request.ts                         # 쿠키에서 로케일 읽어 메시지 로드 (서버)
src/i18n/cookie.ts                          # setLocaleCookie (클라이언트 쿠키 저장)
src/app/layout.tsx                          # NextIntlClientProvider + 동적 <html lang>
src/components/common/LanguageSwitcher.tsx  # 헤더 언어 전환 드롭다운
src/utils/formatTime.ts                     # 로케일 인자 기반 날짜·상대시간 포맷
messages/{ko,en,ta}.json                    # 네임스페이스별 메시지 카탈로그
```

### 동작 흐름 (언어 전환)
1. 헤더 🌐 `LanguageSwitcher`에서 언어 선택
2. `setLocaleCookie(locale)` — 클라이언트에서 `document.cookie`로 `NEXT_LOCALE` 직접 설정
3. `router.refresh()` — 다음 요청에 새 쿠키가 실려 서버가 재렌더
4. `src/i18n/request.ts`의 `getRequestConfig`가 쿠키를 읽어 해당 언어 메시지를 로드
5. `NextIntlClientProvider`가 서버 컨텍스트에서 메시지를 상속 → 클라이언트 컴포넌트까지 반영

> **왜 서버 액션이 아니라 `document.cookie`인가?**
> 초기에 서버 액션으로 쿠키를 설정했더니, 매 요청에 도는 Supabase 미들웨어의 응답 처리와 `Set-Cookie` 타이밍이 얽혀 `router.refresh()`에 새 쿠키가 확정적으로 실리지 않는 문제가 있었다. 쿠키를 클라이언트에서 직접 설정하면 미들웨어·서버 액션과 무관하게 다음 요청에 결정적으로 실린다.

### 핵심 코드

```ts
// src/i18n/request.ts
export default getRequestConfig(async () => {
  const cookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale: Locale =
    cookie && locales.includes(cookie as Locale) ? (cookie as Locale) : defaultLocale;
  return { locale, messages: (await import(`../../messages/${locale}.json`)).default };
});
```

```ts
// src/i18n/cookie.ts  (클라이언트 전용 헬퍼)
export function setLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
}
```

```tsx
// src/app/layout.tsx
const locale = (await getLocale()) as Locale;
return (
  <html lang={BCP47_LOCALE[locale]}>
    <body>
      <NextIntlClientProvider>
        <GlobalLayout initialUser={initialUser}>{children}</GlobalLayout>
      </NextIntlClientProvider>
    </body>
  </html>
);
```

---

## 3. 메시지 카탈로그 & 네임스페이스

메시지는 `messages/{ko,en,ta}.json`에 **기능(네임스페이스)별**로 둔다.
**세 파일의 top-level 네임스페이스는 항상 동일**해야 한다(현재 15개).

| 네임스페이스 | 용도 |
|---|---|
| `Header`, `Footer` | 공통 헤더/푸터 |
| `Auth` | 로그인 폼 |
| `LanguageSwitcher` | 언어 전환 UI |
| `Common` | 공용 버튼·모달·검색·이미지 업로드/캐러셀·탈퇴배너 등 (가장 재사용 多) |
| `Report` | 신고 모달 |
| `Chat` | 채팅 위젯 전체 |
| `Notifications` | 알림 드롭다운/벨 |
| `Enums` | **DB 저장값↔표시 라벨 매핑** (카테고리·상태·고용형태·렌트타입·편의시설 등) |
| `Create` | 글쓰기 카테고리 선택 |
| `Main` | 메인 페이지(Hero·검색·인기목록) |
| `Time` | 가입일 등 날짜 프로즈 |
| `UsedGoods`, `Job`, `Rental` | 각 도메인 목록·상세·작성폼 |

---

## 4. 사용 규칙 (패턴)

### 4.1 컴포넌트에서 번역 호출
```tsx
import { useTranslations } from "next-intl";
const t = useTranslations("UsedGoods");
return <h1>{t("title")}</h1>;
```
- `useTranslations`는 **서버·클라이언트 컴포넌트 모두**에서 동작한다.
- **async 서버 컴포넌트**에서는 hook을 쓸 수 없으므로 `getTranslations`를 `await`로 사용:
  ```ts
  import { getTranslations } from "next-intl/server";
  const t = await getTranslations("UsedGoods");
  ```

### 4.2 보간 / 리치 텍스트 / 날짜
```tsx
t("searchResult", { query });                 // 보간: "{query} 검색 결과"
t.rich("tagline", { br: () => <br /> });       // 리치 텍스트(<br></br> 키)

import { useLocale } from "next-intl";
const locale = useLocale() as Locale;
formatTimeAgo(createdAt, locale);              // 로케일 인자 전달
```
`src/utils/formatTime.ts`의 함수는 `locale` 인자를 받아 `Intl.RelativeTimeFormat`/`toLocaleDateString`으로 포맷한다(생략 시 `ko` 기본).

### 4.3 ⭐ DB 저장값과 결합된 상수 (가장 중요한 규칙)
`RENT_TYPES=["월세","매매"]`, `ROOM_TYPES`, `AMENITIES`, `SALARY_TYPES`, location `"그 외 지역"` 등은
**문자열 자체가 DB에 저장되는 값이자 타입**이다(`src/type/*`).

→ **상수 배열·타입은 절대 바꾸지 않는다(저장값 = canonical 한국어 키).**
→ 화면에 보일 때만 `Enums` 네임스페이스의 값→라벨 매핑으로 번역한다.

```jsonc
// messages/en.json
"Enums": {
  "amenities": { "주차": "Parking", "에어컨": "Air conditioning", ... },
  "roomType":  { "아파트": "Apartment", ... },
  "rentType":  { "월세": "Monthly rent", "매매": "For sale" }
}
```
```tsx
const te = useTranslations("Enums");
{AMENITIES.map((a) => <span key={a}>{te(`amenities.${a}`)}</span>)}
```
- 폼 저장·필터 매칭은 기존 한국어 값으로 그대로 동작 → **DB 마이그레이션 불필요**.
- 키에 공백/한글은 OK(점 `.` 만 없으면 됨).
- 저장값이 매핑에 없을 수 있는 곳은 `te.has(\`...\`) ? te(...) : raw`로 가드(예: 편의시설).

### 4.4 `{ id, label }` 상수
`PRODUCT_CATEGORIES`처럼 `id`(저장값)와 `label`이 분리된 상수는 **`id` 유지, 표시는 `te(\`productCategory.${id}\`)`**.

### 4.5 설정/룩업 객체
`ReportModal`의 카테고리 배열, 채팅 `post_type` 라벨 등 **안정적 key/id는 유지하고 표시 문자열만 메시지로** 옮긴다.

### 4.6 날짜 프로즈 (`Time` 네임스페이스)
"YYYY년 M월 가입" 같이 단어가 박힌 문자열은 컴포넌트에서 조합한다(`RentSellerInfo.tsx` 참고).
```tsx
const tt = useTranslations("Time");
tt("joinedYearMonth", { year, month }); // "{year}년 {month}월 가입"
```

---

## 5. 알아둘 함정 (Gotchas)

1. **React Compiler immutability**: 이 repo는 `reactCompiler: true`라, 컴포넌트 본문에서 `document.cookie = ...` 같은 외부 값 변형이 ESLint(`react-hooks/immutability`) 에러가 난다. → 부수효과는 컴포넌트 밖 일반 함수로 분리(`src/i18n/cookie.ts`처럼).
2. **`next.config.ts` 변경은 HMR로 반영되지 않음**: next-intl 플러그인을 처음 추가했을 때처럼 config를 바꾸면 dev 서버를 **재시작**해야 한다.
3. **누락 키**: en/ta에 없는 키를 접근하면 next-intl이 콘솔에 `MISSING_MESSAGE` 경고를 띄운다. 검증 시 콘솔/`.next/dev/logs`를 확인.
4. **세 파일 동기화**: 키를 추가할 땐 반드시 ko/en/ta 세 파일 모두에 같은 구조로 넣는다.

---

## 6. 진행 현황

### ✅ 완료
- **인프라**: 플러그인·config·request·cookie·Provider·`<html lang>`·LanguageSwitcher·formatTime 로케일화
- **Batch 1 — 공용 컴포넌트 전체**: 버튼·모달(삭제/확인/신고/로그인안내)·검색바·채팅 위젯·알림·탈퇴배너·이미지 캐러셀
- **Batch 2 — 마켓플레이스 전체**: 메인(Hero/검색/인기목록)·글쓰기 선택·**중고거래/구인구직/방렌트**의 목록·상세·작성폼 + 공유 상수(`src/type/*`) 표시처
- **검증**: 메시지 3파일 top-level 네임스페이스 15개 동일, `tsc`·`eslint` 0 오류, 주요 페이지 200, `MISSING_MESSAGE` 없음

### ⏳ 남은 작업
- **Batch 3**: `profile`(7파일)·`signup`(form/agree/terms modal)·`terms`(_config/header)
- **Batch 4**: `favorites`/`myposts`/`notifications` 페이지 + `formatSellerInfoCreatedAt` 정리 + en/ta 미채움 키 최종 점검 + `npm run build`

> `formatSellerInfoCreatedAt`(`src/utils/formatTime.ts`)는 현재 `src/app/(user)/profile/_components/ProfileCard.tsx`에서만 사용 중. Batch 3에서 `Time` 네임스페이스로 교체한 뒤 해당 util을 제거하면 된다.

---

## 7. 새 문자열 추가 / 다음 영역 이어가기

1. 대상 영역에서 하드코딩 한국어 탐색:
   ```bash
   grep -rnE '[가-힣]' "src/app/(user)/profile" "src/app/(user)/signup" "src/app/(user)/terms"
   ```
   (코드 주석·`"그 외 지역"` 같은 canonical 저장값은 제외 대상)
2. 새 네임스페이스(예: `Profile`/`Signup`/`Terms`)를 `messages/{ko,en,ta}.json` **세 파일 모두**에 동일 구조로 추가.
3. 컴포넌트에 `useTranslations`(async 서버는 `getTranslations`) 적용. 설정객체는 key 유지·텍스트만 메시지로, DB 결합 상수는 `Enums` 매핑.
4. `ta`(타갈로그) 초벌 번역은 제공하되 **네이티브 검수를 PR에 명시**.

### 검증 명령
```bash
npx eslint "src/app/(user)/<area>"          # 변경 영역 lint
npx tsc --noEmit                            # 타입 체크(기존 admin 사전 오류는 무관)
node -e "['ko','en','ta'].forEach(l=>JSON.parse(require('fs').readFileSync('messages/'+l+'.json','utf8')))"  # JSON 유효성
# 헤더 🌐로 ko→en→ta 전환하며 육안 확인 (DB 콘텐츠는 원문 유지되는지 함께 확인)
```
