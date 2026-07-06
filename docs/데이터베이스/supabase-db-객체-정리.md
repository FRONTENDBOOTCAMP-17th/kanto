# Supabase DB 객체 정리 — 트리거 · RPC 함수 · RLS 정책

> 작성일: 2026-07-06
> 기준: Supabase 대시보드 SQL Editor로 라이브 DB(`information_schema` / `pg_proc` / `pg_policies` / `pg_class`)를 직접 조회한 결과 + `supabase/migrations/*.sql` 이력을 대조해 작성.

## 이 문서를 만든 방법 / 한계

- `supabase/migrations/`에는 **2026-06-18 이후** 변경 이력만 있다. 그 이전에 대시보드에서 직접 만든 트리거·함수·정책은 마이그레이션 파일에 없으므로, 이 문서는 마이그레이션 파일이 아니라 **라이브 DB 조회 결과**를 1차 출처로 삼았다.
- 로컬 환경에 Docker/psql이 없어 `supabase db dump`로 스키마 전체를 자동 덤프하지 못했다. 대신 SQL Editor에서 아래 카탈로그 쿼리를 실행해 결과를 옮겨 적었다.
  - 트리거: `information_schema.triggers`
  - 함수: `pg_proc` + `pg_get_functiondef()`
  - RLS 정책: `pg_policies`
  - RLS 활성화 여부: `pg_class.relrowsecurity`
- `pg_trgm`(유사도 검색), `moddatetime`(updated_at 자동 갱신) 확장이 만든 내장 함수(`similarity`, `gtrgm_*`, `show_limit` 등)는 서비스 로직이 아니므로 이 문서에서 제외했다. `moddatetime`은 `posts.handle_updated_at` 트리거에서 사용 중이다.
- 이후 새 마이그레이션이 추가되면 이 문서는 다시 최신화가 필요하다(자동 동기화 아님).

---

## 1. 트리거

| 테이블 | 트리거명 | 시점 | 이벤트 | 실행 함수 |
| --- | --- | --- | --- | --- |
| `common_likes` | `trg_notify_like` | AFTER | INSERT | `notify_on_like()` |
| `common_likes` | `trg_notify_like_delete` | AFTER | DELETE | `notify_on_like_delete()` |
| `common_likes` | `trg_post_like_count` | AFTER | INSERT, DELETE | `update_post_like_count()` |
| `common_likes` | `trg_update_like_count` | AFTER | INSERT, DELETE | `update_like_count()` |
| `messages` | `trg_update_last_message_at` | AFTER | INSERT | `update_chat_last_message_at()` |
| `posts` | `handle_updated_at` | BEFORE | UPDATE | `moddatetime('updated_at')` (확장 함수) |
| `posts` | `on_new_post` | AFTER | INSERT | `notify_new_post()` |
| `posts` | `trg_notify_on_new_post` | AFTER | INSERT | `notify_on_new_post()` |
| `posts` | `trg_post_count` | AFTER | INSERT, DELETE | `update_post_count()` |
| `reviews` | `reviews_set_updated_at` | BEFORE | UPDATE | `set_updated_at()` |
| `reviews` | `reviews_sync_avg_rating_delete` | AFTER | DELETE | `sync_user_avg_rating()` |
| `reviews` | `reviews_sync_avg_rating_insert` | AFTER | INSERT | `sync_user_avg_rating()` |
| `reviews` | `reviews_sync_avg_rating_update` | AFTER | UPDATE | `sync_user_avg_rating()` |
| `users` | `trg_sync_kts_grade` | BEFORE | UPDATE | `sync_kts_grade()` |
| `auth.users` | `on_auth_user_created` | AFTER | INSERT | `handle_new_user()` |

