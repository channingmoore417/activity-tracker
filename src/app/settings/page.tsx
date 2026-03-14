import { TrackerShell } from "@/components/tracker-shell";
import { getFlashMessage, getSettingsPageData } from "@/lib/db/tracker";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const data = await getSettingsPageData();

  return (
    <TrackerShell
      data={data}
      flash={getFlashMessage({
        error: typeof params.error === "string" ? params.error : undefined,
        saved: typeof params.saved === "string" ? params.saved : undefined,
      })}
      view="settings"
    />
  );
}
