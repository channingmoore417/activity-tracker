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
            | "leads"
            | "convs"
            | "appts"
            | "apps"
            | "locked"
            | "past"
            | "followups";
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
            | "leads"
            | "convs"
            | "appts"
            | "apps"
            | "locked"
            | "past"
            | "followups";
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
            | "leads"
            | "convs"
            | "appts"
            | "apps"
            | "locked"
            | "past"
            | "followups";
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
      goals: {
        Row: {
          id: string;
          user_id: string;
          metric:
            | "calls"
            | "leads"
            | "convs"
            | "appts"
            | "apps"
            | "locked"
            | "past"
            | "followups";
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
            | "leads"
            | "convs"
            | "appts"
            | "apps"
            | "locked"
            | "past"
            | "followups";
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
            | "leads"
            | "convs"
            | "appts"
            | "apps"
            | "locked"
            | "past"
            | "followups";
          daily_goal?: number;
          weekly_goal?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role_title: string;
          default_view: string;
          sync_hour: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          role_title?: string;
          default_view?: string;
          sync_hour?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          role_title?: string;
          default_view?: string;
          sync_hour?: number;
          created_at?: string;
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
            | "leads"
            | "convs"
            | "appts"
            | "apps"
            | "locked"
            | "past"
            | "followups"
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
            | "leads"
            | "convs"
            | "appts"
            | "apps"
            | "locked"
            | "past"
            | "followups"
            | null;
          total_count: number | null;
        };
      };
    };
    Functions: Record<string, never>;
    Enums: {
      activity_metric:
        | "calls"
        | "leads"
        | "convs"
        | "appts"
        | "apps"
        | "locked"
        | "past"
        | "followups";
    };
    CompositeTypes: Record<string, never>;
  };
};