> 2026-07-06: `posts`(`on_new_post`)와 `auth.users`(`회원가입_트리거`)에 중복 등록돼 있던 트리거를 제거했다. 자세한 내용은 [7. 수정 이력](#7-수정-이력) 참고.

---

## 2. RPC / 유틸리티 함수

### 2-1. 권한 판별 헬퍼

이후 RLS 정책 전반에서 반복 사용되는 함수. 모두 `SECURITY DEFINER` + `STABLE`이라 정책 안에서 호출해도 대상 테이블 RLS를 재귀하지 않는다.

```sql
-- 로그인한 auth 사용자의 public.users.id
CREATE OR REPLACE FUNCTION public.my_user_id()
RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id FROM public.users WHERE auth_id = auth.uid()
$$;

-- 로그인한 사용자의 role
CREATE OR REPLACE FUNCTION public.my_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.users WHERE auth_id = auth.uid()
$$;

-- 로그인한 사용자가 admin인지
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin'
  )
$$;
```

### 2-2. 회원가입(auth 트리거 함수)

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.users (auth_id, email, name, avatar_url, provider, created_at)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name',
             NEW.raw_user_meta_data->>'nickname', split_part(COALESCE(NEW.email, ''), '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_app_meta_data->>'provider', NEW.raw_user_meta_data->>'provider'),
    COALESCE(NEW.created_at, now())
  )
  ON CONFLICT (auth_id) DO NOTHING;
  RETURN NEW;
END;
$$;
```

> 2026-07-06까지는 `신규_유저_처리()`(`회원가입_트리거`)라는 동일 목적의 함수가 하나 더 걸려 있었다. 두 함수 모두 `auth.users` INSERT 시 `public.users`에 행을 만드는 중복 트리거였고, `신규_유저_처리`를 제거해 `handle_new_user()` 하나만 남겼다. 자세한 내용은 [7. 수정 이력](#7-수정-이력) 참고.

### 2-3. 알림 생성 트리거 함수

| 함수 | 대상 테이블(트리거) | 동작 |
| --- | --- | --- |
| `notify_on_new_post()` | `posts` INSERT (`trg_notify_on_new_post`) | `status='active'`인 글만 대상으로 관심 카테고리/키워드가 맞는 유저에게 "관심 있는 새 게시글이 등록되었습니다" 알림 생성 |
| `notify_on_like()` | `common_likes` INSERT (`trg_notify_like`) | 좋아요 시 게시글 작성자에게 알림, 동일 알림 중복 생성 방지 체크 포함 |
| `notify_on_like_delete()` | `common_likes` DELETE (`trg_notify_like_delete`) | 좋아요 취소 시 방금 생성된 알림 삭제 |

> 2026-07-06 이전에는 `notify_new_post()`(`on_new_post` 트리거, status 체크 없이 실행)가 `notify_on_new_post()`와 같은 목적으로 중복 등록돼 있었고, 어떤 트리거에도 연결되지 않은 미사용 함수 `notify_comment()`/`notify_on_comment()`/`notify_like()`/`notify_message()`도 남아 있었다. 모두 제거했다 — [7. 수정 이력](#7-수정-이력) 참고.

```sql
CREATE OR REPLACE FUNCTION public.notify_on_new_post()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_category text;
BEGIN
  IF NEW.status != 'active' THEN RETURN NEW; END IF;

  v_category := CASE NEW.post_type
    WHEN 'used_goods' THEN 'usedgoods' WHEN 'rental' THEN 'rental' WHEN 'jobs' THEN 'jobs' ELSE NULL
  END;
  IF v_category IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.common_notifications (receiver_id, type, related_type, related_id, title, body, is_read)
  SELECT u.id, 'post', NEW.post_type, NEW.id, '관심 있는 새 게시글이 등록되었습니다', NEW.title, false
  FROM public.users u
  WHERE u.alert_post = true
    AND u.id != NEW.user_id
    AND (
      u.interest_categories IS NULL
      OR v_category = ANY(u.interest_categories)
      OR EXISTS (SELECT 1 FROM unnest(u.alert_keywords) kw WHERE NEW.title ILIKE '%' || kw || '%')
    );
  RETURN NEW;
END;
$$;
```

```sql
CREATE OR REPLACE FUNCTION public.notify_on_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  post_owner_id BIGINT; post_title TEXT; post_type_val TEXT; sender_name TEXT;
BEGIN
  SELECT p.user_id, p.title, p.post_type INTO post_owner_id, post_title, post_type_val
  FROM posts p WHERE p.id = NEW.target_id;

  IF post_owner_id IS NULL OR post_owner_id = NEW.user_id THEN RETURN NEW; END IF;

  IF EXISTS (
    SELECT 1 FROM common_notifications
    WHERE receiver_id = post_owner_id AND type = 'like'
      AND related_id = NEW.target_id AND related_type = post_type_val
      AND title LIKE (SELECT u.name FROM users u WHERE u.id = NEW.user_id) || '%'
  ) THEN RETURN NEW; END IF;

  SELECT u.name INTO sender_name FROM users u WHERE u.id = NEW.user_id;
  INSERT INTO common_notifications (receiver_id, type, title, body, related_id, related_type, is_read)
  VALUES (post_owner_id, 'like', sender_name || '님이 좋아요를 눌렀습니다', post_title, NEW.target_id, post_type_val, false);
  RETURN NEW;
END;
$$;
```

```sql
CREATE OR REPLACE FUNCTION public.notify_on_like_delete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  post_owner_id BIGINT; post_type_val TEXT; sender_name TEXT;
BEGIN
  SELECT p.user_id, p.post_type INTO post_owner_id, post_type_val
  FROM posts p WHERE p.id = OLD.target_id;

  IF post_owner_id IS NULL OR post_owner_id = OLD.user_id THEN RETURN OLD; END IF;

  SELECT u.name INTO sender_name FROM users u WHERE u.id = OLD.user_id;
  DELETE FROM common_notifications
  WHERE receiver_id = post_owner_id AND type = 'like'
    AND related_id = OLD.target_id AND related_type = post_type_val
    AND title = sender_name || '님이 좋아요를 눌렀습니다';
  RETURN OLD;
END;
$$;
```

### 2-4. 채팅

```sql
-- presence(열람중) 플래그를 본인 슬롯만 갱신 (RLS 우회 없이 서버 액션에서 호출)
CREATE OR REPLACE FUNCTION public.set_chat_active(p_chat_id bigint, p_user_id bigint, p_active boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE public.chats SET user_id_1_active = p_active WHERE id = p_chat_id AND user_id_1 = p_user_id;
  UPDATE public.chats SET user_id_2_active = p_active WHERE id = p_chat_id AND user_id_2 = p_user_id;
END;
$$;

-- 채팅 미읽음 카운트 증가 (NULL-safe)
CREATE OR REPLACE FUNCTION public.increment_unread(p_chat_id bigint, p_for_user1 boolean)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE public.chats SET
    user_id_1_unread = COALESCE(user_id_1_unread, 0) + CASE WHEN p_for_user1 THEN 1 ELSE 0 END,
    user_id_2_unread = COALESCE(user_id_2_unread, 0) + CASE WHEN p_for_user1 THEN 0 ELSE 1 END
  WHERE id = p_chat_id;
$$;

-- 채팅방 읽음 처리
CREATE OR REPLACE FUNCTION public.mark_chat_read(p_chat_id bigint, p_user_id bigint)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE messages SET is_read = true WHERE chat_id = p_chat_id AND sender_id <> p_user_id AND is_read = false;
  UPDATE chats SET
    user_id_1_unread = CASE WHEN user_id_1 = p_user_id THEN 0 ELSE user_id_1_unread END,
    user_id_2_unread = CASE WHEN user_id_2 = p_user_id THEN 0 ELSE user_id_2_unread END
  WHERE id = p_chat_id;
$$;

-- 칸토go 단체채팅 멤버십(호스트 ∪ 참여자) 판별. RLS 정책에서 재귀 방지용으로 사용.
CREATE OR REPLACE FUNCTION public.is_meetup_chat_member(p_room_id bigint, p_user_id bigint)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM meetup_chat_rooms r JOIN posts p ON p.id = r.meetup_post_id
    WHERE r.id = p_room_id
      AND (p.user_id = p_user_id OR EXISTS (
        SELECT 1 FROM meetup_participants mp
        WHERE mp.meetup_post_id = r.meetup_post_id AND mp.user_id = p_user_id AND mp.status = 'joined'
      ))
  );
$$;
```

> `set_chat_active`는 1:1 채팅 알림이 `common_notifications`에서 빠지면서(2026-06-23) presence 체크가 더 이상 알림 로직에 쓰이지 않게 됐지만, 클라이언트(`useChatRoomRealtime`)가 여전히 호출하므로 무해한 no-op으로 남겨둔 상태다.

### 2-5. 카운트/집계 동기화 (트리거 전용)

```sql
CREATE OR REPLACE FUNCTION public.update_like_count()  -- common_likes → users.like_count
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN UPDATE users SET like_count = like_count + 1 WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN UPDATE users SET like_count = like_count - 1 WHERE id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_post_count()  -- posts → users.post_count
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN UPDATE users SET post_count = post_count + 1 WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN UPDATE users SET post_count = post_count - 1 WHERE id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_post_like_count()  -- common_likes → posts.like_count
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.target_type = 'post' THEN
    UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.target_id;
  ELSIF TG_OP = 'DELETE' AND OLD.target_type = 'post' THEN
    UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.target_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_chat_last_message_at()  -- messages → chats.last_message_at
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.chats SET last_message_at = NEW.created_at WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_user_avg_rating()  -- reviews → users.avg_rating
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE target_user_id bigint;
BEGIN
  IF TG_OP = 'DELETE' THEN target_user_id := OLD.reviewee_id; ELSE target_user_id := NEW.reviewee_id; END IF;
  UPDATE public.users SET avg_rating = (
    SELECT ROUND(AVG(rating)::numeric, 2) FROM public.reviews
    WHERE reviewee_id = target_user_id AND deleted_at IS NULL
  ) WHERE id = target_user_id;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_kts_grade()  -- users.kts_score → users.kts_grade
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.kts_grade := CASE
    WHEN NEW.kts_score >= 90 THEN 'A' WHEN NEW.kts_score >= 75 THEN 'B'
    WHEN NEW.kts_score >= 50 THEN 'C' WHEN NEW.kts_score >= 30 THEN 'D' ELSE 'E'
  END;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()  -- reviews.updated_at 자동 갱신
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
```

### 2-6. 게시글

```sql
CREATE OR REPLACE FUNCTION public.increment_view_count(p_post_id integer)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE posts SET view_count = view_count + 1 WHERE id = p_post_id;
$$;
```

### 2-7. 관리자 대시보드 통계 RPC

`docs/설계/admin-dashboard-supabase-spec.md`에서 처음 정의된 함수들(Supabase JS 체이닝으로 표현하기 어려운 집계/UNION 쿼리).

```sql
CREATE OR REPLACE FUNCTION public.get_active_users_count(days integer)
RETURNS TABLE(count bigint) LANGUAGE sql AS $$
  SELECT COUNT(DISTINCT uid) AS count FROM (
    SELECT user_id AS uid FROM posts WHERE created_at >= NOW() - (days || ' days')::interval
    UNION
    SELECT user_id_1 AS uid FROM chats WHERE last_message_at >= NOW() - (days || ' days')::interval
    UNION
    SELECT user_id_2 AS uid FROM chats WHERE last_message_at >= NOW() - (days || ' days')::interval
  ) sub;
$$;
```

> 2026-07-06 이전에는 `comments` 테이블(2026-07-06 `20260706120000_drop_unused_tables.sql`에서 삭제됨)을 조회하는 UNION 절이 남아 있어 이 함수가 호출 시 에러가 났다(관리자 대시보드 "활성 사용자 수" 위젯 영향). 위 정의는 그 UNION 절을 제거한 수정 후 버전이다 — [7. 수정 이력](#7-수정-이력) 참고.

```sql
CREATE OR REPLACE FUNCTION public.get_daily_signups(days integer)
RETURNS TABLE(day date, count bigint) LANGUAGE sql AS $$
  SELECT DATE(created_at) AS day, COUNT(*) AS count FROM users
  WHERE created_at >= CURRENT_DATE - (days || ' days')::interval AND deleted_at IS NULL
  GROUP BY DATE(created_at) ORDER BY day;
$$;

CREATE OR REPLACE FUNCTION public.get_region_post_counts(days integer)
RETURNS TABLE(location text, count bigint) LANGUAGE sql AS $$
  SELECT location, COUNT(*) AS count FROM (
    SELECT ug.location_type::text AS location FROM posts p JOIN used_goods ug ON ug.post_id = p.id
      WHERE p.created_at >= NOW() - (days || ' days')::interval AND p.status = 'active'
    UNION ALL
    SELECT r.location::text FROM posts p JOIN rentals r ON r.post_id = p.id
      WHERE p.created_at >= NOW() - (days || ' days')::interval AND p.status = 'active'
    UNION ALL
    SELECT j.location_type::text FROM posts p JOIN jobs j ON j.post_id = p.id
      WHERE p.created_at >= NOW() - (days || ' days')::interval AND p.status = 'active'
  ) sub
  WHERE location IS NOT NULL GROUP BY location ORDER BY count DESC LIMIT 6;
$$;

CREATE OR REPLACE FUNCTION public.get_reported_posts(limit_count integer DEFAULT 10)
RETURNS TABLE(post_id bigint, title text, post_type text, report_count bigint, latest_reason text, first_reported_at timestamptz)
LANGUAGE sql AS $$
  SELECT r.target_id, p.title, p.post_type::text, COUNT(r.id), MAX(r.category), MIN(r.created_at)
  FROM common_reports r JOIN posts p ON p.id = r.target_id
  WHERE r.target_type = 'post' AND r.status = 'pending'
  GROUP BY r.target_id, p.title, p.post_type ORDER BY COUNT(r.id) DESC LIMIT limit_count;
$$;

CREATE OR REPLACE FUNCTION public.get_reported_users(limit_count integer DEFAULT 10)
RETURNS TABLE(user_id bigint, name text, avatar_url text, report_count bigint, latest_reason text, first_reported_at timestamptz)
LANGUAGE sql AS $$
  SELECT r.target_id, u.name, u.avatar_url, COUNT(r.id), MAX(r.category), MIN(r.created_at)
  FROM common_reports r JOIN users u ON u.id = r.target_id
  WHERE r.target_type = 'user' AND r.status = 'pending'
  GROUP BY r.target_id, u.name, u.avatar_url ORDER BY COUNT(r.id) DESC LIMIT limit_count;
$$;
```

### 2-8. 회원 정리(계정 삭제 30일 후 하드 삭제)

```sql
CREATE OR REPLACE FUNCTION public.cleanup_deleted_users()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE target RECORD;
BEGIN
  FOR target IN
    SELECT id, auth_id FROM public.users
    WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '30 days'
  LOOP
    DELETE FROM public.messages WHERE sender_id = target.id;
    DELETE FROM public.chats WHERE user_id_1 = target.id OR user_id_2 = target.id;
    DELETE FROM public.used_goods WHERE post_id IN (SELECT id FROM public.posts WHERE user_id = target.id);
    DELETE FROM public.jobs WHERE post_id IN (SELECT id FROM public.posts WHERE user_id = target.id);
    DELETE FROM public.rentals WHERE post_id IN (SELECT id FROM public.posts WHERE user_id = target.id);
    DELETE FROM public.common_likes WHERE user_id = target.id;
    DELETE FROM public.common_reports WHERE user_id = target.id;
    DELETE FROM public.posts WHERE user_id = target.id;
    DELETE FROM public.users WHERE id = target.id;
    DELETE FROM auth.users WHERE id = target.auth_id;
  END LOOP;
END;
$$;
```

> 2026-07-06 이전에는 이미 삭제된 `community_posts`, `comments`, `dating_profiles`, `matches` 네 테이블(2026-06-26/2026-07-06에 삭제)을 여전히 참조하고 있어, 삭제 대상 유저가 하나라도 있으면 호출 시 첫 번째 없는 테이블에서 에러가 나 전체가 롤백됐다. 위 정의는 그 네 테이블 참조를 제거한 수정 후 버전이다 — [7. 수정 이력](#7-수정-이력) 참고. (이 함수가 pg_cron에 등록돼 있는지는 여전히 확인되지 않았다 — [3. 정기 실행](#3-정기-실행-pg_cron) 참고.)

### 2-9. 배치 스코어링 — KTS / KPPS

설계 문서: [`kanto-trust-score(KTS).md`](kanto-trust-score(KTS).md), [`kanto-popular-post-score(KPPS).md`](kanto-popular-post-score(KPPS).md)

- **`recalculate_kts()`** — 전체 유저의 신뢰도 점수(KTS)를 재계산. ReviewScore(±25) + TransactionScore(0~15) + ActivityScore(0~10) + TrendScore(0~14) − PenaltyScore, 36점 기준으로 가감. 결과를 `users.kts_score/kts_grade`에 반영하고, `user_trust_history`에 주간 스냅샷 저장.
- **`recalculate_kpps()`** — `rental`/`used_goods` 활성 게시글의 인기 점수(KPPS)를 재계산. EngagementScore + LikeRateBonus + KTSBonus + QualityBonus + RecencyBonus − ReportPenalty. 유형별 상위 5개(E등급 제외)에 `is_popular = TRUE` 플래그.
- 전체 로직은 [`supabase/migrations/20260623100000_kts_kpps_scoring.sql`](../../supabase/migrations/20260623100000_kts_kpps_scoring.sql) 참고 (368줄, pg_cron 스케줄 포함).

---

## 3. 정기 실행 (pg_cron)

| 잡 이름 | 스케줄 | 실행 내용 |
| --- | --- | --- |
| `recalculate-kts` | `0 3,15 * * *` (매일 03:00, 15:00) | `SELECT recalculate_kts()` |
| `recalculate-kpps` | `30 3,15 * * *` (매일 03:30, 15:30, KTS 완료 후) | `SELECT recalculate_kpps()` |
| `meetup-chat-cleanup` | `0 * * * *` (매시 정각) | 만료된 `meetup_chat_rooms` 삭제 (24h 유예 정리의 백스톱, 주 메커니즘은 서비스 레이어 lazy delete) |

> `cleanup_deleted_users()`가 pg_cron에 등록되어 있는지는 마이그레이션 파일에서 확인되지 않았다. 등록 여부를 Supabase 대시보드 **Database → Cron Jobs**에서 별도 확인 필요.

---

## 4. RLS 정책

모든 `public` 테이블은 `relrowsecurity = true`(RLS 활성화)이고 `FORCE ROW LEVEL SECURITY`는 걸려 있지 않다(테이블 소유자는 RLS 우회 가능 — 서비스 롤 클라이언트가 이 경로로 우회한다).

### admin_teams / team_permissions

| 정책 | 대상 | 명령 | 조건 |
| --- | --- | --- | --- |
| `admins_read_teams` / `admins_read_team_permissions` | public | SELECT | 본인 role이 `admin` 또는 `super_admin` |
| `super_admin_write_teams` / `super_admin_write_team_permissions` | public | ALL | 본인 role이 `super_admin` |

### chats

| 정책 | 대상 | 명령 | 조건 |
| --- | --- | --- | --- |
| 채팅방: 참여자만 조회/생성/수정 가능 | authenticated | SELECT/INSERT/UPDATE | `user_id_1 = my_user_id()` 또는 `user_id_2 = my_user_id()` |

### common_likes

| 정책 | 대상 | 명령 | 조건 |
| --- | --- | --- | --- |
| 찜 목록: 본인 것만 조회/추가/삭제 가능 | authenticated | SELECT/INSERT/DELETE | `user_id = my_user_id()` |

### common_notifications

| 정책 | 대상 | 명령 | 조건 |
| --- | --- | --- | --- |
| 알림: 본인 알림만 조회/읽음처리/삭제 가능 | authenticated | SELECT/UPDATE/DELETE | `receiver_id = my_user_id()` |
| 알림: 관리자는 알림 생성 가능 | authenticated | INSERT | `is_admin()` |

### common_reports

| 정책 | 대상 | 명령 | 조건 |
| --- | --- | --- | --- |
| 신고: 로그인한 사용자만 신고 가능 | authenticated | INSERT | `user_id = my_user_id()` |
| 신고: 본인이 신고한 내역만 조회 가능 | authenticated | SELECT | `user_id = my_user_id()` |
| 신고: 관리자는 모든 신고 조회 가능 | public | SELECT | `is_admin()` |
| 신고: 관리자는 신고 상태 변경 가능 | authenticated | UPDATE | `is_admin()` |

### jobs / rentals / used_goods (마켓플레이스 3종, 동일 패턴)

| 정책 | 대상 | 명령 | 조건 |
| --- | --- | --- | --- |
| 누구나 조회 가능 | public | SELECT | `true` |
| 게시글 작성자만 등록/수정/삭제 가능 | authenticated | INSERT/UPDATE/DELETE | `posts.user_id = my_user_id()` (연결된 `post_id`로 확인) |
| 관리자는 모든 글 수정/삭제 가능 | authenticated | UPDATE/DELETE | `is_admin()` |

### meetups / meetup_participants (칸토go)

| 정책 | 대상 | 명령 | 조건 |
| --- | --- | --- | --- |
| meetups - select | public | SELECT | `true` |
| meetups - insert/update/delete | public | INSERT/UPDATE/DELETE | 호스트(`posts.user_id = my_user_id()`)만 |
| meetup_participants - select | public | SELECT | `true` |
| meetup_participants - insert/update | public | INSERT/UPDATE | `user_id = (SELECT u.id FROM users u WHERE u.auth_id = auth.uid())` — `my_user_id()`가 일부 환경에서 null을 반환하는 문제 때문에 2026-06-25에 직접 매핑으로 강화됨 |

### meetup_chat_rooms / meetup_chat_messages / meetup_chat_reads / meetup_chat_blocks (칸토go 단체채팅)

| 정책 | 대상 | 명령 | 조건 |
| --- | --- | --- | --- |
| meetup_chat_rooms - select member | public | SELECT | `is_meetup_chat_member(id, my_user_id())` |
| meetup_chat_messages - select/insert member | public | SELECT/INSERT | `is_meetup_chat_member(room_id, my_user_id())`, insert는 `sender_id = my_user_id()`도 함께 확인 |
| meetup_chat_reads - select/insert/update own | public | SELECT/INSERT/UPDATE | `user_id = my_user_id()` |
| own chat blocks - select/insert/delete | public | SELECT/INSERT/DELETE | `blocker_id = my_user_id()` |

> `meetup_chat_rooms`는 INSERT/UPDATE/DELETE 정책이 없다 — 방 생성/종료는 의도적으로 서비스 레이어의 admin 클라이언트(RLS 우회)에서만 처리한다("멤버여야 방을 만들 수 있는데 방이 멤버십을 정의한다"는 순환을 피하기 위함).

### messages

| 정책 | 대상 | 명령 | 조건 |
| --- | --- | --- | --- |
| 메시지: 채팅방 참여자만 조회 가능 | authenticated | SELECT | 소속 `chats`에 본인이 참여자 |
| 메시지: 발신자만 전송 가능 | authenticated | INSERT | `sender_id = my_user_id()` AND 소속 채팅방 참여자 |
| 메시지: 참여자만 수정 가능(읽음 처리) | authenticated | UPDATE | 소속 `chats`에 본인이 참여자 |

### notices

| 정책 | 대상 | 명령 | 조건 |
| --- | --- | --- | --- |
| 전체 읽기 허용 | public | SELECT | `true` |
| 관리자 전체 권한 | public | ALL | `is_admin()` |

### posts

| 정책 | 대상 | 명령 | 조건 |
| --- | --- | --- | --- |
| 게시글: 활성 게시글 또는 본인 게시글 조회 가능 | public | SELECT | `status = 'active'` 또는 `user_id = my_user_id()` |
| 게시글: 로그인한 사용자만 작성 가능 | authenticated | INSERT | `user_id = my_user_id()` |
| 게시글: 본인 게시글만 수정/삭제 가능 | authenticated | UPDATE/DELETE | `user_id = my_user_id()` |
| 게시글: 관리자는 모든 게시글 수정/삭제 가능 | authenticated | UPDATE/DELETE | `is_admin()` |

### profanity_rules / spam_config / sanction_templates (콘텐츠 관리, 관리자 전용)

| 정책 | 대상 | 명령 | 조건 |
| --- | --- | --- | --- |
| `<table> - admin only` | public | ALL | `users.id = my_user_id() AND users.role = 'admin'` |

### reviews

| 정책 | 대상 | 명령 | 조건 |
| --- | --- | --- | --- |
| reviews_select_user | authenticated | SELECT | `deleted_at IS NULL` |
| reviews_select_admin / reviews_update_admin | authenticated | SELECT/UPDATE | 본인 role이 `admin` |
| reviews_insert_user | authenticated | INSERT | `reviewer_id = (본인 users.id)` |

### transactions

| 정책 | 대상 | 명령 | 조건 |
| --- | --- | --- | --- |
| transactions_select_participants | public | SELECT | `buyer_id = my_user_id()` 또는 `seller_id = my_user_id()` |

> INSERT/UPDATE 정책이 없다 — 거래 생성/상태 변경은 서비스 레이어(에스크로 결제 처리)에서만 수행.

### user_blocks

| 정책 | 대상 | 명령 | 조건 |
| --- | --- | --- | --- |
| own blocks - select/insert/delete | public | SELECT/INSERT/DELETE | `blocker_id = my_user_id()` |

### users

| 정책 | 대상 | 명령 | 조건 |
| --- | --- | --- | --- |
| users can read own row | authenticated | SELECT | `auth_id = auth.uid()` |
| 유저: 인증된 사용자 전체 조회 | authenticated | SELECT | `true` |
| 서비스: 신규 유저 등록 | public | INSERT | `true` |
| 유저: 본인 프로필만 수정 가능 | authenticated | UPDATE | `auth_id = auth.uid()`, `with check`로 `role`은 본인 기존 role과 같아야 함(role 자체 승격 방지) |
| 유저: 관리자는 모든 회원 수정/삭제 가능 | authenticated | UPDATE/DELETE | `is_admin()` |

> `anon`은 RLS 정책과 별개로 **컬럼 단위 GRANT**로 한 번 더 제한된다 — [6. 특이사항](#6-특이사항--확인-필요)의 `public_profiles` 항목 참고.

### 정책이 없는 테이블

- **`audit_logs`** — RLS는 켜져 있지만 `pg_policies`에 정책이 하나도 없다. 즉 `anon`/`authenticated` 어떤 롤도 PostgREST로는 접근 불가(서비스 롤만 조회 가능). 감사 로그 특성상 의도된 설계로 보이나, 관리자 화면에서 조회가 필요하다면 서비스 클라이언트(`src/utils/supabase/admin.ts`)를 거치고 있는지 확인 필요.
- **`user_sanctions`**, **`user_trust_history`** — 쿼리 결과에 정책이 없었다. 클라이언트에서 이 두 테이블에 직접 접근하는 코드가 있다면 서비스 클라이언트 경유 여부를 확인할 것.

---

## 5. anon 권한 — `public_profiles` 뷰와 컬럼 단위 GRANT

`20260626000000_grant_anon_select_users.sql` → `20260706000000_public_profiles_and_lock_users.sql`로 이어지는 변경 이력이 있어 별도로 정리한다.

1. **2026-06-26**: 비로그인(anon) 사용자가 메인 진입 시 "permission denied for table users" 에러가 발생 → 원인은 RLS 정책은 있었지만 테이블 레벨 `GRANT SELECT`가 `anon`에 없었던 것. `grant select on public.users to anon;`으로 해결했지만, 이때 RLS(행 필터)는 걸러도 **컬럼(email·phone 등 PII)은 걸러지지 않는** 부작용이 생김.
2. **2026-07-06 (19차 리뷰 대응)**: PII 노출을 막기 위해
   - `public.public_profiles` 뷰 생성 (`id, name, avatar_url, auth_id, created_at, deleted_at`만 노출, `security_invoker = on`이라 조회자 권한으로 원본 `users`를 읽어 RLS를 우회하지 않음)
   - `anon`의 `users` 테이블 전체 SELECT 권한 회수(`revoke`) 후, 위와 동일한 6개 컬럼만 **컬럼 단위 GRANT**로 재허용

```sql
create or replace view public.public_profiles
with (security_invoker = on) as
  select id, name, avatar_url, auth_id, created_at, deleted_at
  from public.users;

grant select on public.public_profiles to anon, authenticated;

revoke select on public.users from anon;
grant select (id, name, avatar_url, auth_id, created_at, deleted_at)
  on public.users to anon;
```

> 이 마이그레이션 파일 자체에 "라이브 DB에 실제로 걸린 뷰 정의·GRANT·RLS와 대조해 검증하지 못했다"는 경고 주석이 있다. `public_user_profiles`라는 유사 이름의 뷰도 `src/type/supabase.ts`에 존재하므로 용도 차이를 확인할 필요가 있다.

---

## 6. 특이사항 · 확인 필요

실제 서비스에 영향을 주기 전에 확인/정리가 필요해 보이는 것들. 아래 표에서 취소선/✅ 표시된 항목은 2026-07-06에 수정 완료됨 — [7. 수정 이력](#7-수정-이력) 참고.

| 항목 | 내용 |
| --- | --- |
| ✅ ~~`cleanup_deleted_users()` 깨짐~~ | ~~`community_posts`, `comments`, `dating_profiles`, `matches` 4개 테이블을 모두 참조하는데, 이 테이블들은 전부 삭제됨~~ → 해당 테이블 참조 제거로 수정 완료. 다만 이 함수가 pg_cron에 등록돼 있는지는 여전히 확인되지 않음. |
| ✅ ~~`get_active_users_count(days)` 깨짐~~ | ~~`comments` 테이블을 조회하는 UNION 절이 있어 삭제된 테이블 참조로 에러 발생~~ → UNION 절 제거로 수정 완료. |
| ✅ ~~신규 가입 트리거 중복~~ | ~~`auth.users` AFTER INSERT에 `handle_new_user()`와 `신규_유저_처리()` 두 개가 동시에 걸려 있었다~~ → `신규_유저_처리()`/`회원가입_트리거` 제거, `handle_new_user()`만 유지. |
| ✅ ~~신규 글/좋아요 알림 트리거 중복~~ | ~~`posts`에 `notify_new_post()`와 `notify_on_new_post()` 두 알림 함수가 동시에 걸려 있었다~~ → `notify_new_post()`/`on_new_post` 제거, `notify_on_new_post()`만 유지. |
| ✅ ~~미사용(orphan) 알림 함수~~ | ~~`notify_comment`, `notify_on_comment`, `notify_like`, `notify_message`는 정의만 있고 어떤 트리거에도 연결돼 있지 않았다~~ → 4개 함수 모두 삭제. |
| **`audit_logs`에 RLS 정책 없음** | 서비스 롤만 접근 가능한 상태. 의도된 것인지, 관리자 화면에서 이 테이블을 클라이언트 RLS로 직접 읽으려던 기능이 있었는지 확인. |
| **`public_profiles` vs `public_user_profiles`** | 이름이 비슷한 뷰가 둘 다 존재. `db-schema-reference.md` 1절에 각각의 컬럼/용도가 정리되어 있으나, 하나가 레거시인지는 별도 확인 필요. |

---

## 7. 수정 이력

| 날짜 | 내용 | 근거 |
| --- | --- | --- |
| 2026-07-06 | 삭제된 테이블(`comments`/`community_posts`/`dating_profiles`/`matches`)을 참조하던 `cleanup_deleted_users()`, `get_active_users_count()` 수정. 중복 실행되던 회원가입 트리거(`신규_유저_처리`/`회원가입_트리거`)와 신규글 알림 트리거(`notify_new_post`/`on_new_post`) 제거. 어떤 트리거에도 연결되지 않은 미사용 함수(`notify_comment`, `notify_on_comment`, `notify_like`, `notify_message`) 삭제. | [`supabase/migrations/20260706130000_fix_stale_refs_and_dedupe_triggers.sql`](../../supabase/migrations/20260706130000_fix_stale_refs_and_dedupe_triggers.sql) |

---

## 참고 마이그레이션 파일

이 문서 작성에 근거가 된 주요 파일 (전체 목록은 `supabase/migrations/` 참고):

- `20260618083928_chat_notification_dedupe.sql`, `20260618100438_system_message_notification.sql`, `20260623000000_drop_chat_notifications.sql` — 채팅 알림 로직 변천사
- `20260619000000_notifications_update_policy.sql`, `20260622000000_notifications_not_null_defaults.sql` — 알림 읽음 처리 버그 수정
- `20260623044501_perf_rls_initplan.sql` — `auth.uid()`를 `(select auth.uid())`로 감싸는 RLS 성능 패턴 도입
- `20260623100000_kts_kpps_scoring.sql` — KTS/KPPS 배치 스코어링 전체
- `20260624000000_kanto_go_group_chat.sql`, `20260624010000_meetup_chat_blocks.sql` — 칸토go 단체채팅 RLS
- `20260625200000_admin_teams_permissions.sql` — 관리자 팀/권한 테이블
- `20260626000000_grant_anon_select_users.sql`, `20260706000000_public_profiles_and_lock_users.sql` — anon PII 노출 이슈와 수정
- `20260706120000_drop_unused_tables.sql` — 미사용 테이블(`comments`, `matches`, `dating_profiles`, `banned_keywords`, `community_posts`) 정리
- `20260706130000_fix_stale_refs_and_dedupe_triggers.sql` — 삭제된 테이블을 참조하던 함수 수정, 중복 트리거/미사용 함수 정리 ([7. 수정 이력](#7-수정-이력))
