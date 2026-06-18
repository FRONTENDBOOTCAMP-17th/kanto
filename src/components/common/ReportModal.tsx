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
  const t = useTranslations("Report");
  const tc = useTranslations("Common");
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
            {justReported ? t("done") : t("already")}
          </p>
          <Button variant="teal" onClick={handleClose}>
            {tc("confirm")}
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
              {REPORT_CATEGORIES.map((cate) => (
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
