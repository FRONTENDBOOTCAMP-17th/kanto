import { memo, Profiler, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import type { MessageWithSender } from "@/type/chat/message";
import type { SellerInfo } from "@/type/user";
import type { Transaction } from "@/type/transaction";
import { formatDateDivider, formatMessageTime } from "@/utils/format";
import type { Locale } from "@/i18n/config";
import PaymentCard from "../features/payment/PaymentCard";
import FailedMessageActions from "./FailedMessageActions";
import { useExpiryStatus } from "../features/payment/_hooks/useExpiryStatus";

interface Props {
  msg: MessageWithSender;
  currentUser: SellerInfo;
  showDivider: boolean;
  showMeta: boolean;
  partnerOnline: boolean;
  onTransactionChange: (transaction: Transaction) => void;
  onRetry: (tempId: number) => void;
  onDelete: (tempId: number) => void;
}

function PaymentAttachmentStatus({ transaction }: { transaction: Transaction }) {
  const t = useTranslations("Chat");
  const { isTimedOut } = useExpiryStatus(transaction);

  if (isTimedOut || transaction.status === "expired") {
    return (
      <span className="rounded-full bg-gray-200/70 px-3 py-1 text-center text-xs md:text-[11px] text-gray-500 break-keep">
        {t("payment.expiredNotice")}
      </span>
    );
  }
  if (transaction.status === "pending") {
    return (
      <span className="rounded-full bg-gray-200/70 px-3 py-1 text-center text-xs md:text-[11px] text-gray-500 break-keep">
        {t("payment.pendingNotice")}
      </span>
    );
  }
  return null;
}

function UnreadMark({ partnerOnline }: { partnerOnline: boolean }) {
  const [visible, setVisible] = useState(!partnerOnline);
  useEffect(() => {
    const delay = partnerOnline ? 1000 : 0;
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [partnerOnline]);
  if (!visible) return null;
  return <span className="text-xs md:text-[10px] text-teal-500 font-medium">1</span>;
}

/** 말풍선 하나(날짜 구분선 포함). props가 같으면 memo로 리렌더를 건너뛴다. */
function MessageItem({
  msg,
  currentUser,
  showDivider,
  showMeta,
  partnerOnline,
  onTransactionChange,
  onRetry,
  onDelete,
}: Props) {
  const t = useTranslations("Chat");
  const locale = useLocale() as Locale;
  const isMine = msg.sender_id === currentUser.id;
  const tempId = msg.tempId;
  const isSending = isMine && msg.status === "sending";
  const isFailed = isMine && msg.status === "failed" && tempId !== undefined;

  return (
    // [측정용 임시 코드] memo가 렌더를 건너뛰면 기록되지 않도록 컴포넌트 안쪽에서 측정 (Fragment 자리)
    <Profiler
      id={`msg-${msg.id}`}
      onRender={(id, phase, actualDuration) => {
        const w = window as unknown as { __itemRenders?: unknown[] };
        (w.__itemRenders ??= []).push({ id, phase, actualDuration, content: msg.content });
      }}
    >
      {showDivider && (
        <div className="flex items-center gap-2 my-1">
          <div className="flex-1 h-px bg-gray-200" />
          <time dateTime={msg.created_at} className="text-xs md:text-[10px] text-gray-400">
            {formatDateDivider(msg.created_at, locale)}
          </time>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
      )}
      {msg.type === "system" ? (
        <div className="flex justify-center my-1">
          <span className="rounded-full bg-gray-200/70 px-3 py-1 text-center text-xs md:text-[11px] text-gray-500 break-keep">
            {msg.content}
          </span>
        </div>
      ) : (
      <div className={`flex flex-col gap-0.5 ${isMine ? "items-end" : "items-start"}`}>
        <div className={`flex items-end gap-1 ${isMine ? "flex-row-reverse" : ""}`}>
          {msg.type === "payment" && msg.transaction ? (
            <div className="flex flex-col items-center gap-1.5">
              <PaymentCard
                transaction={msg.transaction}
                currentUser={currentUser}
                onTransactionChange={onTransactionChange}
              />
              <PaymentAttachmentStatus transaction={msg.transaction} />
            </div>
          ) : (
            <div
              className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm md:text-xs leading-relaxed break-keep ${
                isMine
                  ? "bg-teal-500 text-white rounded-tr-sm"
                  : "bg-white text-gray-800 rounded-tl-sm shadow-sm"
              } ${isSending || isFailed ? "opacity-60" : ""}`}
            >
              {msg.content}
            </div>
          )}
          <div className={`flex flex-col shrink-0 ${isMine ? "items-end" : "items-start"} ${showMeta ? "" : "invisible"}`}>
            {isMine && !msg.is_read && <UnreadMark partnerOnline={partnerOnline} />}
            <time dateTime={msg.created_at} className="text-xs md:text-[10px] text-gray-400">
              {formatMessageTime(msg.created_at, locale)}
            </time>
          </div>
        </div>
        {isSending && (
          <span className="flex items-center gap-1 text-xs md:text-[10px] text-gray-400">
            <span className="size-3 animate-spin rounded-full border-2 border-gray-300 border-t-teal-500" />
            {t("messageSending")}
          </span>
        )}
        {isFailed && (
          <FailedMessageActions
            failedLabel={t("messageFailed")}
            retryLabel={t("messageRetry")}
            deleteLabel={t("messageDelete")}
            onRetry={() => onRetry(tempId)}
            onDelete={() => onDelete(tempId)}
            textClassName="text-xs md:text-[10px]"
          />
        )}
      </div>
      )}
    </Profiler>
  );
}

export default memo(MessageItem);
