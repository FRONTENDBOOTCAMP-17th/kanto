-- 구인구직 상세 페이지에서 회사의 정확한 위치를 지도 핀으로 표시하기 위해
-- 글쓰기 폼에서 Google Places 로 선택한 주소의 좌표를 저장한다.
-- (company_address 텍스트와 함께 좌표를 보관해 상세 페이지 지도에 핀을 찍는다.)

alter table public.jobs add column if not exists company_lat double precision;
alter table public.jobs add column if not exists company_lng double precision;
