# Kanto DB 스키마 레퍼런스

> 작성일: 2026-07-06
> 대상: Supabase 프로젝트 `kanto` (`dhvvrtyzurouttlswpbq`), `public` 스키마
> 이 문서는 실제 운영 DB(`supabase db query`)에서 직접 조회한 테이블/컬럼/제약조건을 기준으로 작성되었습니다.
> 미사용 테이블(`comments`, `banned_keywords`, `dating_profiles`, `matches`, `community_posts`) 정리 후 기준이며, 이후 스키마가 바뀌면 이 문서도 함께 갱신해야 합니다.

---

## 0. 한눈에 보기

- 테이블(BASE TABLE) 29개, 뷰(VIEW) 2개 (`public_profiles`, `public_user_profiles`)
- 모든 테이블 RLS(Row Level Security) 활성화 상태
- 공통 패턴: 대부분의 게시글 계열 테이블은 `posts`를 부모로 두는 **1:1 확장 테이블** 구조 (`jobs` / `rentals` / `used_goods` / `meetups`)

| 도메인 | 테이블 | 대략 행수 | 한 줄 설명 |
|---|---|---:|---|
| 사용자 | `users` | 124 | 서비스 회원 정보 |
| 사용자 | `public_profiles` (VIEW) | - | 공개용 프로필(이름·아바타만) |
| 사용자 | `public_user_profiles` (VIEW) | - | 공개용 프로필 + 활동 통계 |
| 게시글 공통 | `posts` | 238 | 모든 게시글의 공통 부모 테이블 |
| 게시글 상세 | `jobs` | 45 | 구인구직 상세 |
| 게시글 상세 | `rentals` | 43 | 방렌트 상세 |
| 게시글 상세 | `used_goods` | 83 | 중고거래 상세 |
| 거래/리뷰 | `transactions` | 39 | 중고거래 안전결제(에스크로) 기록 |
| 거래/리뷰 | `reviews` | 82 | 거래 후기 |
| 1:1 채팅 | `chats` | 27 | 1:1 채팅방 |
| 1:1 채팅 | `messages` | 588 | 채팅 메시지 |
| Go(번개모임) | `meetups` | 55 | 모임 상세 |
| Go(번개모임) | `meetup_participants` | 117 | 모임 참여자 |
| Go(번개모임) | `meetup_chat_rooms` | 23 | 모임 그룹채팅방 |
| Go(번개모임) | `meetup_chat_messages` | 0 | 모임 그룹채팅 메시지 |
| Go(번개모임) | `meetup_chat_reads` | 3 | 모임 그룹채팅 읽음 시각 |
| Go(번개모임) | `meetup_chat_blocks` | - | 모임 그룹채팅 내 차단 |
| 알림/찜/신고 | `common_notifications` | 1218 | 알림 |
| 알림/찜/신고 | `common_likes` | 849 | 찜(좋아요) |
| 알림/찜/신고 | `common_reports` | 41 | 신고 |
| 제재/신뢰도 | `user_sanctions` | 237 | 유저 제재 이력 |
| 제재/신뢰도 | `user_trust_history` | 569 | 주간 신뢰점수(KTS) 이력 |
| 제재/신뢰도 | `sanction_templates` | - | 제재 사유별 안내 문구 템플릿 |
| 콘텐츠 관리 | `profanity_rules` | - | 금칙어 규칙 |
| 콘텐츠 관리 | `spam_config` | - | 도배/스팸 방지 설정값 |
| 유저 관계 | `user_blocks` | 1 | 1:1 유저 차단 |
| 어드민 조직 | `admin_teams` | - | 관리자 팀 |
| 어드민 조직 | `team_permissions` | 14 | 팀별 권한 |
| 어드민 조직 | `audit_logs` | - | 관리자 활동 감사 로그 |
| 공지 | `notices` | - | 사이트 공지 |

행수가 `-`인 테이블은 `reltuples` 추정치가 아직 집계되지 않은 소규모/저빈도 테이블입니다.

### Enum 타입

