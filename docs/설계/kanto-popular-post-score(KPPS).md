# Kanto Popular Post Score (KPPS) — 인기 게시물 선정 설계 문서

> Kanto 프로젝트의 인기 게시물 선정 알고리즘.
> KTS(Kanto Trust Score)와 연계하여 작성자 신뢰도를 게시물 노출 우선순위에 반영한다.

---

## 1. 기획 의도

현재 Kanto의 인기 게시물 선정 기준은 `like_count >= 20`이라는 단일 임계값에 의존한다. 이것만으로는:

- **조회 수 어뷰징에 취약** — 좋아요 없이 조회만 높아도 임계값 도달 후 노출 유리
- **시간 요소 부재** — 2개월 전 게시물과 오늘 올라온 게시물이 동등하게 경쟁
- **신뢰도 미반영** — 사기 전력이 있는 E등급 사용자의 게시물도 동일하게 선정 가능
- **게시물 품질 미반영** — 이미지 없는 빈약한 게시물과 상세한 게시물을 구분 불가

따라서 **참여 절대량·참여 전환율·작성자 신뢰도·게시물 품질·최신성·신고 이력**을 복합 반영한 **KPPS(Kanto Popular Post Score)** 를 도입한다.

---

## 2. 시스템 개요

| 항목 | 내용 |
| --- | --- |
| 명칭 | **Kanto Popular Post Score** (줄여서 KPPS) |
| 점수 범위 | 0 ~ 100점 |
| 적용 대상 | `방렌트 (rental)`, `중고거래 (used_goods)` |
| 인기 배지 | **유형별 최대 5개** (방렌트 top 5, 중고거래 top 5 — 독립 선정) |
| 갱신 시점 | **배치 재계산** — KTS 배치 완료 직후 pg_cron으로 하루 1~2회 실행 |
| KTS와의 관계 | KTS 등급이 KTSBonus 및 인기 선정 게이트에 직접 반영 |
| 주의 | 방렌트·중고거래에는 댓글 기능 없음 → comment_count 미사용 |

---

## 3. 점수 공식

```
KPPS = clamp(
    EngagementScore
  + LikeRateBonus
  + KTSBonus
  + QualityBonus
  + RecencyBonus
  − ReportPenalty,
  0, 100
)
```

| 구성 요소 | 최대 점수 | 반영 계수 | 역할 |
| --- | --- | --- | --- |
| EngagementScore | **+40점** | **40%** | 좋아요·조회수 절대량 |
| LikeRateBonus | **+20점** | **20%** | 좋아요/조회수 전환율 — 어뷰징 억제 |
| KTSBonus | **+20점** | **20%** | 작성자 KTS 등급 신뢰 보너스 |
| QualityBonus | **+10점** | **10%** | 이미지·상세 정보 완성도 |
| RecencyBonus | **+10점** | **10%** | 게시물 최신성 |
| ReportPenalty | 최대 **−30점** | 감점 | 게시물 자체 인정된 신고 건수 비례 |
| **이론상 최대** | **100점** | | |

모든 구성 요소는 **상한/하한 내에서 독립 계산** 후 합산한다.

---

### 3-1. EngagementScore — 참여 절대량 `0 ~ +40점`

좋아요(북마크)와 조회수의 절대적 규모를 측정한다.

```
LikeSub = min(like_count / 20, 1.0) × 30
ViewSub  = min(view_count / 500, 1.0) × 10

EngagementScore = LikeSub + ViewSub
```

기준점 설정 근거:
- 좋아요 20건: 능동적 의사 표시 기준 상한 → 30점 만점
- 조회수 500건: 충분한 노출 기준 상한 → 10점 만점

**EngagementScore 예시**

| like_count | view_count | LikeSub | ViewSub | EngagementScore |
| --- | --- | --- | --- | --- |
| 20 이상 | 500 이상 | 30 | 10 | **40점** (상한) |
| 10 | 250 | 15 | 5 | **20점** |
| 5 | 100 | 7.5 | 2 | **9.5점** |
| 0 | 300 | 0 | 6 | **6점** |
| 2 | 50 | 3 | 1 | **4점** |

