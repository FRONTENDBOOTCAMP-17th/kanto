import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const secret = process.env.ID_ENCRYPTION_SECRET;
  if (!secret || secret.length !== 64) {
    throw new Error("ID_ENCRYPTION_SECRET 환경변수가 64자리 hex 문자열로 설정되어야 합니다.");
  }
  return Buffer.from(secret, "hex");
}

export function encryptId(id: number, domain: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(Buffer.from(domain, "utf8"));
  const encrypted = Buffer.concat([cipher.update(String(id), "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64url");
}

export function decryptId(token: string, domain: string): number | null {
  try {
    const key = getKey();
    const raw = Buffer.from(token, "base64url");
    if (raw.length <= IV_LENGTH + AUTH_TAG_LENGTH) return null;

    const iv = raw.subarray(0, IV_LENGTH);
    const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAAD(Buffer.from(domain, "utf8"));
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");

    const id = Number(decrypted);
    return Number.isInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}
