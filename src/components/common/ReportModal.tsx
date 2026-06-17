"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { checkReported, submitReport } from "@/services/report";

interface report {
  isOpen: boolean;
  onClose: () => void;
  postId: number;
  userId: number | undefined;
  initialReported: boolean;
}

const REPORT_CATEGORIES = [
  "욕설",
  "도배",
  "사기",
  "허위 매물",
  "불법 게시물",
  "성 범죄(성희롱/성추행 등)",
] as const;

export default function ReportModal({
  isOpen,
  onClose,
  postId,
  userId,
  initialReported,
}: report) {
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [isReported, setIsReported] = useState(initialReported);
  const [justReported, setJustReported] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  useEffect(() => {
    if (!isOpen || !userId) return;

    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    checkReported(postId, userId).then((reported) => {
      if (reported) setIsReported(true);
    });

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose, postId, userId]);

  if (!isOpen) return null;

  const handleReport = async () => {
    if (!category || !userId) return;
    setSubmitError(false);

    await supabase.from("common_reports").insert({
      user_id: userId,
      target_id: postId,
      target_type: "post",
      category,
      description: content || null,
      status: "pending",
    });
    const { error } = await submitReport(userId, postId, category, content);
    if (error) {
      console.error("[ReportModal] insert error:", error);
      setSubmitError(true);
      return;
    }
    setJustReported(true);
    setIsReported(true);
  };

  const handleClose = () => {
    setJustReported(false);
    setSubmitError(false);
    onClose();
  };

  if (isReported) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        onClick={handleClose}
      >
        <div
          className="w-full max-w-sm mx-4 bg-white rounded-2xl shadow-xl p-6 flex flex-col gap-5 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-base font-semibold text-gray-800">
            {justReported
              ? "신고가 완료되었습니다."
              : "이미 신고가 완료된 게시글입니다."}
          </p>
          <Button variant="teal" onClick={handleClose}>
            확인
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm mx-4 bg-white rounded-2xl shadow-xl p-6 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">신고하기</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm text-gray-500">신고 유형</p>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="카테고리를 선택해주세요" />
            </SelectTrigger>
            <SelectContent>
              {REPORT_CATEGORIES.map((cate) => (
                <SelectItem key={cate} value={cate}>
                  {cate}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm text-gray-500">상세 내용 (선택)</p>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="신고 내용을 입력해주세요."
            className="resize-none min-h-20 max-h-30"
          />
        </div>

        {submitError && (
          <p className="text-sm text-red-500">
            신고 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
          </p>
        )}

        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button
            className="bg-red-500 hover:bg-red-600 text-white"
            onClick={handleReport}
            disabled={!category}
          >
            신고하기
          </Button>
        </div>
      </div>
    </div>
  );
}
