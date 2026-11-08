import Link from "next/link";

// 미들웨어(로케일 라우팅)를 거치지 않는 경로에서만 쓰이는 최소 404 페이지.
// 일반 페이지의 404는 src/app/[locale]/not-found.tsx가 처리한다.
export default function RootNotFound() {
  return (
    <html lang="ko">
      <body style={{ fontFamily: "sans-serif", textAlign: "center", padding: "20vh 16px" }}>
        <h1>404</h1>
        <p>페이지를 찾을 수 없습니다.</p>
        <Link href="/main">칸토 메인으로</Link>
      </body>
    </html>
  );
}
