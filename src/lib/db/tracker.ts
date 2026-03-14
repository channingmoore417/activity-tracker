import { cache } from "react";
import { redirect } from "next/navigation";
import { endOfMonth, format, startOfMonth, subDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import {
  metricCatalog,
  metricKeys,
  type MetricKey,
} from "@/lib/tracker-data";
import type { Database } from "@/types/database";

type ActivityEntryRow = Database["public"]["Tables"]["activity_entries"]["Row"];
type GoalRow = Database["public"]["Tables"]["goals"]["Row"];

export type TrackerProfile = {
  email: string;
  fullName: string;
  roleTitle: string;
  defaultView: string;
  syncHour: number;
  initials: string;
};

export type TrackerMetric = {
  key: MetricKey;
  label: string;
  color: string;
  icon: (typeof metricCatalog)[number]["icon"];
  dailyGoal: number;
  weeklyGoal: number;
  todayCount: number;
  monthCount: number;
  bars: number[];
};

export type TrackerActivityEntry = {
  id: string;
  metric: MetricKey;
  name: string;
  type: string;
  count: number;
  time: string;
  date: string;
  notes: string | null;
};

export type DashboardData = {
  profile: TrackerProfile;
  metrics: TrackerMetric[];
  totalToday: number;
  totalDailyGoal: number;
};

export type ActivityPageData = {
  profile: TrackerProfile;
  metrics: TrackerMetric[];
  entries: TrackerActivityEntry[];
  filters: {
    search: string;
    metric: string;
    activityType: string;
  };
};

export type ProgressPageData = {
  profile: TrackerProfile;
  metrics: TrackerMetric[];
  summaryCards: {
    label: string;
    value: string;
    badge: string;
    tone: "blue" | "green" | "yellow" | "red";
  }[];
  paceMessage: string;
  heatmap: { day: number; total: number; color: string }[];
};

export type SettingsPageData = {
  profile: TrackerProfile;
  metrics: TrackerMetric[];
};

export type TrackerFlash = {
  status: "success" | "error";
  message: string;
} | null;

function deriveNameFromEmail(email: string) {
  const username = email.split("@")[0] ?? "User";
  return username
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getSafeDisplayName(name: string | null | undefined, email: string) {
  const trimmedName = name?.trim();

  if (trimmedName) {
    return trimmedName;
  }

  return deriveNameFromEmail(email);
}

function getSafeRoleTitle(roleTitle: string | null | undefined) {
  const trimmedRoleTitle = roleTitle?.trim();

  return trimmedRoleTitle || "Loan Officer";
}

function getSafeDefaultView(defaultView: string | null | undefined) {
  const trimmedDefaultView = defaultView?.trim();

  return trimmedDefaultView || "dashboard";
}

function getSafeSyncHour(syncHour: number | null | undefined) {
  return typeof syncHour === "number" && syncHour >= 0 && syncHour <= 23 ? syncHour : 18;
}

function getInitials(name: string | null | undefined, email?: string) {
  const safeName = name?.trim() || (email ? deriveNameFromEmail(email) : "Bayou Mortgage");
  const parts = safeName.split(" ").filter(Boolean).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "BM";
}

async function getAuthedContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id || !user.email) {
    redirect("/login");
  }

  return { supabase, user };
}

async function ensureProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: { id: string; email: string; user_metadata?: Record<string, unknown> },
) {
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (existingProfile) {
    return existingProfile;
  }

  const metadataFullName =
    typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null;
  const fullName = getSafeDisplayName(metadataFullName, user.email);

  const { data: createdProfile, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        full_name: fullName,
        role_title: "Loan Officer",
        default_view: "dashboard",
        sync_hour: 18,
      },
      { onConflict: "id" },
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return createdProfile;
}

async function ensureGoals(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { data: existingGoals, error } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  const existingMetricSet = new Set((existingGoals ?? []).map((goal) => goal.metric));
  const missingGoals = metricCatalog
    .filter((metric) => !existingMetricSet.has(metric.key))
    .map((metric) => ({
      user_id: userId,
      metric: metric.key,
      daily_goal: metric.defaultDailyGoal,
      weekly_goal: metric.defaultWeeklyGoal,
    }));

  if (missingGoals.length > 0) {
    const { error: insertError } = await supabase.from("goals").insert(missingGoals);

    if (insertError) {
      throw insertError;
    }
  }

  const { data: finalGoals, error: finalError } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId);

  if (finalError) {
    throw finalError;
  }

  return finalGoals ?? [];
}

