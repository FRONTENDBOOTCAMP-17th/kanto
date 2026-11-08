// NextIntlClientProvider로 클라이언트에 내려보낼 메시지 네임스페이스 목록.
// 전체 messages(~50KB)를 모든 HTML/RSC 응답에 싣지 않도록, 전역 레이아웃(헤더·푸터·채팅 위젯 등)이
// 쓰는 네임스페이스만 루트에서 내리고 나머지는 세그먼트 레이아웃에서 필요한 것만 추가한다.
//
// "use client" 컴포넌트에서 새 네임스페이스로 useTranslations를 쓰면 여기에 추가해야 한다.
// (src/i18n/clientNamespaces.test.ts 가 import 그래프를 따라가며 누락 여부를 검사한다)

export const GLOBAL_CLIENT_NAMESPACES = [
  "Chat",
  "Chatbot",
  "Common",
  "Footer",
  "Go",
  "Header",
  "LanguageSwitcher",
  "Notice",
  "Notifications",
  "Report",
] as const;

export const SEGMENT_CLIENT_NAMESPACES = {
  create: ["Create"],
  favorites: ["Enums", "Favorites", "Job", "Main", "Rental", "UsedGoods"],
  job: ["Enums", "Job"],
  login: ["Auth", "FindPassword"],
  main: ["Main"],
  myposts: ["Enums", "Favorites", "Job", "Main", "Rental", "UsedGoods"],
  profile: ["Enums", "Profile", "Time"],
  rental: ["Enums", "Main", "Rental", "Time"],
  signup: ["Auth", "Signup"],
  terms: ["Terms"],
  usedgoods: ["Enums", "Main", "Time", "UsedGoods"],
  user: ["Profile", "PublicProfile", "Time"],
} as const;

export type ClientSegment = keyof typeof SEGMENT_CLIENT_NAMESPACES;
