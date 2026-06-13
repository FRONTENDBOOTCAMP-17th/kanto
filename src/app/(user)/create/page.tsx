import { redirect } from "next/navigation";
import Link from "next/link";
import { ShoppingBag, Briefcase, Home, Users } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

const CATEGORIES = [
  {
    name: "중고거래",
    description: "중고 물품을 사고 팔아요",
    icon: ShoppingBag,
    href: "/usedgoods/create",
    color: "text-orange-500",
    bg: "bg-orange-50",
    available: true,
  },
  {
    name: "구인구직",
    description: "일자리를 구하거나 직원을 모집해요",
    icon: Briefcase,
    href: "/job/create",
    color: "text-blue-500",
    bg: "bg-blue-50",
    available: true,
  },
  {
    name: "방렌트",
    description: "방을 구하거나 방을 내놓아요",
    icon: Home,
    href: "/rental/create",
    color: "text-teal-500",
    bg: "bg-teal-50",
    available: true,
  },
  {
    name: "커뮤니티",
    description: "자유롭게 이야기를 나눠요",
    icon: Users,
    href: "/community/create",
    color: "text-purple-500",
    bg: "bg-purple-50",
    available: true,
  },
] as const;

export default async function CreatePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-sm md:max-w-xl">
        <h1 className="page-title mb-2">글쓰기</h1>
        <p className="text-sm text-gray-500 mb-8">어떤 글을 작성할까요?</p>
        <div className="grid grid-cols-2 gap-4">
          {CATEGORIES.map(
            ({ name, description, icon: Icon, href, color, bg, available }) =>
              available ? (
                <Link
                  key={name}
                  href={href}
                  className="flex flex-col gap-4 rounded-2xl border border-gray-200 p-5 md:p-8 hover:border-teal-400 hover:shadow-sm transition-all"
                >
                  <div
                    className={`w-10 h-10 md:w-10 md:h-10 rounded-xl ${bg} flex items-center justify-center`}
                  >
                    <Icon className={`w-5 h-5 md:w-7 md:h-7 ${color}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm md:text-base">
                      {name}
                    </p>
                    <p className="text-xs md:text-sm text-gray-400 mt-0.5">
                      {description}
                    </p>
                  </div>
                </Link>
              ) : (
                <div
                  key={name}
                  className="flex flex-col gap-4 rounded-2xl border border-gray-100 p-5 md:p-8 opacity-50 cursor-not-allowed"
                >
                  <div
                    className={`w-10 h-10 md:w-14 md:h-14 rounded-xl ${bg} flex items-center justify-center`}
                  >
                    <Icon className={`w-5 h-5 md:w-7 md:h-7 ${color}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-gray-800 text-sm md:text-base">
                        {name}
                      </p>
                    </div>
                    <p className="text-xs md:text-sm text-gray-400 mt-0.5">
                      {description}
                    </p>
                  </div>
                </div>
              ),
          )}
        </div>
      </div>
    </div>
  );
}
