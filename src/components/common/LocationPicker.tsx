"use client";

// 글쓰기 폼 공용 거래지역 선택 — Google Places 자동완성으로 위치를 고르되,
// 공개되는 건 바랑가이+시 수준까지만임을 안내. (저장 시 좌표 클램프는 폼에서 수행)

import { useTranslations } from "next-intl";
import { APIProvider } from "@vis.gl/react-google-maps";
import { PlaceAutocomplete } from "@/components/go/PlaceAutocomplete";
import { formatBarangayLabel } from "@/type/location";
import type { PickedLocation } from "@/type/go";

interface Props {
  value: PickedLocation | null;
  onChange: (loc: PickedLocation) => void;
  // 편집 시 아직 재선택하지 않았을 때 보여줄 기존 공개 라벨
  fallbackLabel?: string | null;
}

export function LocationPicker({ value, onChange, fallbackLabel }: Props) {
  const tc = useTranslations("Common");

  // 새로 선택했을 때만 공개 라벨을 안내문에 노출(편집 시 기존 라벨은 연두색 바에서 보여줌 → 중복 방지)
  const freshLabel = value
    ? formatBarangayLabel(value.barangay ?? null, value.city ?? null)
    : null;
  const hasLocation = Boolean(value || fallbackLabel);

  return (
    <div className="space-y-2">
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
        <PlaceAutocomplete
          selected={value}
          onSelect={onChange}
          fallbackLabel={fallbackLabel}
        />
      </APIProvider>
      {hasLocation && (
        <p className="text-xs text-gray-500">
          {freshLabel && (
            <>
              {tc("locationPublicLabel")}:{" "}
              <span className="font-semibold text-gray-700">{freshLabel}</span>
              <br />
            </>
          )}
          {tc("locationPrivacyNote")}
        </p>
      )}
    </div>
  );
}
