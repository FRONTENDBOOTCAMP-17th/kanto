import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getRentalDetail } from "@/services/rental/rental";
import RentalCreateForm from "@/app/[locale]/(user)/rental/create/_components/RentalCreateForm";
import { resolvePostId } from "@/utils/postIdCipher";

// 로그인 사용자 쿠키를 읽는 화면이므로 항상 동적 렌더링한다.
// (명시하지 않으면 try/catch로 감싼 cookies() 호출이 빌드 시 정적 렌더링으로 잘못 굳을 수 있다)
export const dynamic = "force-dynamic";

export default async function RentalEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const postId = resolvePostId(id);
  if (postId === null) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: dbUser } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!dbUser) redirect("/login");

  let rental;
  try {
    rental = await getRentalDetail(postId);
  } catch {
    notFound();
  }

  if (!rental || !rental.post_id) notFound();

  return (
    <div className="page-wrapper">
      <RentalCreateForm
        userId={dbUser.id}
        initialData={{
          post_id: rental.post_id,
          title: rental.posts.title,
          price: rental.price,
          deposit: rental.deposit,
          rent_type: rental.rent_type,
          room_type: rental.room_type,
          max_occupants: rental.max_occupants,
          description: rental.description,
          amenities: rental.amenities as string[] | null,
          images: rental.images as string[] | null,
          location: rental.location,
          location_detail: rental.location_detail,
          location_barangay: rental.location_barangay,
          location_city: rental.location_city,
          location_lat: rental.location_lat,
          location_lng: rental.location_lng,
        }}
      />
    </div>
  );
}
