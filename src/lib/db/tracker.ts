import { cache } from "react";
import { redirect } from "next/navigation";
import { endOfMonth, endOfWeek, format, startOfMonth, startOfWeek, subDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import {
  metricCatalog,
  metricKeys,
  type MetricKey,
} from "@/lib/tracker-data";
import type { Database } from "@/types/supabase";
import type { StreakHistory } from "@/lib/db/tracker-actions";

type ActivityEntryRow = Database["public"]["Tables"]["activity_entries"]["Row"];
type GoalRow = Database["public"]["Tables"]["goals"]["Row"];

export type TrackerProfile = {
  email: string;
  firstName: string;
  lastName: string;
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
  weekCount: number;
  monthCount: number;
  bars: number[];
};

export type TrackerActivityEntry = {
  id: string;
  metric: MetricKey;
  name: string;
  type: string;
  count: number;
  score: number;
  time: string;
  date: string;
  notes: string | null;
};

export type StreakData = {
  currentStreak: number;
  longestStreak: number;
  bestDayScore: number;
  history: StreakHistory;
};

export type DashboardData = {
  profile: TrackerProfile;
  metrics: TrackerMetric[];
  totalToday: number;
  totalDailyGoal: number;
  dailyScore: number;
  streak: StreakData;
};

export type ActivityPageData = {
  profile: TrackerProfile;
  metrics: TrackerMetric[];
  entries: TrackerActivityEntry[];
  activityTypes: string[];
  dailyScore: number;
  streak: StreakData;
  filters: {
    search: string;
    metric: string;
    activityType: string;
    sort: string;
  };
};

export type ProgressMetricData = {
  key: MetricKey;
  label: string;
  color: string;
  icon: (typeof metricCatalog)[number]["icon"];
  monthGoal: number;
  monthCount: number;
  monthPct: number;
  dailyAvg: number;
  bestDay: number;
  dailyBreakdown: (number | null)[];
  dailyGoal: number;
};

export type ProgressPageData = {
  profile: TrackerProfile;
  metrics: TrackerMetric[];
  dailyScore: number;
  streak: StreakData;
  summary: {
    totalActivities: number;
    goalCompletionPct: number;
    daysActive: number;
    daysInMonth: number;
    bestDayCount: number;
    bestDayNum: number;
    paceStatus: "ahead" | "on-track" | "behind";
    expectedPct: number;
    monthName: string;
  };
  paceAlert: {
    status: "ahead" | "on-track" | "behind";
    title: string;
    detail: string;
  } | null;
  metricProgress: ProgressMetricData[];
  heatmap: { day: number; total: number; isPast: boolean }[];
  month: string;
  isCurrentMonth: boolean;
  entries: TrackerActivityEntry[];
};

export type ContactRecord = {
  id: string;
  firstName: string;
  lastName: string;
  contactType: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  activityCount: number;
  createdAt: string;
};

export type ContactsPageData = {
  profile: TrackerProfile;
  metrics: TrackerMetric[];
  dailyScore: number;
  streak: StreakData;
  contacts: ContactRecord[];
  typeCounts: Record<string, number>;
  totalCount: number;
  filters: { search: string; type: string };
};

export type SettingsPageData = {
  profile: TrackerProfile;
  metrics: TrackerMetric[];
  dailyScore: number;
  streak: StreakData;
};

export type TrackerFlash = {
  status: "success" | "error";
  message: string;
} | null;

function deriveFirstNameFromEmail(email: string) {
  const username = email.split("@")[0] ?? "User";
  const parts = username.split(/[._-]/).filter(Boolean);
  return parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : "User";
}

function getSafeString(value: string | null | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed || fallback;
}

function getSafeDefaultView(defaultView: string | null | undefined) {
  const trimmed = defaultView?.trim();
  return trimmed || "dashboard";
}

function getSafeSyncHour(syncHour: number | null | undefined) {
  return typeof syncHour === "number" && syncHour >= 0 && syncHour <= 23 ? syncHour : 18;
}

function getInitials(firstName: string | null | undefined, lastName: string | null | undefined) {
  const f = firstName?.trim()?.[0]?.toUpperCase() ?? "";
  const l = lastName?.trim()?.[0]?.toUpperCase() ?? "";
  return (f + l) || "BM";
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
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingProfile) {
    return existingProfile;
  }

  let metaFirst =
    typeof user.user_metadata?.first_name === "string" ? user.user_metadata.first_name : null;
  let metaLast =
    typeof user.user_metadata?.last_name === "string" ? user.user_metadata.last_name : null;

  // Fallback: try 'name' or 'full_name' from auth metadata (common in OAuth providers)
  if (!metaFirst && !metaLast) {
    const fullName =
      typeof user.user_metadata?.name === "string" ? user.user_metadata.name :
      typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null;
    if (fullName) {
      const parts = fullName.trim().split(/\s+/);
      metaFirst = parts[0] || null;
      metaLast = parts.length > 1 ? parts.slice(1).join(" ") : null;
    }
  }

  const firstName = getSafeString(metaFirst, deriveFirstNameFromEmail(user.email));
  const lastName = getSafeString(metaLast, "");

  const { data: createdProfile, error } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        role_title: "Loan Officer",
        default_view: "dashboard",
        sync_hour: 18,
      },
      { onConflict: "user_id" },
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
  const profileRow = await ensureProfile(supabase, { id: user.id, email: user.email!, user_metadata: user.user_metadata as Record<string, unknown> });
  const goalRows = await ensureGoals(supabase, user.id);

  const { data: streakRow } = await supabase
    .from("streaks")
    .select("current_streak, longest_streak, best_day_score, history")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    supabase,
    userId: user.id,
    profile: {
      email: user.email!,
      firstName: getSafeString(profileRow.first_name, deriveFirstNameFromEmail(user.email!)),
      lastName: getSafeString(profileRow.last_name, ""),
      roleTitle: getSafeString(profileRow.role_title, "Loan Officer"),
      defaultView: getSafeDefaultView(profileRow.default_view),
      syncHour: getSafeSyncHour(profileRow.sync_hour),
      initials: getInitials(profileRow.first_name, profileRow.last_name),
    } satisfies TrackerProfile,
    goalRows,
    streak: {
      currentStreak: streakRow?.current_streak ?? 0,
      longestStreak: streakRow?.longest_streak ?? 0,
      bestDayScore: streakRow?.best_day_score ?? 0,
      history: (streakRow?.history as StreakHistory) ?? {},
    } satisfies StreakData,
  };
}

