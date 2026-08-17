# Supabase pg_cron 설정 정리

프로젝트에 등록된 모든 pg_cron 스케줄 작업을 모아 정리한 문서. 개별 작업의 설계 배경은 각 링크된 문서를 참고.

> pg_cron 익스텐션 자체는 마이그레이션이 아니라 Supabase 대시보드(Database → Extensions)에서 활성화되어 있음. 코드베이스에는 `CREATE EXTENSION pg_cron` 구문이 없음.

---

## 등록된 작업 목록

| Job 이름 | 스케줄 (cron) | 실행 시각 | 실행 SQL | 등록 위치 |
|---------|--------------|----------|---------|----------|
| `recalculate-kts` | `0 3,15 * * *` | 매일 03:00, 15:00 | `SELECT recalculate_kts()` | [20260623100000_kts_kpps_scoring.sql](../../supabase/migrations/20260623100000_kts_kpps_scoring.sql) |
| `recalculate-kpps` | `30 3,15 * * *` | 매일 03:30, 15:30 | `SELECT recalculate_kpps()` | [20260623100000_kts_kpps_scoring.sql](../../supabase/migrations/20260623100000_kts_kpps_scoring.sql) |
| `meetup-chat-cleanup` | `0 * * * *` | 매시 정각 | `DELETE FROM meetup_chat_rooms WHERE expires_at < now()` | [20260624000000_kanto_go_group_chat.sql](../../supabase/migrations/20260624000000_kanto_go_group_chat.sql) |
| `rate-limit-events-cleanup` | `0 * * * *` | 매시 정각 | `DELETE FROM rate_limit_events WHERE (scope='login_fail' AND created_at < now() - interval '15 minutes') OR (scope='ai_chat' AND created_at < now() - interval '60 seconds')` | [20260817000000_rate_limit_events.sql](../../supabase/migrations/20260817000000_rate_limit_events.sql) |

시간대는 DB 서버 타임존 기준(별도 설정 없으면 UTC).

---

## 1. `recalculate-kts` / `recalculate-kpps`

망고 지수(신뢰점수 KTS · 인기점수 KPPS) 배치 재계산.

- **순서 의존성**: KPPS 계산의 KTSBonus가 당일 KTS 등급을 반영해야 하므로 `recalculate-kpps`는 반드시 `recalculate-kts` 완료 후(30분 뒤) 실행되도록 스케줄됨. 두 작업 순서를 바꾸면 KPPS가 전날 등급을 참조하게 됨.
- 상세 계산식, 컬럼, 프론트엔드 반영 현황은 → [kts-kpps-implementation.md](../설계/kts-kpps-implementation.md) 참고.

## 2. `meetup-chat-cleanup`

칸토 Go! 번개모임 단체채팅방의 24시간 유예기간 만료 후 정리.

- **백스톱(backstop) 성격**: 주 삭제 메커니즘은 서비스 레이어의 lazy delete이며, 이 크론은 그 경로를 타지 않은 잔여 행을 시간당 1회 청소하는 보조 장치.
- `meetup_chat_rooms.expires_at`은 모임 `end_at + 24h`로 설정됨.

## 3. `rate-limit-events-cleanup`

로그인 실패 제한(`scope='login_fail'`) / AI챗봇 요청 제한(`scope='ai_chat'`) 슬라이딩 윈도우 이벤트 로그 정리. Redis(get→incr→expire) 의존성을 걷어내고 Supabase로 일원화하며 도입.

- **백스톱(backstop) 성격**: 주 삭제 메커니즘은 서비스 레이어의 lazy delete([login/route.ts](../../src/app/api/login/route.ts), [ai/chat/route.ts](../../src/app/api/ai/chat/route.ts)에서 매 요청마다 그 IP의 윈도우 밖 행을 지움)이며, 이 크론은 한동안 요청이 없어 lazy delete가 발동 안 되는 IP의 잔여 행을 시간당 1회 청소하는 보조 장치.
- scope별 윈도우가 달라(`login_fail` 15분, `ai_chat` 60초) 삭제 조건도 scope마다 분기됨.

---

## 운영 참고

- 등록된 작업 확인: `SELECT * FROM cron.job;`
- 실행 이력/실패 확인: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC;`
- 작업 해제가 필요하면 `SELECT cron.unschedule('job-이름');`을 새 마이그레이션에 추가 (현재 네 작업 모두 unschedule된 이력 없음 — 전부 활성 상태로 간주).
