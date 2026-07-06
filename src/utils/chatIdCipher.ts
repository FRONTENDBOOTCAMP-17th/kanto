import { encryptId, decryptId } from "@/utils/idCipher";

const DOMAIN = "chat";

export function encryptChatId(id: number): string {
  return encryptId(id, DOMAIN);
}

export function decryptChatId(token: string): number | null {
  return decryptId(token, DOMAIN);
}

export function resolveChatId(idOrToken: string): number | null {
  const decrypted = decryptChatId(idOrToken);
  if (decrypted !== null) return decrypted;

  const n = Number(idOrToken);
  return Number.isInteger(n) && n > 0 ? n : null;
}
