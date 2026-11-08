import { getMessages } from "next-intl/server";
import { SEGMENT_CLIENT_NAMESPACES, type ClientSegment } from "./clientNamespaces";
import { pickMessages } from "./pickMessages";
import { MergeIntlMessages } from "./MergeIntlMessages";

// 세그먼트 레이아웃에서 사용: 해당 세그먼트의 클라이언트 컴포넌트가 쓰는 네임스페이스만 추가로 내려보낸다.
export async function ScopedIntlProvider({
  segment,
  children,
}: {
  segment: ClientSegment;
  children: React.ReactNode;
}) {
  const messages = await getMessages();
  return (
    <MergeIntlMessages messages={pickMessages(messages, SEGMENT_CLIENT_NAMESPACES[segment])}>
      {children}
    </MergeIntlMessages>
  );
}