function mapEntries(entries: ActivityEntryRow[]): TrackerActivityEntry[] {
  return entries.map((entry) => ({
    id: entry.id,
    metric: entry.metric,
    name: entry.contact_name,
    type: entry.activity_type,
    count: entry.count,
    score: entry.score ?? 0,
    time: format(new Date(entry.logged_at), "h:mm a"),
    date: entry.activity_date,
    notes: entry.notes,
  }));
}

function buildMetricData(
  goals: GoalRow[],
  entries: ActivityEntryRow[],
  weekRange?: { start: string; end: string },
) {
  const today = format(new Date(), "yyyy-MM-dd");
  const lastSevenDays = Array.from({ length: 7 }, (_, index) =>
    format(subDays(new Date(), 6 - index), "yyyy-MM-dd"),
  );

  return metricCatalog.map((metric) => {
    const goal = goals.find((item) => item.metric === metric.key);
    const metricEntries = entries.filter((entry) => entry.metric === metric.key);
    const todayCount = metricEntries
      .filter((entry) => entry.activity_date === today)
      .reduce((sum, entry) => sum + entry.count, 0);
    const weekCount = weekRange
      ? metricEntries
          .filter((entry) => entry.activity_date >= weekRange.start && entry.activity_date <= weekRange.end)
          .reduce((sum, entry) => sum + entry.count, 0)
      : 0;
    const monthCount = metricEntries
      .reduce((sum, entry) => sum + entry.count, 0);

    return {
      key: metric.key,
      label: metric.label,
      color: metric.color,
      icon: metric.icon,
      dailyGoal: goal?.daily_goal ?? metric.defaultDailyGoal,
      weeklyGoal: goal?.weekly_goal ?? metric.defaultWeeklyGoal,
      todayCount,
      weekCount,
      monthCount,
      bars: lastSevenDays.map((day) =>
        metricEntries
          .filter((entry) => entry.activity_date === day)
          .reduce((sum, entry) => sum + entry.count, 0),
      ),
    } satisfies TrackerMetric;
  });
}

