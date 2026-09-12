import { FAPane } from "@/components/panes/FAPane";

export default async function InvoiceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FAPane id={id} />;
}
