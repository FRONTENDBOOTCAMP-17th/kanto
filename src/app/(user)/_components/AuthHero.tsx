import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";

interface Bubble {
  left: string;
  size: number;
  duration: number;
  delay: number;
  drift: number;
}

const BUBBLES: Bubble[] = [
  { left: "4%", size: 34, duration: 18, delay: -2, drift: 30 },
  { left: "14%", size: 16, duration: 13, delay: -5, drift: -20 },
  { left: "24%", size: 54, duration: 22, delay: -10, drift: 15 },
  { left: "34%", size: 22, duration: 15, delay: -1, drift: -25 },
  { left: "44%", size: 12, duration: 11, delay: -7, drift: 20 },
  { left: "54%", size: 44, duration: 20, delay: -14, drift: -10 },
  { left: "64%", size: 18, duration: 16, delay: -4, drift: 25 },
  { left: "74%", size: 30, duration: 19, delay: -9, drift: -15 },
  { left: "84%", size: 14, duration: 12, delay: -3, drift: 18 },
  { left: "94%", size: 40, duration: 24, delay: -17, drift: -20 },
  { left: "9%", size: 24, duration: 14, delay: -11, drift: 10 },
  { left: "58%", size: 10, duration: 10, delay: -6, drift: -12 },
];

function AuthBubbles() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      {BUBBLES.map((bubble, i) => (
        <span
          key={i}
          className="auth-bubble absolute bottom-[-10%] rounded-full border border-teal-300/40"
          style={
            {
              left: bubble.left,
              width: bubble.size,
              height: bubble.size,
              background:
                "radial-gradient(circle at 30% 28%, rgba(255,255,255,0.95), rgba(94,234,212,0.18) 55%, rgba(45,212,191,0.05) 100%)",
              boxShadow:
                "inset 0 0 8px rgba(255,255,255,0.6), 0 4px 10px rgba(20,184,166,0.08)",
              animationDuration: `${bubble.duration}s`,
              animationDelay: `${bubble.delay}s`,
              "--bubble-drift": `${bubble.drift}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

export function AuthHero() {
  const t = useTranslations("Auth");

  return (
    <aside className="relative hidden flex-1 items-center justify-center overflow-hidden border-r border-gray-100 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen">
      <div
        aria-hidden
        className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-teal-50 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute right-0 -bottom-32 h-112 w-112 translate-x-1/4 rounded-full bg-cyan-50 blur-3xl"
      />
      <AuthBubbles />
      <div className="relative z-10 max-w-md px-10 text-center">
        <h2 className="text-[28px] font-bold leading-snug text-gray-900 break-keep xl:text-[32px]">
          {t("heroTitle")}
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-gray-500 break-keep">
          {t("heroSubtitle")}
        </p>
      </div>
    </aside>
  );
}