/* buildSummaryCards removed — summary data is now computed inline in getProgressPageData */

export const getDashboardPageData = cache(async (): Promise<DashboardData> => {
  const { supabase, userId, profile, goalRows, streak } = await getProfileAndGoals();
  const now = new Date();
  const today = format(now, "yyyy-MM-dd");
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");

  const { data: entries, error } = await supabase
    .from("activity_entries")
    .select("*")
    .eq("user_id", userId)
    .gte("activity_date", weekStart)
    .lte("activity_date", weekEnd);

  if (error) {
    throw error;
  }

  const metrics = buildMetricData(goalRows, entries ?? [], { start: weekStart, end: weekEnd });
  const dailyScore = (entries ?? [])
    .filter((entry) => entry.activity_date === today)
    .reduce((sum, entry) => sum + (entry.score ?? 0), 0);

  return {
    profile,
    metrics,
    totalToday: metrics.reduce((sum, metric) => sum + metric.todayCount, 0),
    totalDailyGoal: metrics.reduce((sum, metric) => sum + metric.dailyGoal, 0),
    dailyScore,
    streak,
  };
});

export async function getActivityPageData(filters: {
  search?: string;
  metric?: string;
  activityType?: string;
  sort?: string;
}): Promise<ActivityPageData> {
  const { supabase, userId, profile, goalRows, streak } = await getProfileAndGoals();
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

  let query = supabase
    .from("activity_entries")
    .select("*")
    .eq("user_id", userId)
    .gte("activity_date", monthStart)
    .lte("activity_date", monthEnd);

  if (filters.sort === "metric") {
    query = query.order("metric").order("logged_at", { ascending: false });
  } else {
    query = query.order("logged_at", { ascending: false });
  }

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

  const today = format(new Date(), "yyyy-MM-dd");
  const dailyScore = (monthEntries ?? [])
    .filter((entry) => entry.activity_date === today)
    .reduce((sum, entry) => sum + (entry.score ?? 0), 0);

  const activityTypes = [...new Set((monthEntries ?? []).map((e) => e.activity_type).filter(Boolean))].sort();

  return {
    profile,
    metrics: buildMetricData(goalRows, monthEntries ?? []),
    entries: mapEntries(filteredEntries ?? []),
    activityTypes,
    dailyScore,
    streak,
    filters: {
      search: filters.search ?? "",
      metric: filters.metric ?? "",
      activityType: filters.activityType ?? "",
      sort: filters.sort === "metric" ? "metric" : "recent",
    },
  };
}

