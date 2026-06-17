-- 근무 요일 / 시간협의 / 우대사항 태그 컬럼 추가
alter table public.jobs
  add column work_days text[],
  add column is_time_negotiable boolean not null default false,
  add column preferred_tags text[];

-- 시간협의(is_time_negotiable=true) 공고는 근무시간을 null로 저장할 수 있도록 NOT NULL 제거
alter table public.jobs
  alter column work_hours drop not null;
