import {
  CalendarCheck2,
  CalendarClock,
  Clock3,
  FileCheck2,
  Handshake,
  MessagesSquare,
  Phone,
  UserRoundPlus,
  type LucideIcon,
} from "lucide-react";

export const metricKeys = [
  "calls",
  "leads",
  "convs",
  "appts",
  "apps",
  "locked",
  "past",
  "followups",
] as const;

export type MetricKey = (typeof metricKeys)[number];

export type MetricCatalogItem = {
  key: MetricKey;
  label: string;
  icon: LucideIcon;
  color: string;
  defaultDailyGoal: number;
  defaultWeeklyGoal: number;
};

export const metricCatalog: MetricCatalogItem[] = [
  {
    key: "calls",
    label: "Calls",
    icon: Phone,
    color: "#008BC7",
    defaultDailyGoal: 50,
    defaultWeeklyGoal: 250,
  },
  {
    key: "leads",
    label: "Leads",
    icon: UserRoundPlus,
    color: "#16a34a",
    defaultDailyGoal: 8,
    defaultWeeklyGoal: 40,
  },
  {
    key: "convs",
    label: "Conversations",
    icon: MessagesSquare,
    color: "#3AABF0",
    defaultDailyGoal: 15,
    defaultWeeklyGoal: 75,
  },
  {
    key: "appts",
    label: "Appointments",
    icon: CalendarCheck2,
    color: "#ca8a04",
    defaultDailyGoal: 4,
    defaultWeeklyGoal: 20,
  },
  {
    key: "apps",
    label: "Applications",
    icon: FileCheck2,
    color: "#172852",
    defaultDailyGoal: 3,
    defaultWeeklyGoal: 15,
  },
  {
    key: "locked",
    label: "Locked Loans",
    icon: Handshake,
    color: "#7c3aed",
    defaultDailyGoal: 2,
    defaultWeeklyGoal: 10,
  },
  {
    key: "past",
    label: "Past Clients",
    icon: Clock3,
    color: "#ea580c",
    defaultDailyGoal: 10,
    defaultWeeklyGoal: 50,
  },
  {
    key: "followups",
    label: "Follow Ups",
    icon: CalendarClock,
    color: "#0f766e",
    defaultDailyGoal: 12,
    defaultWeeklyGoal: 60,
  },
];

export function getMetricCatalogItem(metric: MetricKey) {
  return metricCatalog.find((item) => item.key === metric)!;
}
