"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

const SERVICES = [
  {
    number: "01",
    title: "회사 프로필",
    desc: "로고·소개·업종·주소까지 한 번에 등록하고\n구직자에게 신뢰감을 전달하세요.",
  },
  {
    number: "02",
    title: "공고 게시",
    desc: "급여·근무조건·우대사항을 입력하면\n필리핀 한인 구직자에게 즉시 노출됩니다.",
  },
  {
    number: "03",
    title: "채용 관리",
    desc: "등록한 공고를 한 곳에서 공개·비공개 전환하며\n채용 전 과정을 효율적으로 관리하세요.",
  },
] as const;

export function BusinessLanding() {
  return (
    <div className="bg-gray-950 text-white">

      {/* ── Hero ── */}
      <style>{`
        @keyframes infinity-travel {
          0%   { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -100; }
        }
      `}</style>

      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden">

        {/* 인피니티 SVG — pathLength로 정규화해 루프 끊김 없음 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none">
          <svg
            viewBox="0 0 500 200"
            className="w-130 max-w-[90vw]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* 가이드 — 전체 경로 희미하게 */}
            <path
              pathLength={100}
              d="M378,8 C440,8 492,48 492,100 C492,152 440,192 378,192 C316,192 270,158 250,100 C230,42 184,8 122,8 C60,8 8,48 8,100 C8,152 60,192 122,192 C184,192 230,158 250,100 C270,42 316,8 378,8 Z"
              stroke="white"
              strokeWidth="5"
              strokeOpacity="0.02"
              strokeLinecap="round"
            />
            {/* 움직이는 메인 stroke */}
            <path
              pathLength={100}
              d="M378,8 C440,8 492,48 492,100 C492,152 440,192 378,192 C316,192 270,158 250,100 C230,42 184,8 122,8 C60,8 8,48 8,100 C8,152 60,192 122,192 C184,192 230,158 250,100 C270,42 316,8 378,8 Z"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="30 70"
              strokeDashoffset="0"
              strokeOpacity="0.02"
              style={{ animation: 'infinity-travel 6s linear infinite' }}
            />
          </svg>
        </div>

        <div className="relative z-10 text-center max-w-3xl mx-auto">
          <p className="text-xs text-white/40 uppercase tracking-widest mb-8">
            Kanto · Business
          </p>

          <h1 className="text-4xl sm:text-6xl font-normal leading-tight mb-6">
            필리핀 한인 채용의<br />
            <span className="text-white/60">새로운 기준</span>
          </h1>

          <p className="text-sm text-white/40 leading-loose max-w-md mx-auto mb-10">
            간단한 회사 등록만으로<br />
            수천 명의 한인 구직자에게 즉시 도달하세요.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/business/company/create"
              className="group inline-flex items-center gap-2 bg-white text-black text-sm font-normal px-8 py-4 rounded-lg hover:bg-white/90 transition-colors"
            >
              지금 시작하기
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/business/dashboard"
              className="inline-flex items-center gap-2 border border-white/20 text-white/60 text-sm font-normal px-8 py-4 rounded-lg hover:border-white/50 hover:text-white transition-colors"
            >
              대시보드
            </Link>
          </div>
        </div>

      </section>

      {/* ── Statement ── */}
      <section className="border-t border-white/5 px-6 py-32">
        <div className="max-w-4xl mx-auto">
          <p className="text-2xl sm:text-4xl font-normal leading-relaxed text-white/60 text-center">
            &ldquo;채용은 단순한 공고가 아닙니다.<br />
            <span className="text-white">당신의 기업 문화를 전달하는 일입니다.&rdquo;</span>
          </p>
        </div>
      </section>

      {/* ── Services ── */}
      <section className="border-t border-white/5 px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] tracking-[0.4em] text-white/30 uppercase mb-16">
            Services
          </p>
          <div className="grid sm:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-white/5">
            {SERVICES.map(({ number, title, desc }) => (
              <div key={number} className="px-0 sm:px-10 py-10 sm:py-0 first:pl-0 last:pr-0">
                <span className="text-xs text-white/30">{number}</span>
                <h3 className="mt-4 text-lg font-normal text-white">{title}</h3>
                <p className="mt-3 text-xs text-white/40 leading-loose whitespace-pre-line">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Process ── */}
      <section className="border-t border-white/5 px-6 py-24 bg-white/[0.02]">
        <div className="max-w-3xl mx-auto">
          <p className="text-[10px] tracking-[0.4em] text-white/30 uppercase mb-16">
            How it works
          </p>
          <div className="space-y-0 divide-y divide-white/5">
            {[
              { step: "회사 등록", desc: "회사 정보를 입력해 기업 프로필을 완성합니다." },
              { step: "공고 작성", desc: "원하는 포지션과 근무 조건을 상세히 기입합니다." },
              { step: "채용 관리", desc: "대시보드에서 공고를 실시간으로 관리합니다." },
            ].map(({ step, desc }, i) => (
              <div key={step} className="flex items-center justify-between py-7 group">
                <div className="flex items-center gap-8">
                  <span className="text-xs text-white/30 tabular-nums">0{i + 1}</span>
                  <span className="text-base font-normal text-white/80 group-hover:text-white transition-colors">
                    {step}
                  </span>
                </div>
                <p className="hidden sm:block text-xs text-white/30 max-w-xs text-right">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-white/5 px-6 py-36 text-center">
        <div className="max-w-xl mx-auto">
          <p className="text-[10px] tracking-[0.4em] text-white/30 uppercase mb-8">
            Get Started
          </p>
          <h2 className="text-3xl sm:text-5xl font-normal mb-12 leading-tight">
            지금 바로<br />채용을 시작하세요
          </h2>
          <Link
            href="/business/company/create"
            className="group inline-flex items-center gap-2 bg-white text-black text-sm font-normal px-10 py-4 rounded-lg hover:bg-white/90 transition-all duration-300"
          >
            무료로 시작하기
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

    </div>
  );
}