| 타입 | 값 |
|---|---|
| `trade_location` | `BGC / Taguig`, `Makati`, `Pasay / Paranaque`, `Quezon City`, `Mandaluyong / Pasig`, `Pampanga`, `그 외 지역` |
| `product_condition` | `미개봉`, `가벼운 사용감`, `사용감 있음`, `기타` |
| `transaction_status` | `pending`, `paid`, `released`, `cancelled`, `expired` |

---

## 1. 사용자

### `users`
서비스 회원 정보. `auth.users`와 `auth_id`로 연결되며 소셜 로그인(카카오·구글·페이스북)을 지원.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| id | bigint | NO | `nextval` | PK, auto-increment |
| phone | text | YES | | 전화번호 (선택 입력) |
| name | text | NO | | 표시 이름 (카카오: nickname) |
| created_at | timestamptz | YES | now() | 가입 일시 |
| post_count | integer | YES | | 작성 게시글 수 (캐시) |
| auth_id | uuid | YES | | `auth.users.id` 참조, UNIQUE |
| email | text | YES | | 소셜 로그인 이메일 (카카오 미동의 시 NULL) |
| avatar_url | text | YES | | 프로필 이미지 URL |
| provider | text | YES | | `kakao` / `google` / `facebook` |
| updated_at | timestamptz | YES | now() | 최종 수정 일시 |
| role | text | NO | `'user'` | `user` / `admin` |
| deleted_at | timestamptz | YES | | 삭제 시간 |
| avg_rating | numeric | YES | | 받은 리뷰 평균 평점(1.00~5.00). `reviews` 변경 시 트리거로 자동 갱신 |
| interest_categories | text[] | YES | | 관심 카테고리 |
| alert_keywords | text[] | YES | | 키워드 알림 등록어 |
| alert_chat | boolean | YES | true | 채팅 알림 수신 여부 |
| alert_comment | boolean | YES | true | 댓글 알림 수신 여부 |
| alert_post | boolean | YES | false | 게시글 알림 수신 여부 |
| like_count | integer | NO | 0 | 받은 찜 수 (캐시) |
| suspended_until | timestamptz | YES | | 정지 만료 시각 |
| region | text | YES | | 활동 지역 |
| kts_score | numeric | YES | 36 | 칸토 신뢰점수(KTS) |
| kts_grade | text | YES | `'D'` | KTS 등급 |
| bank_code | text | YES | | 정산 은행 코드 |
| bank_account_number | text | YES | | 정산 계좌번호 |
| bank_account_name | text | YES | | 예금주명 |
| admin_team_id | bigint | YES | | `admin_teams.id` 참조 (관리자 소속 팀) |

- PK: `id` · UNIQUE: `auth_id`
- FK: `admin_team_id → admin_teams.id` (ON DELETE SET NULL)

### `public_profiles` (VIEW)
`common_likes`, `meetup_chat_*` 등에서 상대방을 가볍게 표시할 때 쓰는 최소 공개 프로필.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | bigint | `users.id` |
| name | text | 표시 이름 |
| avatar_url | text | 프로필 이미지 |
| auth_id | uuid | 인증 ID |
| created_at | timestamptz | 가입 일시 |
| deleted_at | timestamptz | 삭제 일시 (탈퇴 유저 필터링용) |

### `public_user_profiles` (VIEW)
프로필 페이지 등 활동 통계까지 필요한 곳에서 사용하는 공개 프로필.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | bigint | `users.id` |
| name | text | 표시 이름 |
| avatar_url | text | 프로필 이미지 |
| created_at | timestamptz | 가입 일시 |
| auth_id | uuid | 인증 ID |
| role | text | 권한 |
| post_count | integer | 게시글 수 |
| avg_rating | numeric | 평균 평점 |
| like_count | integer | 찜 받은 수 |

---

## 2. 게시글

