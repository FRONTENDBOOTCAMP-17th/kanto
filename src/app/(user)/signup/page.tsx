"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";
import { EyeIcon } from "@/src/app/(user)/signup/_components/EyeIcon";

const TERMS_SECTIONS = [
  {
    title: "⚠️ 면책조항 (중요)",
    warn: true,
    content:
      "Kanto는 유저 간 직접 거래(계좌이체/직거래)에서 발생하는 사기, 분쟁, 금전적 피해에 대해 어떠한 법적 책임도 지지 않습니다. 안전거래 이용을 강력히 권장합니다.",
  },
  {
    title: "🚫 금지 게시물",
    items: [
      "마약류 및 불법 약물 거래",
      "총기 및 무기류 거래",
      "성매매 및 성인 컨텐츠",
      "48시간 이내 동일 게시글 중복 등록",
      "혐오·차별·폭력적 표현",
    ],
    warn: "위반 시 즉시 계정 영구 정지 및 수사기관에 신고됩니다.",
  },
  {
    title: "💬 채팅 이용 규칙",
    items: [
      "외부 링크 전송 금지 (피싱·사기 방지)",
      "욕설 및 혐오 발언 금지",
      "신고 3회 누적 시 계정 이용 정지",
    ],
  },
  {
    title: "🔒 안전거래 안내",
    items: [
      "신규 회원 첫 거래 시 안전결제 필수",
      "직거래 시 반드시 공공장소에서 만나세요",
      "의심스러운 거래는 즉시 신고해주세요",
    ],
  },
  {
    title: "⚡ 제재 기준",
    items: [
      "1단계: 경고",
      "2단계: 7일 이용 정지 (신고 3회 누적 포함)",
      "3단계: 30일 이용 정지",
      "4단계: 영구 정지 + 수사기관 신고 (불법행위)",
    ],
  },
];

const PRIVACY_SECTIONS = [
  {
    title: "👤 개인정보 처리방침",
    items: [
      "수집 항목: 이메일, 이름 (필수) / 전화번호 (선택)",
      "이용 목적: 회원 식별 및 서비스 제공",
      "보관 기간: 탈퇴 후 30일 후 완전 삭제",
      "제3자 제공: 수사기관 요청 시에만 제공",
    ],
  },
];

const AGREES = [
  {
    id: "terms",
    label: "서비스 이용약관",
    desc: "면책조항, 금지행위, 제재 기준에 동의합니다",
    required: true,
  },
  {
    id: "privacy",
    label: "개인정보 처리방침",
    desc: "가입 시 이메일, 이름 등 개인정보가 저장됩니다",
    required: true,
  },
  {
    id: "age",
    label: "만 18세 이상 확인",
    desc: "결제 및 거래 서비스 이용을 위해 필요합니다",
    required: true,
  },
  {
    id: "marketing",
    label: "마케팅 수신 동의",
    desc: "이벤트, 혜택 등 마케팅 정보를 받습니다",
    required: false,
  },
  {
    id: "push",
    label: "푸시 알림 수신",
    desc: "채팅, 새 게시글 등 알림을 받습니다",
    required: false,
  },
];

type ModalType = "terms" | "privacy" | "age";

