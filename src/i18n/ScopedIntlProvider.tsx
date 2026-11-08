import { getMessages, setRequestLocale } from "next-intl/server";
import { SEGMENT_CLIENT_NAMESPACES, type ClientSegment } from "./clientNamespaces";
import { pickMessages } from "./pickMessages";
import { MergeIntlMessages } from "./MergeIntlMessages";

// 세그먼트 레이아웃에서 사용: 해당 세그먼트의 클라이언트 컴포넌트가 쓰는 네임스페이스만 추가로 내려보낸다.
// locale은 레이아웃 params에서 받아 넘긴다: setRequestLocale을 호출해야 정적 렌더링이 유지된다.
export async function ScopedIntlProvider({
  segment,
  locale,
  children,
}: {
  segment: ClientSegment;
  locale: string;
  children: React.ReactNode;
}) {
  setRequestLocale(locale);
  const messages = await getMessages({ locale });
  return (
    <MergeIntlMessages messages={pickMessages(messages, SEGMENT_CLIENT_NAMESPACES[segment])}>
      {children}
    </MergeIntlMessages>
  );
}
