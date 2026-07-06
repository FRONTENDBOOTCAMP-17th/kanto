# Google Maps APIProvider 통합 및 중복 로드 에러 수정

작성: `박소유`
일자: 2026-07-04
근거 커밋: `b49a29e`, `4809245`

## 1. 배경

Google Maps를 사용하는 화면이 늘어나면서 각 컴포넌트가 개별적으로 `APIProvider`를 감싸는 구조가 되었다. 칸토GO 지도, 상세 페이지 지도, 위치 선택 컴포넌트가 서로 다른 위치에서 Provider를 생성했고, 일부 Provider는 `libraries` 옵션이 달라 Google Maps 스크립트 중복 로드 경고와 초기화 충돌 가능성이 있었다.

## 2. 문제

- `CompanyLocationMap`, `ApproxAreaMapWithProvider`, `GoClient`가 각각 `APIProvider`를 생성했다.
- 일부 Provider는 `libraries={["places"]}` 없이 로드되어, Places API를 사용하는 경로와 옵션이 일치하지 않았다.
- 같은 페이지 안에서 지도 컴포넌트가 중첩되거나 전환될 때 Google Maps API가 다른 옵션으로 다시 로드될 수 있었다.

## 3. 처리

### 3-1. 단기 수정: libraries 옵션 통일

먼저 지도 Provider가 남아 있는 컴포넌트의 `libraries` 값을 `["places"]`로 맞춰 중복 로드 에러를 줄였다.

- `CompanyLocationMap`
- `ApproxAreaMapWithProvider`

### 3-2. 전역 Provider로 단일화

이후 `src/components/common/Providers.tsx`에서 앱 공통 Provider로 `APIProvider`를 한 번만 감싸도록 구조를 바꿨다.

- `Providers`에 `APIProvider` 추가
- `libraries={["places"]}`, `version="weekly"`를 전역 기준으로 고정
- 하위 지도 컴포넌트에서는 `Map`, `AdvancedMarker`, `useMap`만 사용
- `GoClient`의 중첩 `APIProvider` 제거
- `ApproxAreaMapWithProvider` 제거

## 4. 변경 파일

| 파일 | 변경 내용 |
|---|---|
| `src/components/common/Providers.tsx` | Google Maps `APIProvider` 전역 제공 |
| `src/app/(user)/go/_components/GoClient.tsx` | 중첩 Provider 제거 |
| `src/app/(user)/job/[id]/_components/CompanyLocationMap.tsx` | Provider 제거, `Map` 직접 사용 |
| `src/components/common/ApproxAreaMap.tsx` | Provider 래퍼 제거 |
| `src/app/(user)/rental/[id]/_components/AccommondationInfo.tsx` | 변경된 지도 컴포넌트 사용 흐름 반영 |
| `src/app/(user)/usedgoods/[id]/_components/UsedGoodsDetail.tsx` | 변경된 지도 컴포넌트 사용 흐름 반영 |
| `src/components/common/LocationPicker.tsx` | 전역 Provider 기준으로 정리 |

## 5. 결과

- Google Maps API 로드 지점이 앱 전역 1곳으로 고정됐다.
- `libraries` 옵션이 모든 지도 사용처에서 동일하게 적용된다.
- 지도 컴포넌트가 화면 안에서 조합되어도 Provider 중복 생성 위험이 줄었다.

## 6. 검증

- 지도 사용 페이지에서 Google Maps 중복 로드 경고가 사라지는지 확인 필요
  - `/go`
  - 구인 상세 지도
  - 렌탈/중고거래 상세 위치 지도
  - 위치 선택 모달
- `npx tsc --noEmit`, `npx eslint` 기준으로 타입/린트 확인 권장

