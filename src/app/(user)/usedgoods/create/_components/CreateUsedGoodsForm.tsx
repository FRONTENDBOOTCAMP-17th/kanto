"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
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
  PRODUCT_CATEGORIES,
  PRODUCT_CONDITIONS,
  TRADE_LOCATIONS,
  type ProductCategory,
  type ProductCondition,
  type TradeLocation,
} from "@/type/usedGoods";

interface InitialData {
  post_id: number | undefined;
  title: string | null;
  price: number | null;
  category: string | null;
  condition: string | null;
  location_type: string | null;
  location_custom: string | null;
  content: string | null;
  safe_payment: boolean | null;
  images: string[] | null;
}

export function CreateUsedGoodsForm({
  userId,
  initialData,
}: {
  userId: number;
  initialData?: InitialData;
}) {
  const t = useTranslations("UsedGoods");
  const te = useTranslations("Enums");
  const tc = useTranslations("Common");
  const router = useRouter();

  const postId = initialData?.post_id;
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [price, setPrice] = useState(initialData?.price?.toString() ?? "");
  const [productCategory, setProductCategory] = useState<ProductCategory | "">(
    (initialData?.category as ProductCategory) ?? "",
  );
  const [condition, setCondition] = useState<ProductCondition | "">(
    (initialData?.condition as ProductCondition) ?? "",
  );
  const [preferredLocation, setPreferredLocation] = useState<
    TradeLocation | ""
  >((initialData?.location_type as TradeLocation) ?? "");
  const [preferredLocationDetail, setPreferredLocationDetail] = useState(
    initialData?.location_custom ?? "",
  );
  const [content, setContent] = useState(initialData?.content ?? "");
  const [safePayment, setSafePayment] = useState(
    initialData?.safe_payment ?? false,
  );
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>(
    initialData?.images ?? [],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [urlError, setUrlError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const maxUrlsRef = useRef(3);

  useEffect(() => {
    fetch("/api/admin/spam-config")
      .then((r) => r.json())
      .then((d) => { if (d?.max_urls_per_post != null) maxUrlsRef.current = d.max_urls_per_post; })
      .catch(() => {});
  }, []);
  const [isCheckingImages, setIsCheckingImages] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showErrorToast = (message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(message);
    setShowToast(true);
    toastTimerRef.current = setTimeout(() => setShowToast(false), 3000);
  };

  const isFormValid =
    title.trim() !== "" &&
    price !== "" &&
    productCategory !== "" &&
    condition !== "" &&
    preferredLocation !== "" &&
    (preferredLocation !== "그 외 지역" || preferredLocationDetail.trim() !== "") &&
    content.trim() !== "" &&
    imagePreviews.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productCategory || !condition || !preferredLocation) return;

    const urlCount = (content.match(/https?:\/\/[^\s]+/g) ?? []).length;
    if (urlCount > maxUrlsRef.current) {
      setUrlError(`게시물에 URL은 최대 ${maxUrlsRef.current}개까지 허용됩니다.`);
      return;
    }
    setUrlError("");
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

      const existingUrls = imagePreviews.filter(
        (url) => !url.startsWith("blob:"),
      );
      const finalImages = [...existingUrls, ...uploadedUrls];

      await supabase.from("posts").update({ title }).eq("id", postId);

      await supabase
        .from("used_goods")
        .update({
          price: Number(price),
          category: productCategory,
          condition,
          location_type: preferredLocation,
          location_custom: preferredLocationDetail,
          content,
          safe_payment: safePayment,
          images: finalImages,
        })
        .eq("post_id", postId);
      router.replace(`/usedgoods/${postId}`);
    } else {
      const { data: post, error: postError } = await supabase
        .from("posts")
        .insert({
          user_id: userId,
          post_type: "used_goods",
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

      const { error: goodsError } = await supabase.from("used_goods").insert({
        post_id: post.id,
        price: Number(price),
        category: productCategory,
        condition,
        safe_payment: safePayment,
        content,
        images: uploadedUrls.length > 0 ? uploadedUrls : null,
        location_type: preferredLocation,
        location_custom:
          preferredLocation === "그 외 지역" ? preferredLocationDetail : null,
      });

      if (goodsError) {
        alert(t("form.errorGoods"));
        setIsSubmitting(false);
        return;
      }
      router.push("/usedgoods");
    }
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

  const removeImage = (index: number) => {
    const preview = imagePreviews[index];
    if (preview.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <main className="flex-1 bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("form.back")}
        </Button>

        <Card className="p-8">
          <h1 className="page-title-lg mb-2">
            {initialData ? t("form.editTitle") : t("form.createTitle")}
          </h1>
          <p className="text-gray-600 mb-8">{t("form.subtitle")}</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">{t("form.titleLabel")}</Label>
              <Input
                maxLength={64}
                id="title"
                placeholder={t("form.titlePlaceholder")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">{t("form.priceLabel")}</Label>
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
              <Label htmlFor="productCategory">{t("form.categoryLabel")}</Label>
              <Select
                value={productCategory}
                onValueChange={(v) => setProductCategory(v as ProductCategory)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("form.categoryPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.filter((c) => c.id !== "all").map(
                    (cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {te(`productCategory.${cat.id}`)}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="condition">{t("form.conditionLabel")}</Label>
              <Select
                value={condition}
                onValueChange={(v) => setCondition(v as ProductCondition)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("form.conditionPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CONDITIONS.map((cond) => (
                    <SelectItem key={cond.id} value={cond.id}>
                      {te(`productCondition.${cond.id}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredLocation">{t("form.locationLabel")}</Label>
              <Select
                value={preferredLocation}
                onValueChange={(v) => setPreferredLocation(v as TradeLocation)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("form.locationPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {TRADE_LOCATIONS.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc === "그 외 지역" ? te("tradeLocation.otherAreas") : loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {preferredLocation === "그 외 지역" && (
                <Input
                  placeholder={t("form.locationDetailPlaceholder")}
                  value={preferredLocationDetail}
                  onChange={(e) => setPreferredLocationDetail(e.target.value)}
                  required
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">{t("form.contentLabel")}</Label>
              <Textarea
                className="resize-none min-h-48"
                id="content"
                placeholder={t("form.contentPlaceholder")}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                required
              />
            </div>

            <ImageUploadField
              fileInputRef={fileInputRef}
              imagePreviews={imagePreviews}
              minCount={1}
              isChecking={isCheckingImages}
              onUploadClick={handleImageUpload}
              onSelect={handleImageSelect}
              onRemove={removeImage}
            />
            {imagePreviews.length === 0 && (
              <p className="text-sm text-red-500">{t("form.errorNoImage")}</p>
            )}

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="safePayment"
                checked={safePayment}
                onChange={(e) => setSafePayment(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 bg-white text-teal-500 focus:ring-teal-500"
              />
              <Label htmlFor="safePayment" className="cursor-pointer">
                {t("form.safePaymentUse")}
              </Label>
            </div>

            {urlError && (
              <p className="text-[13px] text-red-500">{urlError}</p>
            )}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
                disabled={isSubmitting}
              >
                {tc("cancel")}
              </Button>
              <Button
                type="submit"
                variant="teal"
                className="flex-1"
                disabled={isSubmitting || !isFormValid}
              >
                {isSubmitting ? t("form.submitting") : t("form.submit")}
              </Button>
            </div>
          </form>
        </Card>
      </div>
      <Toast message={toastMessage} showMessage={showToast} type="error" icon="alert" />
    </main>
  );
}