---

### 3-2. LikeRateBonus — 참여 전환율 보너스 `0 ~ +20점`

조회 수 대비 좋아요 비율로 게시물의 **실질 관심도**를 측정한다.
조회는 많지만 좋아요가 없는 어뷰징성 게시물을 억제하는 핵심 보정 장치.

```
like_rate     = like_count / max(view_count, 1)
LikeRateBonus = min(like_rate / 0.10, 1.0) × 20
```

기준점: 좋아요율 10% (조회 10건당 좋아요 1건) = 만점

| like_count | view_count | like_rate | LikeRateBonus |
| --- | --- | --- | --- |
| 50 | 500 | 10.0% | **20점** (만점) |
| 10 | 200 | 5.0% | **10점** |
| 5 | 200 | 2.5% | **5점** |
| 1 | 500 | 0.2% | **0.4점** |
| 0 | 1000 | 0% | **0점** |

> 설계 의도: 조회수 1,000건에 좋아요 0건인 게시물은 LikeRateBonus가 0점이 되어 EngagementScore의 ViewSub(10점)만 얻는다. 단순 조회 어뷰징으로는 인기 선정 불가.

---

### 3-3. KTSBonus — 작성자 신뢰도 보너스 `0 ~ +20점`

작성자의 KTS 등급에 따라 게시물에 신뢰 보너스를 부여한다.

```
KTSBonus = CASE author.kts_grade
  WHEN 'A' THEN 20
  WHEN 'B' THEN 15
  WHEN 'C' THEN 10
  WHEN 'D' THEN 5
  WHEN 'E' THEN 0  -- E등급은 KTSBonus 0 + 인기 선정 자체 불가
END
```

| KTS 등급 | 점수 구간 | KTSBonus | 비고 |
| --- | --- | --- | --- |
| A | 90~100점 | **+20점** | 최우선 노출 우대 |
| B | 75~89점 | **+15점** | 우대 노출 |
| C | 50~74점 | **+10점** | 기준 (분포 중심) |
| D | 30~49점 | **+5점** | 제한적 노출 |
| E | 0~29점 | **0점** | 인기 선정 완전 불가 (게이트) |

> E등급 게이트: KPPS 점수와 무관하게 작성자가 E등급이면 `is_popular = FALSE`로 강제 설정된다.

---

### 3-4. QualityBonus — 게시물 품질 보너스 `0 ~ +10점`

게시물 상세 정보의 완성도를 평가한다. 이미지는 공통이며 나머지는 유형별로 다르다.

**공통 — 이미지 (최대 +5점)**

```
ImageBonus = min(image_count × 1, 5)
```

| 이미지 수 | ImageBonus |
| --- | --- |
| 0장 | 0점 |
| 3장 | +3점 |
| 5장 이상 | +5점 (상한) |

**방렌트 전용 (최대 +5점)**

| 조건 | 보너스 |
| --- | --- |
| 편의시설(amenities) 3개 이상 명시 | +3점 |
| 보증금(deposit) + 월세(price) 모두 명시 | +2점 |

**중고거래 전용 (최대 +5점)**

| 조건 | 보너스 |
| --- | --- |
| 상품 상태(condition) 명시 | +2점 |
| 안전결제(safe_payment) 지원 | +3점 |

---

### 3-5. RecencyBonus — 최신성 보너스 `0 ~ +10점`

최신 게시물에 노출 우선권을 부여한다. 방렌트는 장기 노출 특성을 반영해 최솟값을 3점으로 보호한다.

```sql
age_days := EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 86400;

-- 중고거래
RecencyBonus := CASE
  WHEN age_days <= 1  THEN 10
  WHEN age_days <= 3  THEN 8
  WHEN age_days <= 7  THEN 6
  WHEN age_days <= 14 THEN 3
  ELSE 1
END;

-- 방렌트 (최솟값 3점으로 보호)
RecencyBonus := GREATEST(위 CASE 결과, 3);
```