export async function getProgressPageData(monthParam?: string): Promise<ProgressPageData> {
  const { supabase, userId, profile, goalRows, streak } = await getProfileAndGoals();
  const now = new Date();

  // Parse optional month param (format "YYYY-MM"), capped to current month
  let targetDate: Date;
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    targetDate = new Date(y, m - 1, 1);
    if (targetDate > startOfMonth(now)) {
      targetDate = startOfMonth(now);
    }
  } else {
    targetDate = startOfMonth(now);
  }

  const monthStart = format(startOfMonth(targetDate), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(targetDate), "yyyy-MM-dd");
  const daysInMonth = endOfMonth(targetDate).getDate();
  const isCurrentMonth = format(targetDate, "yyyy-MM") === format(now, "yyyy-MM");
  const elapsed = isCurrentMonth ? now.getDate() : daysInMonth;

  const { data: entries, error } = await supabase
    .from("activity_entries")
    .select("*")
    .eq("user_id", userId)
    .gte("activity_date", monthStart)
    .lte("activity_date", monthEnd)
    .order("logged_at", { ascending: false });

  if (error) {
    throw error;
  }

  const allEntries = entries ?? [];
  const metrics = buildMetricData(goalRows, allEntries);
  const today = format(now, "yyyy-MM-dd");
  const dailyScore = allEntries
    .filter((e) => e.activity_date === today)
    .reduce((sum, e) => sum + (e.score ?? 0), 0);

  // ── Summary calculations ──
  const totalActivities = allEntries.reduce((sum, e) => sum + e.count, 0);
  const monthGoal = metrics.reduce((sum, m) => sum + m.weeklyGoal * 4, 0);
  const goalCompletionPct = monthGoal > 0 ? Math.round((totalActivities / monthGoal) * 100) : 0;
  const expectedPct = Math.round((elapsed / daysInMonth) * 100);

  // Daily totals (for days active, best day, heatmap)
  const dailyTotals: Record<number, number> = {};
  for (const e of allEntries) {
    const d = new Date(e.activity_date + "T00:00:00").getDate();
    dailyTotals[d] = (dailyTotals[d] ?? 0) + e.count;
  }
  const daysActive = Object.keys(dailyTotals).filter((k) => (dailyTotals[Number(k)] ?? 0) > 0).length;

  let bestDayCount = 0;
  let bestDayNum = 0;
  for (const [day, total] of Object.entries(dailyTotals)) {
    const dayNum = Number(day);
    if (isCurrentMonth && dayNum > now.getDate()) continue;
    if (total > bestDayCount) {
      bestDayCount = total;
      bestDayNum = dayNum;
    }
  }

  // Pace status
  const diff = goalCompletionPct - expectedPct;
  const paceStatus: "ahead" | "on-track" | "behind" =
    diff >= 5 ? "ahead" : diff >= -10 ? "on-track" : "behind";

  // Pace alert (current month only)
  let paceAlert: ProgressPageData["paceAlert"] = null;
  if (isCurrentMonth) {
    if (paceStatus === "ahead") {
      paceAlert = {
        status: "ahead",
        title: "Ahead of pace",
        detail: `${Math.abs(diff)}% ahead. Keep it up!`,
      };
    } else if (paceStatus === "on-track") {
      paceAlert = {
        status: "on-track",
        title: "On track",
        detail: `${elapsed} days in, ${goalCompletionPct}% complete.`,
      };
    } else {
      const needed = monthGoal - totalActivities;
      const daysLeft = daysInMonth - elapsed;
      paceAlert = {
        status: "behind",
        title: "Behind pace",
        detail: `need ~${Math.ceil(needed / Math.max(1, daysLeft))} activities/day over ${daysLeft} remaining days.`,
      };
    }
  }

  // ── Per-metric progress ──
  const metricProgress: ProgressPageData["metricProgress"] = metricCatalog.map((cat) => {
    const goal = goalRows.find((g) => g.metric === cat.key);
    const dailyGoal = goal?.daily_goal ?? cat.defaultDailyGoal;
    const weeklyGoal = goal?.weekly_goal ?? cat.defaultWeeklyGoal;
    const mGoal = weeklyGoal * 4;
    const metricEntries = allEntries.filter((e) => e.metric === cat.key);
    const monthCount = metricEntries.reduce((sum, e) => sum + e.count, 0);
    const monthPct = mGoal > 0 ? Math.min(100, Math.round((monthCount / mGoal) * 100)) : 0;

    // Daily breakdown: number for past days, null for future
    const dailyBreakdown: (number | null)[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      if (isCurrentMonth && d > now.getDate()) {
        dailyBreakdown.push(null);
      } else {
        const dayKey = format(new Date(targetDate.getFullYear(), targetDate.getMonth(), d), "yyyy-MM-dd");
        dailyBreakdown.push(
          metricEntries
            .filter((e) => e.activity_date === dayKey)
            .reduce((sum, e) => sum + e.count, 0),
        );
      }
    }

    const pastVals = dailyBreakdown.filter((v): v is number => v !== null && v > 0);
    const dailyAvg = pastVals.length
      ? Math.round((pastVals.reduce((a, b) => a + b, 0) / pastVals.length) * 10) / 10
      : 0;
    const bestDay = pastVals.length ? Math.max(...pastVals) : 0;

    return {
      key: cat.key,
      label: cat.label,
      color: cat.color,
      icon: cat.icon,
      monthGoal: mGoal,
      monthCount,
      monthPct,
      dailyAvg,
      bestDay,
      dailyBreakdown,
      dailyGoal,
    };
  });

  // ── Heatmap ──
  const heatmap = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const isPast = isCurrentMonth ? day <= now.getDate() : true;
    return { day, total: dailyTotals[day] ?? 0, isPast };
  });

  return {
    profile,
    metrics,
    dailyScore,
    streak,
    summary: {
      totalActivities,
      goalCompletionPct,
      daysActive,
      daysInMonth,
      bestDayCount,
      bestDayNum,
      paceStatus,
      expectedPct,
      monthName: format(targetDate, "MMMM yyyy"),
    },
    paceAlert,
    metricProgress,
    heatmap,
    month: format(targetDate, "yyyy-MM"),
    isCurrentMonth,
    entries: mapEntries(allEntries),
  };
}

