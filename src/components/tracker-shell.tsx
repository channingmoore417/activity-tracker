import Link from "next/link";
import {
  AlertCircle,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  LayoutDashboard,
  Plus,
  Save,
  Search,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  User,
} from "lucide-react";
import { createActivityEntry, updateTrackerSettings } from "@/lib/db/tracker-actions";
import { metricCatalog } from "@/lib/tracker-data";
import type {
  ActivityPageData,
  DashboardData,
  ProgressPageData,
  SettingsPageData,
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
  | { view: "settings"; data: SettingsPageData; flash?: TrackerFlash };

const navItems = [
  { href: "/dashboard", label: "Dashboard", view: "dashboard", icon: LayoutDashboard },
  { href: "/activity", label: "Activity Log", view: "activity", icon: TrendingUp },
  { href: "/progress", label: "Progress", view: "progress", icon: CalendarRange },
  { href: "/settings", label: "Settings", view: "settings", icon: Settings },
] as const;

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
  return (
    <div className={styles.dashboardGrid}>
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div className={styles.panelTitle}>
            <Target size={16} />
            Daily Progress
          </div>
          <div className={styles.panelBadge}>Today</div>
        </div>
        <div className={styles.summaryRow}>
          <div className={styles.summaryLabel}>
            <CalendarDays size={13} />
            Today&apos;s Activity
          </div>
          <div className={styles.summaryTotal}>
            Total: <span>{data.totalToday}</span>
          </div>
        </div>
        <div className={styles.barWrap}>
          <div className={styles.barTrack}>
            <div
              className={styles.barFill}
              style={{
                width: `${Math.min((data.totalToday / Math.max(data.totalDailyGoal, 1)) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
        <ul className={styles.metricList}>
          {data.metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <li key={metric.key} className={styles.metricRow}>
                <div className={styles.metricIcon}>
                  <Icon size={13} />
                </div>
                <div className={styles.metricName}>{metric.key}</div>
                <div className={styles.metricCount}>{metric.todayCount}</div>
                <div className={styles.metricGoal}>/ {metric.dailyGoal}</div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div className={styles.panelTitle}>
            <Sparkles size={16} />
            Goal Progress
          </div>
          <div className={styles.panelBadge}>vs Goal</div>
        </div>
        <div className={styles.ringsGrid}>
          {data.metrics.map((metric) => (
            <div key={metric.key} className={styles.ringCard}>
              <Ring color={metric.color} goal={metric.dailyGoal} value={metric.todayCount} />
              <div className={styles.ringName}>{metric.key}</div>
              <div className={styles.ringSub}>
                {metric.todayCount} / {metric.dailyGoal}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ActivityEntryForm() {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}>
          <Plus size={16} />
          Record Activity
        </div>
        <div className={styles.panelBadge}>Supabase</div>
      </div>
      <form action={createActivityEntry} className={styles.activityForm}>
        <div className={styles.formGrid}>
          <div className={styles.formField}>
            <label className={styles.formLabel} htmlFor="metric">
              Metric
            </label>
            <select className={styles.formInput} defaultValue="calls" id="metric" name="metric">
              {metricCatalog.map((metric) => (
                <option key={metric.key} value={metric.key}>
                  {metric.key}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel} htmlFor="contact_name">
              Contact Name
            </label>
            <input
              className={styles.formInput}
              id="contact_name"
              name="contact_name"
              placeholder="Angela Morris"
              required
            />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel} htmlFor="activity_type">
              Type
            </label>
            <input
              className={styles.formInput}
              id="activity_type"
              name="activity_type"
              placeholder="Outbound"
              required
            />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel} htmlFor="count">
              Count
            </label>
            <input
              className={styles.formInput}
              defaultValue="1"
              id="count"
              max="500"
              min="1"
              name="count"
              required
              type="number"
            />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel} htmlFor="activity_date">
              Activity Date
            </label>
            <input
              className={styles.formInput}
              defaultValue={new Date().toISOString().slice(0, 10)}
              id="activity_date"
              name="activity_date"
              required
              type="date"
            />
          </div>
          <div className={styles.formFieldFull}>
            <label className={styles.formLabel} htmlFor="notes">
              Notes
            </label>
            <textarea
              className={styles.formTextarea}
              id="notes"
              name="notes"
              placeholder="Optional notes about the activity"
              rows={3}
            />
          </div>
        </div>
        <div className={styles.formActions}>
          <button className={styles.actionButton} type="submit">
            <Save size={16} />
            Save Activity
          </button>
        </div>
      </form>
    </section>
  );
}

function ActivityTable({ entries }: { entries: TrackerActivityEntry[] }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Name</th>
            <th>Type</th>
            <th>Count</th>
            <th>Date</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 ? (
            <tr>
              <td className={styles.emptyRow} colSpan={6}>
                No activity entries match the current filters yet.
              </td>
            </tr>
          ) : (
            entries.map((entry) => {
              const metric = metricCatalog.find((item) => item.key === entry.metric)!;
              const Icon = metric.icon;

              return (
                <tr key={entry.id}>
                  <td>
                    <div className={styles.tableMetric}>
                      <div className={styles.metricIcon}>
                        <Icon size={12} />
                      </div>
                      {entry.metric}
                    </div>
                  </td>
                  <td>{entry.name}</td>
                  <td>
                    <span className={styles.chip}>{entry.type}</span>
                  </td>
                  <td>{entry.count}</td>
                  <td>{entry.date}</td>
                  <td>{entry.time}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function ActivityView({ data }: { data: ActivityPageData }) {
  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageTitle}>Activity Log</div>
          <div className={styles.pageMeta}>Your real activity entries from Supabase</div>
        </div>
        <Link className={styles.actionButton} href="#activity-form">
          <Plus size={16} />
          Record Activity
        </Link>
      </div>

      <div className={styles.statsStrip}>
        {data.metrics.slice(0, 4).map((metric) => {
          const Icon = metric.icon;

          return (
            <div key={metric.key} className={styles.statPill}>
              <div className={styles.statPillIcon}>
                <Icon size={13} />
              </div>
              <div>
                <div className={styles.statNum}>{metric.todayCount}</div>
                <div className={styles.statLabel}>{metric.key}</div>
              </div>
            </div>
          );
        })}
      </div>

      <form className={styles.filterBar} method="get">
        <div className={styles.searchWrap}>
          <Search className={styles.searchIcon} size={14} />
          <input
            className={styles.searchInput}
            defaultValue={data.filters.search}
            name="search"
            placeholder="Search by name..."
          />
        </div>
        <select className={styles.select} defaultValue={data.filters.metric} name="metric">
          <option value="">All Metrics</option>
          {metricCatalog.map((metric) => (
            <option key={metric.key} value={metric.key}>
              {metric.key}
            </option>
          ))}
        </select>
        <input
          className={styles.select}
          defaultValue={data.filters.activityType}
          name="activityType"
          placeholder="Type"
        />
        <button className={styles.secondaryButton} type="submit">
          Apply
        </button>
      </form>

      <div id="activity-form">
        <ActivityEntryForm />
      </div>

      <ActivityTable entries={data.entries} />
    </>
  );
}

function MetricProgressCard({ metric }: { metric: TrackerMetric }) {
  const percentage = metric.dailyGoal > 0 ? Math.round((metric.todayCount / metric.dailyGoal) * 100) : 0;

  return (
    <div className={styles.metricCard}>
      <div className={styles.metricCardHead}>
        <div className={styles.metricCardTitle}>
          <div className={styles.metricIcon}>
            <metric.icon size={13} />
          </div>
          <div className={styles.metricName}>{metric.key}</div>
        </div>
        <div className={styles.metricPercent}>{percentage}%</div>
      </div>
      <div className={styles.metricRingRow}>
        <Ring color={metric.color} goal={metric.dailyGoal} value={metric.todayCount} />
        <div className={styles.metricStats}>
          <div className={styles.metricStatRow}>
            <span className={styles.metricStatLabel}>Today</span>
            <span className={styles.metricStatValue}>{metric.todayCount}</span>
          </div>
          <div className={styles.metricStatRow}>
            <span className={styles.metricStatLabel}>Daily Goal</span>
            <span className={styles.metricStatValue}>{metric.dailyGoal}</span>
          </div>
          <div className={styles.metricStatRow}>
            <span className={styles.metricStatLabel}>Monthly Total</span>
            <span className={styles.metricStatValue}>{metric.monthCount}</span>
          </div>
        </div>
      </div>
      <div className={styles.barChart}>
        {metric.bars.map((bar, index) => (
          <div
            key={`${metric.key}-${index}`}
            className={styles.dayBar}
            style={{ background: metric.color, height: `${Math.max(bar * 5, 4)}px` }}
          />
        ))}
      </div>
    </div>
  );
}

function ProgressView({ data }: { data: ProgressPageData }) {
  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageTitle}>Monthly Progress</div>
          <div className={styles.pageMeta}>Calculated from saved activity and live goals</div>
        </div>
        <div className={styles.actionButton}>
          <CalendarRange size={16} />
          Live Summary
        </div>
      </div>

      <div className={styles.summaryStrip}>
        {data.summaryCards.map((card, index) => {
          const highlight = index === 0;

          return (
            <div
              key={card.label}
              className={highlight ? styles.summaryCardHighlight : styles.summaryCard}
            >
              <div className={styles.summaryCardTop}>
                <div className={styles.metricIcon}>
                  <Sparkles size={14} />
                </div>
                <span className={styles.summaryBadge}>{card.badge}</span>
              </div>
              <div className={highlight ? styles.summaryValueLight : styles.summaryValue}>
                {card.value}
              </div>
              <div className={highlight ? styles.summaryTextLight : styles.summaryText}>
                {card.label}
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.paceAlert}>
        <Target size={16} />
        {data.paceMessage}
      </div>

      <div className={styles.metricGrid}>
        {data.metrics.map((metric) => (
          <MetricProgressCard key={metric.key} metric={metric} />
        ))}
      </div>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div className={styles.panelTitle}>
            <CalendarDays size={16} />
            Daily Activity - All Metrics
          </div>
          <div className={styles.panelBadge}>This Month</div>
        </div>
        <div className={styles.heatmapWrap}>
          <div className={styles.heatmapRow}>
            {data.heatmap.map((item) => (
              <div key={item.day} className={styles.heatColumn}>
                <div className={styles.heatDay}>{item.day}</div>
                <div
                  className={styles.heatBar}
                  style={{ background: item.color, height: `${Math.max(item.total * 3, 6)}px` }}
                  title={`${item.total} activities`}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
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
              <label className={styles.settingsFieldLabel} htmlFor="full_name">
                Full Name
              </label>
              <input
                className={styles.settingsInput}
                defaultValue={data.profile.fullName}
                id="full_name"
                name="full_name"
              />
            </div>
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

export function TrackerShell(props: TrackerShellProps) {
  const title =
    props.view === "dashboard"
      ? "Dashboard"
      : props.view === "activity"
        ? "Activity Log"
        : props.view === "progress"
          ? "Progress"
          : "Settings";

  const profile = props.data.profile as TrackerProfile;
  const score = props.data.metrics.reduce((sum, metric) => sum + metric.todayCount, 0);

  return (
    <main className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <div className={styles.sidebarLogoText}>Bayou</div>
          <div className={styles.sidebarLogoSub}>Activity Tracker</div>
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
              <div className={styles.userName}>{profile.fullName}</div>
              <div className={styles.userRole}>{profile.roleTitle}</div>
            </div>
          </div>
        </div>
      </aside>

      <div className={styles.main}>
        <div className={styles.topbar}>
          <div className={styles.topbarTitle}>
            <LayoutDashboard size={20} />
            {title}
          </div>
          <div className={styles.topbarRight}>
            <div className={styles.periodToggle}>
              <button className={styles.periodButtonActive} type="button">
                Daily
              </button>
              <button className={styles.periodButton} type="button">
                Monthly
              </button>
            </div>
            <div className={styles.scoreBadge}>
              <Sparkles size={15} />
              {score} pts
            </div>
          </div>
        </div>

        <div className={styles.content}>
          <FlashMessage flash={props.flash} />
          {props.view === "dashboard" ? <DashboardView data={props.data} /> : null}
          {props.view === "activity" ? <ActivityView data={props.data} /> : null}
          {props.view === "progress" ? <ProgressView data={props.data} /> : null}
          {props.view === "settings" ? <SettingsView data={props.data} /> : null}
        </div>
      </div>
    </main>
  );
}
