import { RoleSwitcher } from "./RoleSwitcher";
import { NotificationBell } from "./NotificationBell";
import { roleLabel } from "@/lib/roles";
import { DEFAULT_LOCALE } from "@/lib/i18n";
import type { User, Vendor, Company, Notification } from "@prisma/client";

export function Header({
  company,
  current,
  users,
  notifications,
}: {
  company: Company;
  current: User & { vendor: Vendor | null };
  users: (User & { vendor: Vendor | null })[];
  notifications: Notification[];
}) {
  return (
    <header className="flex min-h-16 items-center justify-between border-b border-line/70 bg-paper px-6 py-2">
      <div>
        <div className="text-[18px] font-medium leading-none">{company.name}</div>
        <div className="mt-0.5 text-[11px] text-ink-soft">
          {current.name} · {current.role === "VENDOR" ? current.vendor?.name : roleLabel(DEFAULT_LOCALE, current.role)}
        </div>
      </div>
      <div className="flex items-center gap-5">
        <RoleSwitcher users={users} currentId={current.id} />
        <NotificationBell items={notifications} />
      </div>
    </header>
  );
}
