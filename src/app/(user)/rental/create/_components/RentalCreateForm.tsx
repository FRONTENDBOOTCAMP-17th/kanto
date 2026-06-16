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
import { AMENITIES, type Amenity } from "@/type/rental/rentalDetail";

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

export default function RentalCreateForm({ userId }: { userId: number }) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [deposit, setDeposit] = useState("");
  const [rentType, setRentType] = useState<"월세" | "매매" | "">("");
  const [roomType, setRoomType] = useState<"스튜디오" | "투룸" | "아파트" | "">(
    "",
  );
  const [maxOccupants, setMaxOccupants] = useState("");
  const [description, setDescription] = useState("");
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [location, setLocation] = useState<Location | "">("");
  const [locationDetail, setLocationDetail] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleAmenity = (item: "와이파이" | "에어컨" | "주차" | "주방") => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rentType || !roomType || !location) return;
    setIsSubmitting(true);

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
  };

  return (
    <main className="flex-1 bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>

        <Card className="p-8">
          <h1 className="page-title-lg mb-2">방렌트 글쓰기</h1>
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
                required
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
                onValueChange={(v) => setRentType(v as "월세" | "매매")}
                required
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
                onValueChange={(v) =>
                  setRoomType(v as "스튜디오" | "투룸" | "아파트")
                }
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
                {AMENITIES.map(
                  (item) => (
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
                  ),
                )}
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
                onClick={() => router.back()}
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
                {isSubmitting ? "등록 중..." : "작성 완료"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
}