async function getProfileAndGoals() {
  const { supabase, user } = await getAuthedContext();
  const profileRow = await ensureProfile(supabase, user);
  const goalRows = await ensureGoals(supabase, user.id);

  return {
    supabase,
    userId: user.id,
    profile: {
      email: user.email,
      fullName: getSafeDisplayName(profileRow.full_name, user.email),
      roleTitle: getSafeRoleTitle(profileRow.role_title),
      defaultView: getSafeDefaultView(profileRow.default_view),
      syncHour: getSafeSyncHour(profileRow.sync_hour),
      initials: getInitials(profileRow.full_name, user.email),
    } satisfies TrackerProfile,
    goalRows,
  };
}

function mapEntries(entries: ActivityEntryRow[]): TrackerActivityEntry[] {
  return entries.map((entry) => ({
    id: entry.id,
    metric: entry.metric,
    name: entry.contact_name,
    type: entry.activity_type,
    count: entry.count,
    time: format(new Date(entry.logged_at), "h:mm a"),
    date: entry.activity_date,
    notes: entry.notes,
  }));
}

function buildMetricData(goals: GoalRow[], entries: ActivityEntryRow[]) {
  const today = format(new Date(), "yyyy-MM-dd");
  const lastSevenDays = Array.from({ length: 7 }, (_, index) =>
    format(subDays(new Date(), 6 - index), "yyyy-MM-dd"),
  );

  return metricCatalog.map((metric) => {
    const goal = goals.find((item) => item.metric === metric.key);
    const todayCount = entries
      .filter((entry) => entry.metric === metric.key && entry.activity_date === today)
      .reduce((sum, entry) => sum + entry.count, 0);
    const monthCount = entries
      .filter((entry) => entry.metric === metric.key)
      .reduce((sum, entry) => sum + entry.count, 0);

    return {
      key: metric.key,
      label: metric.label,
      color: metric.color,
      icon: metric.icon,
      dailyGoal: goal?.daily_goal ?? metric.defaultDailyGoal,
      weeklyGoal: goal?.weekly_goal ?? metric.defaultWeeklyGoal,
      todayCount,
      monthCount,
      bars: lastSevenDays.map((day) =>
        entries
          .filter((entry) => entry.metric === metric.key && entry.activity_date === day)
          .reduce((sum, entry) => sum + entry.count, 0),
      ),
    } satisfies TrackerMetric;
  });
}

function buildSummaryCards(metrics: TrackerMetric[], entryCount: number) {
  const monthlyTotal = metrics.reduce((sum, metric) => sum + metric.monthCount, 0);
  const monthlyGoal = metrics.reduce((sum, metric) => sum + metric.dailyGoal, 0) * 20;
  const hitRate = monthlyGoal === 0 ? 0 : Math.round((monthlyTotal / monthlyGoal) * 100);
  const paceGap = Math.max(monthlyGoal - monthlyTotal, 0);
  const streak = metrics.filter((metric) => metric.todayCount >= metric.dailyGoal).length;

  return [
    { label: "Month Score", value: String(monthlyTotal), badge: "Live", tone: "blue" as const },
    {
      label: "Goal Hit Rate",
      value: `${hitRate}%`,
      badge: hitRate >= 100 ? "Ahead" : "Working",
      tone: hitRate >= 100 ? "green" : "yellow",
    },
    { label: "Best Streak", value: String(streak), badge: "today", tone: "yellow" as const },
    { label: "Pace Gap", value: String(paceGap), badge: "to goal", tone: "red" as const },
    {
      label: "Logged Entries",
      value: String(entryCount),
      badge: "this month",
      tone: "blue" as const,
    },
  ];
}

export const getDashboardPageData = cache(async (): Promise<DashboardData> => {
  const { supabase, userId, profile, goalRows } = await getProfileAndGoals();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: entries, error } = await supabase
    .from("activity_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("activity_date", today);

  if (error) {
    throw error;
  }

  const metrics = buildMetricData(goalRows, entries ?? []);

  return {
    profile,
    metrics,
    totalToday: metrics.reduce((sum, metric) => sum + metric.todayCount, 0),
    totalDailyGoal: metrics.reduce((sum, metric) => sum + metric.dailyGoal, 0),
  };
});

