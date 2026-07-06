import { encryptId, decryptId } from "@/utils/idCipher";

const DOMAIN = "post";

export function encryptPostId(id: number): string {
  return encryptId(id, DOMAIN);
}

export function decryptPostId(token: string): number | null {
  return decryptId(token, DOMAIN);
}

export function resolvePostId(idOrToken: string): number | null {
  const decrypted = decryptPostId(idOrToken);
  if (decrypted !== null) return decrypted;

  const n = Number(idOrToken);
  return Number.isInteger(n) && n > 0 ? n : null;
}
