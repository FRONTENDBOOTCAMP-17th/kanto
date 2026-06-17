import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getRentalDetail } from "@/services/rental/rental";
import RentalCreateForm from "@/app/(user)/rental/create/_components/RentalCreateForm";

export default async function RentalEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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
    rental = await getRentalDetail(Number(id));
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
        }}
      />
    </div>
  );
}