### `posts`
게시글 공통 부모 테이블. `jobs` · `rentals` · `used_goods` · `meetups`가 `post_id`로 참조. (커뮤니티 게시판 기능은 제거되어 `post_type='community'`는 더 이상 생성되지 않음)

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| id | bigint | NO | | PK |
| created_at | timestamptz | NO | now() | 등록 일시 |
| user_id | bigint | NO | | 작성자 (`users.id`) |
| post_type | varchar | NO | | `job` / `rental` / `used_goods` 등 |
| title | varchar | NO | | 제목 |
| status | varchar | NO | `'active'` | `active`(공개) / `inactive`(숨김) / `deleted`(삭제) |
| view_count | smallint | NO | 0 | 조회수 |
| like_count | smallint | NO | 0 | 찜 수 (캐시) |
| updated_at | timestamptz | YES | | 최종 수정 일시 |
| is_reserved | boolean | NO | false | 예약중 여부 |
| is_sold | boolean | NO | false | 거래완료 여부 |
| handled_by | integer | YES | | 처리한 관리자 (`users.id`) |
| handled_at | timestamptz | YES | | 관리자 처리 일시 |
| kpps_score | numeric | YES | 0 | 칸토 인기 게시글 점수(KPPS) |
| is_popular | boolean | YES | false | 인기글 여부 |
| deleted_at | timestamptz | YES | | 소프트 삭제 일시 |

- PK: `id`
- FK: `user_id → users.id`, `handled_by → users.id` (모두 NO ACTION)

### `jobs`
구인구직 게시글 상세 정보. `posts`의 자식 테이블.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| id | bigint | NO | | PK |
| created_at | timestamptz | NO | now() | 등록 일시 |
| post_id | bigint | NO | | 부모 게시글 (`posts.id`) |
| company_name | varchar | NO | | 회사명 |
| company_intro | text | NO | | 회사 소개 |
| location_type | trade_location | NO | | 근무 지역 |
| location_custom | varchar | YES | | 근무 지역 상세 |
| salary | integer | NO | | 급여 금액 |
| salary_type | varchar | YES | | 급여 유형 (월급/일급/시급 등) |
| employee_type | varchar | NO | | 고용 형태 |
| main_task | text | NO | | 주요 업무 |
| preferred | text | YES | | 우대 사항 |
| work_hours | varchar | YES | | 근무 시간 |
| company_year | integer | YES | | 회사 설립 연도 |
| employee_count | smallint | YES | | 직원 수 |
| industry | varchar | YES | | 업종 |
| company_address | varchar | YES | | 회사 주소 |
| company_website | varchar | YES | | 회사 웹사이트 |
| manager_name | varchar | YES | | 채용 담당자명 |
| manager_title | varchar | YES | | 담당자 직책 |
| manager_phone | varchar | YES | | 담당자 연락처 |
| manager_email | varchar | YES | | 담당자 이메일 |
| applicant_count | varchar | YES | | 모집 인원 |
| deadline | date | NO | | 지원 마감일 |
| images | jsonb | YES | | 첨부 이미지 URL 배열 |
| popular_count | smallint | YES | | 인기도 카운트 |
| work_days | text[] | YES | | 근무 요일 |
| is_time_negotiable | boolean | NO | false | 근무시간 협의 가능 여부 |
| preferred_tags | text[] | YES | | 우대사항 태그 |
| company_logo | text | YES | | 회사 로고 URL |
| company_lat | double precision | YES | | 회사 위치 위도 |
| company_lng | double precision | YES | | 회사 위치 경도 |

- PK: `id` · FK: `post_id → posts.id` (ON DELETE CASCADE)

### `rentals`
방렌트 게시글 상세 정보. `posts`의 자식 테이블.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| id | bigint | NO | | PK |
| created_at | timestamptz | NO | now() | 등록 일시 |
| post_id | bigint | YES | | 부모 게시글 (`posts.id`) |
| price | integer | YES | | 월세 금액 |
| deposit | integer | YES | | 보증금 |
| rent_type | varchar | YES | | 임대 유형 |
| room_type | varchar | YES | | 방 유형 |
| max_occupants | smallint | YES | | 최대 입주 인원 |
| description | text | YES | | 상세 설명 |
| amenities | jsonb | YES | | 편의시설 목록 |
| images | jsonb | YES | | 이미지 URL 배열 |
| location | trade_location | YES | | 지역 |
| location_detail | varchar | YES | | 상세 주소 |
| location_barangay | text | YES | | 바랑가이(행정구역) |
| location_city | text | YES | | 시 |
| location_lat | double precision | YES | | 위도 |
| location_lng | double precision | YES | | 경도 |