| 게시물 나이 | 중고거래 | 방렌트 |
| --- | --- | --- |
| 24시간 이내 | 10점 | 10점 |
| 1~3일 | 8점 | 8점 |
| 3~7일 | 6점 | 6점 |
| 7~14일 | 3점 | 3점 |
| 14일 이상 | 1점 | **3점 (하한 보호)** |

---

### 3-6. ReportPenalty — 신고 페널티 `최대 −30점`

게시물 자체에 대한 인정된 신고(`status = 'resolved'`) 건수를 기반으로 감점한다.

```
resolved_post_reports = COUNT(
  common_reports
  WHERE target_type = 'post'
    AND target_id = post.id
    AND status = 'resolved'
)

ReportPenalty = min(resolved_post_reports × 10, 30)
```

| 인정된 신고 수 | 감점 |
| --- | --- |
| 0건 | 0점 |
| 1건 | −10점 |
| 2건 | −20점 |
| 3건 이상 | −30점 (상한) |

- `pending` 신고: 감점 없음 — 허위 신고 악용 방지
- `dismissed` 신고: 감점 없음 — 무혐의 처리된 건

---

## 4. 인기 배지 선정 기준

```
is_popular 선정 조건:
  1. post.status = 'active'
  2. 중고거래의 경우 is_sold = FALSE
  3. author.kts_grade != 'E'
  4. 위 조건을 만족하는 게시물 중 post_type별 KPPS 내림차순 상위 5건
```

| 조건 | 결과 |
| --- | --- |
| 상위 5위 이내 & kts_grade ≠ 'E' | is_popular = TRUE |
| 6위 이하 | is_popular = FALSE |
| kts_grade = 'E' (순위 무관) | is_popular = FALSE (강제) |
| is_sold = TRUE | 선정 제외 |

---

## 5. 게시물 유형별 고려 사항

| 항목 | 방렌트 | 중고거래 |
| --- | --- | --- |
| RecencyBonus 최솟값 | 3점 (장기 노출 보호) | 1점 (빠른 순환) |
| QualityBonus 추가 기준 | amenities, deposit/price | condition, safe_payment |
| 상태 필터 | status='active' 만 | status='active' AND is_sold=FALSE |
| 선정 상한 | 최대 5개 | 최대 5개 |

- 구인구직(jobs)은 기존 `popular_count` 필드 운영 유지 — KPPS 미적용

---

## 6. 점수 계산 예시

**예시 유형별 케이스**

| 예시 | like | view | KTS | 경과 | 이미지 | 유형별 완성도 | 신고 | KPPS | 결과 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A등급 최신 방렌트 | 8 | 120 | A | 2일 | 5장 | amenities 4개 + deposit/price ✓ | 0건 | 65.7점 | 인기 선정 가능 |
| E등급 고참여 중고거래 | 25 | 800 | E | 1일 | 3장 | condition ✓ / safe_payment ✗ | 1건 | 51.3점 | **E등급 강제 제외** |
| 조회 어뷰징 의심 | 1 | 2000 | C | 5일 | 2장 | — | 0건 | 29.6점 | 인기 선정 불가 |
| B등급 오래된 방렌트 | 18 | 400 | B | 20일 | 5장 | amenities 5개 + deposit/price ✓ | 0건 | 72점 | 인기 선정 가능 |

**예시 1 — A등급 최신 방렌트 (상세)**

```
EngagementScore = min(8/20,1)×30 + min(120/500,1)×10 = 12.0 + 2.4 = 14.4
LikeRateBonus   = min((8/120)/0.10, 1) × 20 = 0.667 × 20 = 13.3
KTSBonus        = 20 (A등급)
QualityBonus    = min(5,5) + 3 + 2 = 10
RecencyBonus    = 8 (1~3일)
ReportPenalty   = 0

KPPS = 14.4 + 13.3 + 20 + 10 + 8 − 0 = 65.7점
```

