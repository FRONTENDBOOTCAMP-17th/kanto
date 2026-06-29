# SEO 메타데이터 최적화 설계

작성일: 2026-06-27  
작성자: 김도혁  
작업 브랜치: `feat/427-metaData`

---

## 개요

현재 프로젝트는 루트 레이아웃의 `metadata`가 Next.js 기본값(`"Create Next App"`)인 상태이며, `robots.ts`, `sitemap.ts`, `manifest.ts`, OG 이미지, JSON-LD 등이 모두 미구현이다. 이 문서는 해당 항목들을 Next.js App Router 방식으로 구현하는 방법을 정의한다.

- **프로젝트**: Next.js (App Router), React 19, TypeScript, next-intl (ko/en/fil)
- **기준 URL 환경변수**: `NEXT_PUBLIC_BASE_URL` (예: `https://kanto.example.com`)
- **동적 데이터 소스**: Supabase

---

## 1. 기본 메타태그 및 OG 태그

### 1-1. 루트 메타데이터 (`src/app/layout.tsx`)

`Metadata` 객체에 `metadataBase`를 지정하면 OG 이미지 등 상대경로를 절대경로로 자동 변환한다.

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!;

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "칸토 | 필리핀 한인 중고거래 & 렌탈 플랫폼",
    template: "%s | 칸토",
  },
  description: "필리핀 한인 커뮤니티를 위한 중고거래, 렌탈, 구인구직 플랫폼입니다.",
  keywords: ["칸토", "필리핀 한인", "중고거래", "렌탈", "구인구직"],
  authors: [{ name: "칸토" }],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: BASE_URL,
    siteName: "칸토",
    title: "칸토 | 필리핀 한인 중고거래 & 렌탈 플랫폼",
    description: "필리핀 한인 커뮤니티를 위한 중고거래, 렌탈, 구인구직 플랫폼입니다.",
    images: [
      {
        url: "/og-image.png", // metadataBase 기준 절대경로로 변환
        width: 1200,
        height: 630,
        alt: "칸토 로고",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "칸토 | 필리핀 한인 중고거래 & 렌탈 플랫폼",
    description: "필리핀 한인 커뮤니티를 위한 중고거래, 렌탈, 구인구직 플랫폼입니다.",
    images: ["/og-image.png"],
  },
};
```

### 1-2. 동적 페이지 메타데이터 (`generateMetadata`)

동적 라우트(`[id]`)는 `generateMetadata` 함수로 Supabase에서 데이터를 가져와 메타데이터를 생성한다.

**적용 대상 페이지**:
- `src/app/(user)/rental/[id]/page.tsx`
- `src/app/(user)/usedgoods/[id]/page.tsx`
- `src/app/(user)/job/[id]/page.tsx`
- `src/app/(user)/user/[id]/page.tsx`

```tsx
// 예시: src/app/(user)/usedgoods/[id]/page.tsx
import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server"; // 기존 서버 클라이언트 함수 재사용

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data: post } = await supabase
    .from("usedgoods")
    .select("title, description, images")
    .eq("id", id)
    .single();

  if (!post) return { title: "게시글을 찾을 수 없습니다" };

  const ogImage = post.images?.[0] ?? "/og-image.png";

  return {
    title: post.title,
    description: post.description?.slice(0, 160),
    openGraph: {
      title: post.title,
      description: post.description?.slice(0, 160),
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
      type: "article",
    },
  };
}
```

---

## 2. Canonical URL 및 hreflang

### 2-1. Canonical URL

`alternates.canonical`을 지정해 중복 콘텐츠 문제를 방지한다.

```tsx
// src/app/layout.tsx의 metadata에 추가
export const metadata: Metadata = {
  // ...기존 설정
  alternates: {
    canonical: BASE_URL,
  },
};
```

동적 페이지에서는 `generateMetadata`에 포함한다.

```tsx
return {
  // ...기존 설정
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_BASE_URL}/usedgoods/${id}`,
  },
};
```

### 2-2. hreflang (next-intl 연동)

next-intl 라우팅과 연동해 언어별 대체 URL을 명시한다. 루트 레이아웃에 설정하면 모든 페이지에 상속된다.

