import { Noto_Sans_KR } from "next/font/google";
import { BusinessHeader } from "./_components/BusinessHeader";

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto-sans-kr",
  display: "swap",
});

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${notoSansKR.variable} min-h-screen bg-gray-950 dark`}
      style={{ fontFamily: "var(--font-noto-sans-kr), sans-serif" }}
    >
      <BusinessHeader />
      {children}
    </div>
  );
}
