import { redirect } from "next/navigation";

/** List lives on the dashboard home; keep this route as a deep-link shim. */
export default async function TendersPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; tab?: string; status?: string; sort?: string; dir?: string; q?: string }>;
}) {
  const sp = await searchParams;
  if (sp.id) {
    const qs = sp.tab ? `?tab=${encodeURIComponent(sp.tab)}` : "";
    redirect(`/appels-offres/${sp.id}${qs}`);
  }
  const params = new URLSearchParams();
  if (sp.status) params.set("status", sp.status);
  if (sp.sort) params.set("sort", sp.sort);
  if (sp.dir) params.set("dir", sp.dir);
  if (sp.q) params.set("q", sp.q);
  const qs = params.toString();
  redirect(qs ? `/?${qs}` : "/");
}
