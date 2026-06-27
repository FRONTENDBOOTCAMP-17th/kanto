import { ImageResponse } from "next/og";
import { createAdminClient } from "@/utils/supabase/admin";
import Image from "next/image";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({
  params,
}: {
  params: Promise<{ id: number }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("jobs")
    .select("images, company_name, salary, posts!inner(title)")
    .eq("post_id", id)
    .single();

  const title = (data?.posts as { title: string } | null)?.title ?? "칸토 구인구직";
  const image = (data?.images as string[] | null)?.[0];
  const companyName = data?.company_name;
  const salary = data?.salary;

  return new ImageResponse(
    (
      <div
        style={{
          background: "#FFFFFF",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          padding: "60px",
          gap: "40px",
        }}
      >
        {image && (
          <Image
            src={image}
            width={400}
            height={400}
            style={{ objectFit: "cover", borderRadius: "12px" }}
            alt={title}
          />
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <p style={{ fontSize: 40, fontWeight: "bold", color: "#1A1A1A", margin: 0 }}>
            {title}
          </p>
          {companyName && (
            <p style={{ fontSize: 28, color: "#444444", margin: 0 }}>{companyName}</p>
          )}
          {salary != null && (
            <p style={{ fontSize: 32, color: "#E85D04", margin: 0 }}>
              ₱ {salary.toLocaleString()}
            </p>
          )}
          <p style={{ fontSize: 24, color: "#888888", margin: 0 }}>칸토 구인구직</p>
        </div>
      </div>
    ),
    { ...size }
  );
}
