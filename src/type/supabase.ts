/** Supabase JSON 필드에 사용되는 재귀적 JSON 타입 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

/**
 * Supabase에서 자동 생성된 전체 데이터베이스 스키마 타입.
 * `createClient<Database>(URL, KEY)` 형태로 사용하면 모든 쿼리에 타입 추론이 적용됩니다.
 */
export type Database = {
  // createClient 호출 시 PostgrestVersion 옵션을 수동으로 지정하지 않아도 되도록
  // 내부적으로 올바른 버전을 자동으로 주입하는 메타데이터 필드
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      /** 금지 키워드 테이블: 게시글·댓글 등록 시 필터링되는 비속어/금칙어를 관리합니다 */
      banned_keywords: {
        /** DB 조회(select) 시 반환되는 행의 전체 필드 타입 */
        Row: {
          /** 키워드 등록 일시 (ISO 8601) */
          created_at: string
          /** 키워드를 등록한 관리자 users.id (null이면 시스템 등록) */
          created_by: number | null
          /** 자동 증가 PK */
          id: number
          /** 금지 키워드 문자열 */
          keyword: string
        }
        /**
         * 행 삽입(insert) 시 허용되는 필드 타입.
         * optional(?)로 표시된 필드는 DB 기본값이 존재하므로 생략 가능합니다.
         */
        Insert: {
          /** 생략 시 DB의 now() 기본값이 적용됨 */
          created_at?: string
          created_by?: number | null
          /** id는 자동 생성(serial)이므로 삽입 불가 */
          id?: never
          keyword: string
        }
        /**
         * 행 수정(update) 시 허용되는 필드 타입.
         * 모든 필드가 optional이며, 변경할 필드만 전달합니다.
         */
        Update: {
          created_at?: string
          created_by?: number | null
          /** id는 PK이므로 수정 불가 */
          id?: never
          keyword?: string
        }
        /**
         * 외래 키 관계 정의.
         * created_by → users.id (다대일, 한 관리자가 여러 금지어 등록 가능)
         */
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
      /**
       * 채팅방 테이블: 1:1 채팅방 정보를 저장합니다.
       * user_id_1과 user_id_2가 채팅 참여자이며, 연결된 게시글(post_id)을 기준으로 생성됩니다.
       */
      chats: {
        /** DB 조회(select) 시 반환되는 행의 전체 필드 타입 */
        Row: {
          /** 채팅방 생성 일시 */
          created_at: string | null
          /** 자동 증가 PK */
          id: number
          /** 가장 최근 메시지가 전송된 일시 (채팅 목록 정렬에 사용) */
          last_message_at: string | null
          /** 가장 최근 메시지 내용 미리보기 */
          last_message_content: string | null
          /** 채팅이 시작된 원본 게시글 posts.id */
          post_id: number | null
          /** 채팅 참여자 1의 users.id */
          user_id_1: number | null
          /** user_id_1의 읽지 않은 메시지 수 */
          user_id_1_unread: number | null
          /** 채팅 참여자 2의 users.id */
          user_id_2: number | null
          /** user_id_2의 읽지 않은 메시지 수 */
          user_id_2_unread: number | null
        }
        /**
         * 행 삽입(insert) 시 허용되는 필드 타입.
         * id는 자동 생성, created_at은 DB 기본값(now()) 사용.
         * last_message_* 필드는 메시지 전송 시 별도로 업데이트됩니다.
         */
        Insert: {
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
        /**
         * 행 수정(update) 시 허용되는 필드 타입.
         * 주로 last_message_at, last_message_content, unread 카운트를 갱신하는 데 사용됩니다.
         */
        Update: {
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
        /**
         * 외래 키 관계 정의.
         * post_id → posts.id (채팅을 시작한 게시글, 다대일)
         * user_id_1 → users.id (참여자 1)
         * user_id_2 → users.id (참여자 2)
         */
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
      /** 댓글 테이블: 게시글(posts)에 달리는 댓글을 저장합니다 */
      comments: {
        /** DB 조회(select) 시 반환되는 행의 전체 필드 타입 */
        Row: {
          /** 댓글 본문 */
          content: string | null
          /** 댓글 작성 일시 */
          created_at: string | null
          /** 자동 증가 PK */
          id: number
          /** 댓글에 달린 좋아요 수 (비정규화된 카운터) */
          like_count: number | null
          /** 댓글이 달린 게시글 posts.id */
          post_id: number | null
          /** 신고 처리 상태 (예: 'pending', 'resolved', 'dismissed') */
          report_status: string | null
          /** 댓글 작성자 users.id */
          user_id: number | null
        }
        /**
         * 행 삽입(insert) 시 허용되는 필드 타입.
         * 댓글 작성 시 content, post_id, user_id를 필수로 제공해야 합니다.
         */
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: number
          /** 초기값 0, 좋아요 발생 시 별도 업데이트 */
          like_count?: number | null
          post_id?: number | null
          /** 초기값 null (신고 없음), 신고 접수 시 'pending'으로 변경 */
          report_status?: string | null
          user_id?: number | null
        }
        /**
         * 행 수정(update) 시 허용되는 필드 타입.
         * 주로 content(댓글 수정), like_count 갱신, report_status 처리에 사용됩니다.
         */
        Update: {
          content?: string | null
          created_at?: string | null
          id?: number
          like_count?: number | null
          post_id?: number | null
          report_status?: string | null
          user_id?: number | null
        }
        /**
         * 외래 키 관계 정의.
         * post_id → posts.id (댓글이 달린 게시글, 다대일)
         * user_id → users.id (댓글 작성자, 다대일)
         */
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
      /**
       * 공통 좋아요 테이블: 게시글·댓글 등 여러 대상에 대한 좋아요를 통합 관리합니다.
       * target_type으로 대상 종류를 구분하고, target_id로 해당 레코드를 참조합니다.
       */
      common_likes: {
        /** DB 조회(select) 시 반환되는 행의 전체 필드 타입 */
        Row: {
          /** 좋아요 누른 일시 */
          created_at: string
          /** 자동 증가 PK */
          id: number
          /** 좋아요 대상 레코드의 id (posts.id 등) */
          target_id: number | null
          /** 좋아요 대상 종류 (예: 'post', 'comment') */
          target_type: string | null
          /** 좋아요를 누른 사용자 users.id */
          user_id: number | null
        }
        /**
         * 행 삽입(insert) 시 허용되는 필드 타입.
         * 좋아요 추가 시 target_id, target_type, user_id를 반드시 지정해야 합니다.
         */
        Insert: {
          created_at?: string
          id?: number
          target_id?: number | null
          target_type?: string | null
          user_id?: number | null
        }
        /**
         * 행 수정(update) 시 허용되는 필드 타입.
         * 좋아요는 생성/삭제만 하므로 실제로 update는 거의 사용되지 않습니다.
         */
        Update: {
          created_at?: string
          id?: number
          target_id?: number | null
          target_type?: string | null
          user_id?: number | null
        }
        /**
         * 외래 키 관계 정의.
         * target_id → posts.id (좋아요 대상 게시글, 다대일)
         * user_id → users.id (좋아요를 누른 사용자, 다대일)
         */
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
      /**
       * 공통 알림 테이블: 댓글·좋아요·매칭 등 다양한 이벤트에 대한 알림을 통합 관리합니다.
       * related_type과 related_id로 알림이 발생한 원본 레코드를 특정합니다.
       */
      common_notifications: {
        /** DB 조회(select) 시 반환되는 행의 전체 필드 타입 */
        Row: {
          /** 알림 본문 내용 */
          body: string | null
          /** 알림 생성 일시 */
          created_at: string | null
          /** 자동 증가 PK */
          id: number
          /** 읽음 여부 (false: 미확인, true: 확인 완료) */
          is_read: boolean | null
          /** 알림을 받는 사용자 users.id */
          receiver_id: number
          /** 알림과 연결된 원본 레코드 id */
          related_id: number | null
          /** 알림 원본 레코드의 종류 (예: 'post', 'comment', 'match') */
          related_type: string | null
          /** 알림 제목 */
          title: string | null
          /** 알림 종류 (예: 'like', 'comment', 'match', 'message') */
          type: string | null
        }
        /**
         * 행 삽입(insert) 시 허용되는 필드 타입.
         * receiver_id는 필수이며, 나머지 필드는 알림 종류에 따라 선택적으로 제공합니다.
         * is_read 기본값은 false(미읽음)입니다.
         */
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: number
          is_read?: boolean | null
          receiver_id: number
          related_id?: number | null
          related_type?: string | null
          title?: string | null
          type?: string | null
        }
        /**
         * 행 수정(update) 시 허용되는 필드 타입.
         * 주로 is_read를 true로 변경(읽음 처리)하는 데 사용됩니다.
         */
        Update: {
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
        /**
         * 외래 키 관계 정의.
         * receiver_id → users.id (알림 수신자, 다대일)
         */
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
      /**
       * 공통 신고 테이블: 게시글·댓글 등 여러 대상에 대한 신고를 통합 관리합니다.
       * target_type으로 신고 대상 종류를 구분하고, status로 처리 현황을 추적합니다.
       */
      common_reports: {
        /** DB 조회(select) 시 반환되는 행의 전체 필드 타입 */
        Row: {
          /** 신고 접수 일시 */
          created_at: string
          /** 자동 증가 PK */
          id: number
          /** 신고 사유 */
          reason: string | null
          /** 처리 상태 (예: 'pending', 'resolved', 'dismissed') */
          status: string | null
          /** 신고 대상 레코드의 id */
          target_id: number | null
          /** 신고 대상 종류 (예: 'post', 'comment') */
          target_type: string | null
          /** 신고한 사용자 users.id */
          user_id: number | null
        }
        /**
         * 행 삽입(insert) 시 허용되는 필드 타입.
         * 신고 접수 시 reason, target_id, target_type, user_id를 함께 제공합니다.
         * status 기본값은 'pending'입니다.
         */
        Insert: {
          created_at?: string
          id?: number
          reason?: string | null
          status?: string | null
          target_id?: number | null
          target_type?: string | null
          user_id?: number | null
        }
        /**
         * 행 수정(update) 시 허용되는 필드 타입.
         * 주로 관리자가 신고를 처리할 때 status를 변경하는 데 사용됩니다.
         */
        Update: {
          created_at?: string
          id?: number
          reason?: string | null
          status?: string | null
          target_id?: number | null
          target_type?: string | null
          user_id?: number | null
        }
        /**
         * 외래 키 관계 정의.
         * user_id → users.id (신고한 사용자, 다대일)
         */
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
      /**
       * 커뮤니티 게시글 테이블: posts 테이블의 공통 정보를 확장한 커뮤니티 전용 상세 정보를 저장합니다.
       * posts.id를 post_id로 참조하는 1:1 확장 구조입니다.
       */
      community_posts: {
        /** DB 조회(select) 시 반환되는 행의 전체 필드 타입 */
        Row: {
          /** 게시글 카테고리 (예: '자유', '질문', '정보') */
          category: string | null
          /** 댓글 수 (비정규화된 카운터, 실제 댓글 삽입/삭제 시 별도 갱신) */
          comment_count: number | null
          /** 게시글 본문 내용 */
          content: string | null
          /** 자동 증가 PK */
          id: number
          /** 첨부 이미지 URL 배열 (JSON) */
          images: Json | null
          /** 연결된 posts.id */
          post_id: number | null
        }
        /**
         * 행 삽입(insert) 시 허용되는 필드 타입.
         * 커뮤니티 게시글 작성 시 posts 테이블에 먼저 행을 삽입한 후 post_id를 지정합니다.
         */
        Insert: {
          category?: string | null
          comment_count?: number | null
          content?: string | null
          id?: number
          images?: Json | null
          post_id?: number | null
        }
        /**
         * 행 수정(update) 시 허용되는 필드 타입.
         * 주로 content, category, images 수정 및 comment_count 갱신에 사용됩니다.
         */
        Update: {
          category?: string | null
          comment_count?: number | null
          content?: string | null
          id?: number
          images?: Json | null
          post_id?: number | null
        }
        /**
         * 외래 키 관계 정의.
         * post_id → posts.id (공통 게시글 정보, 일대일)
         */
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
      /**
       * 소개팅 프로필 테이블: 매칭 서비스에서 사용하는 사용자 프로필 정보를 저장합니다.
       * is_active로 프로필 공개 여부를 제어하며, interests와 photos는 JSON 배열로 저장됩니다.
       */
      dating_profiles: {
        /** DB 조회(select) 시 반환되는 행의 전체 필드 타입 */
        Row: {
          /** 나이 */
          age: number | null
          /** 자기소개 텍스트 */
          bio: string | null
          /** 프로필 생성 일시 */
          created_at: string | null
          /** 성별 (예: 'male', 'female', 'other') */
          gender: string | null
          /** 자동 증가 PK */
          id: number
          /** 관심사 목록 (JSON 문자열 배열, 예: ["독서", "운동"]) */
          interests: Json | null
          /** 매칭 활성화 여부 (false면 다른 유저에게 노출되지 않음) */
          is_active: boolean | null
          /** 프로필에 표시할 이름 */
          name: string | null
          /** 프로필 사진 URL 배열 (JSON) */
          photos: Json | null
          /** 활동 지역 */
          region: string | null
          /** 프로필 마지막 수정 일시 */
          updated_at: string | null
          /** 프로필 소유자 users.id */
          user_id: number
        }
        /**
         * 행 삽입(insert) 시 허용되는 필드 타입.
         * user_id는 필수이며, 나머지는 프로필 설정 화면에서 선택적으로 입력받습니다.
         * is_active 기본값은 false(비활성)이므로 프로필 완성 후 명시적으로 활성화해야 합니다.
         */
        Insert: {
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
          user_id: number
        }
        /**
         * 행 수정(update) 시 허용되는 필드 타입.
         * 프로필 수정 시 변경된 필드만 전달합니다. updated_at은 트리거 또는 직접 갱신합니다.
         */
        Update: {
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
        /**
         * 외래 키 관계 정의.
         * user_id → users.id (프로필 소유자, 일대일)
         */
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
      /**
       * 구인·채용 게시글 테이블: posts를 확장하는 구직/채용 전용 상세 정보를 저장합니다.
       * 회사 정보, 담당자 정보, 근무 조건 등을 포함합니다.
       */
      jobs: {
        /** DB 조회(select) 시 반환되는 행의 전체 필드 타입 */
        Row: {
          /** 지원자 수 (문자열로 저장, 예: '10~50명') */
          applicant_count: string | null
          /** 회사 주소 */
          company_address: string | null
          /** 회사 소개 */
          company_intro: string
          /** 회사명 */
          company_name: string
          /** 회사 웹사이트 URL */
          company_website: string | null
          /** 회사 설립 연도 */
          company_year: number | null
          /** 채용 담당자 연락처 */
          contact: string | null
          /** 게시글 등록 일시 */
          created_at: string
          /** 지원 마감일 (ISO 8601) */
          deadline: string | null
          /** 직원 수 */
          employee_count: number | null
          /** 고용 형태 (예: '정규직', '계약직', '인턴') */
          employee_type: string | null
          /** 자동 증가 PK */
          id: number
          /** 회사·직무 관련 이미지 URL 배열 (JSON) */
          images: Json | null
          /** 업종·산업군 */
          industry: string | null
          /** 주요 업무 내용 */
          main_task: string
          /** 채용 담당자 이메일 */
          manager_email: string | null
          /** 채용 담당자 이름 */
          manager_name: string | null
          /** 채용 담당자 전화번호 */
          manager_phone: string | null
          /** 채용 담당자 직함 */
          manager_title: string | null
          /** 연결된 posts.id */
          post_id: number
          /** 우대 조건 */
          preferred: string | null
          /** 근무 지역 */
          region: string
          /** 근무 지역 상세 주소 */
          region_detail: string | null
          /** 급여 (단위: 원, salary_type으로 유형 구분) */
          salary: number | null
          /** 급여 유형 (예: '연봉', '월급', '시급') */
          salary_type: string | null
          /** 근무 시간 (예: '09:00~18:00') */
          work_hours: string | null
        }
        /**
         * 행 삽입(insert) 시 허용되는 필드 타입.
         * company_intro, company_name, main_task, post_id, region이 필수 항목입니다.
         * post_id는 posts 테이블에 먼저 행을 삽입한 후 받아온 id를 사용합니다.
         */
        Insert: {
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
        /**
         * 행 수정(update) 시 허용되는 필드 타입.
         * 채용 공고 수정 시 변경된 필드만 전달합니다. posts 테이블의 title, status도 함께 갱신해야 합니다.
         */
        Update: {
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
        /**
         * 외래 키 관계 정의.
         * post_id → posts.id (공통 게시글 정보, 일대일)
         */
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
      /**
       * 매칭 테이블: 소개팅 서비스에서 두 사용자가 서로 호감을 표시해 성사된 매칭을 저장합니다.
       * user_id_1과 user_id_2는 순서 없이 매칭된 두 사용자를 나타냅니다.
       */
      matches: {
        /** DB 조회(select) 시 반환되는 행의 전체 필드 타입 */
        Row: {
          /** 자동 증가 PK */
          id: number
          /** 매칭이 성사된 일시 */
          matched_at: string | null
          /** 매칭 참여자 1의 users.id */
          user_id_1: number | null
          /** 매칭 참여자 2의 users.id */
          user_id_2: number | null
        }
        /**
         * 행 삽입(insert) 시 허용되는 필드 타입.
         * 매칭 성사 시 user_id_1, user_id_2를 함께 삽입합니다. matched_at은 DB 기본값(now()) 사용.
         */
        Insert: {
          id?: number
          matched_at?: string | null
          user_id_1?: number | null
          user_id_2?: number | null
        }
        /**
         * 행 수정(update) 시 허용되는 필드 타입.
         * 매칭은 생성/삭제만 하므로 실제로 update는 거의 사용되지 않습니다.
         */
        Update: {
          id?: number
          matched_at?: string | null
          user_id_1?: number | null
          user_id_2?: number | null
        }
        /**
         * 외래 키 관계 정의.
         * user_id_1 → users.id (매칭 참여자 1, 다대일)
         * user_id_2 → users.id (매칭 참여자 2, 다대일)
         */
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
      /**
       * 채팅 메시지 테이블: chats 채팅방 내에서 주고받은 개별 메시지를 저장합니다.
       * post_id는 해당 메시지가 특정 게시글과 연관된 경우에 설정됩니다.
       */
      messages: {
        /** DB 조회(select) 시 반환되는 행의 전체 필드 타입 */
        Row: {
          /** 메시지가 속한 채팅방 chats.id */
          chat_id: number | null
          /** 메시지 본문 */
          content: string | null
          /** 메시지 전송 일시 */
          created_at: string | null
          /** 자동 증가 PK */
          id: number
          /** 수신자의 읽음 여부 (기본값 false) */
          is_read: boolean | null
          /** 메시지와 연결된 게시글 posts.id (선택적, 첫 메시지에서 게시글 공유 시 사용) */
          post_id: number | null
          /** 메시지 발신자 users.id */
          sender_id: number | null
        }
        /**
         * 행 삽입(insert) 시 허용되는 필드 타입.
         * 메시지 전송 시 chat_id, content, sender_id를 필수로 제공합니다.
         * 삽입 후 chats 테이블의 last_message_* 및 unread 카운트도 함께 갱신해야 합니다.
         */
        Insert: {
          chat_id?: number | null
          content?: string | null
          created_at?: string | null
          id?: number
          is_read?: boolean | null
          post_id?: number | null
          sender_id?: number | null
        }
        /**
         * 행 수정(update) 시 허용되는 필드 타입.
         * 주로 is_read를 true로 변경(읽음 처리)하는 데 사용됩니다.
         */
        Update: {
          chat_id?: number | null
          content?: string | null
          created_at?: string | null
          id?: number
          is_read?: boolean | null
          post_id?: number | null
          sender_id?: number | null
        }
        /**
         * 외래 키 관계 정의.
         * chat_id → chats.id (메시지가 속한 채팅방, 다대일)
         * post_id → posts.id (연관 게시글, 다대일)
         * sender_id → users.id (발신자, 다대일)
         */
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
      /**
       * 게시글 공통 테이블: 커뮤니티·중고거래·구인·부동산 등 모든 게시글의 공통 정보를 저장합니다.
       * 각 게시글 유형의 상세 정보는 community_posts, used_goods, jobs, rentals 테이블이 이 테이블을 1:1로 확장합니다.
       */
      posts: {
        /** DB 조회(select) 시 반환되는 행의 전체 필드 타입 */
        Row: {
          /** 게시글 최초 작성 일시 */
          created_at: string
          /** 자동 증가 PK */
          id: number
          /** 좋아요 수 (비정규화된 카운터, common_likes 변경 시 별도 갱신) */
          like_count: number | null
          /** 게시글 유형 (예: 'community', 'used_goods', 'job', 'rental') */
          post_type: string | null
          /** 게시글 상태 (예: 'active', 'deleted', 'blocked') */
          status: string | null
          /** 게시글 제목 */
          title: string | null
          /** 게시글 마지막 수정 일시 */
          updated_at: string | null
          /** 게시글 작성자 users.id */
          user_id: number
          /** 조회 수 */
          view_count: number | null
        }
        /**
         * 행 삽입(insert) 시 허용되는 필드 타입.
         * user_id는 필수이며, post_type에 따라 상세 테이블(community_posts 등)에도 행을 삽입합니다.
         * status 기본값은 'active'입니다.
         */
        Insert: {
          created_at?: string
          id?: number
          like_count?: number | null
          post_type?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: number
          view_count?: number | null
        }
        /**
         * 행 수정(update) 시 허용되는 필드 타입.
         * 게시글 수정 시 updated_at도 함께 갱신해야 합니다.
         * 삭제 시에는 행을 제거하는 대신 status를 'deleted'로 변경하는 소프트 삭제 방식을 사용할 수 있습니다.
         */
        Update: {
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
        /**
         * 외래 키 관계 정의.
         * user_id → users.id (게시글 작성자, 다대일)
         */
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
      /**
       * 부동산 임대 게시글 테이블: posts를 확장하는 방·원룸·아파트 등 임대 물건 상세 정보를 저장합니다.
       * amenities는 편의시설 목록, images는 물건 사진 URL 배열을 JSON으로 저장합니다.
       */
      rentals: {
        /** DB 조회(select) 시 반환되는 행의 전체 필드 타입 */
        Row: {
          /** 편의시설 목록 JSON 배열 (예: ["주차", "엘리베이터", "에어컨"]) */
          amenities: Json | null
          /** 게시글 등록 일시 */
          created_at: string
          /** 보증금 (단위: 만원) */
          deposit: number | null
          /** 물건 상세 설명 */
          description: string | null
          /** 자동 증가 PK */
          id: number
          /** 물건 사진 URL 배열 (JSON) */
          images: Json | null
          /** 물건 위치·주소 */
          location: string | null
          /** 물건 상세 위치 */
          location_detail: string | null
          /** 최대 거주 인원 */
          max_occupants: number | null
          /** 연결된 posts.id */
          post_id: number | null
          /** 월 납부 금액 (단위: 만원, 월세·관리비 등 포함) */
          price: number | null
          /** 임대 유형 (예: '월세', '전세', '단기') */
          rent_type: string | null
          /** 방 유형 (예: '원룸', '투룸', '아파트', '오피스텔') */
          room_type: string | null
        }
        /**
         * 행 삽입(insert) 시 허용되는 필드 타입.
         * post_id는 posts 테이블에 먼저 행을 삽입한 후 받아온 id를 사용합니다.
         */
        Insert: {
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
        /**
         * 행 수정(update) 시 허용되는 필드 타입.
         * 임대 물건 정보 수정 시 변경된 필드만 전달합니다. posts 테이블의 updated_at도 함께 갱신합니다.
         */
        Update: {
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
        /**
         * 외래 키 관계 정의.
         * post_id → posts.id (공통 게시글 정보, 일대일)
         */
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
      /**
       * 중고거래 게시글 테이블: posts를 확장하는 중고 물품 판매 상세 정보를 저장합니다.
       * safe_payment는 안전결제 사용 여부를, location_type은 직거래·택배 등 거래 방식을 나타냅니다.
       */
      used_goods: {
        /** DB 조회(select) 시 반환되는 행의 전체 필드 타입 */
        Row: {
          /** 상품 카테고리 (예: '전자기기', '의류', '가구') */
          category: string | null
          /** 상품 상태 (예: '새상품', '상', '중', '하') */
          condition: string | null
          /** 상품 상세 설명 */
          content: string | null
          /** 자동 증가 PK */
          id: number
          /** 상품 사진 URL 배열 (JSON) */
          images: Json | null
          /** 직거래 희망 장소 등 사용자 지정 위치 텍스트 */
          location_custom: string | null
          /** 거래 방식 (예: '직거래', '택배', '모두') */
          location_type: string | null
          /** 연결된 posts.id */
          post_id: number
          /** 판매 가격 (단위: 원) */
          price: number | null
          /** 안전결제 사용 여부 */
          safe_payment: boolean | null
        }
        /**
         * 행 삽입(insert) 시 허용되는 필드 타입.
         * post_id는 posts 테이블에 먼저 행을 삽입한 후 받아온 id를 사용합니다.
         */
        Insert: {
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
        /**
         * 행 수정(update) 시 허용되는 필드 타입.
         * 상품 정보 수정 시 변경된 필드만 전달합니다. posts 테이블의 title, updated_at도 함께 갱신합니다.
         */
        Update: {
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
        /**
         * 외래 키 관계 정의.
         * post_id → posts.id (공통 게시글 정보, 일대일)
         */
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
      /** 사용자 테이블: 소셜 로그인 및 이메일 인증을 통해 가입한 사용자 정보를 저장합니다 */
      users: {
        /** DB 조회(select) 시 반환되는 행의 전체 필드 타입 */
        Row: {
          /** Supabase Auth의 UUID (auth.users.id와 연결) */
          auth_id: string | null
          /** 프로필 이미지 URL */
          avatar_url: string | null
          /** 계정 생성 일시 */
          created_at: string | null
          /** 사용자 이메일 */
          email: string | null
          /** 자동 증가 PK (서비스 내부 사용자 식별자) */
          id: number
          /** 사용자 표시 이름(닉네임) */
          name: string | null
          /** 전화번호 */
          phone: string | null
          /** 작성한 게시글 수 (비정규화된 카운터, posts 변경 시 별도 갱신) */
          post_count: number | null
          /** 소셜 로그인 제공자 (예: 'google', 'kakao', 'email') */
          provider: string | null
          /** 권한 역할 (예: 'user', 'admin') */
          role: string
          /** 계정 정보 마지막 수정 일시 */
          updated_at: string | null
        }
        /**
         * 행 삽입(insert) 시 허용되는 필드 타입.
         * 회원가입 시 auth_id, email, provider를 주로 제공합니다.
         * role 기본값은 'user'이며, 관리자 권한 부여 시에만 'admin'으로 설정합니다.
         */
        Insert: {
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
        /**
         * 행 수정(update) 시 허용되는 필드 타입.
         * 프로필 수정 시 name, avatar_url, phone 등을 갱신합니다. updated_at도 함께 갱신합니다.
         */
        Update: {
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
        /** 이 테이블은 다른 테이블을 참조하는 외래 키가 없습니다 */
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      /** 현재 로그인한 사용자가 admin 역할인지 확인하는 RPC 함수 */
      is_admin: { Args: never; Returns: boolean }
      /** 현재 로그인한 사용자의 role 값을 반환하는 RPC 함수 */
      my_role: { Args: never; Returns: string }
      /** 현재 로그인한 사용자의 users.id를 반환하는 RPC 함수 */
      my_user_id: { Args: never; Returns: number }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

/** Database에서 내부 메타데이터(__InternalSupabase)를 제거한 타입 */
type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

/** public 스키마를 기본 스키마로 참조하기 위한 단축 타입 */
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

/**
 * 테이블 또는 뷰의 Row 타입을 추출하는 제네릭 유틸리티 타입.
 *
 * @example
 * // 기본 사용: public 스키마의 테이블명으로 조회
 * type UserRow = Tables<"users">
 *
 * // 다른 스키마 지정
 * type OtherRow = Tables<{ schema: "other_schema" }, "table_name">
 */
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

/**
 * 테이블의 Insert 타입을 추출하는 제네릭 유틸리티 타입.
 * supabase.from("table").insert(data) 호출 시 data의 타입으로 사용합니다.
 *
 * @example
 * type NewPost = TablesInsert<"posts">
 */
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

/**
 * 테이블의 Update 타입을 추출하는 제네릭 유틸리티 타입.
 * supabase.from("table").update(data) 호출 시 data의 타입으로 사용합니다.
 *
 * @example
 * type PostUpdate = TablesUpdate<"posts">
 */
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

/**
 * DB Enum 값의 타입을 추출하는 제네릭 유틸리티 타입.
 * 현재 이 프로젝트는 Supabase Enum을 사용하지 않으므로 실제로 쓰이지 않습니다.
 *
 * @example
 * type StatusEnum = Enums<"post_status">
 */
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

/**
 * DB CompositeType 값의 타입을 추출하는 제네릭 유틸리티 타입.
 * 현재 이 프로젝트는 CompositeType을 사용하지 않으므로 실제로 쓰이지 않습니다.
 */
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

/** 스키마별 상수 값 모음 (현재 Enum 없음) */
export const Constants = {
  public: {
    Enums: {},
  },
} as const