```tsx
// src/app/layout.tsx
export const metadata: Metadata = {
  // ...기존 설정
  alternates: {
    canonical: BASE_URL,
    languages: {
      "ko-KR": `${BASE_URL}/ko`,
      "en-US": `${BASE_URL}/en`,
      "fil": `${BASE_URL}/fil`,
      "x-default": BASE_URL,
    },
  },
};
```

동적 페이지의 경우 locale별 경로를 모두 포함한다.

```tsx
alternates: {
  canonical: `${BASE_URL}/ko/usedgoods/${id}`,
  languages: {
    "ko-KR": `${BASE_URL}/ko/usedgoods/${id}`,
    "en-US": `${BASE_URL}/en/usedgoods/${id}`,
    "fil": `${BASE_URL}/fil/usedgoods/${id}`,
  },
},
```

---

## 3. 검색엔진 크롤링 설정

### 3-1. robots.ts

`src/app/robots.ts`를 생성하면 Next.js가 `/robots.txt`로 자동 서빙한다.

```ts
// src/app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",  // 관리자 페이지 크롤링 차단
          "/api/",
          "/chat/",   // 개인 채팅 차단
          "/profile/edit",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
```

### 3-2. sitemap.ts

정적 라우트와 Supabase에서 가져온 동적 라우트를 합쳐 생성한다.

```ts
// src/app/sitemap.ts
import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin"; // 서비스 역할 키 사용

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createAdminClient();

  // 동적 라우트 데이터 병렬 조회
  const [usedgoods, rentals, jobs] = await Promise.all([
    supabase.from("usedgoods").select("id, updated_at").eq("status", "active"),
    supabase.from("rentals").select("id, updated_at").eq("status", "active"),
    supabase.from("jobs").select("id, updated_at").eq("status", "active"),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/main`, lastModified: new Date(), priority: 1 },
    { url: `${BASE_URL}/usedgoods`, lastModified: new Date(), priority: 0.9 },
    { url: `${BASE_URL}/rental`, lastModified: new Date(), priority: 0.9 },
    { url: `${BASE_URL}/job`, lastModified: new Date(), priority: 0.9 },
  ];

  const dynamicRoutes: MetadataRoute.Sitemap = [
    ...(usedgoods.data ?? []).map((item) => ({
      url: `${BASE_URL}/usedgoods/${item.id}`,
      lastModified: new Date(item.updated_at),
      priority: 0.7,
    })),
    ...(rentals.data ?? []).map((item) => ({
      url: `${BASE_URL}/rental/${item.id}`,
      lastModified: new Date(item.updated_at),
      priority: 0.7,
    })),
    ...(jobs.data ?? []).map((item) => ({
      url: `${BASE_URL}/job/${item.id}`,
      lastModified: new Date(item.updated_at),
      priority: 0.7,
    })),
  ];

  return [...staticRoutes, ...dynamicRoutes];
}
```

### 3-3. GSC(Google Search Console) 등록 절차

1. [Google Search Console](https://search.google.com/search-console) 접속 → 속성 추가
2. **도메인 소유권 확인**: HTML 파일 업로드 방식 사용
   - 다운로드한 `google<token>.html` 파일을 `public/` 폴더에 추가
   - `next.config.ts`에 별도 설정 불필요 (public 파일은 자동 서빙)
3. sitemap.xml URL(`{BASE_URL}/sitemap.xml`) 제출

### 3-4. 네이버 서치어드바이저 등록 절차

1. [네이버 서치어드바이저](https://searchadvisor.naver.com/) 접속 → 사이트 등록
2. **소유권 확인**: HTML 파일 인증 방식
   - 다운로드한 `naver<token>.html` 파일을 `public/` 폴더에 추가
3. 검증 후 sitemap.xml 제출

---

## 4. JSON-LD 구조화 데이터

JSON-LD는 Google이 리치 스니펫(별점, 가격 등)을 렌더링하는 데 사용한다. 서버 컴포넌트에서 `<script type="application/ld+json">` 태그를 직접 삽입한다.

**적용 Schema.org 타입**:

| 페이지 | 타입 |
|--------|------|
| 중고거래 상세 | `Product` |
| 렌탈 상세 | `Product` + `Offer` |
| 구인구직 상세 | `JobPosting` |
| 프로필 | `Person` |
| 루트/메인 | `Organization` + `WebSite` |

### 예시: 중고거래 상세 페이지

```tsx
// src/app/(user)/usedgoods/[id]/page.tsx
export default async function UsedGoodsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: post } = await supabase
    .from("usedgoods")
    .select("*")
    .eq("id", id)
    .single();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: post.title,
    description: post.description,
    image: post.images?.[0],
    offers: {
      "@type": "Offer",
      price: post.price,
      priceCurrency: "PHP",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* 기존 페이지 컴포넌트 */}
    </>
  );
}
```

### 예시: 루트 레이아웃 Organization

```tsx
// src/app/layout.tsx
const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "칸토",
  url: process.env.NEXT_PUBLIC_BASE_URL,
  logo: `${process.env.NEXT_PUBLIC_BASE_URL}/kantoLogo.png`,
  sameAs: [],
};

