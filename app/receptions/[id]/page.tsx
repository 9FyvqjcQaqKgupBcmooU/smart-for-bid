import { GRPane } from "@/components/panes/GRPane";

export default async function GRDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GRPane id={id} />;
}