- PK: `id` · FK: `post_id → posts.id` (ON DELETE CASCADE)

### `used_goods`
중고거래 게시글 상세 정보. `posts`의 자식 테이블.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| id | bigint | NO | | PK |
| post_id | bigint | NO | | 부모 게시글 (`posts.id`) |
| price | integer | NO | | 판매 희망 가격 |
| category | varchar | NO | | 물품 카테고리 |
| condition | product_condition | NO | | 물품 상태 |
| location_type | trade_location | NO | | 거래 장소 유형 |
| location_custom | varchar | YES | | 직접 입력 거래 장소 |
| safe_payment | boolean | NO | false | 안전결제(에스크로) 사용 여부 |
| content | text | NO | | 상세 설명 |
| images | jsonb | YES | | 이미지 URL 배열 |
| location_barangay | text | YES | | 바랑가이 |
| location_city | text | YES | | 시 |
| location_lat | double precision | YES | | 위도 |
| location_lng | double precision | YES | | 경도 |

- PK: `id` · FK: `post_id → posts.id` (ON DELETE CASCADE)

---

## 3. 거래 / 리뷰

### `transactions`
중고거래 안전결제(에스크로) 기록. Xendit 결제 연동.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| id | bigint | NO | | PK |
| post_id | bigint | YES | | 대상 게시글 (`posts.id`) |
| chat_id | bigint | NO | | 거래가 발생한 채팅방 (`chats.id`) |
| buyer_id | bigint | NO | | 구매자 (`users.id`) |
| seller_id | bigint | NO | | 판매자 (`users.id`) |
| amount | integer | NO | | 거래 금액 |
| status | transaction_status | NO | `'pending'` | 결제 상태 |
| external_id | text | NO | | 외부 결제 시스템 ID, UNIQUE |
| xendit_invoice_id | text | YES | | Xendit 인보이스 ID |
| xendit_invoice_url | text | YES | | Xendit 결제 URL |
| created_at | timestamptz | NO | now() | 생성 일시 |
| paid_at | timestamptz | YES | | 결제 완료 일시 |
| released_at | timestamptz | YES | | 정산(release) 일시 |
| xendit_disbursement_id | text | YES | | Xendit 정산 ID |
| post_title | text | YES | | 거래 당시 게시글 제목 스냅샷 |

- PK: `id` · UNIQUE: `external_id`
- FK: `post_id → posts.id`(SET NULL), `chat_id → chats.id`(NO ACTION), `buyer_id → users.id`(NO ACTION), `seller_id → users.id`(NO ACTION)

### `reviews`
중고거래 후기. 구매자↔판매자 양방향. 유저는 작성만 가능, 수정·삭제는 어드민만 가능.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| id | bigint | NO | | PK |
| created_at | timestamptz | NO | now() | 작성 일시 |
| updated_at | timestamptz | YES | | 최종 수정 일시(어드민 처리 시 자동 갱신) |
| reviewer_id | bigint | NO | | 작성자 (`users.id`) |
| reviewee_id | bigint | NO | | 수신자 (`users.id`) |
| post_id | bigint | YES | | 대상 게시글 (`posts.id`), 삭제 시 NULL |
| rating | smallint | NO | | 평점 (1~5) |
| content | text | NO | | 리뷰 본문 |
| role | text | NO | | 작성자 역할 `buyer` / `seller` |
| post_title | varchar | YES | | 거래 당시 게시글 제목 스냅샷 |
| post_price | integer | YES | | 거래 당시 가격 스냅샷 |
| deleted_at | timestamptz | YES | | 소프트 삭제 일시 |
| transaction_id | bigint | YES | | 관련 거래 (`transactions.id`) |

