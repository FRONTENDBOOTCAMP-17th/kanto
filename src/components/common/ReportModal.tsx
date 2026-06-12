import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

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

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleReport = async () => {
    if (!category || !userId) return;

    await supabase.from("common_reports").insert({
      user_id: userId,
      target_id: postId,
      target_type: "post",
      reason: content ? `${category} - ${content}` : category,
      status: "pending",
    });
    setJustReported(true);
    setIsReported(true);
  };

  if (isReported) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl px-4 py-8 w-80 text-center flex flex-col gap-6">
          <p className="text-xl font-semibold">
            {justReported
              ? "신고가 완료되었습니다."
              : "이미 신고가 완료된 게시글입니다."}
          </p>
          <button
            onClick={() => {
              setJustReported(false);
              onClose();
            }}
            className="border-2 px-3 py-1 rounded-xl bg-teal-500 text-white"
          >
            확인
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-4 w-80 flex flex-col gap-5">
        <h1 className="text-2xl font-bold">신고하기</h1>
        <select
          name="reportModal"
          id="report"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border-2 p-2 border-gray-400"
        >
          <option value="">카테고리 선택</option>
          {REPORT_CATEGORIES.map((cate) => (
            <option key={cate} value={cate}>
              {cate}
            </option>
          ))}
        </select>
        <textarea
          name="reportModal"
          id="report"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="신고 내용을 입력해주세요."
          className="w-full h-50 border-2 border-gray-400 p-2"
        />
        <div className="flex justify-evenly gap-4">
          <button onClick={onClose} className="border-2 w-full rounded-xl">
            취소
          </button>
          <button
            onClick={handleReport}
            className="border-2 w-full rounded-xl bg-red-400 text-white"
          >
            신고하기
          </button>
        </div>
      </div>
    </div>
  );
}
