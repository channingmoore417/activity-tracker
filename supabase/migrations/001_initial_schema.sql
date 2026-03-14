create extension if not exists "pgcrypto";

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'activity_metric'
  ) then
    create type public.activity_metric as enum (
      'calls',
      'leads',
      'convs',
      'appts',
      'apps',
      'locked',
      'past',
      'followups'
    );
  end if;
end
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role_title text not null default 'Loan Officer',
  default_view text not null default 'dashboard',
  sync_hour smallint not null default 18 check (sync_hour between 0 and 23),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  metric public.activity_metric not null,
  daily_goal integer not null default 0 check (daily_goal >= 0),
  weekly_goal integer not null default 0 check (weekly_goal >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, metric)
);

create table public.activity_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  metric public.activity_metric not null,
  contact_name text not null,
  activity_type text not null,
  count integer not null default 1 check (count > 0),
  activity_date date not null default current_date,
  notes text,
  logged_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email_daily_summary boolean not null default true,
  email_goal_alerts boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index activity_entries_user_date_idx
  on public.activity_entries (user_id, activity_date desc);

create index activity_entries_user_metric_idx
  on public.activity_entries (user_id, metric, activity_date desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger set_goals_updated_at
before update on public.goals
for each row
execute function public.set_updated_at();

create trigger set_activity_entries_updated_at
before update on public.activity_entries
for each row
execute function public.set_updated_at();

create trigger set_notification_preferences_updated_at
before update on public.notification_preferences
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.goals enable row level security;
alter table public.activity_entries enable row level security;
alter table public.notification_preferences enable row level security;

create policy "Users can manage own profile"
on public.profiles
for all
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Users can manage own goals"
on public.goals
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own activity entries"
on public.activity_entries
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own notification preferences"
on public.notification_preferences
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace view public.activity_daily_progress
with (security_invoker = true) as
select
  user_id,
  activity_date,
  metric,
  sum(count)::int as total_count
from public.activity_entries
group by user_id, activity_date, metric;

create or replace view public.activity_monthly_progress
with (security_invoker = true) as
select
  user_id,
  date_trunc('month', activity_date)::date as month_start,
  metric,
  sum(count)::int as total_count
from public.activity_entries
group by user_id, date_trunc('month', activity_date)::date, metric;

insert into public.profiles (id)
select id
from auth.users
on conflict (id) do nothing;