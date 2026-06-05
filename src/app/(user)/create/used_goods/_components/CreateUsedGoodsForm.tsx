"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ImagePlus, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LOCATIONS = [
  { id: "bgc-taguig", name: "BGC / Taguig" },
  { id: "makati", name: "Makati" },
  { id: "pasay-paranaque", name: "Pasay / Paranaque" },
  { id: "quezon-city", name: "Quezon City" },
  { id: "mandaluyong-pasig", name: "Mandaluyong / Pasig" },
  { id: "pampanga", name: "Pampanga" },
  { id: "others", name: "그 외 지역" },
];

export function CreateUsedGoodsForm() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [preferredLocation, setPreferredLocation] = useState("");
  const [preferredLocationDetail, setPreferredLocationDetail] = useState("");
  const [content, setContent] = useState("");
  const [safePayment, setSafePayment] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Supabase insert — posts 테이블(post_type='used_goods') 및 used_goods 테이블 연동
    alert("게시글이 작성되었습니다!");
    router.push("/usedgoods");
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = 10 - images.length;
    files.slice(0, remaining).forEach((file) => {
      setImages((prev) => [...prev, URL.createObjectURL(file)]);
    });
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
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
                onValueChange={setProductCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="카테고리를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="electronics">전자기기</SelectItem>
                  <SelectItem value="furniture">가구</SelectItem>
                  <SelectItem value="clothing">의류</SelectItem>
                  <SelectItem value="accessories">악세사리</SelectItem>
                  <SelectItem value="baby">유아 용품</SelectItem>
                  <SelectItem value="others">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="condition">상태 *</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger>
                  <SelectValue placeholder="상태를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unopened">미개봉 중고</SelectItem>
                  <SelectItem value="light">가벼운 사용감</SelectItem>
                  <SelectItem value="used">사용감 있음</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredLocation">거래 지역 *</Label>
              <Select
                value={preferredLocation}
                onValueChange={setPreferredLocation}
              >
                <SelectTrigger>
                  <SelectValue placeholder="지역을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {preferredLocation === "others" && (
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

            <div className="space-y-2">
              <Label>사진 (최대 10장)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageSelect}
              />
              <div className="space-y-3">
                {images.length > 0 && (
                  <div className="grid grid-cols-5 gap-3">
                    {images.map((img, index) => (
                      <div key={index} className="relative aspect-square">
                        <img
                          src={img}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {images.length < 10 && (
                  <button
                    type="button"
                    onClick={handleImageUpload}
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-teal-500 transition-colors"
                  >
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <ImagePlus className="w-8 h-8" />
                      <span className="text-sm">사진 추가하기</span>
                      <span className="text-xs">({images.length}/10)</span>
                    </div>
                  </button>
                )}
              </div>
            </div>

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
              >
                취소
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-teal-500 hover:bg-teal-600"
              >
                작성 완료
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
}