- PK: `id`
- FK: `reviewer_id → users.id`(NO ACTION), `reviewee_id → users.id`(NO ACTION), `post_id → posts.id`(SET NULL), `transaction_id → transactions.id`(NO ACTION)

---

## 4. 1:1 채팅

### `chats`
1:1 채팅방 정보. 두 참여자의 `user_id`와 마지막 메시지 시각을 관리.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| id | bigint | NO | | PK |
| created_at | timestamptz | YES | now() | 생성 일시 |
| user_id_1 | bigint | YES | | 참여자 1 (`users.id`) |
| user_id_2 | bigint | YES | | 참여자 2 (`users.id`) |
| last_message_at | timestamptz | YES | | 마지막 메시지 수신 일시 (목록 정렬용) |
| post_id | bigint | NO | | 관련 게시글 (`posts.id`) |
| last_message_content | text | YES | | 마지막 메시지 내용 미리보기 |
| user_id_1_unread | smallint | NO | 0 | 참여자1 안읽음 수 |
| user_id_2_unread | smallint | NO | 0 | 참여자2 안읽음 수 |
| user_id_1_left | boolean | YES | false | 참여자1 퇴장 여부 |
| user_id_2_left | boolean | YES | false | 참여자2 퇴장 여부 |
| user_id_1_active | boolean | NO | false | 참여자1 현재 활성(presence) 여부 |
| user_id_2_active | boolean | NO | false | 참여자2 현재 활성(presence) 여부 |

- PK: `id`
- FK: `post_id → posts.id`(CASCADE), `user_id_1 → users.id`(NO ACTION), `user_id_2 → users.id`(NO ACTION)
- 참고: `user_id_*_active`와 `set_chat_active` RPC는 과거 채팅 알림 트리거의 presence 체크용으로 추가됐으나 해당 트리거는 제거됨. 클라이언트(`useChatRoomRealtime`)가 아직 호출 중이라 무해한 no-op으로 남아있음.

### `messages`
채팅 메시지. `chats`에 속하며 발신자와 내용을 저장.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| id | bigint | NO | | PK |
| created_at | timestamptz | NO | now() | 전송 일시 |
| chat_id | bigint | NO | | 소속 채팅방 (`chats.id`) |
| sender_id | bigint | NO | | 발신자 (`users.id`) |
| content | text | NO | | 메시지 본문 |
| is_read | boolean | NO | false | 수신자 읽음 여부 |
| post_id | bigint | YES | | 관련 게시글 (`posts.id`) |
| type | text | NO | `'text'` | 메시지 유형 (텍스트/시스템 등) |
| transaction_id | bigint | YES | | 관련 거래 (`transactions.id`, 거래 완료 시스템 메시지용) |

- PK: `id`
- FK: `chat_id → chats.id`(CASCADE), `sender_id → users.id`(NO ACTION), `post_id → posts.id`(CASCADE), `transaction_id → transactions.id`(NO ACTION)

---

## 5. Go (번개모임)

### `meetups`
번개모임 상세. `posts`의 자식 테이블이며 PK 자체가 `post_id`.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| post_id | bigint | NO | | PK, 부모 게시글 (`posts.id`) |
| topic | text | NO | | 모임 주제 |
| start_at | timestamptz | NO | | 시작 시각 |
| end_at | timestamptz | NO | | 종료 시각 |
| location_lat | double precision | NO | | 위도 |
| location_lng | double precision | NO | | 경도 |
| location_address | text | NO | | 주소 |
| location_detail | text | YES | | 상세 위치 |
| description | text | NO | | 모임 설명 |
| max_participants | integer | NO | 6 | 최대 인원 |

- PK: `post_id` · FK: `post_id → posts.id`(CASCADE)

### `meetup_participants`
모임 참여자.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| id | bigint | NO | | PK |
| meetup_post_id | bigint | NO | | 모임 (`meetups.post_id`) |
| user_id | bigint | NO | | 참여자 (`users.id`) |
| joined_at | timestamptz | NO | now() | 참여 일시 |
| status | text | NO | `'joined'` | 참여 상태 |

