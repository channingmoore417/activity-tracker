import {
  Banknote,
  MessagesSquare,
  Phone,
  Share2,
  ThumbsUp,
  UserRoundPlus,
  type LucideIcon,
} from "lucide-react";

export const metricKeys = [
  "calls",
  "convs",
  "leads",
  "credits",
  "social_posts",
  "social_engagements",
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
    defaultDailyGoal: 20,
    defaultWeeklyGoal: 100,
  },
  {
    key: "convs",
    label: "Conversations",
    icon: MessagesSquare,
    color: "#3AABF0",
    defaultDailyGoal: 10,
    defaultWeeklyGoal: 50,
  },
  {
    key: "leads",
    label: "Leads",
    icon: UserRoundPlus,
    color: "#16a34a",
    defaultDailyGoal: 4,
    defaultWeeklyGoal: 20,
  },
  {
    key: "credits",
    label: "Credit Pulls",
    icon: Banknote,
    color: "#008BC7",
    defaultDailyGoal: 2,
    defaultWeeklyGoal: 10,
  },
  {
    key: "social_posts",
    label: "Social Posts",
    icon: Share2,
    color: "#7c3aed",
    defaultDailyGoal: 1,
    defaultWeeklyGoal: 5,
  },
  {
    key: "social_engagements",
    label: "Social Engagements",
    icon: ThumbsUp,
    color: "#e11d48",
    defaultDailyGoal: 5,
    defaultWeeklyGoal: 25,
  },
];

export function getMetricCatalogItem(metric: MetricKey) {
  return metricCatalog.find((item) => item.key === metric)!;
}
