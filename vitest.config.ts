import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

// review/unit 은 리뷰 전용 별도 하네스라 제외하고, src 안의 colocated 테스트만 실행한다.
export default defineConfig({
  resolve: {
    alias: { "@": resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
