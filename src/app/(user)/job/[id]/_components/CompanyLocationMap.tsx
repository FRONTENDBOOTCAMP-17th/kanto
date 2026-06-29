"use client";

// 구인구직 상세 — 회사의 정확한 위치를 지도에 핀으로 표시.
// 글쓰기에서 Google Places 로 선택해 저장한 좌표(company_lat/lng)를 사용한다.

import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { MapPin } from "lucide-react";

const MAP_ID = "kanto-company-location-map";

interface Props {
  lat: number;
  lng: number;
  address?: string | null;
}

export default function CompanyLocationMap({ lat, lng, address }: Props) {
  const center = { lat, lng };

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
      <Map
        id={MAP_ID}
        mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID}
        defaultCenter={center}
        defaultZoom={16}
        gestureHandling="cooperative"
        disableDefaultUI={true}
        className="h-56 w-full overflow-hidden rounded-xl"
      >
        <AdvancedMarker position={center} title={address ?? undefined}>
          <MapPin className="h-9 w-9 -translate-y-1/2 fill-teal-500 text-white drop-shadow-md" strokeWidth={1.5} />
        </AdvancedMarker>
      </Map>
    </APIProvider>
  );
}