const MODAL_TITLES: Record<ModalType, string> = {
  terms: "서비스 이용약관",
  privacy: "개인정보 처리방침",
  age: "만 18세 이상 확인",
};

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState({
    terms: false,
    privacy: false,
    age: false,
    marketing: false,
    push: false,
  });

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  const focusNext =
    (next: React.RefObject<HTMLInputElement | null>) =>
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        next.current?.focus();
      }
    };

  const [modalType, setModalType] = useState<ModalType | null>(null);
  const [modalQueue, setModalQueue] = useState<ModalType[]>([]);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = modalType ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalType]);

  const nameValid = /^[가-힣a-zA-Z]{2,}$/.test(name);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/.test(password);
  const confirmPasswordValid =
    confirmPassword === password && confirmPassword !== "";

  const allChecked = Object.values(agreed).every((v) => v);
  const requiredChecked = AGREES.filter((a) => a.required).every(
    (a) => agreed[a.id as keyof typeof agreed],
  );

  const openModal = (type: ModalType, queue: ModalType[] = []) => {
    setModalType(type);
    setModalQueue(queue);
    setScrolledToBottom(type !== "terms");
  };

  const handleItemClick = (id: string) => {
    if (id === "marketing" || id === "push") {
      setAgreed((prev) => ({ ...prev, [id]: !prev[id as keyof typeof prev] }));
      return;
    }
    const key = id as ModalType;
    if (agreed[key]) {
      setAgreed((prev) => ({ ...prev, [key]: false }));
    } else {
      openModal(key);
    }
  };

  const handleToggleAll = () => {
    if (allChecked) {
      const reset = Object.fromEntries(
        AGREES.map((a) => [a.id, false]),
      ) as typeof agreed;
      setAgreed(reset);
      return;
    }
    setAgreed((prev) => ({ ...prev, marketing: true, push: true }));
    const order: ModalType[] = ["terms", "privacy", "age"];
    const queue = order.filter((id) => !agreed[id]);
    if (queue.length > 0) {
      openModal(queue[0], queue.slice(1));
    }
  };

  const handleModalAgree = () => {
    if (!modalType) return;
    setAgreed((prev) => ({ ...prev, [modalType]: true }));
    if (modalQueue.length > 0) {
      const [next, ...rest] = modalQueue;
      setModalType(next);
      setModalQueue(rest);
      setScrolledToBottom(next !== "terms");
    } else {
      setModalType(null);
    }
  };

  const handleModalClose = () => {
    setModalType(null);
    setModalQueue([]);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (modalType !== "terms") return;
    const el = e.currentTarget;
    setScrolledToBottom(el.scrollHeight - el.scrollTop <= el.clientHeight + 10);
  };

  const handleSubmit = async () => {
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    });
    if (!nameValid || !emailValid || !passwordValid || !confirmPasswordValid)
      return;
    if (!requiredChecked) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (data.user?.identities?.length === 0) {
        setErrorMessage("이미 가입된 이메일입니다.");
        return;
      }

      setIsSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };
  const sections =
    modalType === "terms"
      ? TERMS_SECTIONS
      : modalType === "privacy"
        ? PRIVACY_SECTIONS
        : null;

  return (
    <div className="min-h-screen min-w-[390px] bg-linear-to-br from-teal-50 to-teal-100 flex items-center justify-center p-4">
      <div className="w-full max-w-97.5 bg-white rounded-2xl shadow-md p-8 my-8">
        <Link href="/" className="text-sm text-teal-600 font-semibold">
          홈으로 가기
        </Link>
        <div className="flex justify-center mb-8">
          <img src="/signup/kanto.png" alt="Kanto" className="h-20 w-auto" />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-gray-700">
              이름
            </label>
            <input
              id="name"
              ref={nameRef}
              autoFocus
              type="text"
              placeholder="한글 또는 영어 2자 이상 (예: 홍길동)"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrorMessage("");
              }}
              onBlur={() => {
                if (name) setTouched((p) => ({ ...p, name: true }));
              }}
              onKeyDown={focusNext(emailRef)}
              className={`w-full border rounded-md px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 ${touched.name && !nameValid ? "border-red-400" : "border-gray-300"}`}
            />
            {touched.name && !nameValid && (
              <p className="text-xs text-red-500">
                한글 또는 영어로 2자 이상 입력해주세요.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-gray-700"
            >
              이메일
            </label>
            <input
              id="email"
              ref={emailRef}
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrorMessage("");
              }}
              onBlur={() => {
                if (email) setTouched((p) => ({ ...p, email: true }));
              }}
              onKeyDown={focusNext(passwordRef)}
              className={`w-full border rounded-md px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 ${touched.email && !emailValid ? "border-red-400" : "border-gray-300"}`}
            />
            {touched.email && !emailValid && (
              <p className="text-xs text-red-500">
                올바른 이메일을 입력해주세요.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-gray-700"
            >
              비밀번호
            </label>
            <div className="relative">
              <input
                id="password"
                ref={passwordRef}
                type={showPassword ? "text" : "password"}
                placeholder="영문 + 숫자 포함 8자 이상"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage("");
                }}
                onBlur={() => {
                  if (password) setTouched((p) => ({ ...p, password: true }));
                }}
                onKeyDown={focusNext(confirmPasswordRef)}
                className={`w-full border rounded-md px-3 py-2 pr-10 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 ${touched.password && !passwordValid ? "border-red-400" : "border-gray-300"}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <EyeIcon visible={showPassword} />
              </button>
            </div>
            {touched.password && !passwordValid && (
              <p className="text-xs text-red-500">
                영문과 숫자를 포함하여 8자 이상 입력해주세요.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label
              htmlFor="confirmPassword"
              className="text-sm font-medium text-gray-700"
            >
              비밀번호 확인
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                ref={confirmPasswordRef}
                type={showConfirmPassword ? "text" : "password"}
                placeholder="비밀번호를 다시 입력하세요"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrorMessage("");
                }}
                onBlur={() => {
                  if (confirmPassword)
                    setTouched((p) => ({ ...p, confirmPassword: true }));
                }}
                className={`w-full border rounded-md px-3 py-2 pr-10 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 ${touched.confirmPassword && !confirmPasswordValid ? "border-red-400" : "border-gray-300"}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <EyeIcon visible={showConfirmPassword} />
              </button>
            </div>
            {touched.confirmPassword && !confirmPasswordValid && (
              <p className="text-xs text-red-500">
                비밀번호가 일치하지 않습니다.
              </p>
            )}
          </div>

          <div className="border-t pt-4 space-y-3">
            <div
              onClick={handleToggleAll}
              className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3 cursor-pointer"
            >
              <div
                className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${allChecked ? "bg-teal-500 border-teal-500" : "border-gray-300"}`}
              >
                {allChecked && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
              <span className="text-sm font-medium text-gray-900">
                전체 동의하기
              </span>
            </div>

            <div className="space-y-1">
              {AGREES.map((a) => (
                <div
                  key={a.id}
                  onClick={() => handleItemClick(a.id)}
                  className="flex items-start gap-3 px-4 py-2 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div
                    className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${agreed[a.id as keyof typeof agreed] ? "bg-teal-500 border-teal-500" : "border-gray-300"}`}
                  >
                    {agreed[a.id as keyof typeof agreed] && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-900">{a.label}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.required ? "bg-teal-100 text-teal-600" : "bg-gray-100 text-gray-500"}`}
                      >
                        {a.required ? "필수" : "선택"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{a.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {errorMessage && (
            <p className="text-sm text-red-500 text-center">{errorMessage}</p>
          )}

          {isSuccess && (
            <div className="text-sm text-teal-600 text-center bg-teal-50 rounded-md p-3">
              가입 완료! 이메일을 확인해 인증을 완료해주세요.
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!requiredChecked || isLoading || isSuccess}
            className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-md transition-colors"
          >
            {isLoading ? "처리 중..." : "회원가입"}
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            이미 계정이 있으신가요?{" "}
            <Link
              href="/login"
              className="text-teal-500 hover:text-teal-600 font-semibold"
            >
              로그인
            </Link>
          </p>
        </div>
      </div>

      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={handleModalClose}
          />

          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl flex flex-col max-h-[85vh]">
            <div className="px-6 pt-6 pb-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                {MODAL_TITLES[modalType]}
              </h2>
            </div>

            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-6 py-4"
            >
              {sections && (
                <div className="space-y-4">
                  {sections.map((s, i) => (
                    <div key={i} className="border rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">
                        {s.title}
                      </h3>
                      {"warn" in s && s.warn === true ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 leading-relaxed">
                          {s.content}
                        </div>
                      ) : (
                        <>
                          <ul className="text-sm text-gray-600 space-y-1.5 leading-relaxed">
                            {s.items?.map((item, j) => (
                              <li key={j} className="ml-4 list-disc">
                                {item}
                              </li>
                            ))}
                          </ul>
                          {"warn" in s && typeof s.warn === "string" && (
                            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                              {s.warn}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {modalType === "age" && (
                <div className="border rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    🔞 연령 확인
                  </h3>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 leading-relaxed">
                    Kanto는 만 18세 이상만 이용 가능한 서비스입니다. 결제 및
                    거래 서비스 이용을 위해 연령 확인이 필요합니다. 만 18세
                    미만의 경우 서비스 이용이 제한될 수 있습니다.
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t flex gap-3">
              <button
                onClick={handleModalClose}
                className="flex-1 border border-gray-300 text-gray-700 font-medium py-2.5 rounded-md hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleModalAgree}
                disabled={!scrolledToBottom}
                className="flex-1 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-md transition-colors"
              >
                {scrolledToBottom ? "동의합니다" : "끝까지 읽어주세요"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
