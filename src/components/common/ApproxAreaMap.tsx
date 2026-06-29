"use client";

// 상세페이지 거래지역 — 정확한 핀 대신 대략적 원형 영역만 표시 (프라이버시).
// 저장된 좌표는 이미 소수점 2자리로 클램프되어 있으므로 건물 단위 특정 불가.

import { useEffect } from "react";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { useTranslations } from "next-intl";

const MAP_ID = "kanto-approx-area-map";

function AreaCircle({
  center,
  radius,
}: {
  center: google.maps.LatLngLiteral;
  radius: number;
}) {
  const map = useMap(MAP_ID);

  useEffect(() => {
    if (!map) return;
    const circle = new google.maps.Circle({
      map,
      center,
      radius,
      strokeColor: "#14b8a6",
      strokeOpacity: 0.6,
      strokeWeight: 1.5,
      fillColor: "#14b8a6",
      fillOpacity: 0.18,
      clickable: false,
    });
    return () => circle.setMap(null);
  }, [map, center, radius]);

  return null;
}

interface Props {
  lat: number;
  lng: number;
  radius?: number; // meters
  className?: string;
}

export function ApproxAreaMap({ lat, lng, radius = 400, className }: Props) {
  const tc = useTranslations("Common");
  const center = { lat, lng };

  return (
    <div className={className}>
      <Map
        id={MAP_ID}
        defaultCenter={center}
        defaultZoom={15}
        gestureHandling="cooperative"
        disableDefaultUI={true}
        className="h-48 w-full overflow-hidden rounded-xl"
      >
        <AreaCircle center={center} radius={radius} />
      </Map>
      <p className="mt-1.5 text-xs text-gray-400">{tc("approxAreaNote")}</p>
    </div>
  );
}

// APIProvider 로 감싼 단독 사용용 래퍼 (상세페이지에서 바로 사용)
export function ApproxAreaMapWithProvider(props: Props) {
  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
      <ApproxAreaMap {...props} />
    </APIProvider>
  );
}