**예시 3 — 조회 어뷰징 의심 (상세)**

```
EngagementScore = min(1/20,1)×30 + min(2000/500,1)×10 = 1.5 + 10.0 = 11.5
LikeRateBonus   = min((1/2000)/0.10, 1) × 20 = 0.005 × 20 = 0.1
KTSBonus        = 10 (C등급)
QualityBonus    = 2 (이미지 2장)
RecencyBonus    = 6 (3~7일)
ReportPenalty   = 0

KPPS = 11.5 + 0.1 + 10 + 2 + 6 − 0 = 29.6점
```

> LikeRateBonus가 사실상 0에 수렴 — 조회 수만 높은 게시물이 인기에 오르는 것을 방지

---

## 7. 예상 점수 분포

### 산출 가정

| 항목 | 가정 값 | 근거 |
| --- | --- | --- |
| 평균 QualityBonus | **6점** | 이미지 3장(3점) + 유형별 항목 1~2개(3점) |
| 평균 RecencyBonus | **5점** | ≤1일(10)×15% + 1~3일(8)×20% + 3~7일(6)×25% + 7~14일(3)×20% + 14일+(1)×20% = 5.4 |
| 고정 보너스 합계 | **11점** | QualityBonus 6 + RecencyBonus 5 |
| 신고 페널티 | **0점** | 정상 게시물 기준 |
| KTS 등급 분포 | A 7% / B 22% / C 45% / D 22% / E 4% | KTS 설계 문서 예상 분포 참조 |

### 참여도 등급 정의

| 참여도 등급 | 대표값 (like / view) | like_rate | LikeSub | ViewSub | LikeRateBonus | Eng+LR 합계 | 게시물 비율 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 매우 낮음 | 1 / 25 | 4.0% | 1.5 | 0.5 | 8.0 | **10점** | 35% |
| 낮음 | 5 / 100 | 5.0% | 7.5 | 2.0 | 10.0 | **20점** | 30% |
| 중간 | 11 / 220 | 5.0% | 16.5 | 4.4 | 10.0 | **31점** | 20% |
| 높음 | 20 / 380 | 5.3% | 30.0 | 7.6 | 10.5 | **48점** | 10% |
| 매우 높음 | 30 / 600 | 5.0% | 30.0 (상한) | 10.0 (상한) | 10.0 | **50점** | 5% |

### KTS × 참여도 KPPS 매트릭스

KPPS = Eng+LR 합계 + KTSBonus + 고정 보너스 11점 / ✗ = E등급 → is_popular 강제 FALSE

| 참여도 \ KTS | A등급 (+20) | B등급 (+15) | C등급 (+10) | D등급 (+5) | E등급 (+0) |
| --- | --- | --- | --- | --- | --- |
| 매우 낮음 (10점) | **41점** | **36점** | **31점** | **26점** | 21점 ✗ |
| 낮음 (20점) | **51점** | **46점** | **41점** | **36점** | 31점 ✗ |
| 중간 (31점) | **62점** | **57점** | **52점** | **47점** | 42점 ✗ |
| 높음 (48점) | **79점** | **74점** | **69점** | **64점** | 59점 ✗ |
| 매우 높음 (50점) | **81점** | **76점** | **71점** | **66점** | 61점 ✗ |

### 전체 분포

가중 평균 KPPS: **약 44점**

```
70점 이상   ████                     6.6%
50~69점     ████████████████        24.7%
30~49점     ████████████████████████████████████  57.0%
0~29점      ███████                 11.7%
```

| KPPS 구간 | 비율 | 의미 |
| --- | --- | --- |
| 70점 이상 | 6.6% | 인기 선정 유력 — A/B등급 + 높은 참여도 |
| 50~69점 | 24.7% | 인기 경쟁 구간 — 유형별 top 5 자리를 두고 경합 |
| 30~49점 | 57.0% | 일반 게시물 — 플랫폼 분포의 중심축 |
| 0~29점 | 11.7% | 저관심/저신뢰 게시물 (D 매우낮음 + E등급 전체) |