export async function getContactsPageData(filters: {
  search?: string;
  type?: string;
}): Promise<ContactsPageData> {
  const { supabase, userId, profile, goalRows, streak } = await getProfileAndGoals();

  // Fetch all contacts for this user (for type counts)
  const { data: allContacts, error: allError } = await supabase
    .from("contacts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (allError) throw allError;

  const contacts = allContacts ?? [];

  // Type counts from ALL contacts (unfiltered)
  const typeCounts: Record<string, number> = { Realtor: 0, "Past Client": 0, Referral: 0, Lead: 0 };
  for (const c of contacts) {
    if (typeCounts[c.contact_type] !== undefined) {
      typeCounts[c.contact_type]++;
    }
  }

  // Apply filters
  let filtered = contacts;
  if (filters.type) {
    filtered = filtered.filter((c) => c.contact_type === filters.type);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.notes ?? "").toLowerCase().includes(q),
    );
  }

  // Daily score
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");
  const { data: entries } = await supabase
    .from("activity_entries")
    .select("*")
    .eq("user_id", userId)
    .gte("activity_date", monthStart)
    .lte("activity_date", monthEnd);

  const today = format(new Date(), "yyyy-MM-dd");
  const dailyScore = (entries ?? [])
    .filter((e) => e.activity_date === today)
    .reduce((sum, e) => sum + (e.score ?? 0), 0);

  return {
    profile,
    metrics: buildMetricData(goalRows, entries ?? []),
    dailyScore,
    streak,
    contacts: filtered.map((c) => ({
      id: c.id,
      firstName: c.first_name,
      lastName: c.last_name,
      contactType: c.contact_type,
      email: c.email,
      phone: c.phone,
      notes: c.notes,
      activityCount: c.activity_count,
      createdAt: c.created_at,
    })),
    typeCounts,
    totalCount: contacts.length,
    filters: {
      search: filters.search ?? "",
      type: filters.type ?? "",
    },
  };
}

export async function getSettingsPageData(): Promise<SettingsPageData> {
  const { supabase, userId, profile, goalRows, streak } = await getProfileAndGoals();
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

  const today = format(new Date(), "yyyy-MM-dd");
  const dailyScore = (entries ?? [])
    .filter((entry) => entry.activity_date === today)
    .reduce((sum, entry) => sum + (entry.score ?? 0), 0);

  return {
    profile,
    metrics: buildMetricData(goalRows, entries ?? []),
    dailyScore,
    streak,
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
