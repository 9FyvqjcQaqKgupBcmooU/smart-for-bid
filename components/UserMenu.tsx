"use client";

import { authClient } from "@/lib/auth-client";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { firstName } from "@/lib/format";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function UserMenu({ name, locale }: { name: string; locale: Locale }) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-2">
      <Link
        href="/mfa/enroll"
        className="hidden rounded-full bg-paper-2 px-3 py-2 text-[13px] text-ink-soft hover:text-ink sm:inline"
      >
        {t(locale, "auth.mfaSettings")}
      </Link>
      <span className="inline-flex min-h-11 items-center rounded-full bg-paper-2 px-3 text-[14px] font-medium text-ink">
        {firstName(name)}
      </span>
      <button
        type="button"
        className="rounded-full border border-line px-3 py-2 text-[13px] text-ink hover:bg-paper-2"
        onClick={async () => {
          await authClient.signOut();
          router.push("/sign-in");
          router.refresh();
        }}
      >
        {t(locale, "auth.signOut")}
      </button>
    </div>
  );
}
