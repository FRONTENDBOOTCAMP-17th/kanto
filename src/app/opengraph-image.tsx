import Image from "next/image";
import { ImageResponse } from "next/og";

export const alt = "칸토";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#FFFFFF",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
        }}
      >
        <Image
          src={`${process.env.NEXT_PUBLIC_BASE_URL}/kantoLogo.png`}
          width={240}
          height={240}
          alt="칸토 로고"
        />
        <p style={{ fontSize: 48, fontWeight: "bold", color: "#1A1A1A", margin: 0 }}>
          칸토
        </p>
        <p style={{ fontSize: 24, color: "#666666", margin: 0 }}>
          필리핀 한인 중고거래 & 렌탈 플랫폼
        </p>
      </div>
    ),
    { ...size }
  );
}
