import { encryptId, decryptId } from "@/utils/idCipher";

const DOMAIN = "post";

export function encryptPostId(id: number): string {
  return encryptId(id, DOMAIN);
}

export function decryptPostId(token: string): number | null {
  return decryptId(token, DOMAIN);
}

// URL의 [id] 세그먼트가 암호화된 토큰이든, 기존에 공유된 평문 숫자 id든 모두 해석합니다.
export function resolvePostId(idOrToken: string): number | null {
  const decrypted = decryptPostId(idOrToken);
  if (decrypted !== null) return decrypted;

  const n = Number(idOrToken);
  return Number.isInteger(n) && n > 0 ? n : null;
}
