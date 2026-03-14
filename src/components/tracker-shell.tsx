import Link from "next/link";
import { endOfWeek, format, startOfWeek } from "date-fns";
import {
  Activity,
  AlertCircle,
  BarChart3,
  CalendarDays,
  CalendarRange,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock,
  LayoutDashboard,
  Plus,
  Save,
  Search,
  Settings,
  Sparkles,
  Star,
  Target,
  Trash2,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import { deleteActivity, updateTrackerSettings } from "@/lib/db/tracker-actions";
import { ActivityLogger } from "@/components/activity-logger";
import { ContactsViewClient } from "@/components/contacts-view-client";
import { PrintButton } from "@/components/print-button";
import { StreakPopover } from "@/components/streak-popover";
import { metricCatalog } from "@/lib/tracker-data";
import type {
  ActivityPageData,
  ContactRecord,
  ContactsPageData,
  DashboardData,
  ProgressMetricData,
  ProgressPageData,
  SettingsPageData,
  StreakData,
  TrackerActivityEntry,
  TrackerFlash,
  TrackerMetric,
  TrackerProfile,
} from "@/lib/db/tracker";
import styles from "./tracker-shell.module.css";

type TrackerShellProps =
  | { view: "dashboard"; data: DashboardData; flash?: TrackerFlash }
  | { view: "activity"; data: ActivityPageData; flash?: TrackerFlash }
  | { view: "progress"; data: ProgressPageData; flash?: TrackerFlash }
  | { view: "contacts"; data: ContactsPageData; flash?: TrackerFlash }
  | { view: "settings"; data: SettingsPageData; flash?: TrackerFlash };

const navItems = [
  { href: "/dashboard", label: "Dashboard", view: "dashboard", icon: LayoutDashboard },
  { href: "/activity", label: "Activity Log", view: "activity", icon: TrendingUp },
  { href: "/progress", label: "Progress", view: "progress", icon: CalendarRange },
  { href: "/contacts", label: "Contacts", view: "contacts", icon: Users },
  { href: "/settings", label: "Settings", view: "settings", icon: Settings },
] as const;

/* Per-metric gradient pairs for icon backgrounds and ring strokes */
const METRIC_GRADIENTS: Record<string, [string, string]> = {
  calls: ["#172852", "#008BC7"],
  convs: ["#008BC7", "#3AABF0"],
  leads: ["#0f4c8a", "#1d82c7"],
  credits: ["#0a3060", "#005a9e"],
};

function Ring({ value, goal, color }: { value: number; goal: number; color: string }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const progress = goal > 0 ? Math.min(value / goal, 1) : 0;
  const dashoffset = circumference * (1 - progress);

  return (
    <div className={styles.ringWrap}>
      <svg height="64" width="64">
        <circle cx="32" cy="32" fill="none" r={radius} stroke="#d3e4ef" strokeWidth="7" />
        <circle
          cx="32"
          cy="32"
          fill="none"
          r={radius}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          strokeWidth="7"
          transform="rotate(-90 32 32)"
        />
      </svg>
      <div className={styles.ringLabel}>{Math.round(progress * 100)}%</div>
    </div>
  );
}

/* 80×80 ring with gradient stroke for weekly dashboard */
function WeeklyRing({ value, goal, gradientId }: { value: number; goal: number; gradientId: string }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const progress = goal > 0 ? Math.min(value / goal, 1) : 0;
  const dashoffset = circumference * (1 - progress);

  return (
    <div className={styles.weekRingWrap}>
      <svg viewBox="0 0 80 80" width="80" height="80" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="40" cy="40" r={radius} fill="none" stroke="#e4eaf3" strokeWidth="8" />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(.4,0,.2,1)" }}
        />
      </svg>
      <div className={styles.weekRingInner}>
        <div className={styles.weekRingPct}>{Math.round(progress * 100)}%</div>
      </div>
    </div>
  );
}

function FlashMessage({ flash }: { flash?: TrackerFlash }) {
  if (!flash) return null;
  const Icon = flash.status === "success" ? CheckCircle2 : AlertCircle;

  return (
    <div className={flash.status === "success" ? styles.flashSuccess : styles.flashError}>
      <Icon size={16} />
      {flash.message}
    </div>
  );
}

function DashboardView({ data }: { data: DashboardData }) {
  const pct = data.totalDailyGoal > 0 ? Math.min(100, Math.round((data.totalToday / data.totalDailyGoal) * 100)) : 0;
  const hasStreak = data.streak.currentStreak > 0;
  const scorePct = Math.min(100, Math.round((data.dailyScore / 100) * 100));

  const now = new Date();
  const weekStartDate = startOfWeek(now, { weekStartsOn: 1 });
  const weekEndDate = endOfWeek(now, { weekStartsOn: 1 });
  const weekLabel = `${format(weekStartDate, "MMM d")} – ${format(weekEndDate, "MMM d")}`;

  /* Build streak history dots (last 7 days) */
  const streakDots: { lit: boolean; todayGlow: boolean }[] = [];
  const show = Math.min(data.streak.currentStreak, 7);
  for (let i = 0; i < 7; i++) {
    streakDots.push({
      lit: i < show,
      todayGlow: i === show - 1 && data.dailyScore >= 100,
    });
  }

  /* PB day message */
  const pbScore = data.streak.bestDayScore;
  const pbMsg = data.dailyScore >= pbScore && pbScore > 0
    ? "🎉 You\u2019re matching your best!"
    : pbScore > 0
    ? `You need ${pbScore - data.dailyScore} more pts to match it!`
    : "Log your first activity!";

  return (
    <div className={styles.dashGrid}>
      {/* Hidden SVG defs for ring gradients */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="rg-calls" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#172852" />
            <stop offset="100%" stopColor="#008BC7" />
          </linearGradient>
          <linearGradient id="rg-convs" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#008BC7" />
            <stop offset="100%" stopColor="#3AABF0" />
          </linearGradient>
          <linearGradient id="rg-leads" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0f4c8a" />
            <stop offset="100%" stopColor="#008BC7" />
          </linearGradient>
          <linearGradient id="rg-credits" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0a3060" />
            <stop offset="100%" stopColor="#005a9e" />
          </linearGradient>
        </defs>
      </svg>

      {/* ── LEFT: DAILY PROGRESS ── */}
      <section className={styles.module}>
        <div className={styles.moduleHead}>
          <div className={styles.moduleTitle}>
            <CalendarDays size={16} />
            Daily Progress
          </div>
          <div className={styles.moduleDate}>{format(now, "MMM d")}</div>
        </div>

        {/* Progress bar */}
        <div className={styles.progBarWrap}>
          <div className={styles.progBarTrack}>
            <div className={styles.progBarFill} style={{ width: `${pct}%` }} />
          </div>
          <div className={styles.progBarLabels}>
            <span className={styles.progBarPct}>{pct}%</span>
            <span className={styles.progBarFraction}>{data.totalToday} / {data.totalDailyGoal} goal</span>
          </div>
        </div>

        {/* Big number */}
        <div className={styles.actsRow}>
          <span className={styles.actsNum}>{data.totalToday}</span>
          <span className={styles.actsDenom}>/{data.totalDailyGoal}</span>
          <span className={styles.actsLabel}>activities today</span>
        </div>

        {/* Metric rows */}
        <ul className={styles.dashMetricList}>
          {data.metrics.map((metric) => {
            const Icon = metric.icon;
            const done = metric.todayCount >= metric.dailyGoal;
            const mPct = metric.dailyGoal > 0 ? Math.min(100, Math.round((metric.todayCount / metric.dailyGoal) * 100)) : 0;
            const grad = METRIC_GRADIENTS[metric.key] ?? ["#008BC7", "#3AABF0"];

            return (
              <li key={metric.key} className={styles.dashMetricItem}>
                <div
                  className={styles.dashMetricIcon}
                  style={{ background: `linear-gradient(135deg, ${grad[0]}, ${grad[1]})` }}
                >
                  <Icon size={16} color="#fff" />
                </div>
                <div className={styles.dashMetricInfo}>
                  <div className={styles.dashMetricName}>{metric.label}</div>
                  <div className={styles.dashMetricSub}>Goal: {metric.dailyGoal} today</div>
                </div>
                <div className={styles.dashMetricRight}>
                  <div className={styles.dashMetricVals}>
                    <div className={styles.dashMetricVal}>{metric.todayCount}</div>
                    <div className={styles.dashMetricGoalLbl}>/{metric.dailyGoal}</div>
                    <div className={styles.dashMiniBar}>
                      <div
                        className={done ? styles.dashMiniFillDone : styles.dashMiniFill}
                        style={{ width: `${mPct}%` }}
                      />
                    </div>
                  </div>
                  {done ? (
                    <div className={styles.dashMetricCheck}>
                      <Check size={11} strokeWidth={3} color="#fff" />
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>

        {/* Streak card */}
        <div className={hasStreak ? styles.streakCardActive : styles.streakCard}>
          <div className={styles.streakCardLeft}>
            <span className={hasStreak ? styles.streakBigFlame : styles.streakBigFlameDim}>🔥</span>
          </div>
          <div className={styles.streakCardBody}>
            <div className={hasStreak ? styles.streakNumActive : styles.streakNum}>
              {data.streak.currentStreak}
            </div>
            <div className={hasStreak ? styles.streakNumLabelActive : styles.streakNumLabel}>
              Day Streak{data.streak.currentStreak > 1 ? " 🎉" : ""}
            </div>
            <div className={styles.streakHint}>
              {data.streak.currentStreak === 0
                ? "Score 100 pts to start your streak!"
                : data.dailyScore >= 100
                ? "100 pts hit today — keep it going tomorrow!"
                : "Score 100 pts today to extend your streak!"}
            </div>
            <div className={styles.streakScoreBar}>
              <div className={styles.streakScoreTrack}>
                <div className={styles.streakScoreFill} style={{ width: `${scorePct}%` }} />
              </div>
              <span className={styles.streakScoreLabel}>{data.dailyScore} / 100 pts</span>
            </div>
            <div className={styles.streakDots}>
              {streakDots.map((dot, i) => (
                <div
                  key={i}
                  className={
                    dot.lit
                      ? dot.todayGlow
                        ? styles.sDotTodayGlow
                        : styles.sDotLit
                      : styles.sDot
                  }
                />
              ))}
            </div>
          </div>
        </div>

        {/* Personal best badge */}
        <div className={styles.pbBadge}>
          <span className={styles.pbIcon}>🏆</span>
          <div className={styles.pbText}>
            Personal Best Day: <strong>{pbScore > 0 ? `${pbScore} pts` : "—"}</strong>
            <br />
            Keep pushing — <strong>{pbMsg}</strong>
          </div>
        </div>
      </section>

      {/* ── RIGHT: WEEKLY PROGRESS ── */}
      <section className={styles.module}>
        <div className={styles.moduleHead}>
          <div className={styles.moduleTitle}>
            <Clock size={16} />
            Weekly Progress
          </div>
          <div className={styles.moduleDate}>{weekLabel}</div>
        </div>

        <div className={styles.weekRings}>
          {data.metrics.map((metric) => (
            <div key={metric.key} className={styles.weekRingCard}>
              <WeeklyRing
                value={metric.weekCount}
                goal={metric.weeklyGoal}
                gradientId={`rg-${metric.key}`}
              />
              <div className={styles.weekRingLabel}>{metric.label}</div>
              <div className={styles.weekRingSub}>{metric.weekCount} / {metric.weeklyGoal}</div>
            </div>
          ))}
        </div>

        <div className={styles.pbBadge}>
          <span className={styles.pbIcon}>📈</span>
          <div className={styles.pbText}>
            Personal Best Week: <strong>—</strong>
            <br />
            <strong>Keep building momentum!</strong>
          </div>
        </div>
      </section>
    </div>
  );
}

function ActivityTable({ entries }: { entries: TrackerActivityEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className={styles.tableWrap}>
        <div className={styles.logEmpty}>
          <div className={styles.logEmptyIcon}>
            <ClipboardList size={28} />
          </div>
          <div className={styles.logEmptyTitle}>No activity logged yet</div>
          <p className={styles.logEmptyText}>
            Start recording your daily calls, conversations, leads, and credit
            pulls to track your progress.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Contact</th>
            <th>Type</th>
            <th>Time</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const metric = metricCatalog.find((m) => m.key === entry.metric)!;
            const Icon = metric.icon;
            const grad = METRIC_GRADIENTS[entry.metric] ?? ["#008BC7", "#3AABF0"];

            return (
              <tr key={entry.id}>
                <td>
                  <div className={styles.tdMetric}>
                    <div
                      className={styles.tdMetricIcon}
                      style={{ background: `linear-gradient(135deg, ${grad[0]}, ${grad[1]})` }}
                    >
                      <Icon size={13} color="#fff" />
                    </div>
                    {metric.label}
                  </div>
                </td>
                <td>{entry.name || "\u2014"}</td>
                <td>
                  {entry.type ? (
                    <span className={styles.tdChip}>{entry.type}</span>
                  ) : (
                    <span className={styles.tdChipEmpty}>{"\u2014"}</span>
                  )}
                </td>
                <td>
                  <span className={styles.tdTime}>{entry.time}</span>
                </td>
                <td>
                  <form action={deleteActivity}>
                    <input type="hidden" name="id" value={entry.id} />
                    <button className={styles.tdDel} type="submit">
                      <Trash2 size={13} />
                    </button>
                  </form>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ActivityView({ data }: { data: ActivityPageData }) {
  const totalToday = data.metrics.reduce((sum, m) => sum + m.todayCount, 0);
  const currentSort = data.filters.sort || "recent";

  /* Build href preserving current filters but changing sort */
  function sortHref(sort: string) {
    const p = new URLSearchParams();
    if (data.filters.search) p.set("search", data.filters.search);
    if (data.filters.metric) p.set("metric", data.filters.metric);
    if (data.filters.activityType) p.set("activityType", data.filters.activityType);
    p.set("sort", sort);
    return `/activity?${p.toString()}`;
  }

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageTitle}>Activity Log</div>
          <div className={styles.pageMeta}>Today&apos;s logged activity</div>
        </div>
      </div>

      {/* Stats strip: total + 4 metrics */}
      <div className={styles.statsStrip}>
        <div className={styles.statPill}>
          <div
            className={styles.statPillIcon}
            style={{ background: "linear-gradient(135deg, #172852, #008BC7)" }}
          >
            <Target size={16} color="#fff" />
          </div>
          <div>
            <div className={styles.statNum}>{totalToday}</div>
            <div className={styles.statLabel}>Total</div>
          </div>
        </div>
        {data.metrics.map((metric) => {
          const Icon = metric.icon;
          const grad = METRIC_GRADIENTS[metric.key] ?? ["#008BC7", "#3AABF0"];
          return (
            <div key={metric.key} className={styles.statPill}>
              <div
                className={styles.statPillIcon}
                style={{ background: `linear-gradient(135deg, ${grad[0]}, ${grad[1]})` }}
              >
                <Icon size={16} color="#fff" />
              </div>
              <div>
                <div className={styles.statNum}>{metric.todayCount}</div>
                <div className={styles.statLabel}>{metric.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter bar */}
      <form className={styles.filterBar} method="get" action="/activity">
        <div className={styles.searchWrap}>
          <Search className={styles.searchIcon} size={14} />
          <input
            className={styles.searchInput}
            defaultValue={data.filters.search}
            name="search"
            placeholder="Search by name\u2026"
          />
        </div>
        <select className={styles.filterSelect} defaultValue={data.filters.metric} name="metric">
          <option value="">All Metrics</option>
          {metricCatalog.map((m) => (
            <option key={m.key} value={m.key}>
              {m.label}
            </option>
          ))}
        </select>
        <select className={styles.filterSelect} defaultValue={data.filters.activityType} name="activityType">
          <option value="">All Types</option>
          {data.activityTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input type="hidden" name="sort" value={currentSort} />
        <button className={styles.btnClear} type="submit">
          Apply
        </button>
        <Link className={styles.btnClear} href="/activity">
          Clear
        </Link>
        <div className={styles.sortWrap}>
          <span className={styles.sortLbl}>Sort:</span>
          <Link
            className={currentSort === "recent" ? styles.btnSortActive : styles.btnSort}
            href={sortHref("recent")}
          >
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="12" height="12">
              <line x1="12" y1="5" x2="12" y2="19" />
              <polyline points="19 12 12 19 5 12" />
            </svg>
            Recent
          </Link>
          <Link
            className={currentSort === "metric" ? styles.btnSortActive : styles.btnSort}
            href={sortHref("metric")}
          >
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="12" height="12">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
            </svg>
            Metric
          </Link>
        </div>
      </form>

      <ActivityTable entries={data.entries} />
    </>
  );
}

function ProgressMetricCard({ data }: { data: ProgressMetricData }) {
  const R = 20;
  const C = 2 * Math.PI * R;
  const pct = data.monthPct;
  const dash = (C * pct) / 100;
  const strokeColor =
    pct >= 100 ? "#16a34a" : pct >= 70 ? "#008BC7" : pct >= 40 ? "#ca8a04" : "#dc2626";
  const pctClass =
    pct >= 100
      ? styles.progPctGreen
      : pct >= 70
        ? styles.progPctBlue
        : pct >= 40
          ? styles.progPctYellow
          : styles.progPctRed;

  const grad = METRIC_GRADIENTS[data.key] ?? ["#008BC7", "#3AABF0"];
  const Icon = data.icon;

  const pastVals = data.dailyBreakdown.filter((v): v is number => v !== null);
  const maxVal = Math.max(1, ...pastVals);

  return (
    <div className={styles.progMetricCard}>
      <div className={styles.progMetricHead}>
        <div className={styles.progMetricTitleRow}>
          <div
            className={styles.progMetricIcon}
            style={{ background: `linear-gradient(135deg, ${grad[0]}, ${grad[1]})` }}
          >
            <Icon size={13} color="#fff" />
          </div>
          <span className={styles.progMetricName}>{data.label}</span>
        </div>
        <span className={`${styles.progMetricPct} ${pctClass}`}>{pct}%</span>
      </div>

      <div className={styles.progMetricRingRow}>
        <div className={styles.progMiniRingWrap}>
          <svg viewBox="0 0 52 52" width="52" height="52" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="26" cy="26" r={R} fill="none" stroke="#d3e4ef" strokeWidth="6" />
            <circle
              cx="26"
              cy="26"
              r={R}
              fill="none"
              stroke={strokeColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={C.toFixed(1)}
              strokeDashoffset={(C - dash).toFixed(1)}
            />
          </svg>
          <div className={styles.progMiniRingLabel}>{pct}%</div>
        </div>
        <div className={styles.progMetricStats}>
          <div className={styles.progMetricStatRow}>
            <span className={styles.progMetricStatLbl}>Total</span>
            <span className={styles.progMetricStatVal}>
              {data.monthCount} / {data.monthGoal}
            </span>
          </div>
          <div className={styles.progMetricStatRow}>
            <span className={styles.progMetricStatLbl}>Daily avg</span>
            <span className={styles.progMetricStatVal}>{data.dailyAvg}</span>
          </div>
          <div className={styles.progMetricStatRow}>
            <span className={styles.progMetricStatLbl}>Best day</span>
            <span className={styles.progMetricStatVal}>{data.bestDay}</span>
          </div>
        </div>
      </div>

      <div className={styles.progMetricBars}>
        {data.dailyBreakdown.map((v, i) => {
          if (v === null) {
            return (
              <div
                key={i}
                className={styles.progDayBar}
                style={{ background: "#d3e4ef", height: "3px" }}
                title={`Day ${i + 1}`}
              />
            );
          }
          const h = Math.max(3, Math.round((v / maxVal) * 38));
          const bg =
            v >= data.dailyGoal ? "#16a34a" : v >= data.dailyGoal * 0.6 ? "#3AABF0" : "#fbbf24";
          return (
            <div
              key={i}
              className={styles.progDayBar}
              style={{ background: bg, height: `${h}px` }}
              title={`Day ${i + 1}: ${v}`}
            />
          );
        })}
      </div>
    </div>
  );
}

function ProgressView({ data }: { data: ProgressPageData }) {
  const { summary, paceAlert, metricProgress, heatmap, month } = data;

  // Month navigation
  const [y, m] = month.split("-").map(Number);
  const prevMonth = format(new Date(y, m - 2, 1), "yyyy-MM");
  const nextMonth = format(new Date(y, m, 1), "yyyy-MM");
  const currentMonthStr = format(new Date(), "yyyy-MM");
  const canGoNext = nextMonth <= currentMonthStr;

  // Heatmap max for relative bar heights
  const heatMax = Math.max(1, ...heatmap.map((h) => h.total));

  return (
    <>
      {/* Page header with month nav + Export PDF */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageTitle}>Monthly Progress</div>
          <div className={styles.pageMeta}>
            Performance overview &middot; {summary.monthName}
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div className={styles.progMonthNav}>
            <Link href={`/progress?month=${prevMonth}`} className={styles.progMonthBtn}>
              <svg
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
                width="14"
                height="14"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </Link>
            <span className={styles.progMonthLabel}>{summary.monthName}</span>
            {canGoNext ? (
              <Link href={`/progress?month=${nextMonth}`} className={styles.progMonthBtn}>
                <svg
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            ) : (
              <span className={styles.progMonthBtnDisabled}>
                <svg
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
            )}
          </div>
          <PrintButton />
        </div>
      </div>

      {/* ── Summary strip: 5 stat cards ── */}
      <div className={styles.progSummaryStrip}>
        {/* 1. Total Activities (highlighted) */}
        <div className={styles.progStatCardHL}>
          <div className={styles.progStatTop}>
            <div className={styles.progStatIconHL}>
              <Activity size={15} />
            </div>
            <span className={styles.progBadgeHL}>
              {format(new Date(y, m - 1, 1), "MMMM")}
            </span>
          </div>
          <div className={styles.progStatNumHL}>{summary.totalActivities}</div>
          <div className={styles.progStatLblHL}>Total Activities</div>
        </div>

        {/* 2. Goal Completion */}
        <div className={styles.progStatCard}>
          <div className={styles.progStatTop}>
            <div className={styles.progStatIcon}>
              <Clock size={15} />
            </div>
            <span
              className={`${styles.progStatBadge} ${
                summary.goalCompletionPct >= 100
                  ? styles.badgeGreen
                  : summary.goalCompletionPct >= 70
                    ? styles.badgeBlue
                    : styles.badgeYellow
              }`}
            >
              {summary.goalCompletionPct}% done
            </span>
          </div>
          <div className={styles.progStatNum}>{summary.goalCompletionPct}%</div>
          <div className={styles.progStatLbl}>Goal Completion</div>
        </div>

        {/* 3. Days Active */}
        <div className={styles.progStatCard}>
          <div className={styles.progStatTop}>
            <div className={styles.progStatIcon}>
              <CalendarDays size={15} />
            </div>
            <span className={`${styles.progStatBadge} ${styles.badgeBlue}`}>
              of {summary.daysInMonth}
            </span>
          </div>
          <div className={styles.progStatNum}>{summary.daysActive}</div>
          <div className={styles.progStatLbl}>Days Active</div>
        </div>

        {/* 4. Best Day */}
        <div className={styles.progStatCard}>
          <div className={styles.progStatTop}>
            <div className={styles.progStatIcon}>
              <Star size={15} />
            </div>
            {summary.bestDayNum > 0 ? (
              <span className={`${styles.progStatBadge} ${styles.badgeGreen}`}>
                Day {summary.bestDayNum}
              </span>
            ) : (
              <span className={`${styles.progStatBadge} ${styles.badgeBlue}`}>&mdash;</span>
            )}
          </div>
          <div className={styles.progStatNum}>{summary.bestDayCount}</div>
          <div className={styles.progStatLbl}>Best Day</div>
        </div>

        {/* 5. Pace Status */}
        <div className={styles.progStatCard}>
          <div className={styles.progStatTop}>
            <div className={styles.progStatIcon}>
              <BarChart3 size={15} />
            </div>
            <span
              className={`${styles.progStatBadge} ${
                summary.paceStatus === "ahead"
                  ? styles.badgeGreen
                  : summary.paceStatus === "on-track"
                    ? styles.badgeBlue
                    : styles.badgeYellow
              }`}
            >
              {summary.expectedPct}% elapsed
            </span>
          </div>
          <div className={styles.progStatNum}>
            {summary.paceStatus === "ahead"
              ? "Ahead"
              : summary.paceStatus === "on-track"
                ? "On Track"
                : "Behind"}
          </div>
          <div className={styles.progStatLbl}>Pace Status</div>
        </div>
      </div>

      {/* ── Pace alert ── */}
      {paceAlert && (
        <div
          className={
            paceAlert.status === "ahead"
              ? styles.paceAlertAhead
              : paceAlert.status === "on-track"
                ? styles.paceAlertOnTrack
                : styles.paceAlertBehind
          }
        >
          {paceAlert.status === "ahead" && (
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16" height="16">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            </svg>
          )}
          {paceAlert.status === "on-track" && (
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16" height="16">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          {paceAlert.status === "behind" && (
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16" height="16">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
          <span>
            <strong>{paceAlert.title}</strong> &mdash; {paceAlert.detail}
          </span>
        </div>
      )}

      {/* ── Metric cards: 4-col grid ── */}
      <div className={styles.progMetricsGrid}>
        {metricProgress.map((mp) => (
          <ProgressMetricCard key={mp.key} data={mp} />
        ))}
      </div>

      {/* ── Heatmap ── */}
      <div className={styles.module}>
        <div className={styles.moduleHead}>
          <div className={styles.moduleTitle}>
            <CalendarDays size={16} />
            Daily Activity Heatmap
          </div>
          <div className={styles.moduleBadge}>{summary.daysActive} active days</div>
        </div>
        <div className={styles.progHeatInner}>
          <div className={styles.progHeatDays}>
            {heatmap.map((h) => {
              const height = !h.isPast
                ? 4
                : Math.max(4, Math.round((h.total / heatMax) * 80));
              const bg = !h.isPast
                ? "#d3e4ef"
                : h.total === 0
                  ? "#d3e4ef"
                  : h.total > heatMax * 0.75
                    ? "#0f1f3d"
                    : h.total > heatMax * 0.5
                      ? "#008BC7"
                      : h.total > heatMax * 0.25
                        ? "#3AABF0"
                        : "#bfdbfe";
              return (
                <div key={h.day} className={styles.progHeatCol}>
                  <div
                    className={styles.progHeatBar}
                    style={{ height: `${height}px`, background: bg }}
                    title={h.isPast ? `Day ${h.day}: ${h.total}` : `Day ${h.day}`}
                  />
                  <div className={styles.progHeatDayNum}>{h.day}</div>
                </div>
              );
            })}
          </div>
          <div className={styles.progHeatLegend}>
            <span className={styles.progHeatLegendItem}>
              <span className={styles.progHeatDot} style={{ background: "#d3e4ef" }} />
              No activity
            </span>
            <span className={styles.progHeatLegendItem}>
              <span className={styles.progHeatDot} style={{ background: "#bfdbfe" }} />
              Light
            </span>
            <span className={styles.progHeatLegendItem}>
              <span className={styles.progHeatDot} style={{ background: "#3AABF0" }} />
              Moderate
            </span>
            <span className={styles.progHeatLegendItem}>
              <span className={styles.progHeatDot} style={{ background: "#008BC7" }} />
              Strong
            </span>
            <span className={styles.progHeatLegendItem}>
              <span className={styles.progHeatDot} style={{ background: "#0f1f3d" }} />
              Excellent
            </span>
          </div>
        </div>
      </div>

      {/* ── Logged Contacts This Month ── */}
      <div className={styles.module}>
        <div className={styles.moduleHead}>
          <div className={styles.moduleTitle}>
            <Users size={16} />
            Logged Contacts This Month
          </div>
        </div>
        {data.entries.length === 0 ? (
          <div className={styles.progEntriesEmpty}>
            No logged contacts for this period yet.
          </div>
        ) : (
          <table className={styles.progEntriesTable}>
            <thead>
              <tr>
                <th>Metric</th>
                <th>Name</th>
                <th>Type / Source</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.entries.map((entry) => {
                const cat = metricCatalog.find((mc) => mc.key === entry.metric)!;
                const Icon = cat.icon;
                const grad = METRIC_GRADIENTS[entry.metric] ?? ["#008BC7", "#3AABF0"];
                const isToday = entry.date === format(new Date(), "yyyy-MM-dd");
                const dateLabel = format(
                  new Date(entry.date + "T00:00:00"),
                  "MMM d",
                );
                return (
                  <tr key={entry.id}>
                    <td>
                      <div className={styles.progEntryMetric}>
                        <div
                          className={styles.progEntryMetricIcon}
                          style={{
                            background: `linear-gradient(135deg, ${grad[0]}, ${grad[1]})`,
                          }}
                        >
                          <Icon size={11} color="#fff" />
                        </div>
                        <span className={styles.progEntryMetricLabel}>{cat.label}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 500 }}>{entry.name || "\u2014"}</span>
                      {isToday && (
                        <span className={styles.progTodayBadge}>TODAY</span>
                      )}
                    </td>
                    <td>
                      {entry.type ? (
                        <span className={styles.tdChip}>{entry.type}</span>
                      ) : (
                        <span className={styles.tdChipEmpty}>{"\u2014"}</span>
                      )}
                    </td>
                    <td className={styles.progEntryDate}>{dateLabel}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function SettingsView({ data }: { data: SettingsPageData }) {
  return (
    <form action={updateTrackerSettings} className={styles.settingsForm}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageTitle}>Settings</div>
          <div className={styles.pageMeta}>
            Profile, goals, and preferences stored in Supabase
          </div>
        </div>
        <button className={styles.saveButton} type="submit">
          <Save size={15} />
          Save Changes
        </button>
      </div>

      <section className={styles.settingsSection}>
        <div className={styles.settingsLabel}>
          <User size={14} />
          Profile
        </div>
        <div className={styles.settingsCard}>
          <div className={styles.settingsRow}>
            <div className={styles.settingsField}>
              <label className={styles.settingsFieldLabel} htmlFor="first_name">
                First Name
              </label>
              <input
                className={styles.settingsInput}
                defaultValue={data.profile.firstName}
                id="first_name"
                name="first_name"
              />
            </div>
            <div className={styles.settingsField}>
              <label className={styles.settingsFieldLabel} htmlFor="last_name">
                Last Name
              </label>
              <input
                className={styles.settingsInput}
                defaultValue={data.profile.lastName}
                id="last_name"
                name="last_name"
              />
            </div>
          </div>
          <div className={styles.settingsRow}>
            <div className={styles.settingsField}>
              <label className={styles.settingsFieldLabel} htmlFor="role_title">
                Role / Title
              </label>
              <input
                className={styles.settingsInput}
                defaultValue={data.profile.roleTitle}
                id="role_title"
                name="role_title"
              />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.settingsSection}>
        <div className={styles.settingsLabel}>
          <Target size={14} />
          Activity Goals
        </div>
        <div className={styles.settingsCard}>
          <div className={styles.goalsHeader}>
            <div>Metric</div>
            <div>Daily Goal</div>
            <div>Weekly Goal</div>
            <div>Monthly Est.</div>
          </div>
          {data.metrics.map((metric) => (
            <div key={metric.key} className={styles.goalRow}>
              <div className={styles.goalMetric}>
                <div className={styles.metricIcon}>
                  <metric.icon size={13} />
                </div>
                <span>{metric.key}</span>
              </div>
              <input
                className={styles.settingsInput}
                defaultValue={metric.dailyGoal}
                name={`${metric.key}_daily_goal`}
                type="number"
              />
              <input
                className={styles.settingsInput}
                defaultValue={metric.weeklyGoal}
                name={`${metric.key}_weekly_goal`}
                type="number"
              />
              <div className={styles.pageMeta}>{metric.weeklyGoal * 4}</div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.settingsSection}>
        <div className={styles.settingsLabel}>
          <Settings size={14} />
          Preferences
        </div>
        <div className={styles.settingsCard}>
          <div className={styles.settingsRow}>
            <div className={styles.settingsField}>
              <label className={styles.settingsFieldLabel} htmlFor="sync_hour">
                Auto-Sync Time
              </label>
              <div className={styles.settingsHint}>
                Stored in Supabase for your account only
              </div>
              <select
                className={styles.settingsInput}
                defaultValue={String(data.profile.syncHour)}
                id="sync_hour"
                name="sync_hour"
              >
                <option value="16">4:00 PM</option>
                <option value="17">5:00 PM</option>
                <option value="18">6:00 PM</option>
                <option value="19">7:00 PM</option>
                <option value="20">8:00 PM</option>
              </select>
            </div>
            <div className={styles.settingsField}>
              <label className={styles.settingsFieldLabel} htmlFor="default_view">
                Default View
              </label>
              <div className={styles.settingsHint}>
                Used when you return to the app later
              </div>
              <select
                className={styles.settingsInput}
                defaultValue={data.profile.defaultView}
                id="default_view"
                name="default_view"
              >
                <option value="dashboard">Dashboard</option>
                <option value="activity">Activity Log</option>
                <option value="progress">Progress</option>
                <option value="settings">Settings</option>
              </select>
            </div>
          </div>
        </div>
      </section>
    </form>
  );
}

const VIEW_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  activity: "Activity Log",
  progress: "Progress",
  contacts: "Contacts",
  settings: "Settings",
};

export function TrackerShell(props: TrackerShellProps) {
  const title = VIEW_TITLES[props.view] ?? "Dashboard";
  const profile = props.data.profile as TrackerProfile;
  const dailyScore = "dailyScore" in props.data ? (props.data as { dailyScore: number }).dailyScore : 0;
  const streak: StreakData = props.data.streak;

  return (
    <main className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <svg width="220" height="52" viewBox="0 0 220 52" xmlns="http://www.w3.org/2000/svg">
            <text x="0" y="38" fontFamily="'Poppins',sans-serif" fontSize="38" fontWeight="900" fill="white" letterSpacing="-2" fontStyle="italic">BAYOU OS</text>
            <line x1="0" y1="44" x2="218" y2="44" stroke="white" strokeWidth="1.5" opacity="0.2"/>
            <text x="1" y="52" fontFamily="'Poppins',sans-serif" fontSize="9" fontWeight="600" fill="rgba(255,255,255,0.5)" letterSpacing="4">SALES OPERATING SYSTEM</text>
          </svg>
        </div>
        <div className={styles.sidebarLabel}>Workspace</div>
        <ul className={styles.navList}>
          {navItems.map(({ href, label, icon: Icon, view }) => (
            <li key={href}>
              <Link
                className={props.view === view ? styles.navLinkActive : styles.navLink}
                href={href}
              >
                <Icon size={16} />
                {label}
              </Link>
            </li>
          ))}
        </ul>
        <div className={styles.sidebarBottom}>
          <div className={styles.sidebarUser}>
            <div className={styles.avatar}>{profile.initials}</div>
            <div>
              <div className={styles.userName}>
                {profile.lastName && profile.lastName !== profile.firstName
                  ? `${profile.firstName} ${profile.lastName}`
                  : profile.firstName}
              </div>
              <div className={styles.userRole}>{profile.roleTitle}</div>
            </div>
          </div>
        </div>
      </aside>

      <div className={styles.main}>
        <div className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <div className={styles.topbarTitle}>{title}</div>
            <div className={styles.topbarDate}>{format(new Date(), "EEEE, MMMM d")}</div>
          </div>
          <div className={styles.topbarRight}>
            <StreakPopover streak={streak}>
              <div className={streak.currentStreak > 0 ? styles.streakPillActive : styles.streakPill}>
                <span className={streak.currentStreak > 0 ? styles.streakFlame : styles.streakFlameDim}>
                  🔥
                </span>
                <span>
                  {streak.currentStreak} day{streak.currentStreak === 1 ? "" : " "}streak
                </span>
              </div>
            </StreakPopover>
            <div className={styles.scoreBadge}>
              <TrendingUp size={14} />
              <span>{dailyScore} / 100</span> pts
            </div>
            <ActivityLogger />
          </div>
        </div>

        <div className={styles.content}>
          <FlashMessage flash={props.flash} />
          {props.view === "dashboard" ? <DashboardView data={props.data} /> : null}
          {props.view === "activity" ? <ActivityView data={props.data} /> : null}
          {props.view === "progress" ? <ProgressView data={props.data} /> : null}
          {props.view === "contacts" ? <ContactsViewClient data={props.data} /> : null}
          {props.view === "settings" ? <SettingsView data={props.data} /> : null}
        </div>
      </div>
    </main>
  );
}
