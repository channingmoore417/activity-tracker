import Link from "next/link";
import {
  Activity,
  CalendarDays,
  CalendarRange,
  LayoutDashboard,
  Plus,
  Search,
  Settings,
  Sparkles,
  Target,
  User,
} from "lucide-react";
import {
  activityEntries,
  metricDefinitions,
  monthlySummaryCards,
} from "@/lib/tracker-data";
import styles from "./tracker-shell.module.css";

type View = "dashboard" | "activity" | "progress" | "settings";

type TrackerShellProps = {
  view: View;
};

const navItems = [
  { href: "/dashboard", label: "Dashboard", view: "dashboard", icon: LayoutDashboard },
  { href: "/activity", label: "Activity Log", view: "activity", icon: Activity },
  { href: "/progress", label: "Progress", view: "progress", icon: CalendarRange },
  { href: "/settings", label: "Settings", view: "settings", icon: Settings },
] as const;

function Ring({ value, goal, color }: { value: number; goal: number; color: string }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / goal, 1);
  const dashoffset = circumference * (1 - progress);

  return (
    <div className={styles.ringWrap}>
      <svg height="64" width="64">
        <circle
          cx="32"
          cy="32"
          fill="none"
          r={radius}
          stroke="#d3e4ef"
          strokeWidth="7"
        />
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

function DashboardView() {
  const total = metricDefinitions.reduce((sum, metric) => sum + metric.current, 0);
  const goal = metricDefinitions.reduce((sum, metric) => sum + metric.dailyGoal, 0);

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
            Total: <span>{total}</span>
          </div>
        </div>
        <div className={styles.barWrap}>
          <div className={styles.barTrack}>
            <div
              className={styles.barFill}
              style={{ width: `${Math.min((total / goal) * 100, 100)}%` }}
            />
          </div>
        </div>
        <ul className={styles.metricList}>
          {metricDefinitions.map((metric) => {
            const Icon = metric.icon;
            return (
              <li key={metric.key} className={styles.metricRow}>
                <div className={styles.metricIcon}>
                  <Icon size={13} />
                </div>
                <div className={styles.metricName}>{metric.key}</div>
                <div className={styles.metricCount}>{metric.current}</div>
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
          {metricDefinitions.map((metric) => (
            <div key={metric.key} className={styles.ringCard}>
              <Ring color={metric.color} goal={metric.dailyGoal} value={metric.current} />
              <div className={styles.ringName}>{metric.key}</div>
              <div className={styles.ringSub}>
                {metric.current} / {metric.dailyGoal}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ActivityView() {
  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageTitle}>Activity Log</div>
          <div className={styles.pageMeta}>Today&apos;s logged activity</div>
        </div>
        <button className={styles.actionButton} type="button">
          <Plus size={16} />
          Record Activity
        </button>
      </div>

      <div className={styles.statsStrip}>
        {metricDefinitions.slice(0, 4).map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.key} className={styles.statPill}>
              <div className={styles.statPillIcon}>
                <Icon size={13} />
              </div>
              <div>
                <div className={styles.statNum}>{metric.current}</div>
                <div className={styles.statLabel}>{metric.key}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.filterBar}>
        <div className={styles.searchWrap}>
          <Search className={styles.searchIcon} size={14} />
          <input className={styles.searchInput} placeholder="Search by name..." />
        </div>
        <select className={styles.select} defaultValue="">
          <option value="">All Metrics</option>
          {metricDefinitions.map((metric) => (
            <option key={metric.key} value={metric.key}>
              {metric.key}
            </option>
          ))}
        </select>
        <select className={styles.select} defaultValue="">
          <option value="">All Types</option>
          <option value="Outbound">Outbound</option>
          <option value="Referral">Referral</option>
          <option value="Warm Lead">Warm Lead</option>
        </select>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Name</th>
              <th>Type</th>
              <th>Count</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {activityEntries.map((entry) => {
              const metric = metricDefinitions.find((item) => item.key === entry.metric)!;
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
                  <td>{entry.time}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ProgressView() {
  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageTitle}>Monthly Progress</div>
          <div className={styles.pageMeta}>Performance overview for the month</div>
        </div>
        <button className={styles.actionButton} type="button">
          <CalendarRange size={16} />
          Export PDF
        </button>
      </div>

      <div className={styles.summaryStrip}>
        {monthlySummaryCards.map((card, index) => {
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
        You are slightly behind pace on appts and apps, but calls and followups are
        carrying the month.
      </div>

      <div className={styles.metricGrid}>
        {metricDefinitions.map((metric) => {
          const pct = Math.round((metric.current / metric.dailyGoal) * 100);
          return (
            <div key={metric.key} className={styles.metricCard}>
              <div className={styles.metricCardHead}>
                <div className={styles.metricCardTitle}>
                  <div className={styles.metricIcon}>
                    <metric.icon size={13} />
                  </div>
                  <div className={styles.metricName}>{metric.key}</div>
                </div>
                <div className={styles.metricPercent}>{pct}%</div>
              </div>
              <div className={styles.metricRingRow}>
                <Ring color={metric.color} goal={metric.dailyGoal} value={metric.current} />
                <div className={styles.metricStats}>
                  <div className={styles.metricStatRow}>
                    <span className={styles.metricStatLabel}>Today</span>
                    <span className={styles.metricStatValue}>{metric.current}</span>
                  </div>
                  <div className={styles.metricStatRow}>
                    <span className={styles.metricStatLabel}>Goal</span>
                    <span className={styles.metricStatValue}>{metric.dailyGoal}</span>
                  </div>
                  <div className={styles.metricStatRow}>
                    <span className={styles.metricStatLabel}>Weekly</span>
                    <span className={styles.metricStatValue}>{metric.weeklyGoal}</span>
                  </div>
                </div>
              </div>
              <div className={styles.barChart}>
                {metric.bars.map((bar, index) => (
                  <div
                    key={`${metric.key}-${index}`}
                    className={styles.dayBar}
                    style={{ background: metric.color, height: `${Math.max(bar * 3, 4)}px` }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div className={styles.panelTitle}>
            <CalendarDays size={16} />
            Daily Activity - All Metrics
          </div>
          <div className={styles.panelBadge}>March 2026</div>
        </div>
        <div className={styles.heatmapWrap}>
          <div className={styles.heatmapRow}>
            {Array.from({ length: 31 }, (_, index) => {
              const height = 8 + ((index * 7) % 48);
              const hue = index % 3 === 0 ? "#008bc7" : index % 3 === 1 ? "#3aabf0" : "#172852";
              return (
                <div key={index + 1} className={styles.heatColumn}>
                  <div className={styles.heatDay}>{index + 1}</div>
                  <div className={styles.heatBar} style={{ background: hue, height }} />
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}

function SettingsView() {
  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageTitle}>Settings</div>
          <div className={styles.pageMeta}>
            Manage your goals, profile, and preferences
          </div>
        </div>
        <button className={styles.saveButton} type="button">
          <Settings size={15} />
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
              <label className={styles.settingsFieldLabel}>Full Name</label>
              <input className={styles.settingsInput} defaultValue="Channing Moore" />
            </div>
            <div className={styles.settingsField}>
              <label className={styles.settingsFieldLabel}>Role / Title</label>
              <input className={styles.settingsInput} defaultValue="Loan Officer" />
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
          {metricDefinitions.map((metric) => (
            <div key={metric.key} className={styles.goalRow}>
              <div className={styles.goalMetric}>
                <div className={styles.metricIcon}>
                  <metric.icon size={13} />
                </div>
                <span>{metric.key}</span>
              </div>
              <input className={styles.settingsInput} defaultValue={metric.dailyGoal} />
              <input className={styles.settingsInput} defaultValue={metric.weeklyGoal} />
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
              <label className={styles.settingsFieldLabel}>Auto-Sync Time</label>
              <div className={styles.settingsHint}>
                Activities automatically sync to Google Sheets at this time each day
              </div>
              <select className={styles.settingsInput} defaultValue="6:00 PM">
                <option>4:00 PM</option>
                <option>5:00 PM</option>
                <option>6:00 PM</option>
                <option>7:00 PM</option>
              </select>
            </div>
            <div className={styles.settingsField}>
              <label className={styles.settingsFieldLabel}>Default View</label>
              <div className={styles.settingsHint}>
                Which page opens when you first load the tracker
              </div>
              <select className={styles.settingsInput} defaultValue="Dashboard">
                <option>Dashboard</option>
                <option>Activity Log</option>
                <option>Progress</option>
              </select>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export function TrackerShell({ view }: TrackerShellProps) {
  const totalScore = metricDefinitions.reduce((sum, metric) => sum + metric.current, 0);
  const title =
    view === "dashboard"
      ? "Dashboard"
      : view === "activity"
        ? "Activity Log"
        : view === "progress"
          ? "Progress"
          : "Settings";

  return (
    <main className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <div className={styles.sidebarLogoText}>Bayou</div>
          <div className={styles.sidebarLogoSub}>Activity Tracker</div>
        </div>
        <div className={styles.sidebarLabel}>Workspace</div>
        <ul className={styles.navList}>
          {navItems.map(({ href, label, icon: Icon, view: navView }) => (
            <li key={href}>
              <Link
                className={view === navView ? styles.navLinkActive : styles.navLink}
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
            <div className={styles.avatar}>CM</div>
            <div>
              <div className={styles.userName}>Channing Moore</div>
              <div className={styles.userRole}>Loan Officer</div>
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
                Weekly
              </button>
            </div>
            <div className={styles.scoreBadge}>
              <Sparkles size={15} />
              {totalScore} pts
            </div>
            <button className={styles.actionButton} type="button">
              <Plus size={16} />
              Record Activity
            </button>
          </div>
        </div>

        <div className={styles.content}>
          {view === "dashboard" ? <DashboardView /> : null}
          {view === "activity" ? <ActivityView /> : null}
          {view === "progress" ? <ProgressView /> : null}
          {view === "settings" ? <SettingsView /> : null}
        </div>
      </div>
    </main>
  );
}
