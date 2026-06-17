import type { Tables } from "@/type/supabase";

export type Transaction = Tables<"transactions">;
export type TransactionStatus = Transaction["status"];
