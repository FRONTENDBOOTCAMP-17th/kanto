// <html>/<body>는 src/app/[locale]/layout.tsx에서 렌더링한다.
// 이 파일은 로케일 밖 경로용 src/app/not-found.tsx를 위해서만 존재한다.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