30~49점 구간이 전체의 **57%** 를 차지하며 분포의 중심축을 이룬다.
70점 이상은 A/B등급 + 높음 이상의 참여도를 동시에 달성한 게시물에게만 부여된다.

**인기 선정 진입을 위한 참여도 가이드**

| KTS 등급 | 인기 진입 최소 조건 | 예상 KPPS |
| --- | --- | --- |
| A등급 | 낮음 이상 (like ≥ 5, like_rate ≥ 5%) | 51점+ |
| B등급 | 중간 이상 (like ≥ 11, like_rate ≥ 5%) | 57점+ |
| C등급 | 높음 이상 (like ≥ 20, like_rate ≥ 5%) | 69점+ |
| D등급 | 매우 높음 + 경쟁 게시물 적을 때만 (like ≥ 30) | 64~66점 |
| E등급 | **진입 불가** | — |

> 인기 선정은 절댓값 임계가 아닌 **유형별 상위 5개** 기준이므로, 시장 내 경쟁 강도에 따라 실제 진입 임계값이 달라진다. 위 가이드는 평균적인 경쟁 환경을 가정한 추정치다.

---

## 8. 데이터베이스 설계

### 8-1. posts 테이블 컬럼 추가

```sql
ALTER TABLE posts ADD COLUMN kpps_score NUMERIC(5,2) DEFAULT 0;
ALTER TABLE posts ADD COLUMN is_popular  BOOLEAN      DEFAULT FALSE;
```

### 8-2. 배치 재계산 함수

