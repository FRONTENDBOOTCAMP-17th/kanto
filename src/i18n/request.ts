import { getRequestConfig } from "next-intl/server";
import { defaultLocale } from "./config";

// 서버는 항상 기본 로케일(ko)로 렌더링한다. cookies()/headers()를 여기서 읽으면
// Next.js가 이 설정을 쓰는 모든 라우트를 request-time dynamic rendering으로
// 강제 전환시켜 캐싱이 전부 꺼진다. 실제 언어 선호는 클라이언트에서
// LocaleProvider(src/i18n/LocaleProvider.tsx)가 쿠키를 읽어 반영한다.
export default getRequestConfig(async () => {
  return {
    locale: defaultLocale,
    messages: (await import(`../../messages/${defaultLocale}.json`)).default,
    timeZone: "Asia/Manila",
  };
});
