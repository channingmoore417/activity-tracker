import { TrackerShell } from "@/components/tracker-shell";
import { getContactsPageData } from "@/lib/db/tracker";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const data = await getContactsPageData({
    search: typeof params.search === "string" ? params.search : undefined,
    type: typeof params.type === "string" ? params.type : undefined,
  });

  return <TrackerShell data={data} view="contacts" />;
}
