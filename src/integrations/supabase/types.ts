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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          requirement_type: string
          requirement_value: number
          xp_reward: number
        }
        Insert: {
          created_at?: string
          description: string
          icon: string
          id?: string
          name: string
          requirement_type: string
          requirement_value: number
          xp_reward?: number
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          requirement_type?: string
          requirement_value?: number
          xp_reward?: number
        }
        Relationships: []
      }
      content_reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          reason: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          short_id: string
          status: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          short_id: string
          status?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          short_id?: string
          status?: string
        }
        Relationships: []
      }
      daily_goals: {
        Row: {
          completed: boolean
          created_at: string
          date: string
          goal_type: string
          id: string
          progress: number
          subject: string | null
          target: number
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          date?: string
          goal_type: string
          id?: string
          progress?: number
          subject?: string | null
          target?: number
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          date?: string
          goal_type?: string
          id?: string
          progress?: number
          subject?: string | null
          target?: number
          user_id?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      group_invites: {
        Row: {
          created_at: string
          group_id: string
          id: string
          invitee_id: string
          inviter_id: string
          status: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          invitee_id: string
          inviter_id: string
          status?: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          invitee_id?: string
          inviter_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_invites_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          avatar_url: string | null
          created_at: string
          description: string | null
          id: string
          is_private: boolean
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_private?: boolean
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_private?: boolean
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          id: string
          short_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          short_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          short_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_short_id_fkey"
            columns: ["short_id"]
            isOneToOne: false
            referencedRelation: "shorts"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      moderation_logs: {
        Row: {
          classification: string
          confidence: string | null
          created_at: string
          id: string
          raw_response: string | null
          short_id: string
        }
        Insert: {
          classification: string
          confidence?: string | null
          created_at?: string
          id?: string
          raw_response?: string | null
          short_id: string
        }
        Update: {
          classification?: string
          confidence?: string | null
          created_at?: string
          id?: string
          raw_response?: string | null
          short_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_logs_short_id_fkey"
            columns: ["short_id"]
            isOneToOne: false
            referencedRelation: "shorts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          accessibility_settings: Json | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          daily_goal_target: number | null
          id: string
          interests: string[] | null
          last_activity_date: string | null
          streak: number
          theme_animation: string | null
          theme_background: string | null
          updated_at: string
          username: string | null
          xp: number
        }
        Insert: {
          accessibility_settings?: Json | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          daily_goal_target?: number | null
          id: string
          interests?: string[] | null
          last_activity_date?: string | null
          streak?: number
          theme_animation?: string | null
          theme_background?: string | null
          updated_at?: string
          username?: string | null
          xp?: number
        }
        Update: {
          accessibility_settings?: Json | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          daily_goal_target?: number | null
          id?: string
          interests?: string[] | null
          last_activity_date?: string | null
          streak?: number
          theme_animation?: string | null
          theme_background?: string | null
          updated_at?: string
          username?: string | null
          xp?: number
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean
          quiz_id: string
          selected_answer: number
          user_id: string
          xp_earned: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct: boolean
          quiz_id: string
          selected_answer: number
          user_id: string
          xp_earned?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean
          quiz_id?: string
          selected_answer?: number
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          correct_answer: number
          created_at: string
          id: string
          options: Json
          question: string
          short_id: string
          xp_reward: number
        }
        Insert: {
          correct_answer: number
          created_at?: string
          id?: string
          options: Json
          question: string
          short_id: string
          xp_reward?: number
        }
        Update: {
          correct_answer?: number
          created_at?: string
          id?: string
          options?: Json
          question?: string
          short_id?: string
          xp_reward?: number
        }
        Relationships: []
      }
      reposts: {
        Row: {
          created_at: string
          group_id: string | null
          id: string
          message: string | null
          recipient_id: string | null
          sender_id: string
          short_id: string
        }
        Insert: {
          created_at?: string
          group_id?: string | null
          id?: string
          message?: string | null
          recipient_id?: string | null
          sender_id: string
          short_id: string
        }
        Update: {
          created_at?: string
          group_id?: string | null
          id?: string
          message?: string | null
          recipient_id?: string | null
          sender_id?: string
          short_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reposts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      short_views: {
        Row: {
          created_at: string
          id: string
          short_id: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          created_at?: string
          id?: string
          short_id: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          created_at?: string
          id?: string
          short_id?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "short_views_short_id_fkey"
            columns: ["short_id"]
            isOneToOne: false
            referencedRelation: "shorts"
            referencedColumns: ["id"]
          },
        ]
      }
      shorts: {
        Row: {
          ai_summary: string | null
          category: string
          created_at: string
          description: string | null
          difficulty_level: string | null
          id: string
          is_approved: boolean
          is_educational: boolean | null
          likes_count: number
          moderated_at: string | null
          moderation_result: string | null
          moderation_status: string | null
          subtopic: string | null
          thumbnail_url: string | null
          title: string
          topics: string[] | null
          transcript: string | null
          user_id: string
          video_url: string
          views_count: number
        }
        Insert: {
          ai_summary?: string | null
          category: string
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          id?: string
          is_approved?: boolean
          is_educational?: boolean | null
          likes_count?: number
          moderated_at?: string | null
          moderation_result?: string | null
          moderation_status?: string | null
          subtopic?: string | null
          thumbnail_url?: string | null
          title: string
          topics?: string[] | null
          transcript?: string | null
          user_id: string
          video_url: string
          views_count?: number
        }
        Update: {
          ai_summary?: string | null
          category?: string
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          id?: string
          is_approved?: boolean
          is_educational?: boolean | null
          likes_count?: number
          moderated_at?: string | null
          moderation_result?: string | null
          moderation_status?: string | null
          subtopic?: string | null
          thumbnail_url?: string | null
          title?: string
          topics?: string[] | null
          transcript?: string | null
          user_id?: string
          video_url?: string
          views_count?: number
        }
        Relationships: []
      }
      topic_quiz_progress: {
        Row: {
          created_at: string
          id: string
          last_quiz_at: string | null
          topic: string
          updated_at: string
          user_id: string
          videos_watched: number
        }
        Insert: {
          created_at?: string
          id?: string
          last_quiz_at?: string | null
          topic: string
          updated_at?: string
          user_id: string
          videos_watched?: number
        }
        Update: {
          created_at?: string
          id?: string
          last_quiz_at?: string | null
          topic?: string
          updated_at?: string
          user_id?: string
          videos_watched?: number
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subject_progress: {
        Row: {
          avg_score: number | null
          created_at: string
          id: string
          quizzes_attempted: number
          quizzes_passed: number
          subject: string
          total_score: number
          updated_at: string
          user_id: string
          videos_watched: number
        }
        Insert: {
          avg_score?: number | null
          created_at?: string
          id?: string
          quizzes_attempted?: number
          quizzes_passed?: number
          subject: string
          total_score?: number
          updated_at?: string
          user_id: string
          videos_watched?: number
        }
        Update: {
          avg_score?: number | null
          created_at?: string
          id?: string
          quizzes_attempted?: number
          quizzes_passed?: number
          subject?: string
          total_score?: number
          updated_at?: string
          user_id?: string
          videos_watched?: number
        }
        Relationships: []
      }
      user_video_progress: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          last_position: number
          short_id: string
          time_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          last_position?: number
          short_id: string
          time_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          last_position?: number
          short_id?: string
          time_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_video_progress_short_id_fkey"
            columns: ["short_id"]
            isOneToOne: false
            referencedRelation: "shorts"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          reference_id: string | null
          source: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          reference_id?: string | null
          source: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          reference_id?: string | null
          source?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      are_friends: {
        Args: { user_id_1: string; user_id_2: string }
        Returns: boolean
      }
      award_xp: {
        Args: {
          p_amount: number
          p_reference_id?: string
          p_source: string
          p_user_id: string
        }
        Returns: boolean
      }
      get_follower_count: { Args: { p_user_id: string }; Returns: number }
      get_following_count: { Args: { p_user_id: string }; Returns: number }
      get_public_profile: {
        Args: { p_user_id: string }
        Returns: {
          avatar_url: string
          bio: string
          id: string
          streak: number
          username: string
          xp: number
        }[]
      }
      get_public_profiles: {
        Args: { p_user_ids: string[] }
        Returns: {
          avatar_url: string
          bio: string
          id: string
          streak: number
          username: string
          xp: number
        }[]
      }
      get_quiz_for_short: {
        Args: { p_short_id: string }
        Returns: {
          created_at: string
          id: string
          options: Json
          question: string
          short_id: string
          xp_reward: number
        }[]
      }
      get_quiz_public: {
        Args: { p_quiz_id: string }
        Returns: {
          created_at: string
          id: string
          options: Json
          question: string
          short_id: string
          xp_reward: number
        }[]
      }
      get_starter_feed: {
        Args: { p_limit?: number }
        Returns: {
          ai_summary: string
          category: string
          created_at: string
          description: string
          difficulty_level: string
          id: string
          likes_count: number
          thumbnail_url: string
          title: string
          topics: string[]
          video_url: string
          views_count: number
        }[]
      }
      get_user_video_count: { Args: { p_user_id: string }; Returns: number }
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
      is_following: {
        Args: { p_follower_id: string; p_following_id: string }
        Returns: boolean
      }
      is_new_user: { Args: { p_user_id: string }; Returns: boolean }
      record_topic_video_view: {
        Args: { p_topic: string; p_user_id: string }
        Returns: Json
      }
      search_users_by_username: {
        Args: { search_query: string }
        Returns: {
          avatar_url: string
          id: string
          username: string
        }[]
      }
      submit_quiz_answer: {
        Args: { p_quiz_id: string; p_selected_answer: number }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
