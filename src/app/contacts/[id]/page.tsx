import { notFound } from "next/navigation";
import { getContactDetailData } from "@/lib/db/tracker";
import { ContactDetailView } from "@/components/contact-detail-view";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getContactDetailData(id);
  if (!data) notFound();

  return <ContactDetailView data={data} />;
}
