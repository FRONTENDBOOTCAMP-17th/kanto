// @vitest-environment node
import { createCipheriv, randomBytes } from "crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { decryptId, encryptId } from "./idCipher";

const SECRET = "a".repeat(64);

beforeAll(() => {
  process.env.ID_ENCRYPTION_SECRET = SECRET;
});

describe("idCipher", () => {
  it("같은 id·domain은 항상 같은 토큰을 만든다", () => {
    expect(encryptId(42, "post")).toBe(encryptId(42, "post"));
  });

  it("id나 domain이 다르면 토큰이 달라진다", () => {
    expect(encryptId(42, "post")).not.toBe(encryptId(43, "post"));
    expect(encryptId(42, "post")).not.toBe(encryptId(42, "user"));
  });

  it("암호화한 토큰을 같은 domain으로 복호화하면 원래 id가 나온다", () => {
    expect(decryptId(encryptId(42, "post"), "post")).toBe(42);
    expect(decryptId(encryptId(42, "post"), "user")).toBeNull();
  });

  it("예전 랜덤 IV 방식으로 만든 토큰도 복호화된다", () => {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", Buffer.from(SECRET, "hex"), iv);
    cipher.setAAD(Buffer.from("post", "utf8"));
    const encrypted = Buffer.concat([cipher.update("42", "utf8"), cipher.final()]);
    const legacyToken = Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");

    expect(decryptId(legacyToken, "post")).toBe(42);
    expect(legacyToken).not.toBe(encryptId(42, "post"));
  });
});
