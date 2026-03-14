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

export type MetricKey =
  | "calls"
  | "leads"
  | "convs"
  | "appts"
  | "apps"
  | "locked"
  | "past"
  | "followups";

export type MetricDefinition = {
  key: MetricKey;
  label: string;
  icon: LucideIcon;
  dailyGoal: number;
  weeklyGoal: number;
  current: number;
  color: string;
  bars: number[];
};

export const metricDefinitions: MetricDefinition[] = [
  {
    key: "calls",
    label: "Calls",
    icon: Phone,
    dailyGoal: 50,
    weeklyGoal: 250,
    current: 34,
    color: "#008BC7",
    bars: [4, 7, 9, 8, 12, 10, 11],
  },
  {
    key: "leads",
    label: "Leads",
    icon: UserRoundPlus,
    dailyGoal: 8,
    weeklyGoal: 40,
    current: 6,
    color: "#16a34a",
    bars: [1, 2, 3, 4, 3, 5, 4],
  },
  {
    key: "convs",
    label: "Convs",
    icon: MessagesSquare,
    dailyGoal: 15,
    weeklyGoal: 75,
    current: 11,
    color: "#3AABF0",
    bars: [2, 3, 4, 5, 4, 6, 5],
  },
  {
    key: "appts",
    label: "Appts",
    icon: CalendarCheck2,
    dailyGoal: 4,
    weeklyGoal: 20,
    current: 3,
    color: "#ca8a04",
    bars: [0, 1, 1, 2, 2, 3, 2],
  },
  {
    key: "apps",
    label: "Apps",
    icon: FileCheck2,
    dailyGoal: 3,
    weeklyGoal: 15,
    current: 2,
    color: "#172852",
    bars: [0, 1, 1, 1, 2, 2, 2],
  },
  {
    key: "locked",
    label: "Locked",
    icon: Handshake,
    dailyGoal: 2,
    weeklyGoal: 10,
    current: 1,
    color: "#7c3aed",
    bars: [0, 0, 1, 1, 1, 1, 1],
  },
  {
    key: "past",
    label: "Past",
    icon: Clock3,
    dailyGoal: 10,
    weeklyGoal: 50,
    current: 7,
    color: "#ea580c",
    bars: [1, 1, 2, 2, 3, 3, 4],
  },
  {
    key: "followups",
    label: "Followups",
    icon: CalendarClock,
    dailyGoal: 12,
    weeklyGoal: 60,
    current: 9,
    color: "#0f766e",
    bars: [2, 3, 4, 4, 5, 6, 5],
  },
];

export const activityEntries = [
  {
    id: 1,
    metric: "calls",
    name: "Angela Morris",
    type: "Outbound",
    count: 4,
    time: "8:15 AM",
  },
  {
    id: 2,
    metric: "leads",
    name: "Marcus Dorsey",
    type: "Referral",
    count: 1,
    time: "9:05 AM",
  },
  {
    id: 3,
    metric: "convs",
    name: "Tina Alvarez",
    type: "Warm Lead",
    count: 2,
    time: "10:42 AM",
  },
  {
    id: 4,
    metric: "appts",
    name: "Jordan Kelly",
    type: "Booked",
    count: 1,
    time: "11:30 AM",
  },
  {
    id: 5,
    metric: "apps",
    name: "Lydia Chen",
    type: "Submitted",
    count: 1,
    time: "1:20 PM",
  },
  {
    id: 6,
    metric: "followups",
    name: "Samuel Reed",
    type: "Past Client",
    count: 3,
    time: "3:10 PM",
  },
];

export const monthlySummaryCards = [
  { label: "Month Score", value: "428", badge: "Ahead", tone: "blue" },
  { label: "Goal Hit Rate", value: "82%", badge: "+8%", tone: "green" },
  { label: "Best Streak", value: "12", badge: "days", tone: "yellow" },
  { label: "Pace Gap", value: "6", badge: "to goal", tone: "red" },
  { label: "Logged Entries", value: "96", badge: "this month", tone: "blue" },
];
