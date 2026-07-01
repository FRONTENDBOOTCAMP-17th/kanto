import { ImageResponse } from "next/og";

export const alt = "칸토";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BASE = process.env.NEXT_PUBLIC_BASE_URL!.replace(/\/$/, "");

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#080808",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
        }}
      >
        
        <div
          style={{
            position: "absolute",
            bottom: "-160px",
            left: "-80px",
            width: "700px",
            height: "700px",
            background: "radial-gradient(circle, rgba(13,148,136,0.18) 0%, transparent 65%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "-200px",
            right: "-100px",
            width: "500px",
            height: "500px",
            background: "radial-gradient(circle, rgba(5,150,105,0.08) 0%, transparent 65%)",
            display: "flex",
          }}
        />

        
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(13,148,136,0.6), transparent)",
            display: "flex",
          }}
        />

        
        <img
          src={`${BASE}/kantoLogo.png`}
          width={380}
          height={380}
          alt="칸토"
          style={{ objectFit: "contain" }}
        />
      </div>
    ),
    { ...size },
  );
}