```sql
CREATE OR REPLACE FUNCTION recalculate_kpps()
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  rec         RECORD;
  eng_score   NUMERIC;
  lr_bonus    NUMERIC;
  kts_bonus   NUMERIC;
  qual_bonus  NUMERIC;
  rec_bonus   NUMERIC;
  rep_penalty NUMERIC;
  like_rate   NUMERIC;
  age_days    NUMERIC;
  kpps        NUMERIC;
  img_count   INTEGER;
BEGIN
  UPDATE posts SET is_popular = FALSE
  WHERE post_type IN ('rental', 'used_goods');

  FOR rec IN
    SELECT
      p.id,
      p.post_type,
      p.like_count,
      p.view_count,
      p.created_at,
      p.is_sold,
      u.kts_grade,
      CASE p.post_type
        WHEN 'rental'     THEN COALESCE(jsonb_array_length(r.images::jsonb), 0)
        WHEN 'used_goods' THEN COALESCE(jsonb_array_length(ug.images::jsonb), 0)
      END AS img_count,
      r.amenities,
      r.deposit,
      r.price AS rent_price,
      ug.condition,
      ug.safe_payment,
      COALESCE(rpt.resolved_count, 0) AS resolved_reports
    FROM posts p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN rentals    r  ON r.post_id  = p.id AND p.post_type = 'rental'
    LEFT JOIN used_goods ug ON ug.post_id = p.id AND p.post_type = 'used_goods'
    LEFT JOIN (
      SELECT target_id, COUNT(*) AS resolved_count
      FROM common_reports
      WHERE target_type = 'post' AND status = 'resolved'
      GROUP BY target_id
    ) rpt ON rpt.target_id = p.id
    WHERE p.status = 'active'
      AND p.post_type IN ('rental', 'used_goods')
      AND (p.post_type != 'used_goods' OR p.is_sold = FALSE)
  LOOP
    -- EngagementScore
    eng_score := LEAST(rec.like_count, 20)::NUMERIC / 20 * 30
               + LEAST(rec.view_count, 500)::NUMERIC / 500 * 10;

    -- LikeRateBonus
    like_rate := rec.like_count::NUMERIC / GREATEST(rec.view_count, 1);
    lr_bonus  := LEAST(like_rate / 0.10, 1.0) * 20;

    -- KTSBonus
    kts_bonus := CASE rec.kts_grade
      WHEN 'A' THEN 20
      WHEN 'B' THEN 15
      WHEN 'C' THEN 10
      WHEN 'D' THEN 5
      ELSE 0
    END;

    -- QualityBonus
    img_count  := LEAST(rec.img_count, 5);
    qual_bonus := img_count;
    IF rec.post_type = 'rental' THEN
      IF jsonb_array_length(rec.amenities::jsonb) >= 3 THEN qual_bonus := qual_bonus + 3; END IF;
      IF rec.deposit IS NOT NULL AND rec.rent_price IS NOT NULL  THEN qual_bonus := qual_bonus + 2; END IF;
    ELSIF rec.post_type = 'used_goods' THEN
      IF rec.condition IS NOT NULL THEN qual_bonus := qual_bonus + 2; END IF;
      IF rec.safe_payment = TRUE    THEN qual_bonus := qual_bonus + 3; END IF;
    END IF;
    qual_bonus := LEAST(qual_bonus, 10);

    -- RecencyBonus
    age_days  := EXTRACT(EPOCH FROM (NOW() - rec.created_at)) / 86400;
    rec_bonus := CASE
      WHEN age_days <= 1  THEN 10
      WHEN age_days <= 3  THEN 8
      WHEN age_days <= 7  THEN 6
      WHEN age_days <= 14 THEN 3
      ELSE 1
    END;
    IF rec.post_type = 'rental' THEN
      rec_bonus := GREATEST(rec_bonus, 3);
    END IF;

    -- ReportPenalty
    rep_penalty := LEAST(rec.resolved_reports * 10, 30);

    -- KPPS
    kpps := GREATEST(
      LEAST(eng_score + lr_bonus + kts_bonus + qual_bonus + rec_bonus - rep_penalty, 100),
      0
    );

    UPDATE posts SET kpps_score = kpps WHERE id = rec.id;
  END LOOP;

  -- 유형별 상위 5개에만 is_popular = TRUE 부여 (E등급 제외)
  UPDATE posts SET is_popular = TRUE
  WHERE id IN (
    SELECT id FROM (
      SELECT id,
             RANK() OVER (PARTITION BY post_type ORDER BY kpps_score DESC) AS rnk
      FROM posts
      WHERE post_type IN ('rental', 'used_goods')
        AND status = 'active'
        AND (post_type != 'used_goods' OR is_sold = FALSE)
        AND user_id IN (SELECT id FROM users WHERE kts_grade != 'E')
    ) ranked
    WHERE rnk <= 5
  );
END;
$$;

-- pg_cron 등록: KTS 배치(03:00) 완료 후 03:30에 실행
SELECT cron.schedule('recalculate-kpps', '30 3,15 * * *', 'SELECT recalculate_kpps()');
```

> **배치 순서 의존성**: KPPS 배치는 반드시 **KTS 배치 완료 이후** 실행해야 한다. `users.kts_grade`가 당일 갱신된 값을 반영해야 KTSBonus가 정확하게 산출된다. KTS가 03:00에, KPPS가 03:30에 실행되도록 시간 간격을 확보한다.

---

## 9. KTS와의 연계 구조

| 항목 | KTS | KPPS |
| --- | --- | --- |
| 대상 | 사용자 | 게시물 |
| 점수 범위 | 0~100점 | 0~100점 |
| 갱신 주기 | 하루 1~2회 배치 | 하루 1~2회 배치 (KTS 이후) |
| E등급 영향 | 신뢰도 최하위 | 인기 선정 완전 배제 |
| 연계 방식 | → KTSBonus (0~20점)로 KPPS에 반영 | — |

```
KTS 배치 실행
   └─→ users.kts_grade 업데이트
         └─→ KPPS 배치 실행
               └─→ posts.kpps_score 업데이트
                     └─→ 유형별 상위 5개 is_popular = TRUE
```
