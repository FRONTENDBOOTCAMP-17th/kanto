"use client";

import { useMemo } from "react";
import {
  NextIntlClientProvider,
  useLocale,
  useMessages,
  type AbstractIntlMessages,
} from "next-intl";

// 상위 NextIntlClientProvider의 메시지에 세그먼트 전용 메시지를 합쳐 하위 트리에 제공한다.
// (중첩 Provider는 messages를 병합하지 않고 덮어쓰기 때문에 클라이언트에서 합친다)
export function MergeIntlMessages({
  messages,
  children,
}: {
  messages: AbstractIntlMessages;
  children: React.ReactNode;
}) {
  const parent = useMessages();
  const locale = useLocale();
  const merged = useMemo(() => ({ ...parent, ...messages }), [parent, messages]);

  return (
    <NextIntlClientProvider locale={locale} messages={merged}>
      {children}
    </NextIntlClientProvider>
  );
}
