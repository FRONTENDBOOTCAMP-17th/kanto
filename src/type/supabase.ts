// JSON 값으로 올 수 있는 모든 타입 (문자열, 숫자, 불리언, null, 객체, 배열)
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Supabase가 자동으로 만들어주는 DB 전체 타입
// createClient<Database>(URL, KEY) 이렇게 쓰면 쿼리할 때 자동완성이 됨
export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      // 금지어 테이블 - 게시글/댓글에 쓰면 안 되는 단어 목록
      banned_keywords: {
        Row: { // select 결과
          created_at: string        // 등록 날짜
          created_by: number | null // 등록한 관리자 id (null이면 시스템이 등록)
          id: number                // 고유 번호 (자동 생성)
          keyword: string           // 금지 단어
        }
        Insert: { // 새로 추가할 때
          created_at?: string       // 생략하면 현재 시간으로 자동 설정
          created_by?: number | null
          id?: never                // 자동 생성이라 직접 넣을 수 없음
          keyword: string           // 필수
        }
        Update: { // 수정할 때 (바꿀 것만 넣으면 됨)
          created_at?: string
          created_by?: number | null
          id?: never                // PK라서 수정 불가
          keyword?: string
        }
        Relationships: [
          {
            foreignKeyName: "banned_keywords_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      // 채팅방 테이블 - 1:1 채팅방 정보
      // user_id_1, user_id_2가 대화 참여자, post_id는 채팅이 시작된 게시글
      chats: {
        Row: { // select 결과
          created_at: string | null          // 채팅방 생성 날짜
          id: number                         // 고유 번호 (자동 생성)
          last_message_at: string | null     // 마지막 메시지 보낸 시간 (목록 정렬용)
          last_message_content: string | null // 마지막 메시지 미리보기
          post_id: number | null             // 채팅 시작한 게시글 id
          user_id_1: number | null           // 참여자 1의 id
          user_id_1_unread: number | null    // 참여자 1의 안 읽은 메시지 수
          user_id_2: number | null           // 참여자 2의 id
          user_id_2_unread: number | null    // 참여자 2의 안 읽은 메시지 수
        }
        Insert: { // 새로 추가할 때
          created_at?: string | null
          id?: number
          last_message_at?: string | null
          last_message_content?: string | null
          post_id?: number | null
          user_id_1?: number | null
          user_id_1_unread?: number | null
          user_id_2?: number | null
          user_id_2_unread?: number | null
        }
        Update: { // 수정할 때 - 주로 마지막 메시지 내용이나 안 읽은 수 갱신할 때 씀
          created_at?: string | null
          id?: number
          last_message_at?: string | null
          last_message_content?: string | null
          post_id?: number | null
          user_id_1?: number | null
          user_id_1_unread?: number | null
          user_id_2?: number | null
          user_id_2_unread?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chats_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_user_id_1_fkey"
            columns: ["user_id_1"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_user_id_2_fkey"
            columns: ["user_id_2"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      // 댓글 테이블
      comments: {
        Row: { // select 결과
          content: string | null      // 댓글 내용
          created_at: string | null   // 작성 날짜
          id: number                  // 고유 번호 (자동 생성)
          like_count: number | null   // 좋아요 수
          post_id: number | null      // 달린 게시글 id
          report_status: string | null // 신고 처리 상태 ('pending', 'resolved', 'dismissed')
          user_id: number | null      // 작성자 id
        }
        Insert: { // 새로 추가할 때
          content?: string | null
          created_at?: string | null
          id?: number
          like_count?: number | null   // 기본값 0
          post_id?: number | null
          report_status?: string | null // 기본값 null (신고 없음)
          user_id?: number | null
        }
        Update: { // 수정할 때 - 주로 내용 수정, 좋아요 수 갱신, 신고 처리할 때 씀
          content?: string | null
          created_at?: string | null
          id?: number
          like_count?: number | null
          post_id?: number | null
          report_status?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      // 좋아요 테이블 - 게시글/댓글 등 여러 대상의 좋아요를 한 테이블에서 관리
      // target_type으로 어디에 단 좋아요인지 구분, target_id로 해당 글/댓글 참조
      common_likes: {
        Row: { // select 결과
          created_at: string          // 좋아요 누른 시간
          id: number                  // 고유 번호 (자동 생성)
          target_id: number | null    // 좋아요 누른 대상의 id
          target_type: string | null  // 좋아요 대상 종류 ('post', 'comment')
          user_id: number | null      // 좋아요 누른 사용자 id
        }
        Insert: { // 새로 추가할 때
          created_at?: string
          id?: number
          target_id?: number | null
          target_type?: string | null
          user_id?: number | null
        }
        Update: { // 좋아요는 추가/삭제만 하므로 거의 안 씀
          created_at?: string
          id?: number
          target_id?: number | null
          target_type?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "common_likes_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "common_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      // 알림 테이블 - 댓글/좋아요/매칭 등 여러 이벤트 알림을 한 테이블에서 관리
      common_notifications: {
        Row: { // select 결과
          body: string | null         // 알림 본문
          created_at: string | null   // 알림 생성 시간
          id: number                  // 고유 번호 (자동 생성)
          is_read: boolean | null     // 읽음 여부 (false: 안 읽음, true: 읽음)
          receiver_id: number         // 알림 받는 사람 id
          related_id: number | null   // 알림과 연결된 원본 레코드 id
          related_type: string | null // 원본 레코드 종류 ('post', 'comment', 'match')
          title: string | null        // 알림 제목
          type: string | null         // 알림 종류 ('like', 'comment', 'match', 'message')
        }
        Insert: { // 새로 추가할 때 - receiver_id는 필수
          body?: string | null
          created_at?: string | null
          id?: number
          is_read?: boolean | null    // 기본값 false (안 읽음)
          receiver_id: number         // 필수
          related_id?: number | null
          related_type?: string | null
          title?: string | null
          type?: string | null
        }
        Update: { // 수정할 때 - 주로 is_read를 true로 바꿀 때 (읽음 처리) 씀
          body?: string | null
          created_at?: string | null
          id?: number
          is_read?: boolean | null
          receiver_id?: number
          related_id?: number | null
          related_type?: string | null
          title?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "common.notifications_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      // 신고 테이블 - 게시글/댓글 등 여러 대상의 신고를 한 테이블에서 관리
      common_reports: {
        Row: { // select 결과
          created_at: string          // 신고 접수 시간
          id: number                  // 고유 번호 (자동 생성)
          reason: string | null       // 신고 사유
          status: string | null       // 처리 상태 ('pending', 'resolved', 'dismissed')
          target_id: number | null    // 신고 대상 id
          target_type: string | null  // 신고 대상 종류 ('post', 'comment')
          user_id: number | null      // 신고한 사람 id
        }
        Insert: { // 새로 추가할 때 - 기본 status는 'pending'
          created_at?: string
          id?: number
          reason?: string | null
          status?: string | null
          target_id?: number | null
          target_type?: string | null
          user_id?: number | null
        }
        Update: { // 수정할 때 - 주로 관리자가 status 바꿀 때 씀
          created_at?: string
          id?: number
          reason?: string | null
          status?: string | null
          target_id?: number | null
          target_type?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "common_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      // 커뮤니티 게시글 상세 테이블
      // posts 테이블의 공통 정보(제목, 작성자 등)를 post_id로 연결해서 확장하는 구조
      community_posts: {
        Row: { // select 결과
          category: string | null      // 카테고리 ('자유', '질문', '정보')
          comment_count: number | null // 댓글 수
          content: string | null       // 본문 내용
          id: number                   // 고유 번호 (자동 생성)
          images: Json | null          // 첨부 이미지 URL 배열
          post_id: number | null       // 연결된 posts.id
        }
        Insert: { // 새로 추가할 때 - posts에 먼저 넣고 나온 id를 post_id에 씀
          category?: string | null
          comment_count?: number | null
          content?: string | null
          id?: number
          images?: Json | null
          post_id?: number | null
        }
        Update: { // 수정할 때
          category?: string | null
          comment_count?: number | null
          content?: string | null
          id?: number
          images?: Json | null
          post_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      // 소개팅 프로필 테이블
      // is_active가 false면 다른 유저에게 안 보임, interests/photos는 JSON 배열
      dating_profiles: {
        Row: { // select 결과
          age: number | null       // 나이
          bio: string | null       // 자기소개
          created_at: string | null // 프로필 생성 날짜
          gender: string | null    // 성별 ('male', 'female', 'other')
          id: number               // 고유 번호 (자동 생성)
          interests: Json | null   // 관심사 목록 (예: ["독서", "운동"])
          is_active: boolean | null // 매칭 활성화 여부 (false면 노출 안 됨)
          name: string | null      // 프로필 이름
          photos: Json | null      // 사진 URL 배열
          region: string | null    // 활동 지역
          updated_at: string | null // 마지막 수정 날짜
          user_id: number          // 프로필 주인 id
        }
        Insert: { // 새로 추가할 때 - user_id 필수, is_active 기본값은 false
          age?: number | null
          bio?: string | null
          created_at?: string | null
          gender?: string | null
          id?: number
          interests?: Json | null
          is_active?: boolean | null
          name?: string | null
          photos?: Json | null
          region?: string | null
          updated_at?: string | null
          user_id: number           // 필수
        }
        Update: { // 수정할 때 - 바꿀 필드만 넣으면 됨
          age?: number | null
          bio?: string | null
          created_at?: string | null
          gender?: string | null
          id?: number
          interests?: Json | null
          is_active?: boolean | null
          name?: string | null
          photos?: Json | null
          region?: string | null
          updated_at?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "dating_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      // 구인/채용 게시글 상세 테이블 - posts를 확장
      // 회사 정보, 담당자 정보, 근무 조건 등을 저장
      jobs: {
        Row: { // select 결과
          applicant_count: string | null  // 지원자 수 (예: '10~50명')
          company_address: string | null  // 회사 주소
          company_intro: string           // 회사 소개
          company_name: string            // 회사명
          company_website: string | null  // 회사 홈페이지
          company_year: number | null     // 설립 연도
          contact: string | null          // 채용 담당자 연락처
          created_at: string              // 등록 날짜
          deadline: string | null         // 지원 마감일
          employee_count: number | null   // 직원 수
          employee_type: string | null    // 고용 형태 ('정규직', '계약직', '인턴')
          id: number                      // 고유 번호 (자동 생성)
          images: Json | null             // 이미지 URL 배열
          industry: string | null         // 업종
          main_task: string               // 주요 업무
          manager_email: string | null    // 담당자 이메일
          manager_name: string | null     // 담당자 이름
          manager_phone: string | null    // 담당자 전화번호
          manager_title: string | null    // 담당자 직함
          post_id: number                 // 연결된 posts.id
          preferred: string | null        // 우대 조건
          region: string                  // 근무 지역
          region_detail: string | null    // 근무 상세 주소
          salary: number | null           // 급여 (원 단위)
          salary_type: string | null      // 급여 유형 ('연봉', '월급', '시급')
          work_hours: string | null       // 근무 시간 (예: '09:00~18:00')
        }
        Insert: { // 새로 추가할 때 - company_intro, company_name, main_task, post_id, region 필수
          applicant_count?: string | null
          company_address?: string | null
          company_intro: string
          company_name: string
          company_website?: string | null
          company_year?: number | null
          contact?: string | null
          created_at?: string
          deadline?: string | null
          employee_count?: number | null
          employee_type?: string | null
          id?: number
          images?: Json | null
          industry?: string | null
          main_task: string
          manager_email?: string | null
          manager_name?: string | null
          manager_phone?: string | null
          manager_title?: string | null
          post_id: number
          preferred?: string | null
          region: string
          region_detail?: string | null
          salary?: number | null
          salary_type?: string | null
          work_hours?: string | null
        }
        Update: { // 수정할 때 - 바꿀 필드만 넣으면 됨
          applicant_count?: string | null
          company_address?: string | null
          company_intro?: string
          company_name?: string
          company_website?: string | null
          company_year?: number | null
          contact?: string | null
          created_at?: string
          deadline?: string | null
          employee_count?: number | null
          employee_type?: string | null
          id?: number
          images?: Json | null
          industry?: string | null
          main_task?: string
          manager_email?: string | null
          manager_name?: string | null
          manager_phone?: string | null
          manager_title?: string | null
          post_id?: number
          preferred?: string | null
          region?: string
          region_detail?: string | null
          salary?: number | null
          salary_type?: string | null
          work_hours?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      // 매칭 테이블 - 소개팅에서 두 사람이 서로 호감을 표시해 성사된 매칭
      matches: {
        Row: { // select 결과
          id: number               // 고유 번호 (자동 생성)
          matched_at: string | null // 매칭 성사된 시간
          user_id_1: number | null  // 매칭된 사람 1의 id
          user_id_2: number | null  // 매칭된 사람 2의 id
        }
        Insert: { // 새로 추가할 때 - matched_at은 기본값(현재 시간)
          id?: number
          matched_at?: string | null
          user_id_1?: number | null
          user_id_2?: number | null
        }
        Update: { // 매칭은 추가/삭제만 하므로 거의 안 씀
          id?: number
          matched_at?: string | null
          user_id_1?: number | null
          user_id_2?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_user_id_1_fkey"
            columns: ["user_id_1"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_user_id_2_fkey"
            columns: ["user_id_2"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      // 채팅 메시지 테이블 - chats 채팅방 안에서 주고받는 개별 메시지
      messages: {
        Row: { // select 결과
          chat_id: number | null    // 속한 채팅방 id
          content: string | null    // 메시지 내용
          created_at: string | null // 전송 시간
          id: number                // 고유 번호 (자동 생성)
          is_read: boolean | null   // 수신자가 읽었는지 여부 (기본값 false)
          post_id: number | null    // 연결된 게시글 id (첫 메시지에서 게시글 공유할 때 씀)
          sender_id: number | null  // 보낸 사람 id
        }
        Insert: { // 새로 추가할 때 - 메시지 보내면 chats의 last_message, unread 수도 같이 갱신해야 함
          chat_id?: number | null
          content?: string | null
          created_at?: string | null
          id?: number
          is_read?: boolean | null
          post_id?: number | null
          sender_id?: number | null
        }
        Update: { // 수정할 때 - 주로 is_read를 true로 바꿀 때 (읽음 처리) 씀
          chat_id?: number | null
          content?: string | null
          created_at?: string | null
          id?: number
          is_read?: boolean | null
          post_id?: number | null
          sender_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      // 게시글 공통 테이블 - 커뮤니티/중고거래/구인/부동산 모든 게시글의 공통 정보
      // 상세 정보는 community_posts, used_goods, jobs, rentals가 이 테이블을 1:1로 확장
      posts: {
        Row: { // select 결과
          created_at: string         // 작성 날짜
          id: number                 // 고유 번호 (자동 생성)
          like_count: number | null  // 좋아요 수
          post_type: string | null   // 게시글 종류 ('community', 'used_goods', 'job', 'rental')
          status: string | null      // 상태 ('active', 'deleted', 'blocked')
          title: string | null       // 제목
          updated_at: string | null  // 마지막 수정 날짜
          user_id: number            // 작성자 id
          view_count: number | null  // 조회 수
        }
        Insert: { // 새로 추가할 때 - user_id 필수, status 기본값은 'active'
          created_at?: string
          id?: number
          like_count?: number | null
          post_type?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: number            // 필수
          view_count?: number | null
        }
        Update: { // 수정할 때 - 삭제할 때는 행 삭제 대신 status를 'deleted'로 바꾸는 방식도 사용
          created_at?: string
          id?: number
          like_count?: number | null
          post_type?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: number
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      // 부동산 임대 게시글 상세 테이블 - posts를 확장
      // amenities는 편의시설 목록, images는 사진 URL 배열을 JSON으로 저장
      rentals: {
        Row: { // select 결과
          amenities: Json | null       // 편의시설 목록 (예: ["주차", "엘리베이터"])
          created_at: string           // 등록 날짜
          deposit: number | null       // 보증금 (만원 단위)
          description: string | null   // 상세 설명
          id: number                   // 고유 번호 (자동 생성)
          images: Json | null          // 사진 URL 배열
          location: string | null      // 위치/주소
          location_detail: string | null // 상세 위치
          max_occupants: number | null // 최대 거주 인원
          post_id: number | null       // 연결된 posts.id
          price: number | null         // 월 납부 금액 (만원 단위)
          rent_type: string | null     // 임대 유형 ('월세', '전세', '단기')
          room_type: string | null     // 방 유형 ('원룸', '투룸', '아파트', '오피스텔')
        }
        Insert: { // 새로 추가할 때 - posts에 먼저 넣고 나온 id를 post_id에 씀
          amenities?: Json | null
          created_at?: string
          deposit?: number | null
          description?: string | null
          id?: number
          images?: Json | null
          location?: string | null
          location_detail?: string | null
          max_occupants?: number | null
          post_id?: number | null
          price?: number | null
          rent_type?: string | null
          room_type?: string | null
        }
        Update: { // 수정할 때 - posts의 updated_at도 함께 갱신해야 함
          amenities?: Json | null
          created_at?: string
          deposit?: number | null
          description?: string | null
          id?: number
          images?: Json | null
          location?: string | null
          location_detail?: string | null
          max_occupants?: number | null
          post_id?: number | null
          price?: number | null
          rent_type?: string | null
          room_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rentals_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      // 중고거래 게시글 상세 테이블 - posts를 확장
      // safe_payment는 안전결제 여부, location_type은 직거래/택배 등 거래 방식
      used_goods: {
        Row: { // select 결과
          category: string | null       // 카테고리 ('전자기기', '의류', '가구')
          condition: string | null      // 상품 상태 ('새상품', '상', '중', '하')
          content: string | null        // 상품 설명
          id: number                    // 고유 번호 (자동 생성)
          images: Json | null           // 사진 URL 배열
          location_custom: string | null // 직거래 희망 장소
          location_type: string | null  // 거래 방식 ('직거래', '택배', '모두')
          post_id: number               // 연결된 posts.id
          price: number | null          // 판매 가격 (원 단위)
          safe_payment: boolean | null  // 안전결제 사용 여부
        }
        Insert: { // 새로 추가할 때 - posts에 먼저 넣고 나온 id를 post_id에 씀
          category?: string | null
          condition?: string | null
          content?: string | null
          id?: number
          images?: Json | null
          location_custom?: string | null
          location_type?: string | null
          post_id: number
          price?: number | null
          safe_payment?: boolean | null
        }
        Update: { // 수정할 때 - posts의 title, updated_at도 함께 갱신해야 함
          category?: string | null
          condition?: string | null
          content?: string | null
          id?: number
          images?: Json | null
          location_custom?: string | null
          location_type?: string | null
          post_id?: number
          price?: number | null
          safe_payment?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "used_goods_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      // 사용자 테이블
      users: {
        Row: { // select 결과
          auth_id: string | null      // Supabase Auth의 UUID (로그인 인증용)
          avatar_url: string | null   // 프로필 이미지 URL
          created_at: string | null   // 가입 날짜
          email: string | null        // 이메일
          id: number                  // 고유 번호 (자동 생성, 서비스 내부 식별자)
          name: string | null         // 닉네임
          phone: string | null        // 전화번호
          post_count: number | null   // 작성한 게시글 수
          provider: string | null     // 로그인 방법 ('google', 'kakao', 'email')
          role: string                // 권한 ('user', 'admin')
          updated_at: string | null   // 마지막 수정 날짜
        }
        Insert: { // 새로 추가할 때 - 회원가입 시 auth_id, email, provider 주로 넣음
          auth_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: number
          name?: string | null
          phone?: string | null
          post_count?: number | null
          provider?: string | null
          role?: string              // 기본값 'user', 관리자만 'admin'으로 설정
          updated_at?: string | null
        }
        Update: { // 수정할 때 - 프로필 수정 시 name, avatar_url, phone 등 갱신
          auth_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: number
          name?: string | null
          phone?: string | null
          post_count?: number | null
          provider?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean } // 현재 로그인한 유저가 admin인지 확인
      my_role: { Args: never; Returns: string }   // 현재 로그인한 유저의 role 반환
      my_user_id: { Args: never; Returns: number } // 현재 로그인한 유저의 id 반환
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// 내부 메타데이터 제거한 타입
type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

// public 스키마 단축 타입
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

// 테이블/뷰의 Row 타입 꺼내기
// 사용법: type User = Tables<"users">
export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

// 테이블의 Insert 타입 꺼내기
// 사용법: type NewPost = TablesInsert<"posts">
export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

// 테이블의 Update 타입 꺼내기
// 사용법: type PostUpdate = TablesUpdate<"posts">
export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

// DB Enum 타입 꺼내기 (현재 이 프로젝트는 Enum 안 씀)
export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

// CompositeType 타입 꺼내기 (현재 이 프로젝트는 CompositeType 안 씀)
export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
