import { useState } from "react";
import { checkReported } from "@/services/report";

interface Params {
  partnerId: number;
  currentUserId: number;
  onAlreadyReported: () => void;
}

/** 유저 신고 모달 상태를 관리하고, 열기 전 중복 신고 여부를 확인한다. */
export function useUserReport({ partnerId, currentUserId, onAlreadyReported }: Params) {
  const [showReport, setShowReport] = useState(false);
  const [isReported, setIsReported] = useState(false);
  const [isCheckingReport, setIsCheckingReport] = useState(false);

  const handleReportClick = async () => {
    if (isReported) {
      onAlreadyReported();
      return;
    }

    setIsCheckingReport(true);
    const reported = await checkReported(partnerId, currentUserId, "user");
    setIsCheckingReport(false);

    if (reported) {
      setIsReported(true);
      onAlreadyReported();
      return;
    }

    setShowReport(true);
  };

  return {
    showReport,
    closeReport: () => setShowReport(false),
    markReported: () => setIsReported(true),
    isCheckingReport,
    handleReportClick,
  };
}