- PK: `id` · UNIQUE(`meetup_post_id`, `user_id`) — 중복 참여 방지
- FK: `meetup_post_id → meetups.post_id`(CASCADE), `user_id → users.id`(CASCADE)

### `meetup_chat_rooms`
모임별 그룹채팅방. 모임 1개당 1개.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| id | bigint | NO | | PK |
| meetup_post_id | bigint | NO | | 모임 (`meetups.post_id`), UNIQUE |
| created_at | timestamptz | NO | now() | 생성 일시 |
| expires_at | timestamptz | NO | | 만료 시각 |
| status | text | NO | `'active'` | 방 상태 |

- PK: `id` · UNIQUE: `meetup_post_id` · FK: `meetup_post_id → meetups.post_id`(CASCADE)

### `meetup_chat_messages`
모임 그룹채팅 메시지.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| id | bigint | NO | | PK |
| room_id | bigint | NO | | 채팅방 (`meetup_chat_rooms.id`) |
| sender_id | bigint | NO | | 발신자 (`users.id`) |
| content | text | NO | | 메시지 본문 |
| type | text | NO | `'text'` | 메시지 유형 |
| created_at | timestamptz | NO | now() | 전송 일시 |

- PK: `id` · FK: `room_id → meetup_chat_rooms.id`(CASCADE), `sender_id → users.id`(CASCADE)

### `meetup_chat_reads`
모임 그룹채팅 읽음 시각(유저별 마지막 읽은 시각).

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| room_id | bigint | NO | | 채팅방 (`meetup_chat_rooms.id`), PK 일부 |
| user_id | bigint | NO | | 유저 (`users.id`), PK 일부 |
| last_read_at | timestamptz | NO | now() | 마지막 읽은 시각 |

- PK: (`room_id`, `user_id`) · FK: `room_id → meetup_chat_rooms.id`(CASCADE), `user_id → users.id`(CASCADE)

### `meetup_chat_blocks`
모임 그룹채팅 내 유저 간 차단.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| id | bigint | NO | | PK |
| room_id | bigint | NO | | 채팅방 (`meetup_chat_rooms.id`) |
| blocker_id | bigint | NO | | 차단한 유저 (`users.id`) |
| blocked_id | bigint | NO | | 차단당한 유저 (`users.id`) |
| created_at | timestamptz | NO | now() | 차단 일시 |

- PK: `id` · UNIQUE(`room_id`, `blocker_id`, `blocked_id`) — 같은 방에서 동일 유저 중복 차단 방지
- FK: `room_id → meetup_chat_rooms.id`(CASCADE), `blocker_id → users.id`(CASCADE), `blocked_id → users.id`(CASCADE)

---

## 6. 알림 / 찜 / 신고

### `common_notifications`
알림 메시지. 서버(service_role) 또는 관리자만 생성 가능, 수신자는 본인 알림만 조회 가능.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| id | bigint | NO | | PK |
| receiver_id | bigint | NO | | 수신자 (`users.id`) |
| type | varchar | YES | | 알림 유형 (`like` / `chat` / `match` 등, 레거시 값 일부 포함) |
| title | varchar | YES | | 제목 |
| body | text | YES | | 본문 |
| related_type | varchar | YES | | 관련 콘텐츠 유형 |
| related_id | bigint | YES | | 관련 콘텐츠 ID |
| is_read | boolean | NO | false | 읽음 여부 |
| created_at | timestamptz | NO | now() | 생성 일시 |

- PK: `id` · FK: `receiver_id → users.id`(NO ACTION)
- 참고: 채팅 알림은 더 이상 이 테이블에 쌓지 않음(우측 하단 플로팅 위젯이 자체 카운트로 처리). 정지/해제 등 시스템 알림만 계속 적재됨.

### `common_likes`
찜(좋아요) 목록. `target_type` + `target_id`로 다양한 대상을 찜.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| id | bigint | NO | | PK |
| user_id | bigint | NO | | 찜한 유저 (`users.id`) |
| target_type | text | NO | | 찜 대상 유형 (현재는 실질적으로 `post`만 사용) |
| target_id | bigint | NO | | 찜 대상 ID |
| created_at | timestamptz | NO | now() | 등록 일시 |

