"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { ImageUploadField } from "@/components/common/ImageUploadField";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AMENITIES,
  type Amenity,
  type RentType,
  type RoomType,
} from "@/type/rental/rentalDetail";

const LOCATIONS = [
  "BGC / Taguig",
  "Makati",
  "Pasay / Paranaque",
  "Quezon City",
  "Mandaluyong / Pasig",
  "Pampanga",
  "그 외 지역",
] as const;

type Location = (typeof LOCATIONS)[number];

interface InitialData {
  post_id: number;
  title: string | null;
  price: number | null;
  deposit: number | null;
  rent_type: string | null;
  room_type: string | null;
  max_occupants: number | null;
  description: string | null;
  amenities: string[] | null;
  images: string[] | null;
  location: string | null;
  location_detail: string | null;
}

export default function RentalCreateForm({
  userId,
  initialData,
}: {
  userId: number;
  initialData?: InitialData;
}) {
  const router = useRouter();

  const postId = initialData?.post_id;
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [price, setPrice] = useState(initialData?.price?.toString() ?? "");
  const [deposit, setDeposit] = useState(initialData?.deposit?.toString() ?? "");
  const [rentType, setRentType] = useState<RentType | "">((initialData?.rent_type as RentType) ?? "");
  const [roomType, setRoomType] = useState<RoomType | "">((initialData?.room_type as RoomType) ?? "");
  const [maxOccupants, setMaxOccupants] = useState(initialData?.max_occupants?.toString() ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [amenities, setAmenities] = useState<Amenity[]>((initialData?.amenities as Amenity[]) ?? []);
  const [location, setLocation] = useState<Location | "">((initialData?.location as Location) ?? "");
  const [locationDetail, setLocationDetail] = useState(initialData?.location_detail ?? "");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>(initialData?.images ?? []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleAmenity = (item: Amenity) => {
    setAmenities((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item],
    );
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = 10 - imageFiles.length;
    const allowedFiles = files.slice(0, remaining);

    setImageFiles((prev) => [...prev, ...allowedFiles]);
    setImagePreviews((prev) => [
      ...prev,
      ...allowedFiles.map((file) => URL.createObjectURL(file)),
    ]);
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    const preview = imagePreviews[index];
    if (preview.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!rentType || !roomType || !location) return;
    setIsSubmitting(true);

    if (initialData) {
      if (!postId) return;

      const uploadedUrls: string[] = [];
      for (const file of imageFiles) {
        const safeFileName = `${Date.now()}.${file.name.split(".").pop()}`;
        const filePath = `${userId}/${postId}/${safeFileName}`;
        const { error: uploadError } = await supabase.storage
          .from("images")
          .upload(filePath, file, { upsert: true });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("images")
            .getPublicUrl(filePath);
          uploadedUrls.push(urlData.publicUrl);
        }
      }

      const existingUrls = imagePreviews.filter((url) => !url.startsWith("blob:"));
      const finalImages = [...existingUrls, ...uploadedUrls];

      await supabase.from("posts").update({ title }).eq("id", postId);

      await supabase
        .from("rentals")
        .update({
          price: Number(price),
          deposit: deposit ? Number(deposit) : 0,
          rent_type: rentType,
          room_type: roomType,
          max_occupants: Number(maxOccupants),
          description,
          amenities,
          images: finalImages.length > 0 ? finalImages : null,
          location,
          location_detail: location === "그 외 지역" ? locationDetail : null,
        })
        .eq("post_id", postId);

      router.replace(`/rental/${postId}`);
    } else {
      const { data: post, error: postError } = await supabase
        .from("posts")
        .insert({
          user_id: userId,
          post_type: "rental",
          title,
          status: "active",
          view_count: 0,
          like_count: 0,
        })
        .select("id")
        .single();

      if (postError || !post) {
        alert("게시글 등록에 실패했습니다.");
        setIsSubmitting(false);
        return;
      }

      const uploadedUrls: string[] = [];
      for (const file of imageFiles) {
        const filePath = `${userId}/${post.id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("images")
          .upload(filePath, file);

        if (uploadError) {
          await supabase.from("posts").delete().eq("id", post.id);
          alert("이미지 업로드에 실패했습니다.");
          setIsSubmitting(false);
          return;
        }

        const { data: urlData } = supabase.storage
          .from("images")
          .getPublicUrl(filePath);
        uploadedUrls.push(urlData.publicUrl);
      }

      const { error: rentalError } = await supabase.from("rentals").insert({
        post_id: post.id,
        price: Number(price),
        deposit: deposit ? Number(deposit) : 0,
        rent_type: rentType,
        room_type: roomType,
        max_occupants: Number(maxOccupants),
        description,
        amenities,
        images: uploadedUrls.length > 0 ? uploadedUrls : null,
        location,
        location_detail: location === "그 외 지역" ? locationDetail : null,
      });

      if (rentalError) {
        alert("방 정보 등록에 실패했습니다.");
        setIsSubmitting(false);
        return;
      }

      router.push("/rental");
    }
  };

  return (
    <main className="flex-1 bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          onClick={() =>
            router.push(initialData ? `/rental/${postId}` : "/rental")
          }
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>

        <Card className="p-8">
          <h1 className="page-title-lg mb-2">
            {initialData ? "방렌트 글 수정" : "방렌트 글쓰기"}
          </h1>
          <p className="text-gray-600 mb-8">필요한 정보를 입력해주세요</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">숙소명 *</Label>
              <Input
                id="title"
                placeholder="숙소명을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">숙소 위치 *</Label>
              <Select
                value={location}
                onValueChange={(v) => setLocation(v as Location)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="지역을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {location === "그 외 지역" && (
                <Input
                  placeholder="상세 위치를 입력하세요"
                  value={locationDetail}
                  onChange={(e) => setLocationDetail(e.target.value)}
                  required
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rentType">월세 / 매매 *</Label>
              <Select
                value={rentType}
                onValueChange={(v) => setRentType(v as RentType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="월세">월세</SelectItem>
                  <SelectItem value="매매">매매</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">가격 *</Label>
              <div className="relative">
                <Input
                  id="price"
                  type="number"
                  placeholder="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="pr-12"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  PHP
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deposit">보증금</Label>
              <div className="relative">
                <Input
                  id="deposit"
                  type="number"
                  placeholder="0"
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value)}
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  PHP
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="roomType">방 타입 *</Label>
              <Select
                value={roomType}
                onValueChange={(v) => setRoomType(v as RoomType)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="방 타입을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="스튜디오">스튜디오</SelectItem>
                  <SelectItem value="투룸">투룸</SelectItem>
                  <SelectItem value="아파트">아파트</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxOccupants">최대 인원 *</Label>
              <Input
                id="maxOccupants"
                type="number"
                placeholder="0"
                value={maxOccupants}
                onChange={(e) => setMaxOccupants(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>편의시설</Label>
              <div className="flex gap-2 flex-wrap">
                {AMENITIES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleAmenity(item)}
                    className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                      amenities.includes(item)
                        ? "bg-teal-500 text-white border-teal-500"
                        : "bg-white text-gray-700 border-gray-300 hover:border-teal-400"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <ImageUploadField
              fileInputRef={fileInputRef}
              imagePreviews={imagePreviews}
              onUploadClick={handleImageUpload}
              onSelect={handleImageSelect}
              onRemove={removeImage}
            />

            <div className="space-y-2">
              <Label htmlFor="description">상세 설명</Label>
              <Textarea
                id="description"
                placeholder="숙소에 대한 상세 설명을 입력하세요"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={10}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  router.push(initialData ? `/rental/${postId}` : "/rental")
                }
                className="flex-1"
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button
                type="submit"
                variant="teal"
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? initialData
                    ? "수정 중..."
                    : "등록 중..."
                  : initialData
                    ? "수정 완료"
                    : "작성 완료"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
}