// return 내부
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
/>
```

---

## 5. 동적 OG 이미지

Next.js의 `ImageResponse`를 활용해 게시글별 OG 이미지를 엣지 런타임에서 동적으로 생성한다.

### 5-1. 기본 OG 이미지 (`opengraph-image.tsx`)

```tsx
// src/app/opengraph-image.tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "칸토";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#FFFFFF",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img src="칸토 로고 URL" width={240} height={240} alt="칸토 로고" />
        <p style={{ fontSize: 48, fontWeight: "bold", color: "#1A1A1A" }}>
          칸토
        </p>
        <p style={{ fontSize: 24, color: "#666666" }}>
          필리핀 한인 중고거래 & 렌탈 플랫폼
        </p>
      </div>
    ),
    { ...size }
  );
}
```

### 5-2. 게시글별 동적 OG 이미지

```tsx
// src/app/(user)/usedgoods/[id]/opengraph-image.tsx
import { ImageResponse } from "next/og";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: post } = await supabase
    .from("usedgoods")
    .select("title, price, images")
    .eq("id", id)
    .single();

  return new ImageResponse(
    (
      <div
        style={{
          background: "#FFFFFF",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          padding: "60px",
          gap: "40px",
        }}
      >
        {post?.images?.[0] && (
          <img
            src={post.images[0]}
            width={400}
            height={400}
            style={{ objectFit: "cover", borderRadius: "12px" }}
            alt={post.title}
          />
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <p style={{ fontSize: 40, fontWeight: "bold", color: "#1A1A1A" }}>
            {post?.title}
          </p>
          <p style={{ fontSize: 32, color: "#E85D04" }}>
            ₱ {post?.price?.toLocaleString()}
          </p>
          <p style={{ fontSize: 24, color: "#888888" }}>칸토 중고거래</p>
        </div>
      </div>
    ),
    { ...size }
  );
}
```

동일 패턴을 `rental/[id]/`, `job/[id]/`에도 적용한다.

---

## 6. 성능 최적화

### 6-1. Core Web Vitals 기준

| 지표 | 설명 | 목표값 |
|------|------|--------|
| LCP (Largest Contentful Paint) | 최대 콘텐츠 렌더링 시간 | ≤ 2.5s |
| FID (First Input Delay) | 첫 입력 응답 지연 | ≤ 100ms |
| CLS (Cumulative Layout Shift) | 누적 레이아웃 이동 | ≤ 0.1 |
| INP (Interaction to Next Paint) | 상호작용 응답 시간 | ≤ 200ms |

**측정 방법**: `npx next build && npx next start` 후 [PageSpeed Insights](https://pagespeed.web.dev/) 또는 Chrome DevTools Lighthouse 탭 사용

**주요 개선 방향**:
- LCP: 히어로 이미지에 `priority` prop 추가
- CLS: 이미지에 `width`/`height` 또는 `fill` + `sizes` 명시
- 폰트 최적화: `next/font` 사용 (이미 Geist 폰트 적용됨)

### 6-2. 이미지 최적화

현재 프로젝트에서 `next/image`를 사용하는 파일은 16개이다. 아래 규칙을 준수한다.

**`alt` 속성 작성 기준**:

| 이미지 유형 | alt 작성 방법 | 예시 |
|------------|--------------|------|
| 상품 이미지 | 상품명 + 주요 특성 | `"빨간 자전거 앞면"` |
| 사용자 아바타 | `"{닉네임} 프로필 사진"` | `"홍길동 프로필 사진"` |
| 장식용 아이콘 | 빈 문자열 `""` | `""` |
| 로고 | 브랜드명 + "로고" | `"칸토 로고"` |
| 버튼 내 아이콘 | 빈 문자열 (버튼에 텍스트가 있는 경우) | `""` |

**이미지 사이즈 최적화**:

```tsx
// 고정 크기 이미지
<Image src={src} alt={alt} width={400} height={300} />

// 반응형 이미지 (부모 컨테이너 기준 fill)
<div style={{ position: "relative", aspectRatio: "4/3" }}>
  <Image
    src={src}
    alt={alt}
    fill
    sizes="(max-width: 768px) 100vw, 50vw"
    style={{ objectFit: "cover" }}
  />
</div>

// 히어로 이미지 (LCP 개선)
<Image src={src} alt={alt} priority width={1200} height={630} />
```

---

## 7. PWA 매니페스트

### 7-1. manifest.ts

`src/app/manifest.ts`를 생성하면 `/manifest.json`으로 자동 서빙된다.

```ts
// src/app/manifest.ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "칸토 - 필리핀 한인 플랫폼",
    short_name: "칸토",
    description: "필리핀 한인 커뮤니티를 위한 중고거래, 렌탈, 구인구직 플랫폼",
    start_url: "/main",
    display: "standalone",         // 브라우저 UI 없이 앱처럼 표시
    background_color: "#FFFFFF",
    theme_color: "#E85D04",        // 상단 상태바 색상 (칸토 브랜드 컬러로 변경)
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    screenshots: [
      {
        src: "/screenshot-mobile.png",
        sizes: "390x844",
        type: "image/png",
        form_factor: "narrow",
      },
    ],
  };
}
```

### 7-2. 필요한 아이콘 파일 (`public/`)

| 파일명 | 크기 | 용도 |
|--------|------|------|
| `icon-192.png` | 192×192 | Android 홈 화면 |
| `icon-512.png` | 512×512 | Android 스플래시 |
| `apple-touch-icon.png` | 180×180 | iOS 홈 화면 추가 |

iOS는 manifest를 지원하지 않으므로 레이아웃에서 별도로 지정한다.

```tsx
// src/app/layout.tsx의 metadata에 추가
export const metadata: Metadata = {
  // ...기존 설정
  appleWebApp: {
    capable: true,
    title: "칸토",
    statusBarStyle: "default",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};
```

---

## 구현 순서 및 검증

### 구현 순서

1. `src/app/layout.tsx` — `metadata` 기본값 수정, `metadataBase` 추가
2. `src/app/robots.ts` — 생성 및 `/robots.txt` 응답 확인
3. `src/app/sitemap.ts` — 생성 및 `/sitemap.xml` 응답 확인
4. `src/app/opengraph-image.tsx` — 기본 OG 이미지 생성
5. 동적 페이지 `generateMetadata` — rental, usedgoods, job 순으로 적용
6. 동적 페이지 `opengraph-image.tsx` — 각 [id] 폴더에 추가
7. JSON-LD — 루트 레이아웃(Organization) → 동적 페이지(Product, JobPosting)
8. `src/app/manifest.ts` — 생성 및 아이콘 파일 추가
9. GSC, 네이버 서치어드바이저 소유권 파일 `public/`에 추가 후 등록

### 검증 방법

| 항목 | 검증 방법 |
|------|----------|
| 메타태그 | [Open Graph Debugger](https://developers.facebook.com/tools/debug/) 또는 브라우저 `<head>` 확인 |
| robots.txt | `{BASE_URL}/robots.txt` 직접 접속 |
| sitemap.xml | `{BASE_URL}/sitemap.xml` 직접 접속 |
| manifest | `{BASE_URL}/manifest.json` 직접 접속, Chrome DevTools Application 탭 |
| JSON-LD | [Schema Markup Validator](https://validator.schema.org/) |
| OG 이미지 | `{BASE_URL}/opengraph-image` 직접 접속 |
| Core Web Vitals | Lighthouse (`npx next build && npx next start` 후) |
| 홈 화면 추가 | Android: Chrome → 메뉴 → 홈 화면에 추가 |
