"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { metricCatalog, metricKeys } from "@/lib/tracker-data";

const activityEntrySchema = z.object({
  metric: z.enum(metricKeys),
  contact_name: z.string().trim().min(1).max(120),
  activity_type: z.string().trim().min(1).max(60),
  count: z.coerce.number().int().min(1).max(500),
  activity_date: z.string().date(),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

const settingsSchema = z.object({
  full_name: z.string().trim().min(1).max(120),
  role_title: z.string().trim().min(1).max(120),
  default_view: z.enum(["dashboard", "activity", "progress", "settings"]),
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
    full_name: formData.get("full_name"),
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
      id: user.id,
      ...parsedSettings.data,
    },
    { onConflict: "id" },
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