- PK: `id` · FK: `user_id → users.id`(NO ACTION), `target_id → posts.id`(CASCADE)

### `common_reports`
신고 기록. 감사 추적 목적으로 일반 유저는 수정·삭제 불가.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| id | bigint | NO | | PK |
| user_id | bigint | YES | | 신고자 (`users.id`) |
| target_type | text | YES | | 신고 대상 유형 (`post` / `user` 등) |
| target_id | bigint | YES | | 신고 대상 ID |
| status | text | YES | | `pending` / `resolved` / `dismissed` |
| created_at | timestamptz | NO | now() | 신고 일시 |
| resolved_at | timestamptz | YES | | 처리 완료 일시 |
| category | text | YES | | 신고 사유 카테고리 |
| description | text | YES | | 신고 상세 내용 |
| post_deactivated | boolean | NO | false | 신고로 인한 게시글 비활성화 여부 |
| sanction_type | text | YES | | 적용된 제재 유형 |
| sanction_expires_at | timestamptz | YES | | 제재 만료 시각 |
| handled_by | integer | YES | | 처리 관리자 (`users.id`) |

- PK: `id` · FK: `user_id → users.id`(NO ACTION), `handled_by → users.id`(NO ACTION)

---

## 7. 제재 / 신뢰도

### `user_sanctions`
유저에게 적용된 제재(정지 등) 이력.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| id | integer | NO | `nextval` | PK |
| user_id | integer | NO | | 대상 유저 (`users.id`) |
| admin_id | integer | YES | | 처리한 관리자 (`users.id`) |
| sanction_type | text | NO | | 제재 유형 |
| expires_at | timestamptz | YES | | 만료 시각 |
| created_at | timestamptz | YES | now() | 적용 일시 |
| report_id | bigint | YES | | 관련 신고 (`common_reports.id`) |

- PK: `id`
- FK: `user_id → users.id`(NO ACTION), `admin_id → users.id`(NO ACTION), `report_id → common_reports.id`(SET NULL)

### `user_trust_history`
칸토 신뢰점수(KTS) 주간 스냅샷 이력.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| user_id | bigint | NO | | 유저 (`users.id`), PK 일부 |
| week_date | date | NO | | 집계 주차, PK 일부 |
| kts_score | integer | NO | | 해당 주 KTS 점수 |
| grade_level | integer | NO | | 해당 주 등급 |

- PK: (`user_id`, `week_date`) · FK: `user_id → users.id`(CASCADE)
- 앱 코드에서는 읽기/쓰기 없이 `scripts/seed.ts` / `scripts/seed-bulk.ts` 시딩 스크립트만 참조 중 (2026-07-06 기준 보류, 미삭제).

### `sanction_templates`
제재 사유별 안내 문구 템플릿.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| id | bigint | NO | | PK |
| trigger | text | NO | | 트리거 키, UNIQUE |
| title | text | NO | | 안내 제목 |
| body | text | NO | | 안내 본문 |
| updated_by | bigint | YES | | 최종 수정 관리자 (`users.id`) |
| updated_at | timestamptz | NO | now() | 최종 수정 일시 |

- PK: `id` · UNIQUE: `trigger` · FK: `updated_by → users.id`(SET NULL)

---

## 8. 콘텐츠 관리 / 스팸 방지

### `profanity_rules`
금칙어 규칙.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| id | bigint | NO | | PK |
| scopes | text[] | NO | `'{}'` | 적용 범위 |
| words | text[] | NO | `'{}'` | 금칙어 목록 |
| created_by | bigint | YES | | 등록 관리자 (`users.id`) |
| updated_at | timestamptz | NO | now() | 최종 수정 일시 |
| created_at | timestamptz | NO | now() | 등록 일시 |

- PK: `id` · FK: `created_by → users.id`(SET NULL)

