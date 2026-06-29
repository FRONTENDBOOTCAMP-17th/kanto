-- 거래지역 바랑가이 단위 세분화
-- 기존 location_type/location(광역 enum) + location_custom/location_detail 는 그대로 유지.
-- 정확한 좌표는 저장하지 않음 — 글쓰기 시 소수점 2자리(≈1.1km)로 반올림한 값만 저장(프라이버시 클램프).
-- 상세페이지 지도는 이 반올림 좌표를 중심으로 대략적 원형 영역만 표시.

ALTER TABLE used_goods
  ADD COLUMN IF NOT EXISTS location_barangay text,
  ADD COLUMN IF NOT EXISTS location_city     text,
  ADD COLUMN IF NOT EXISTS location_lat      double precision,
  ADD COLUMN IF NOT EXISTS location_lng      double precision;

ALTER TABLE rentals
  ADD COLUMN IF NOT EXISTS location_barangay text,
  ADD COLUMN IF NOT EXISTS location_city     text,
  ADD COLUMN IF NOT EXISTS location_lat      double precision,
  ADD COLUMN IF NOT EXISTS location_lng      double precision;

-- 2단계 필터(광역 선택 후 바랑가이) 조회 가속용 인덱스
CREATE INDEX IF NOT EXISTS idx_used_goods_barangay ON used_goods(location_type, location_barangay);
CREATE INDEX IF NOT EXISTS idx_rentals_barangay ON rentals(location, location_barangay);
