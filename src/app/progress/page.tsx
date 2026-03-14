import { TrackerShell } from "@/components/tracker-shell";
import { getProgressPageData } from "@/lib/db/tracker";

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const data = await getProgressPageData(
    typeof params.month === "string" ? params.month : undefined,
  );

  return <TrackerShell data={data} view="progress" />;
}
