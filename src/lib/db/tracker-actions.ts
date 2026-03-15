"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { metricCatalog, metricKeys, type MetricKey } from "@/lib/tracker-data";
import { isFreeDay } from "@/lib/utils/date";
import type { Json } from "@/types/supabase";

const activityEntrySchema = z.object({
  metric: z.enum(metricKeys),
  contact_name: z.string().trim().min(1).max(120),
  activity_type: z.string().trim().min(1).max(60),
  count: z.coerce.number().int().min(1).max(500),
  activity_date: z.string().date(),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

const logActivitySchema = z.object({
  metric: z.enum(metricKeys),
  contact_name: z.string().trim().max(120),
  activity_type: z.string().trim().min(1).max(60),
  count: z.coerce.number().int().min(1).max(500),
});

const SCORE_TARGET = 100;

const SCORE_MAP: Record<string, Record<string, number>> = {
  calls: { _default: 2 },
  convs: {
    "Text Conversation": 3,
    "Phone Conversation": 5,
    "Event": 8,
    "Open House": 15,
    "Face-to-Face Meeting": 20,
    _default: 5,
  },
  leads: { _default: 15 },
  credits: { _default: 20 },
};

function getEntryScore(metric: string, activityType: string): number {
  const map = SCORE_MAP[metric];
  if (!map) return 0;
  if (activityType && map[activityType] !== undefined) return map[activityType];
  return map._default ?? 0;
}

export type StreakHistoryEntry = { score: number; status: "hit" | "bonus" | "missed" | "free" };
export type StreakHistory = Record<string, StreakHistoryEntry>;

export type LogActivityResult = {
  success: boolean;
  error?: string;
  metric?: MetricKey;
  contactName?: string;
  activityType?: string;
  count?: number;
  score?: number;
  contactExists?: boolean;
  justEarned?: boolean;
  bestDayScore?: number;
  streak?: { current: number; longest: number };
};

const contactTypeByMetric: Record<MetricKey, string> = {
  leads: "Lead",
  convs: "Realtor",
  credits: "Past Client",
  calls: "Past Client",
};

const settingsSchema = z.object({
  first_name: z.string().trim().min(1).max(120),
  last_name: z.string().trim().max(120),
  role_title: z.string().trim().min(1).max(120),
  default_view: z.enum(["dashboard", "activity", "progress", "contacts", "settings"]),
  sync_hour: z.coerce.number().int().min(0).max(23),
});

async function getAuthedSupabase() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    redirect("/login");
  }

  return { supabase, user };
}

export async function createActivityEntry(formData: FormData) {
  const parsed = activityEntrySchema.safeParse({
    metric: formData.get("metric"),
    contact_name: formData.get("contact_name"),
    activity_type: formData.get("activity_type"),
    count: formData.get("count"),
    activity_date: formData.get("activity_date"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    redirect("/activity?error=validation");
  }

  const { supabase, user } = await getAuthedSupabase();
  const { error } = await supabase.from("activity_entries").insert({
    user_id: user.id,
    ...parsed.data,
    notes: parsed.data.notes || null,
  });

  if (error) {
    redirect("/activity?error=validation");
  }

  revalidatePath("/dashboard");
  revalidatePath("/activity");
  revalidatePath("/progress");
  redirect("/activity?saved=activity");
}

export async function updateTrackerSettings(formData: FormData) {
  const parsedSettings = settingsSchema.safeParse({
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    role_title: formData.get("role_title"),
    default_view: formData.get("default_view"),
    sync_hour: formData.get("sync_hour"),
  });

  if (!parsedSettings.success) {
    redirect("/settings?error=validation");
  }

  const { supabase, user } = await getAuthedSupabase();

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      ...parsedSettings.data,
    },
    { onConflict: "user_id" },
  );

  if (profileError) {
    redirect("/settings?error=validation");
  }

  const goals = metricCatalog.map((metric) => ({
    user_id: user.id,
    metric: metric.key,
    daily_goal: Number(formData.get(`${metric.key}_daily_goal`) ?? metric.defaultDailyGoal),
    weekly_goal: Number(formData.get(`${metric.key}_weekly_goal`) ?? metric.defaultWeeklyGoal),
  }));

  const invalidGoal = goals.some(
    (goal) =>
      !Number.isInteger(goal.daily_goal) ||
      goal.daily_goal < 0 ||
      !Number.isInteger(goal.weekly_goal) ||
      goal.weekly_goal < 0,
  );

  if (invalidGoal) {
    redirect("/settings?error=validation");
  }

  const { error: goalsError } = await supabase.from("goals").upsert(goals, {
    onConflict: "user_id,metric",
  });

  if (goalsError) {
    redirect("/settings?error=validation");
  }

  revalidatePath("/dashboard");
  revalidatePath("/activity");
  revalidatePath("/progress");
  revalidatePath("/settings");
  redirect("/settings?saved=settings");
}

