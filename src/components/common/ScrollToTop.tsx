"use client";
import { useAuthStore } from "@/store/authStore";
import { ChevronUp, Plus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();
  const path = usePathname();
  const { isLoggedIn } = useAuthStore();

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 250);
      // 높이를 얼마부터 동작하게 할것인가?
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePlus = () => {
    router.push("/create");
  };

  const showPlus =
    !path.includes("/create") &&
    !path.startsWith("/profile") &&
    !path.startsWith("/favorites") &&
    !/\/(usedgoods|rental|job)\/\d/.test(path);

  if (!isVisible) return null;

  return (
    <div className="flex md:hidden flex-col items-center gap-3">
      {showPlus && isLoggedIn && (
        <button
          className="cursor-pointer w-12 h-12 bg-gray-100 hover:bg-gray-300 text-black rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
          aria-label="더보기"
          onClick={handlePlus}
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
      <button
        className="cursor-pointer w-12 h-12 btn-primary rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
        aria-label="맨 위로 이동"
        onClick={handleScrollToTop}
      >
        <ChevronUp className="w-6 h-6" />
      </button>
    </div>
  );
}
