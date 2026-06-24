"use client";

const FIELD_INPUT = "w-full bg-transparent border-b border-white/10 text-white text-sm py-2.5 focus:border-white/40 focus:outline-none placeholder:text-white/20 transition-colors";

interface CompanyFormStep3Props {
  companyAddress: string;
  companyWebsite: string;
  websiteError: string;
  onCompanyAddressChange: (v: string) => void;
  onCompanyWebsiteChange: (v: string) => void;
  onWebsiteBlur: () => void;
}

export function CompanyFormStep3({
  companyAddress,
  companyWebsite,
  websiteError,
  onCompanyAddressChange,
  onCompanyWebsiteChange,
  onWebsiteBlur,
}: CompanyFormStep3Props) {
  return (
    <div className="divide-y divide-white/5">

      {/* 주소 */}
      <div className="py-8 flex gap-10 items-start">
        <div className="w-28 shrink-0 pt-3">
          <p className="text-[10px] tracking-[0.3em] text-white/30 uppercase">주소</p>
          <p className="text-[9px] text-white/20 mt-1">선택</p>
        </div>
        <div className="flex-1">
          <input
            placeholder="회사 주소를 입력해주세요"
            value={companyAddress}
            onChange={(e) => onCompanyAddressChange(e.target.value)}
            className={FIELD_INPUT}
          />
        </div>
      </div>

      {/* 웹사이트 */}
      <div className="py-8 flex gap-10 items-start">
        <div className="w-28 shrink-0 pt-3">
          <p className="text-[10px] tracking-[0.3em] text-white/30 uppercase">웹사이트</p>
          <p className="text-[9px] text-white/20 mt-1">선택</p>
        </div>
        <div className="flex-1">
          <input
            placeholder="https://company.com"
            value={companyWebsite}
            onChange={(e) => onCompanyWebsiteChange(e.target.value)}
            onBlur={onWebsiteBlur}
            className={FIELD_INPUT}
          />
          {websiteError && <p className="text-[11px] text-red-400/70 mt-2">{websiteError}</p>}
        </div>
      </div>

    </div>
  );
}
