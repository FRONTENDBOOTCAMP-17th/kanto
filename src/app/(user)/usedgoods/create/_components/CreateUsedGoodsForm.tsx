"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useImageUpload } from "@/hooks/useImageUpload";
import { ImageUploadField } from "@/components/common/ImageUploadField";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CONDITIONS,
  TRADE_LOCATIONS,
  type ProductCategory,
  type ProductCondition,
  type TradeLocation,
} from "@/type/usedGoods";

export function CreateUsedGoodsForm({ userId }: { userId: number }) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [productCategory, setProductCategory] = useState<ProductCategory | "">(
    "",
  );
  const [condition, setCondition] = useState<ProductCondition | "">("");
  const [preferredLocation, setPreferredLocation] = useState<
    TradeLocation | ""
  >("");
  const [preferredLocationDetail, setPreferredLocationDetail] = useState("");
  const [content, setContent] = useState("");
  const [safePayment, setSafePayment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const imageUpload = useImageUpload(10);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productCategory || !condition || !preferredLocation) return;
    setIsSubmitting(true);

    // posts 테이블 insert
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
      alert("게시글 등록에 실패했습니다.");
      setIsSubmitting(false);
      return;
    }

    // Storage 이미지 업로드
    const uploadedUrls: string[] = [];
    for (const file of imageUpload.imageFiles) {
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

    // used_goods 테이블 insert
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
      alert("상품 정보 등록에 실패했습니다.");
      setIsSubmitting(false);
      return;
    }

    router.push("/usedgoods");
  };

  return (
    <main className="flex-1 bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>

        <Card className="p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            중고거래 글쓰기
          </h1>
          <p className="text-gray-600 mb-8">필요한 정보를 입력해주세요</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                placeholder="상품명을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
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
              <Label htmlFor="productCategory">상품 카테고리 *</Label>
              <Select
                value={productCategory}
                onValueChange={(v) => setProductCategory(v as ProductCategory)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="카테고리를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.filter((c) => c.id !== "all").map(
                    (cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="condition">상태 *</Label>
              <Select
                value={condition}
                onValueChange={(v) => setCondition(v as ProductCondition)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="상태를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CONDITIONS.map((cond) => (
                    <SelectItem key={cond.id} value={cond.id}>
                      {cond.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredLocation">거래 지역 *</Label>
              <Select
                value={preferredLocation}
                onValueChange={(v) => setPreferredLocation(v as TradeLocation)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="지역을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {TRADE_LOCATIONS.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {preferredLocation === "그 외 지역" && (
                <Input
                  placeholder="상세 지역을 입력하세요"
                  value={preferredLocationDetail}
                  onChange={(e) => setPreferredLocationDetail(e.target.value)}
                  required
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">내용 *</Label>
              <Textarea
                id="content"
                placeholder="상품에 대한 설명을 입력하세요"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                required
              />
            </div>

            <ImageUploadField
              fileInputRef={imageUpload.fileInputRef}
              imagePreviews={imageUpload.imagePreviews}
              onUploadClick={imageUpload.handleImageUpload}
              onSelect={imageUpload.handleImageSelect}
              onRemove={imageUpload.removeImage}
            />

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="safePayment"
                checked={safePayment}
                onChange={(e) => setSafePayment(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 bg-white text-teal-500 focus:ring-teal-500"
              />
              <Label htmlFor="safePayment" className="cursor-pointer">
                안전 결제 사용
              </Label>
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
                className="flex-1 bg-teal-500 hover:bg-teal-600"
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
