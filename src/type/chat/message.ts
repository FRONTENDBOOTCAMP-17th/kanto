import type { Tables } from "@/type/supabase";
import type { SellerInfo } from "../user";

export type Message = Tables<"messages">;

export interface MessageWithSender extends Message {
  sender: SellerInfo;
}
