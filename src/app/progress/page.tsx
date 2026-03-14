import { TrackerShell } from "@/components/tracker-shell";
import { getProgressPageData } from "@/lib/db/tracker";

export default async function ProgressPage() {
  const data = await getProgressPageData();

  return <TrackerShell data={data} view="progress" />;
}
