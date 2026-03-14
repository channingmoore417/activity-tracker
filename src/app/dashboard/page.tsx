import { TrackerShell } from "@/components/tracker-shell";
import { getDashboardPageData } from "@/lib/db/tracker";

export default async function DashboardPage() {
  const data = await getDashboardPageData();

  return <TrackerShell data={data} view="dashboard" />;
}
