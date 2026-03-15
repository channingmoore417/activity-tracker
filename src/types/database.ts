export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      activity_entries: {
        Row: {
          id: string;
          user_id: string;
          metric:
            | "calls"
            | "convs"
            | "leads"
            | "credits";
          contact_name: string;
          activity_type: string;
          count: number;
          activity_date: string;
          notes: string | null;
          logged_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          metric:
            | "calls"
            | "convs"
            | "leads"
            | "credits";
          contact_name: string;
          activity_type: string;
          count?: number;
          activity_date?: string;
          notes?: string | null;
          logged_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          metric?:
            | "calls"
            | "convs"
            | "leads"
            | "credits";
          contact_name?: string;
          activity_type?: string;
          count?: number;
          activity_date?: string;
          notes?: string | null;
          logged_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      contacts: {
        Row: {
          id: string;
          user_id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string;
          contact_type: "Realtor" | "Past Client" | "Referral" | "Lead" | "Financial Advisor" | "CPA" | "Attorney";
          notes: string | null;
          activity_count: number;
          dob: string | null;
          city: string | null;
          state: string | null;
          home_anniversary: string | null;
          credit_score: number | null;
          down_payment: string | null;
          timeline: string | null;
          employment: string | null;
          income: string | null;
          realtor_name: string | null;
          realtor_id: string | null;
          military_veteran: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          first_name: string;
          last_name: string;
          email?: string;
          phone?: string;
          contact_type?: "Realtor" | "Past Client" | "Referral" | "Lead" | "Financial Advisor" | "CPA" | "Attorney";
          notes?: string | null;
          activity_count?: number;
          dob?: string | null;
          city?: string | null;
          state?: string | null;
          home_anniversary?: string | null;
          credit_score?: number | null;
          down_payment?: string | null;
          timeline?: string | null;
          employment?: string | null;
          income?: string | null;
          realtor_name?: string | null;
          realtor_id?: string | null;
          military_veteran?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string;
          contact_type?: "Realtor" | "Past Client" | "Referral" | "Lead" | "Financial Advisor" | "CPA" | "Attorney";
          notes?: string | null;
          activity_count?: number;
          dob?: string | null;
          city?: string | null;
          state?: string | null;
          home_anniversary?: string | null;
          credit_score?: number | null;
          down_payment?: string | null;
          timeline?: string | null;
          employment?: string | null;
          income?: string | null;
          realtor_name?: string | null;
          realtor_id?: string | null;
          military_veteran?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          metric:
            | "calls"
            | "convs"
            | "leads"
            | "credits";
          daily_goal: number;
          weekly_goal: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          metric:
            | "calls"
            | "convs"
            | "leads"
            | "credits";
          daily_goal?: number;
          weekly_goal?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          metric?:
            | "calls"
            | "convs"
            | "leads"
            | "credits";
          daily_goal?: number;
          weekly_goal?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          user_id: string;
          first_name: string;
          last_name: string;
          role_title: string;
          default_view: string;
          sync_hour: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          first_name: string;
          last_name: string;
          role_title?: string;
          default_view?: string;
          sync_hour?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          first_name?: string;
          last_name?: string;
          role_title?: string;
          default_view?: string;
          sync_hour?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      streaks: {
        Row: {
          user_id: string;
          current_streak: number;
          longest_streak: number;
          last_goal_date: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          current_streak?: number;
          longest_streak?: number;
          last_goal_date?: string | null;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          current_streak?: number;
          longest_streak?: number;
          last_goal_date?: string | null;
          updated_at?: string;
        };
      };
      notification_preferences: {
        Row: {
          id: string;
          user_id: string;
          email_daily_summary: boolean;
          email_goal_alerts: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email_daily_summary?: boolean;
          email_goal_alerts?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email_daily_summary?: boolean;
          email_goal_alerts?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      activity_daily_progress: {
        Row: {
          user_id: string | null;
          activity_date: string | null;
          metric:
            | "calls"
            | "convs"
            | "leads"
            | "credits"
            | null;
          total_count: number | null;
        };
      };
      activity_monthly_progress: {
        Row: {
          user_id: string | null;
          month_start: string | null;
          metric:
            | "calls"
            | "convs"
            | "leads"
            | "credits"
            | null;
          total_count: number | null;
        };
      };
    };
    Functions: Record<string, never>;
    Enums: {
      activity_metric:
        | "calls"
        | "convs"
        | "leads"
        | "credits";
    };
    CompositeTypes: Record<string, never>;
  };
};
