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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      activity_entries: {
        Row: {
          activity_date: string
          activity_type: string
          contact_name: string
          count: number
          created_at: string
          id: string
          logged_at: string
          metric: Database["public"]["Enums"]["activity_metric"]
          notes: string | null
          score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_date?: string
          activity_type: string
          contact_name: string
          count?: number
          created_at?: string
          id?: string
          logged_at?: string
          metric: Database["public"]["Enums"]["activity_metric"]
          notes?: string | null
          score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_date?: string
          activity_type?: string
          contact_name?: string
          count?: number
          created_at?: string
          id?: string
          logged_at?: string
          metric?: Database["public"]["Enums"]["activity_metric"]
          notes?: string | null
          score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          activity_count: number
          city: string | null
          contact_type: string
          created_at: string
          credit_score: number | null
          dob: string | null
          down_payment: string | null
          email: string | null
          employment: string | null
          first_name: string
          home_anniversary: string | null
          id: string
          income: string | null
          last_name: string
          military_veteran: boolean | null
          notes: string | null
          phone: string | null
          realtor_id: string | null
          realtor_name: string | null
          state: string | null
          timeline: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_count?: number
          city?: string | null
          contact_type: string
          created_at?: string
          credit_score?: number | null
          dob?: string | null
          down_payment?: string | null
          email?: string | null
          employment?: string | null
          first_name: string
          home_anniversary?: string | null
          id?: string
          income?: string | null
          last_name: string
          military_veteran?: boolean | null
          notes?: string | null
          phone?: string | null
          realtor_id?: string | null
          realtor_name?: string | null
          state?: string | null
          timeline?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_count?: number
          city?: string | null
          contact_type?: string
          created_at?: string
          credit_score?: number | null
          dob?: string | null
          down_payment?: string | null
          email?: string | null
          employment?: string | null
          first_name?: string
          home_anniversary?: string | null
          id?: string
          income?: string | null
          last_name?: string
          military_veteran?: boolean | null
          notes?: string | null
          phone?: string | null
          realtor_id?: string | null
          realtor_name?: string | null
          state?: string | null
          timeline?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          created_at: string
          daily_goal: number
          id: string
          metric: Database["public"]["Enums"]["activity_metric"]
          updated_at: string
          user_id: string
          weekly_goal: number
        }
        Insert: {
          created_at?: string
          daily_goal?: number
          id?: string
          metric: Database["public"]["Enums"]["activity_metric"]
          updated_at?: string
          user_id: string
          weekly_goal?: number
        }
        Update: {
          created_at?: string
          daily_goal?: number
          id?: string
          metric?: Database["public"]["Enums"]["activity_metric"]
          updated_at?: string
          user_id?: string
          weekly_goal?: number
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_daily_summary: boolean
          email_goal_alerts: boolean
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_daily_summary?: boolean
          email_goal_alerts?: boolean
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_daily_summary?: boolean
          email_goal_alerts?: boolean
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          default_view: string
          first_name: string | null
          last_name: string | null
          role_title: string
          sync_hour: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_view?: string
          first_name?: string | null
          last_name?: string | null
          role_title?: string
          sync_hour?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_view?: string
          first_name?: string | null
          last_name?: string | null
          role_title?: string
          sync_hour?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      streaks: {
        Row: {
          best_day_score: number
          current_streak: number
          history: Json
          last_goal_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          best_day_score?: number
          current_streak?: number
          history?: Json
          last_goal_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          best_day_score?: number
          current_streak?: number
          history?: Json
          last_goal_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      activity_daily_progress: {
        Row: {
          activity_date: string | null
          metric: Database["public"]["Enums"]["activity_metric"] | null
          total_count: number | null
          user_id: string | null
        }
        Relationships: []
      }
      activity_monthly_progress: {
        Row: {
          metric: Database["public"]["Enums"]["activity_metric"] | null
          month_start: string | null
          total_count: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      activity_metric: "calls" | "convs" | "leads" | "credits"
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
      activity_metric: ["calls", "convs", "leads", "credits"],
    },
  },
} as const
