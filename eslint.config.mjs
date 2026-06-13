import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      "no-restricted-imports": ["error", {
        paths: [{
          name: "@/lib/supabaseServer",
          message: "createSupabaseServerClient는 삭제되었습니다. @/utils/supabase/server 의 createClient 를 사용하세요.",
        }],
      }],
    },
  },
]);

export default eslintConfig;
