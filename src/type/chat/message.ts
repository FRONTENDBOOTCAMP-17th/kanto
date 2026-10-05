import type { Tables } from "@/type/supabase";
import type { SellerInfo } from "../user";
import type { Transaction } from "../transaction";

export type Message = Tables<"messages">;

/** 낙관적으로 추가한 메시지의 전송 상태. 값이 없으면 정상(또는 1초 미만의 전송 중)이다. */
export type MessageSendStatus = "sending" | "failed";

export interface MessageWithSender extends Message {
  sender: SellerInfo;
  transaction?: Transaction | null;
  tempId?: number;
  status?: MessageSendStatus;
}
