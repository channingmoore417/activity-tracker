import { TrackerShell } from "@/components/tracker-shell";
import { getActivityPageData, getFlashMessage } from "@/lib/db/tracker";

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const data = await getActivityPageData({
    search: typeof params.search === "string" ? params.search : "",
    metric: typeof params.metric === "string" ? params.metric : "",
    activityType: typeof params.activityType === "string" ? params.activityType : "",
    sort: typeof params.sort === "string" ? params.sort : "",
  });

  return (
    <TrackerShell
      data={data}
      flash={getFlashMessage({
        error: typeof params.error === "string" ? params.error : undefined,
        saved: typeof params.saved === "string" ? params.saved : undefined,
      })}
      view="activity"
    />
  );
}
