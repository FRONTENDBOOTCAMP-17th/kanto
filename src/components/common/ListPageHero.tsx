import type { LucideIcon } from "lucide-react";

interface ListPageHeroProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}

export function ListPageHero({
  icon: Icon,
  title,
  subtitle,
  action,
  children,
}: ListPageHeroProps) {
  return (
    <section className="relative rounded-3xl bg-cyan-950 shadow-xl px-4 py-8 md:px-12 md:py-10">
      <div
        className="absolute inset-0 overflow-hidden rounded-3xl"
        aria-hidden="true"
      >
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-12 -translate-y-1/2 opacity-10 hidden md:block">
          <Icon className="w-44 h-44 text-white" />
        </div>
      </div>

      {action && <div className="absolute right-4 top-4 z-10">{action}</div>}

      <div className="relative z-20 flex flex-col items-center text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow break-keep">
          {title}
        </h1>
        <p className="mt-1.5 text-sm text-white/85 drop-shadow break-keep">
          {subtitle}
        </p>
        {children && <div className="mt-6 w-full">{children}</div>}
      </div>
    </section>
  );
}
