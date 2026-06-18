import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ShoppingBag, Briefcase, Home, Users } from "lucide-react";
import { createClient } from "@/utils/supabase/server";

const CATEGORIES = [
  {
    key: "usedgoods",
    icon: ShoppingBag,
    href: "/usedgoods/create",
    color: "text-orange-500",
    bg: "bg-orange-50",
    available: true,
  },
  {
    key: "jobs",
    icon: Briefcase,
    href: "/job/create",
    color: "text-blue-500",
    bg: "bg-blue-50",
    available: true,
  },
  {
    key: "rental",
    icon: Home,
    href: "/rental/create",
    color: "text-teal-500",
    bg: "bg-teal-50",
    available: true,
  },
  {
    key: "community",
    icon: Users,
    href: "/community/create",
    color: "text-purple-500",
    bg: "bg-purple-50",
    available: true,
  },
] as const;

export default async function CreatePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const t = await getTranslations("Create");

  return (
    <div className="flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-sm md:max-w-xl">
        <h1 className="page-title mb-2">{t("title")}</h1>
        <p className="text-sm text-gray-500 mb-8">{t("subtitle")}</p>
        <div className="grid grid-cols-2 gap-4">
          {CATEGORIES.map(
            ({ key, icon: Icon, href, color, bg, available }) =>
              available ? (
                <Link
                  key={key}
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
                      {t(`categories.${key}.name`)}
                    </p>
                    <p className="text-xs md:text-sm text-gray-400 mt-0.5">
                      {t(`categories.${key}.description`)}
                    </p>
                  </div>
                </Link>
              ) : (
                <div
                  key={key}
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
                        {t(`categories.${key}.name`)}
                      </p>
                    </div>
                    <p className="text-xs md:text-sm text-gray-400 mt-0.5">
                      {t(`categories.${key}.description`)}
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
