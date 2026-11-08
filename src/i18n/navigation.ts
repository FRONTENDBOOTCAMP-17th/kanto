import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// next/link, next/navigation 대신 사용: 현재 로케일 접두사를 자동으로 붙이고,
// usePathname은 로케일 접두사를 뗀 경로(/main 등)를 돌려준다.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