export async function logActivity(input: {
  metric: string;
  contactName: string;
  activityType: string;
  count: number;
}): Promise<LogActivityResult> {
  const parsed = logActivitySchema.safeParse({
    metric: input.metric,
    contact_name: input.contactName,
    activity_type: input.activityType,
    count: input.count,
  });

  if (!parsed.success) {
    return { success: false, error: "Invalid input." };
  }

  const { supabase, user } = await getAuthedSupabase();
  const now = new Date();
  const today = format(now, "yyyy-MM-dd");

  // Calculate score for this entry
  const entryScore = getEntryScore(parsed.data.metric, parsed.data.activity_type) * parsed.data.count;

  // Insert activity entry with score
  const { error: insertError } = await supabase.from("activity_entries").insert({
    user_id: user.id,
    metric: parsed.data.metric,
    contact_name: parsed.data.contact_name,
    activity_type: parsed.data.activity_type,
    count: parsed.data.count,
    activity_date: today,
    score: entryScore,
  });

  if (insertError) {
    return { success: false, error: "Failed to save activity." };
  }

  // Check if contact exists (only if contact_name is non-empty)
  let contactExists = true;
  if (parsed.data.contact_name) {
    const parts = parsed.data.contact_name.trim().split(/\s+/);
    const first = parts[0] ?? "";
    const last = parts.slice(1).join(" ");

    let contactQuery = supabase
      .from("contacts")
      .select("id")
      .eq("user_id", user.id)
      .ilike("first_name", first);

    if (last) {
      contactQuery = contactQuery.ilike("last_name", last);
    }

    const { data: matchedContact } = await contactQuery.limit(1).maybeSingle();
    contactExists = !!matchedContact;
  }

  // Sum today's total score from all activity_entries
  const { data: todayEntries } = await supabase
    .from("activity_entries")
    .select("score")
    .eq("user_id", user.id)
    .eq("activity_date", today);

  const todayScore = (todayEntries ?? []).reduce((sum, row) => sum + (row.score ?? 0), 0);

  // Streak logic: fires when daily score >= 100 pts
  let justEarned = false;
  let bestDayScore = 0;
  let streak = { current: 0, longest: 0 };

  // Fetch current streak row
  const { data: streakRow } = await supabase
    .from("streaks")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const todayDate = new Date(`${today}T00:00:00`);
  const free = isFreeDay(todayDate);
  const scoreHit = todayScore >= SCORE_TARGET;
  const existingHistory: StreakHistory = (streakRow?.history as StreakHistory) ?? {};
  const newBestDayScore = Math.max(streakRow?.best_day_score ?? 0, todayScore);

  if (scoreHit) {
    // Today's status
    const todayStatus: "hit" | "bonus" = free ? "bonus" : "hit";
    const updatedHistory: StreakHistory = {
      ...existingHistory,
      [today]: { score: todayScore, status: todayStatus },
    };

    if (!streakRow) {
      // No streak row yet — create with streak of 1
      await supabase.from("streaks").insert({
        user_id: user.id,
        current_streak: 1,
        longest_streak: 1,
        last_goal_date: today,
        best_day_score: newBestDayScore,
        history: updatedHistory as unknown as Json,
      });
      streak = { current: 1, longest: 1 };
      justEarned = true;
      bestDayScore = newBestDayScore;
    } else if (streakRow.last_goal_date === today) {
      // Already counted today — just update score/history (score may have increased)
      await supabase
        .from("streaks")
        .update({
          best_day_score: newBestDayScore,
          history: updatedHistory as unknown as Json,
        })
        .eq("user_id", user.id);
      streak = { current: streakRow.current_streak, longest: streakRow.longest_streak };
      bestDayScore = newBestDayScore;
    } else {
      // Check if streak should continue or was broken
      // Walk from day after last_goal_date to yesterday — if any required weekday was missed, break
      let broken = false;
      if (streakRow.last_goal_date) {
        const cursor = new Date(`${streakRow.last_goal_date}T00:00:00`);
        cursor.setDate(cursor.getDate() + 1);
        while (cursor < todayDate) {
          const ds = format(cursor, "yyyy-MM-dd");
          if (!isFreeDay(cursor)) {
            // Required weekday — was it logged as hit?
            const hist = existingHistory[ds];
            if (!hist || hist.status === "missed") {
              updatedHistory[ds] = { score: 0, status: "missed" };
              broken = true;
              break;
            }
          } else {
            // Free day — mark as free if not already in history
            if (!updatedHistory[ds]) {
              updatedHistory[ds] = { score: 0, status: "free" };
            }
          }
          cursor.setDate(cursor.getDate() + 1);
        }
      }

      if (broken) {
        // Streak was broken — start fresh at 1
        const newLongest = Math.max(1, streakRow.longest_streak);
        await supabase
          .from("streaks")
          .update({
            current_streak: 1,
            longest_streak: newLongest,
            last_goal_date: today,
            best_day_score: newBestDayScore,
            history: updatedHistory as unknown as Json,
          })
          .eq("user_id", user.id);
        streak = { current: 1, longest: newLongest };
      } else {
        // Streak continues — increment
        const newCurrent = streakRow.current_streak + 1;
        const newLongest = Math.max(newCurrent, streakRow.longest_streak);
        await supabase
          .from("streaks")
          .update({
            current_streak: newCurrent,
            longest_streak: newLongest,
            last_goal_date: today,
            best_day_score: newBestDayScore,
            history: updatedHistory as unknown as Json,
          })
          .eq("user_id", user.id);
        streak = { current: newCurrent, longest: newLongest };
      }
      justEarned = true;
      bestDayScore = newBestDayScore;
    }
  } else {
    // Score not yet hit — just read current streak state
    if (streakRow) {
      streak = { current: streakRow.current_streak, longest: streakRow.longest_streak };
      bestDayScore = streakRow.best_day_score;
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/activity");
  revalidatePath("/progress");
  revalidatePath("/contacts");

  return {
    success: true,
    metric: parsed.data.metric,
    contactName: parsed.data.contact_name,
    activityType: parsed.data.activity_type,
    count: parsed.data.count,
    score: todayScore,
    contactExists,
    justEarned,
    bestDayScore,
    streak,
  };
}

export async function deleteActivity(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string") return;

  const { supabase, user } = await getAuthedSupabase();
  await supabase.from("activity_entries").delete().eq("id", id).eq("user_id", user.id);

  revalidatePath("/dashboard");
  revalidatePath("/activity");
  revalidatePath("/progress");
}

export async function saveContact(input: {
  contactName: string;
  metric: string;
}): Promise<{ success: boolean; error?: string }> {
  const { supabase, user } = await getAuthedSupabase();

  const parts = input.contactName.trim().split(/\s+/);
  const firstName = parts[0] ?? "";
  const lastName = parts.slice(1).join(" ");
  const contactType = contactTypeByMetric[input.metric as MetricKey] ?? "Lead";

  const { error } = await supabase.from("contacts").insert({
    user_id: user.id,
    first_name: firstName,
    last_name: lastName,
    contact_type: contactType,
  });

  if (error) {
    return { success: false, error: "Failed to save contact." };
  }

  return { success: true };
}

const contactModalSchema = z.object({
  first_name: z.string().trim().min(1, "First name required").max(120),
  last_name: z.string().trim().min(1, "Last name required").max(120),
  contact_type: z.enum(["Realtor", "Past Client", "Referral", "Lead", "Financial Advisor", "CPA", "Attorney"]),
  email: z.string().trim().max(200).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  dob: z.string().trim().max(10).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  state: z.string().trim().max(60).optional().or(z.literal("")),
  home_anniversary: z.string().trim().max(10).optional().or(z.literal("")),
  credit_score: z.coerce.number().int().min(300).max(850).optional().or(z.literal("")).transform((v) => (v === "" ? undefined : v)),
  down_payment: z.string().trim().max(60).optional().or(z.literal("")),
  timeline: z.string().trim().max(120).optional().or(z.literal("")),
  employment: z.string().trim().max(200).optional().or(z.literal("")),
  income: z.string().trim().max(60).optional().or(z.literal("")),
  realtor_name: z.string().trim().max(120).optional().or(z.literal("")),
  realtor_id: z.string().trim().max(60).optional().or(z.literal("")),
  military_veteran: z.boolean().optional(),
});

export async function saveOrUpdateContact(input: {
  id?: string;
  firstName: string;
  lastName: string;
  contactType: string;
  email: string;
  phone: string;
  notes: string;
  dob?: string;
  city?: string;
  state?: string;
  homeAnniversary?: string;
  creditScore?: number | string;
  downPayment?: string;
  timeline?: string;
  employment?: string;
  income?: string;
  realtorName?: string;
  realtorId?: string;
  militaryVeteran?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  const parsed = contactModalSchema.safeParse({
    first_name: input.firstName,
    last_name: input.lastName,
    contact_type: input.contactType,
    email: input.email,
    phone: input.phone,
    notes: input.notes,
    dob: input.dob,
    city: input.city,
    state: input.state,
    home_anniversary: input.homeAnniversary,
    credit_score: input.creditScore,
    down_payment: input.downPayment,
    timeline: input.timeline,
    employment: input.employment,
    income: input.income,
    realtor_name: input.realtorName,
    realtor_id: input.realtorId,
    military_veteran: input.militaryVeteran,
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input.";
    return { success: false, error: firstError };
  }

  const { supabase, user } = await getAuthedSupabase();

  const payload = {
    first_name: parsed.data.first_name,
    last_name: parsed.data.last_name,
    contact_type: parsed.data.contact_type,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    notes: parsed.data.notes || null,
    dob: parsed.data.dob || null,
    city: parsed.data.city || null,
    state: parsed.data.state || null,
    home_anniversary: parsed.data.home_anniversary || null,
    credit_score: typeof parsed.data.credit_score === "number" ? parsed.data.credit_score : null,
    down_payment: parsed.data.down_payment || null,
    timeline: parsed.data.timeline || null,
    employment: parsed.data.employment || null,
    income: parsed.data.income || null,
    realtor_name: parsed.data.realtor_name || null,
    realtor_id: parsed.data.realtor_id || null,
    military_veteran: parsed.data.military_veteran ?? null,
  };

  if (input.id) {
    const { error } = await supabase
      .from("contacts")
      .update(payload)
      .eq("id", input.id)
      .eq("user_id", user.id);

    if (error) return { success: false, error: "Failed to update contact." };
  } else {
    const { error } = await supabase.from("contacts").insert({
      user_id: user.id,
      ...payload,
    });

    if (error) return { success: false, error: "Failed to save contact." };
  }

  revalidatePath("/contacts");
  revalidatePath("/dashboard");
  revalidatePath("/activity");
  return { success: true };
}

export async function searchRealtors(query: string): Promise<{ id: string; name: string }[]> {
  if (!query || query.length < 1) return [];
  const { supabase, user } = await getAuthedSupabase();

  const { data } = await supabase
    .from("contacts")
    .select("id, first_name, last_name")
    .eq("user_id", user.id)
    .eq("contact_type", "Realtor")
    .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
    .limit(8);

  return (data ?? []).map((r) => ({
    id: r.id,
    name: `${r.first_name} ${r.last_name}`.trim(),
  }));
}

export async function resetStreak(): Promise<void> {
  const { supabase, user } = await getAuthedSupabase();

  await supabase
    .from("streaks")
    .update({ current_streak: 0, last_goal_date: null, history: {} })
    .eq("user_id", user.id);

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  revalidatePath("/activity");
  revalidatePath("/progress");
  redirect("/settings?saved=settings");
}

export async function deleteContact(contactId: string): Promise<{ success: boolean; error?: string }> {
  if (!contactId) return { success: false, error: "No contact ID." };

  const { supabase, user } = await getAuthedSupabase();
  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("id", contactId)
    .eq("user_id", user.id);

  if (error) return { success: false, error: "Failed to delete contact." };

  revalidatePath("/contacts");
  return { success: true };
}
