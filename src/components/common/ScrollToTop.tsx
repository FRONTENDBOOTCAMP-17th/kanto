"use client";
import { useAuthStore } from "@/store/authStore";
import { useSuspended } from "@/hooks/useSuspended";
import { ChevronUp, Plus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export function ScrollToTop() {
  const t = useTranslations("Common");
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();
  const path = usePathname();
  const { isLoggedIn } = useAuthStore();
  const { isSuspended, openModal } = useSuspended();

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 240);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePlus = () => {
    if (isSuspended) { openModal(); return; }
    router.push("/create");
  };

  const showPlus =
    !path.includes("/create") &&
    !path.startsWith("/profile") &&
    !path.startsWith("/favorites") &&
    !/\/(usedgoods|rental|job)\/\d/.test(path);

  if (!isVisible) return null;

  return (
    <div className="flex flex-col items-center gap-3">
      {showPlus && isLoggedIn && (
        <button
          className="cursor-pointer w-12 h-12 bg-gray-100 hover:bg-gray-300 text-black rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
          aria-label={t("more")}
          onClick={handlePlus}
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
      <button
        className="cursor-pointer w-12 h-12 btn-primary rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
        aria-label={t("scrollTop")}
        onClick={handleScrollToTop}
      >
        <ChevronUp className="w-6 h-6" />
      </button>
    </div>
  );
}
