import { encryptId, decryptId } from "@/utils/idCipher";

const DOMAIN = "user";

export function encryptUserId(id: number): string {
  return encryptId(id, DOMAIN);
}

export function decryptUserId(token: string): number | null {
  return decryptId(token, DOMAIN);
}

export function resolveUserId(idOrToken: string): number | null {
  const decrypted = decryptUserId(idOrToken);
  if (decrypted !== null) return decrypted;

  const n = Number(idOrToken);
  return Number.isInteger(n) && n > 0 ? n : null;
}
