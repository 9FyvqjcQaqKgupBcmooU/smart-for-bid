import { AOPane } from "@/components/panes/AOPane";

export default async function TenderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AOPane id={id} />;
}
