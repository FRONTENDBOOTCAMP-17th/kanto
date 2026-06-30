import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  const mapUrl =
    `https://maps.googleapis.com/maps/api/staticmap` +
    `?center=14.5547,121.0244` +
    `&zoom=11` +
    `&size=1200x630` +
    `&scale=2` +
    `&style=feature:poi|visibility:off` +
    `&style=feature:transit|visibility:off` +
    `&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
        }}
      >
        <img src={mapUrl} width={1200} height={630} style={{ objectFit: "cover" }} alt="" />
        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: 40,
            background: "rgba(15, 23, 42, 0.72)",
            borderRadius: "16px",
            padding: "20px 28px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            backdropFilter: "blur(8px)",
          }}
        >
          <p style={{ color: "#ffffff", fontSize: 42, fontWeight: "bold", margin: 0 }}>
            칸토 Go! ⚡
          </p>
          <p style={{ color: "#94a3b8", fontSize: 22, margin: 0 }}>
            필리핀 한인 번개 모임 지도
          </p>
        </div>
      </div>
    ),
    { ...size }
  );
}
