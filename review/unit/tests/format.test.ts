import { describe, it, expect } from "vitest";
import { formatPrice, formatDate } from "@/utils/format";

// 가격·날짜 포맷은 목록/상세/채팅 어디서나 쓰이는 순수 함수라,
// 한 곳이 틀어지면 화면 곳곳이 같이 틀어집니다. 단위테스트로 못 박아 둡니다.
describe("formatPrice", () => {
  it("값이 없으면(null/undefined) '가격 협의'로 보여준다", () => {
    expect(formatPrice(null)).toBe("가격 협의");
    expect(formatPrice(undefined)).toBe("가격 협의");
  });

  it("숫자는 페소 기호와 천 단위 콤마로 보여준다", () => {
    expect(formatPrice(1500000)).toBe("₱ 1,500,000");
  });

  it("0원은 협의가 아니라 '₱ 0'으로 구분한다", () => {
    expect(formatPrice(0)).toBe("₱ 0");
  });
});

describe("formatDate", () => {
  it("null이면 대시(-)로 막아 화면이 깨지지 않게 한다", () => {
    expect(formatDate(null)).toBe("-");
  });

  it("ISO 날짜를 한국식 yyyy. mm. dd 로 보여준다", () => {
    // ko-KR Intl 포맷은 '2026. 06. 14.' 형태
    expect(formatDate("2026-06-14T09:00:00Z")).toMatch(/2026\.\s*0?6\.\s*1[45]\./);
  });
});
