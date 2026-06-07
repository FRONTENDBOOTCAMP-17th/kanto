import { formatTimeAgo } from "@/utils/formatTime";
import { Siren, Heart, Share2, Clock, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RentalWithPost } from "@/type/rental/rental";

export default function PostInfo({ rental }: { rental: RentalWithPost }) {
  return (
    <div className="mt-6">
      <h1 className="text-2xl font-semibold">{rental.posts.title}</h1>
      <p className="text-gray-500 text-sm mt-1">
        {rental.room_type} · {rental.location_detail ?? rental.location}
      </p>

      <div className="flex gap-2 mt-4">
        <Button
          size="lg"
          className="cursor-pointer border rounded-lg bg-white hover:bg-black/10 border-gray-200"
        >
          <Heart className="text-black" />
        </Button>
        <Button
          size="lg"
          className="cursor-pointer border rounded-lg bg-white hover:bg-black/10 border-gray-200"
        >
          <Share2 className="text-black" />
        </Button>
        <Button
          size="lg"
          className="cursor-pointer border rounded-lg bg-white hover:bg-black/10 border-gray-200"
        >
          <Siren className="text-black" />
        </Button>
      </div>

      <div className="text-gray-400 text-sm flex gap-4 mt-3">
        <span className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {formatTimeAgo(rental.created_at)}
        </span>
        <span className="flex items-center gap-1">
          <Eye className="w-4 h-4" />
          조회수 : {rental.posts.view_count}
        </span>
      </div>

      <hr className="border-gray-200 my-4" />

      <h2 className="text-xl font-semibold mb-3">숙소 설명</h2>
      <p className="text-gray-700 whitespace-pre-line">{rental.description}</p>
    </div>
  );
}
