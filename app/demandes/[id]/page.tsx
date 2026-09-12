import { DAPane } from "@/components/panes/DAPane";

export default async function DADetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DAPane id={id} />;
}
