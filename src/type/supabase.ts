export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      banned_keywords: {
        Row: {
          created_at: string
          created_by: number | null
          id: number
          keyword: string
        }
        Insert: {
          created_at?: string
          created_by?: number | null
          id?: never
          keyword: string
        }
        Update: {
          created_at?: string
          created_by?: number | null
          id?: never
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
      chats: {
        Row: {
          created_at: string | null
          id: number
          last_message_at: string | null
          last_message_content: string | null
          post_id: number
          user_id_1: number | null
          user_id_1_left: boolean | null
          user_id_1_unread: number | null
          user_id_2: number | null
          user_id_2_left: boolean | null
          user_id_2_unread: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          last_message_at?: string | null
          last_message_content?: string | null
          post_id: number
          user_id_1?: number | null
          user_id_1_left?: boolean | null
          user_id_1_unread?: number | null
          user_id_2?: number | null
          user_id_2_left?: boolean | null
          user_id_2_unread?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          last_message_at?: string | null
          last_message_content?: string | null
          post_id?: number
          user_id_1?: number | null
          user_id_1_left?: boolean | null
          user_id_1_unread?: number | null
          user_id_2?: number | null
          user_id_2_left?: boolean | null
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
      comments: {
        Row: {
          content: string | null
          created_at: string | null
          id: number
          like_count: number | null
          post_id: number | null
          report_status: string | null
          user_id: number | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: number
          like_count?: number | null
          post_id?: number | null
          report_status?: string | null
          user_id?: number | null
        }
        Update: {
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
      common_likes: {
        Row: {
          created_at: string
          id: number
          target_id: number
          target_type: string
          user_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          target_id: number
          target_type: string
          user_id: number
        }
        Update: {
          created_at?: string
          id?: number
          target_id?: number
          target_type?: string
          user_id?: number
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
      common_notifications: {
        Row: {
          body: string | null
          created_at: string | null
          id: number
          is_read: boolean | null
          receiver_id: number
          related_id: number | null
          related_type: string | null
          title: string | null
          type: string | null
        }
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
      common_reports: {
        Row: {
          created_at: string
          id: number
          reason: string | null
          resolved_at: string | null
          status: string | null
          target_id: number | null
          target_type: string | null
          user_id: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          reason?: string | null
          resolved_at?: string | null
          status?: string | null
          target_id?: number | null
          target_type?: string | null
          user_id?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          reason?: string | null
          resolved_at?: string | null
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
      community_posts: {
        Row: {
          category: string | null
          comment_count: number | null
          content: string | null
          id: number
          images: Json | null
          post_id: number | null
        }
        Insert: {
          category?: string | null
          comment_count?: number | null
          content?: string | null
          id?: number
          images?: Json | null
          post_id?: number | null
        }
        Update: {
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
      dating_profiles: {
        Row: {
          age: number | null
          bio: string | null
          created_at: string | null
          gender: string | null
          id: number
          interests: Json | null
          is_active: boolean | null
          name: string | null
          photos: Json | null
          region: string | null
          updated_at: string | null
          user_id: number
        }
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
      jobs: {
        Row: {
          applicant_count: string | null
          company_address: string | null
          company_intro: string
          company_name: string
          company_website: string | null
          company_year: number | null
          created_at: string
          deadline: string
          employee_count: number | null
          employee_type: string
          id: number
          images: Json | null
          industry: string | null
          location_custom: string | null
          location_type: Database["public"]["Enums"]["trade_location"]
          main_task: string
          manager_email: string | null
          manager_name: string | null
          manager_phone: string | null
          manager_title: string | null
          popular_count: number | null
          post_id: number
          preferred: string | null
          salary: number
          salary_type: string | null
          work_hours: string
        }
        Insert: {
          applicant_count?: string | null
          company_address?: string | null
          company_intro: string
          company_name: string
          company_website?: string | null
          company_year?: number | null
          created_at?: string
          deadline: string
          employee_count?: number | null
          employee_type: string
          id?: number
          images?: Json | null
          industry?: string | null
          location_custom?: string | null
          location_type: Database["public"]["Enums"]["trade_location"]
          main_task: string
          manager_email?: string | null
          manager_name?: string | null
          manager_phone?: string | null
          manager_title?: string | null
          popular_count?: number | null
          post_id: number
          preferred?: string | null
          salary: number
          salary_type?: string | null
          work_hours: string
        }
        Update: {
          applicant_count?: string | null
          company_address?: string | null
          company_intro?: string
          company_name?: string
          company_website?: string | null
          company_year?: number | null
          created_at?: string
          deadline?: string
          employee_count?: number | null
          employee_type?: string
          id?: number
          images?: Json | null
          industry?: string | null
          location_custom?: string | null
          location_type?: Database["public"]["Enums"]["trade_location"]
          main_task?: string
          manager_email?: string | null
          manager_name?: string | null
          manager_phone?: string | null
          manager_title?: string | null
          popular_count?: number | null
          post_id?: number
          preferred?: string | null
          salary?: number
          salary_type?: string | null
          work_hours?: string
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
      matches: {
        Row: {
          id: number
          matched_at: string | null
          user_id_1: number | null
          user_id_2: number | null
        }
        Insert: {
          id?: number
          matched_at?: string | null
          user_id_1?: number | null
          user_id_2?: number | null
        }
        Update: {
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
      messages: {
        Row: {
          chat_id: number
          content: string
          created_at: string
          id: number
          is_read: boolean
          post_id: number | null
          sender_id: number
        }
        Insert: {
          chat_id: number
          content: string
          created_at?: string
          id?: number
          is_read?: boolean
          post_id?: number | null
          sender_id: number
        }
        Update: {
          chat_id?: number
          content?: string
          created_at?: string
          id?: number
          is_read?: boolean
          post_id?: number | null
          sender_id?: number
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
      posts: {
        Row: {
          created_at: string
          id: number
          like_count: number
          post_type: string
          status: string
          title: string
          updated_at: string | null
          user_id: number
          view_count: number
        }
        Insert: {
          created_at?: string
          id?: number
          like_count?: number
          post_type: string
          status?: string
          title: string
          updated_at?: string | null
          user_id: number
          view_count?: number
        }
        Update: {
          created_at?: string
          id?: number
          like_count?: number
          post_type?: string
          status?: string
          title?: string
          updated_at?: string | null
          user_id?: number
          view_count?: number
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
      rentals: {
        Row: {
          amenities: Json | null
          created_at: string
          deposit: number | null
          description: string | null
          id: number
          images: Json | null
          location: Database["public"]["Enums"]["trade_location"] | null
          location_detail: string | null
          max_occupants: number | null
          post_id: number | null
          price: number | null
          rent_type: string | null
          room_type: string | null
        }
        Insert: {
          amenities?: Json | null
          created_at?: string
          deposit?: number | null
          description?: string | null
          id?: number
          images?: Json | null
          location?: Database["public"]["Enums"]["trade_location"] | null
          location_detail?: string | null
          max_occupants?: number | null
          post_id?: number | null
          price?: number | null
          rent_type?: string | null
          room_type?: string | null
        }
        Update: {
          amenities?: Json | null
          created_at?: string
          deposit?: number | null
          description?: string | null
          id?: number
          images?: Json | null
          location?: Database["public"]["Enums"]["trade_location"] | null
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
      reviews: {
        Row: {
          content: string
          created_at: string
          deleted_at: string | null
          id: number
          post_id: number | null
          post_price: number | null
          post_title: string | null
          rating: number
          reviewee_id: number
          reviewer_id: number
          role: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string
          deleted_at?: string | null
          id?: number
          post_id?: number | null
          post_price?: number | null
          post_title?: string | null
          rating: number
          reviewee_id: number
          reviewer_id: number
          role: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: number
          post_id?: number | null
          post_price?: number | null
          post_title?: string | null
          rating?: number
          reviewee_id?: number
          reviewer_id?: number
          role?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      used_goods: {
        Row: {
          category: string
          condition: Database["public"]["Enums"]["product_condition"]
          content: string
          id: number
          images: Json | null
          location_custom: string | null
          location_type: Database["public"]["Enums"]["trade_location"]
          post_id: number
          price: number
          safe_payment: boolean
        }
        Insert: {
          category: string
          condition: Database["public"]["Enums"]["product_condition"]
          content: string
          id?: number
          images?: Json | null
          location_custom?: string | null
          location_type: Database["public"]["Enums"]["trade_location"]
          post_id: number
          price: number
          safe_payment?: boolean
        }
        Update: {
          category?: string
          condition?: Database["public"]["Enums"]["product_condition"]
          content?: string
          id?: number
          images?: Json | null
          location_custom?: string | null
          location_type?: Database["public"]["Enums"]["trade_location"]
          post_id?: number
          price?: number
          safe_payment?: boolean
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
      users: {
        Row: {
          alert_chat: boolean | null
          alert_comment: boolean | null
          alert_keywords: string[] | null
          alert_post: boolean | null
          auth_id: string | null
          avatar_url: string | null
          avg_rating: number | null
          created_at: string | null
          deleted_at: string | null
          email: string | null
          id: number
          interest_categories: string[] | null
          like_count: number
          name: string
          phone: string | null
          post_count: number | null
          provider: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          alert_chat?: boolean | null
          alert_comment?: boolean | null
          alert_keywords?: string[] | null
          alert_post?: boolean | null
          auth_id?: string | null
          avatar_url?: string | null
          avg_rating?: number | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: number
          interest_categories?: string[] | null
          like_count?: number
          name: string
          phone?: string | null
          post_count?: number | null
          provider?: string | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          alert_chat?: boolean | null
          alert_comment?: boolean | null
          alert_keywords?: string[] | null
          alert_post?: boolean | null
          auth_id?: string | null
          avatar_url?: string | null
          avg_rating?: number | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: number
          interest_categories?: string[] | null
          like_count?: number
          name?: string
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
      cleanup_deleted_users: { Args: never; Returns: undefined }
      get_active_users_count: {
        Args: { days: number }
        Returns: {
          count: number
        }[]
      }
      get_daily_signups: {
        Args: { days: number }
        Returns: {
          count: number
          day: string
        }[]
      }
      get_region_post_counts: {
        Args: { days: number }
        Returns: {
          count: number
          location: string
        }[]
      }
      get_reported_posts: {
        Args: { limit_count?: number }
        Returns: {
          first_reported_at: string
          latest_reason: string
          post_id: number
          post_type: string
          report_count: number
          title: string
        }[]
      }
      get_reported_users: {
        Args: { limit_count?: number }
        Returns: {
          avatar_url: string
          first_reported_at: string
          latest_reason: string
          name: string
          report_count: number
          user_id: number
        }[]
      }
      increment_view_count: { Args: { p_post_id: number }; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
      my_role: { Args: never; Returns: string }
      my_user_id: { Args: never; Returns: number }
    }
    Enums: {
      product_condition: "미개봉" | "가벼운 사용감" | "사용감 있음"
      trade_location:
        | "BGC / Taguig"
        | "Makati"
        | "Pasay / Paranaque"
        | "Quezon City"
        | "Mandaluyong / Pasig"
        | "Pampanga"
        | "그 외 지역"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

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
    Enums: {
      product_condition: ["미개봉", "가벼운 사용감", "사용감 있음"],
      trade_location: [
        "BGC / Taguig",
        "Makati",
        "Pasay / Paranaque",
        "Quezon City",
        "Mandaluyong / Pasig",
        "Pampanga",
        "그 외 지역",
      ],
    },
  },
} as const
