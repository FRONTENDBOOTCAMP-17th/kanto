"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
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
  categories?: readonly string[];
  targetType?: "post" | "user";
  onToast?: (message: string, type?: "success" | "error", icon?: "check" | "x" | "alert") => void;
  onReported?: () => void;
}

export const POST_REPORT_CATEGORIES = [
  "욕설",
  "도배",
  "사기",
  "허위 매물",
  "불법 게시물",
  "성 범죄(성희롱/성추행 등)",
] as const;

export const USER_REPORT_CATEGORIES = [
  "욕설/비방",
  "성희롱/성적 불쾌감",
  "사기/금전 요구",
  "도배/광고/스팸",
  "부적절한 행위",
] as const;

export default function ReportModal({
  isOpen,
  onClose,
  postId,
  userId,
  initialReported,
  categories = POST_REPORT_CATEGORIES,
  targetType = "post",
  onToast,
  onReported,
}: report) {
  const t = useTranslations("Report");
  const tc = useTranslations("Common");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [isReported, setIsReported] = useState(initialReported);
  const [submitError, setSubmitError] = useState(false);

  useEffect(() => {
    if (!isOpen || !userId) return;

    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    if (initialReported || isReported) {
      const alreadyText = targetType === "user" ? t("alreadyUser") : t("already");
      onToast?.(alreadyText, "error", "x");
      onClose();
      return () => {
        document.body.style.overflow = "";
        document.removeEventListener("keydown", onKeyDown);
      };
    }

    checkReported(postId, userId, targetType).then((reported) => {
      if (reported) {
        setIsReported(true);
        const alreadyText = targetType === "user" ? t("alreadyUser") : t("already");
        onToast?.(alreadyText, "error", "x");
        onClose();
      }
    });

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose, postId, userId, targetType, initialReported, isReported, onToast, t]);

  if (!isOpen) return null;

  const handleReport = async () => {
    if (!category || !userId) return;
    setSubmitError(false);

    const { error } = await submitReport(userId, postId, category, content, targetType);
    if (error) {
      console.error("[ReportModal] insert error:", error);
      setSubmitError(true);
      return;
    }
    setIsReported(true);
    onReported?.();
    onToast?.(t("done"), "success", "check");
    setCategory("");
    setContent("");
    setSubmitError(false);
    onClose();
  };

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
          <h2 className="text-base font-semibold text-gray-800">{t("title")}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={tc("close")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm text-gray-500">{t("type")}</p>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder={t("selectCategory")} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cate) => (
                <SelectItem key={cate} value={cate}>
                  {t(`categories.${cate}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm text-gray-500">{t("detail")}</p>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("detailPlaceholder")}
            className="resize-none min-h-20 max-h-30"
          />
        </div>

        {submitError && (
          <p className="text-sm text-red-500">{t("submitError")}</p>
        )}

        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose}>
            {tc("cancel")}
          </Button>
          <Button
            className="bg-red-500 hover:bg-red-600 text-white"
            onClick={handleReport}
            disabled={!category}
          >
            {t("submit")}
          </Button>
        </div>
      </div>
    </div>
  );
}
