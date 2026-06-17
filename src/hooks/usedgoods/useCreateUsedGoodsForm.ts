"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { useImageUpload } from "@/hooks/useImageUpload";
import {
  type ProductCategory,
  type ProductCondition,
  type TradeLocation,
} from "@/type/usedGoods";

export function useCreateUsedGoodsForm(userId: number) {
  const router = useRouter();
  const t = useTranslations("UsedGoods.form");

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [productCategory, setProductCategory] = useState<ProductCategory | "">("");
  const [condition, setCondition] = useState<ProductCondition | "">("");
  const [preferredLocation, setPreferredLocation] = useState<TradeLocation | "">("");
  const [preferredLocationDetail, setPreferredLocationDetail] = useState("");
  const [content, setContent] = useState("");
  const [safePayment, setSafePayment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const imageUpload = useImageUpload([], 10);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productCategory || !condition || !preferredLocation) return;
    setIsSubmitting(true);

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
      alert(t("errorPost"));
      setIsSubmitting(false);
      return;
    }

    const uploadedUrls: string[] = [];
    for (const file of imageUpload.imageFiles) {
      const filePath = `${userId}/${post.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(filePath, file);

      if (uploadError) {
        await supabase.from("posts").delete().eq("id", post.id);
        alert(t("errorImage"));
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
      alert(t("errorGoods"));
      setIsSubmitting(false);
      return;
    }

    router.push("/usedgoods");
  };

  return {
    title, setTitle,
    price, setPrice,
    productCategory, setProductCategory,
    condition, setCondition,
    preferredLocation, setPreferredLocation,
    preferredLocationDetail, setPreferredLocationDetail,
    content, setContent,
    safePayment, setSafePayment,
    isSubmitting,
    imageUpload,
    handleSubmit,
    handleBack: () => router.back(),
  };
}
