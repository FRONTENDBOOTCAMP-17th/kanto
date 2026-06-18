import type { Tables } from "@/type/supabase";
import type { SellerInfo } from "../user";
import type { Transaction } from "../transaction";

export type Message = Tables<"messages">;

export interface MessageWithSender extends Message {
  sender: SellerInfo;
  transaction?: Transaction | null;
  tempId?: number;
}