### `spam_config`
도배/스팸 방지 설정값. 싱글턴 테이블(사실상 1행).

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| id | integer | NO | 1 | PK |
| chat_window_sec | integer | NO | 3 | 채팅 도배 판정 시간 창(초) |
| chat_max_count | integer | NO | 5 | 위 시간 내 허용 최대 메시지 수 |
| chat_cooldown_sec | integer | NO | 10 | 도배 감지 후 쿨다운(초) |
| max_urls_per_post | integer | NO | 3 | 게시글 내 최대 URL 수 |
| profanity_strike_max | integer | NO | 3 | 금칙어 누적 경고 한도 |
| report_strike_max | integer | NO | 5 | 신고 누적 경고 한도 |
| auto_sanction_enabled | boolean | NO | false | 자동 제재 활성화 여부 |
| updated_by | bigint | YES | | 최종 수정 관리자 (`users.id`) |
| updated_at | timestamptz | NO | now() | 최종 수정 일시 |
| post_window_sec | integer | NO | 60 | 게시글 도배 판정 시간 창(초) |
| post_max_count | integer | NO | 3 | 위 시간 내 허용 최대 게시글 수 |

- PK: `id` · FK: `updated_by → users.id`(SET NULL)

---

## 9. 유저 관계

### `user_blocks`
1:1 채팅 상대 차단.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| id | bigint | NO | | PK |
| blocker_id | bigint | NO | | 차단한 유저 (`users.id`), UNIQUE |
| blocked_id | bigint | NO | | 차단당한 유저 (`users.id`), UNIQUE |
| created_at | timestamptz | NO | now() | 차단 일시 |

- PK: `id` · UNIQUE(`blocker_id`, `blocked_id`) — 동일 쌍 중복 차단 방지
- FK: `blocker_id → users.id`(CASCADE), `blocked_id → users.id`(CASCADE)

---

## 10. 어드민 조직

### `admin_teams`
관리자 팀.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| id | bigint | NO | `nextval` | PK |
| name | text | NO | | 팀 이름 |
| created_at | timestamptz | NO | now() | 생성 일시 |

- PK: `id`

### `team_permissions`
팀별 권한 매핑.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| team_id | bigint | NO | | 팀 (`admin_teams.id`), PK 일부 |
| permission | text | NO | | 권한 키, PK 일부 |

- PK: (`team_id`, `permission`) · FK: `team_id → admin_teams.id`(CASCADE)

### `audit_logs`
관리자 활동 감사 로그.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| id | bigint | NO | | PK |
| actor_id | bigint | YES | | 행위자 (`users.id`) |
| actor_role | text | NO | | 행위자 권한 |
| action | text | NO | | 수행한 액션 |
| target_type | text | YES | | 대상 유형 |
| target_id | bigint | YES | | 대상 ID |
| detail | jsonb | YES | | 상세 내용 |
| created_at | timestamptz | YES | now() | 기록 일시 |

- PK: `id` · FK: `actor_id → users.id`(NO ACTION)

---

## 11. 공지

### `notices`
사이트 공지.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| id | bigint | NO | | PK |
| title | text | NO | | 공지 제목 (한국어) |
| starts_at | timestamptz | NO | | 노출 시작 시각 |
| ends_at | timestamptz | NO | | 노출 종료 시각 |
| created_at | timestamptz | NO | now() | 작성 일시 |
| created_by | integer | YES | | 작성 관리자 (`users.id`) |
| title_en | text | YES | | 공지 제목 (영어) |
| title_fil | text | YES | | 공지 제목 (필리핀어) |

- PK: `id` · FK: `created_by → users.id`(NO ACTION)

---

## 12. 최근 정리 이력

- 2026-07-06: 코드에서 전혀 참조되지 않는 `comments`, `banned_keywords`, `dating_profiles`, `matches`, `community_posts` 테이블 삭제 (`supabase/migrations/20260706120000_drop_unused_tables.sql`)
- 2026-06-26: 커뮤니티 게시판 기능 제거에 따라 `community_posts` DROP 마이그레이션 작성 (`20260626020000_drop_community_posts.sql`)
- 2026-06-23: 채팅 알림을 `common_notifications`에 적재하던 트리거 제거, 시스템 알림만 유지 (`20260623000000_drop_chat_notifications.sql`)
