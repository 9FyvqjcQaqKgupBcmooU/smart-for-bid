import { createOrganization } from "@/app/actions/orgs";
import { requireAuthUser } from "@/lib/session";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n";

export default async function NewOrgPage() {
  await requireAuthUser();
  const locale = await getLocale();
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold text-ink">{t(locale, "auth.createOrg")}</h1>
      <p className="mt-1 text-sm text-ink-soft">{t(locale, "auth.createOrgHint")}</p>
      <form action={createOrganization} className="mt-8 space-y-4">
        <label className="block text-sm">
          <span className="text-ink-soft">{t(locale, "auth.orgName")}</span>
          <input name="name" required className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2.5" />
        </label>
        <label className="block text-sm">
          <span className="text-ink-soft">{t(locale, "auth.orgType")}</span>
          <select name="type" className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2.5">
            <option value="buyer">{t(locale, "auth.orgBuyer")}</option>
            <option value="supplier">{t(locale, "auth.orgSupplier")}</option>
          </select>
        </label>
        <button type="submit" className="w-full rounded-lg bg-cobalt px-4 py-2.5 text-sm font-medium text-white">
          {t(locale, "auth.createOrgSubmit")}
        </button>
      </form>
    </div>
  );
}
