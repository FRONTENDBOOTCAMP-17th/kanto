"use client";

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
  PRODUCT_CATEGORIES,
  PRODUCT_CONDITIONS,
  TRADE_LOCATIONS,
  type ProductCategory,
  type ProductCondition,
  type TradeLocation,
} from "@/type/usedGoods";
import { useCreateUsedGoodsForm } from "@/hooks/usedgoods/useCreateUsedGoodsForm";

export function CreateUsedGoodsForm({ userId }: { userId: number }) {
  const form = useCreateUsedGoodsForm(userId);

  return (
    <main className="flex-1 bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" onClick={form.handleBack} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>

        <Card className="p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            중고거래 글쓰기
          </h1>
          <p className="text-gray-600 mb-8">필요한 정보를 입력해주세요</p>

          <form onSubmit={form.handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                placeholder="상품명을 입력하세요"
                value={form.title}
                onChange={(e) => form.setTitle(e.target.value)}
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
                  value={form.price}
                  onChange={(e) => form.setPrice(e.target.value)}
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
                value={form.productCategory}
                onValueChange={(v) => form.setProductCategory(v as ProductCategory)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="카테고리를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.filter((c) => c.id !== "all").map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="condition">상태 *</Label>
              <Select
                value={form.condition}
                onValueChange={(v) => form.setCondition(v as ProductCondition)}
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
                value={form.preferredLocation}
                onValueChange={(v) => form.setPreferredLocation(v as TradeLocation)}
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
              {form.preferredLocation === "그 외 지역" && (
                <Input
                  placeholder="상세 지역을 입력하세요"
                  value={form.preferredLocationDetail}
                  onChange={(e) => form.setPreferredLocationDetail(e.target.value)}
                  required
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">내용 *</Label>
              <Textarea
                id="content"
                placeholder="상품에 대한 설명을 입력하세요"
                value={form.content}
                onChange={(e) => form.setContent(e.target.value)}
                rows={10}
                required
              />
            </div>

            <ImageUploadField
              fileInputRef={form.imageUpload.fileInputRef}
              imagePreviews={form.imageUpload.imagePreviews}
              onUploadClick={form.imageUpload.handleImageUpload}
              onSelect={form.imageUpload.handleImageSelect}
              onRemove={form.imageUpload.removeImage}
            />

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="safePayment"
                checked={form.safePayment}
                onChange={(e) => form.setSafePayment(e.target.checked)}
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
                onClick={form.handleBack}
                className="flex-1"
                disabled={form.isSubmitting}
              >
                취소
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-teal-500 hover:bg-teal-600"
                disabled={form.isSubmitting}
              >
                {form.isSubmitting ? "등록 중..." : "작성 완료"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
}