export async function getActivityPageData(filters: {
  search?: string;
  metric?: string;
  activityType?: string;
}): Promise<ActivityPageData> {
  const { supabase, userId, profile, goalRows } = await getProfileAndGoals();
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

  let query = supabase
    .from("activity_entries")
    .select("*")
    .eq("user_id", userId)
    .gte("activity_date", monthStart)
    .lte("activity_date", monthEnd)
    .order("logged_at", { ascending: false });

  if (filters.search) {
    query = query.ilike("contact_name", `%${filters.search}%`);
  }

  if (filters.metric && metricKeys.includes(filters.metric as MetricKey)) {
    query = query.eq("metric", filters.metric as MetricKey);
  }

  if (filters.activityType) {
    query = query.eq("activity_type", filters.activityType);
  }

  const { data: filteredEntries, error } = await query.limit(100);

  if (error) {
    throw error;
  }

  const { data: monthEntries, error: monthError } = await supabase
    .from("activity_entries")
    .select("*")
    .eq("user_id", userId)
    .gte("activity_date", monthStart)
    .lte("activity_date", monthEnd);

  if (monthError) {
    throw monthError;
  }

  return {
    profile,
    metrics: buildMetricData(goalRows, monthEntries ?? []),
    entries: mapEntries(filteredEntries ?? []),
    filters: {
      search: filters.search ?? "",
      metric: filters.metric ?? "",
      activityType: filters.activityType ?? "",
    },
  };
}

export async function getProgressPageData(): Promise<ProgressPageData> {
  const { supabase, userId, profile, goalRows } = await getProfileAndGoals();
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

  const { data: entries, error } = await supabase
    .from("activity_entries")
    .select("*")
    .eq("user_id", userId)
    .gte("activity_date", monthStart)
    .lte("activity_date", monthEnd);

  if (error) {
    throw error;
  }

  const metrics = buildMetricData(goalRows, entries ?? []);
  const totalMonth = metrics.reduce((sum, metric) => sum + metric.monthCount, 0);
  const totalGoalPace = metrics.reduce((sum, metric) => sum + metric.dailyGoal, 0) * 10;

  return {
    profile,
    metrics,
    summaryCards: buildSummaryCards(metrics, entries?.length ?? 0),
    paceMessage:
      totalMonth >= totalGoalPace
        ? "You are ahead of pace this month based on your saved activity."
        : "You are slightly behind pace this month. Focus on the lowest goal percentages first.",
    heatmap: Array.from({ length: endOfMonth(new Date()).getDate() }, (_, index) => index + 1).map(
      (day) => {
        const dayKey = format(
          new Date(new Date().getFullYear(), new Date().getMonth(), day),
          "yyyy-MM-dd",
        );
        const total = (entries ?? [])
          .filter((entry) => entry.activity_date === dayKey)
          .reduce((sum, entry) => sum + entry.count, 0);

        return {
          day,
          total,
          color:
            total === 0 ? "#d3e4ef" : total < 5 ? "#8bd2f3" : total < 12 ? "#3aabf0" : "#172852",
        };
      },
    ),
  };
}

export async function getSettingsPageData(): Promise<SettingsPageData> {
  const { supabase, userId, profile, goalRows } = await getProfileAndGoals();
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

  const { data: entries, error } = await supabase
    .from("activity_entries")
    .select("*")
    .eq("user_id", userId)
    .gte("activity_date", monthStart)
    .lte("activity_date", monthEnd);

  if (error) {
    throw error;
  }

  return {
    profile,
    metrics: buildMetricData(goalRows, entries ?? []),
  };
}

export function getFlashMessage(params: Record<string, string | undefined>): TrackerFlash {
  if (params.saved === "activity") {
    return { status: "success", message: "Activity saved to Supabase." };
  }

  if (params.saved === "settings") {
    return { status: "success", message: "Settings saved to Supabase." };
  }

  if (params.error === "validation") {
    return { status: "error", message: "Please fix the submitted form values and try again." };
  }

  return null;
}
