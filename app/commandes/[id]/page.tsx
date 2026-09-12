import { POPane } from "@/components/panes/POPane";

export default async function PODetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <POPane id={id} />;
}
