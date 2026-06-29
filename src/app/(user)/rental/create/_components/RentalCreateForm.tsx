"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploadField } from "@/components/common/ImageUploadField";
import { moderateImage } from "@/lib/moderateImage";
import Toast from "@/components/common/Toast";
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
import { LocationPicker } from "@/components/common/LocationPicker";
import {
  cityToTradeLocation,
  roundCoord,
  formatBarangayLabel,
  type TradeLocation,
} from "@/type/location";
import type { PickedLocation } from "@/type/go";

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
  location_barangay: string | null;
  location_city: string | null;
  location_lat: number | null;
  location_lng: number | null;
}

export default function RentalCreateForm({
  userId,
  initialData,
}: {
  userId: number;
  initialData?: InitialData;
}) {
  const t = useTranslations("Rental");
  const te = useTranslations("Enums");
  const tc = useTranslations("Common");
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
  // 새로 선택한 거래지역 (편집 시 재선택 안 하면 null → 기존 값 유지)
  const [picked, setPicked] = useState<PickedLocation | null>(null);
  const fallbackLocationLabel =
    initialData?.location_barangay || initialData?.location_city
      ? formatBarangayLabel(
          initialData.location_barangay ?? null,
          initialData.location_city ?? null,
        )
      : (initialData?.location ?? null);
  const hasExistingLocation = Boolean(initialData?.location);

  // 저장용 거래지역 필드 — 새로 선택 시 좌표 클램프 후 도출, 아니면 기존 값 유지.
  const buildLocationFields = () =>
    picked
      ? {
          location: cityToTradeLocation(
            picked.city ?? null,
            picked.province ?? null,
          ) as TradeLocation,
          location_barangay: picked.barangay ?? null,
          // 시 성분 없는 장소(랜드마크 등)도 라벨이 비지 않도록 폴백 — 표시 전용
          location_city:
            picked.city ?? picked.province ?? picked.displayName ?? picked.address ?? null,
          location_lat: roundCoord(picked.lat),
          location_lng: roundCoord(picked.lng),
          location_detail: null,
        }
      : {
          location: (initialData?.location ?? null) as TradeLocation | null,
          location_barangay: initialData?.location_barangay ?? null,
          location_city: initialData?.location_city ?? null,
          location_lat: initialData?.location_lat ?? null,
          location_lng: initialData?.location_lng ?? null,
          location_detail: initialData?.location_detail ?? null,
        };
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>(initialData?.images ?? []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [urlError, setUrlError] = useState("");
  const maxUrlsRef = useRef(3);
  const [isCheckingImages, setIsCheckingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/admin/spam-config")
      .then((r) => r.json())
      .then((d) => { if (d?.max_urls_per_post != null) maxUrlsRef.current = d.max_urls_per_post; })
      .catch(() => {});
  }, []);

  const showErrorToast = (message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(message);
    setShowToast(true);
    toastTimerRef.current = setTimeout(() => setShowToast(false), 3000);
  };

  const toggleAmenity = (item: Amenity) => {
    setAmenities((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item],
    );
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = 10 - imageFiles.length;
    const candidates = files.slice(0, remaining);
    e.target.value = "";

    setIsCheckingImages(true);
    try {
      const allowedFiles: File[] = [];
      let blockedReason: string | null = null;

      for (const file of candidates) {
        const outcome = await moderateImage(file);
        if (outcome.allowed) {
          allowedFiles.push(file);
        } else {
          blockedReason = outcome.reason;
        }
      }

      if (blockedReason) {
        showErrorToast(
          blockedReason === "unavailable"
            ? tc("imageUpload.unavailable")
            : tc("imageUpload.blocked"),
        );
      }

      setImageFiles((prev) => [...prev, ...allowedFiles]);
      setImagePreviews((prev) => [
        ...prev,
        ...allowedFiles.map((file) => URL.createObjectURL(file)),
      ]);
    } finally {
      setIsCheckingImages(false);
    }
  };

  const handleFilesDropped = async (files: File[]) => {
    const remaining = 10 - imageFiles.length;
    const candidates = files.slice(0, remaining);

    setIsCheckingImages(true);
    try {
      const allowedFiles: File[] = [];
      let blockedReason: string | null = null;

      for (const file of candidates) {
        const outcome = await moderateImage(file);
        if (outcome.allowed) {
          allowedFiles.push(file);
        } else {
          blockedReason = outcome.reason;
        }
      }

      if (blockedReason) {
        showErrorToast(
          blockedReason === "unavailable"
            ? tc("imageUpload.unavailable")
            : tc("imageUpload.blocked"),
        );
      }

      setImageFiles((prev) => [...prev, ...allowedFiles]);
      setImagePreviews((prev) => [
        ...prev,
        ...allowedFiles.map((file) => URL.createObjectURL(file)),
      ]);
    } finally {
      setIsCheckingImages(false);
    }
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
    if (!rentType || !roomType) return;
    if (!picked && !hasExistingLocation) return;
    if (!rentType || !roomType || !location) return;

    const urlCount = (description.match(/https?:\/\/[^\s]+/g) ?? []).length;
    if (urlCount > maxUrlsRef.current) {
      setUrlError(`게시물에 URL은 최대 ${maxUrlsRef.current}개까지 허용됩니다.`);
      return;
    }
    setUrlError("");
    setIsSubmitting(true);

    const locationFields = buildLocationFields();

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
          ...locationFields,
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
        alert(t("form.errorPost"));
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
          alert(t("form.errorImage"));
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
        ...locationFields,
      });

      if (rentalError) {
        alert(t("form.errorRental"));
        setIsSubmitting(false);
        return;
      }

      router.push("/rental");
    }
  };

  return (
    <main className="flex-1 bg-gray-50 py-8 px-4 pb-32">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => router.push(initialData ? `/rental/${postId}` : "/rental")}
            className="hover:text-teal-500"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="text-lg font-semibold">
            {initialData ? t("form.editTitle") : t("form.createTitle")}
          </span>
        </div>

        <div className="p-8">
          <form id="rental-create-form" onSubmit={handleSubmit} className="space-y-6">
            <ImageUploadField
              fileInputRef={fileInputRef}
              imagePreviews={imagePreviews}
              isChecking={isCheckingImages}
              onUploadClick={handleImageUpload}
              onSelect={handleImageSelect}
              onRemove={removeImage}
              onFilesDropped={handleFilesDropped}
            />

            <div className="space-y-2">
              <Label htmlFor="title">{t("form.titleLabel")}</Label>
              <Input
                id="title"
                placeholder={t("form.titlePlaceholder")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-12 rounded-sm"
                required
              />
              {title.length > 0 && title.trim().length < 2 && (
                <p className="text-[13px] text-red-500">{t("form.titleMinLength")}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t("form.locationLabel")}</Label>
              <LocationPicker
                value={picked}
                onChange={setPicked}
                fallbackLabel={fallbackLocationLabel}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rentType">{t("form.rentTypeLabel")}</Label>
              <Select
                value={rentType}
                onValueChange={(v) => setRentType(v as RentType)}
                required
              >
                <SelectTrigger className="h-12 rounded-sm">
                  <SelectValue placeholder={t("form.rentTypePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="월세">{te("rentType.월세")}</SelectItem>
                  <SelectItem value="매매">{te("rentType.매매")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">{t("form.priceLabel")}</Label>
              <div className="relative">
                <Input
                  id="price"
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ""))}
                  className="h-12 rounded-sm pr-12"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">PHP</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deposit">{t("form.depositLabel")}</Label>
              <div className="relative">
                <Input
                  id="deposit"
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value.replace(/[^0-9]/g, ""))}
                  className="h-12 rounded-sm pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">PHP</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="roomType">{t("form.roomTypeLabel")}</Label>
              <Select value={roomType} onValueChange={(v) => setRoomType(v as RoomType)} required>
                <SelectTrigger className="h-12 rounded-sm">
                  <SelectValue placeholder={t("form.roomTypePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="아파트">{te("roomType.아파트")}</SelectItem>
                  <SelectItem value="스튜디오">{te("roomType.스튜디오")}</SelectItem>
                  <SelectItem value="원룸">{te("roomType.원룸")}</SelectItem>
                  <SelectItem value="투룸">{te("roomType.투룸")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxOccupants">{t("form.maxOccupantsLabel")}</Label>
              <Input
                id="maxOccupants"
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={maxOccupants}
                onChange={(e) => setMaxOccupants(e.target.value.replace(/[^0-9]/g, ""))}
                className="h-12 rounded-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>{t("form.amenitiesLabel")}</Label>
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
                    {te(`amenities.${item}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("form.descriptionLabel")}</Label>
              <Textarea
                id="description"
                placeholder={t("form.descriptionPlaceholder")}
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 5000))}
                className="resize-none min-h-56 rounded-sm p-5 text-xs md:text-sm"
                rows={10}
                maxLength={5000}
              />
              {description.length > 0 && description.trim().length < 10 && (
                <p className="text-[13px] text-red-500">{t("form.descriptionMinLength")}</p>
              )}
              <p className="text-right text-xs text-gray-400">{description.length}/5000</p>
            </div>
          </form>
        </div>
      </div>

      <div className="sticky bottom-0 z-10 bg-gray-50 pb-4 -mx-4 px-4 md:static md:bg-transparent md:pb-0 md:max-w-7xl md:mx-auto md:px-8">
        <hr className="border-gray-200" />
        <p className="text-center text-xs md:text-sm text-gray-500 mt-4">{t("form.sellerDisclaimer")}</p>

        {urlError && (
          <p className="text-[13px] text-red-500 mt-2">{urlError}</p>
        )}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(initialData ? `/rental/${postId}` : "/rental")}
            className="flex-1 h-12"
            disabled={isSubmitting}
          >
            {tc("cancel")}
          </Button>
          <Button
            type="submit"
            form="rental-create-form"
            variant="teal"
            className="flex-1 h-12"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? initialData ? t("form.editing") : t("form.submitting")
              : initialData ? t("form.editDone") : t("form.submit")}
          </Button>
        </div>
      </div>
      <Toast message={toastMessage} showMessage={showToast} type="error" icon="alert" />
    </main>
  );
}
