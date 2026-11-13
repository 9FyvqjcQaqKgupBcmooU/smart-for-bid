"use client";

import { useState, type ReactNode } from "react";
import { NavSidebar } from "./NavSidebar";
import { TopBar } from "./TopBar";
import type { Locale } from "@/lib/i18n";
import type { ThemePreference } from "@/lib/theme";
import type { User, Vendor, Notification } from "@prisma/client";

type U = User & { vendor: Vendor | null };

export function ShellFrame({
  locale,
  theme,
  isSupplier,
  canCreate,
  companyName,
  current,
  users,
  notifications = [],
  banner,
  children,
}: {
  locale: Locale;
  theme: ThemePreference;
  isSupplier: boolean;
  canCreate: boolean;
  companyName?: string;
  current: U;
  users: U[];
  notifications?: Notification[];
  banner?: ReactNode;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="flex min-h-dvh flex-col bg-paper-2 md:h-full md:overflow-hidden md:p-3 lg:p-4">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-paper md:rounded-2xl md:border md:border-line md:shadow-[0_1px_2px_rgba(28,25,23,0.04),0_12px_32px_rgba(28,25,23,0.06)]">
        <TopBar
          current={current}
          users={users}
          locale={locale}
          theme={theme}
          onMenu={() => setMobileOpen(true)}
          notifications={notifications}
        />
        {banner}
        <div className="relative flex min-h-0 flex-1 md:overflow-hidden">
          <NavSidebar
            locale={locale}
            isSupplier={isSupplier}
            canCreate={canCreate}
            companyName={companyName}
            userName={current.name}
            userTitle={current.title}
            mobileOpen={mobileOpen}
            onClose={() => setMobileOpen(false)}
          />
          <main className="min-w-0 flex-1 md:min-h-0 md:overflow-hidden">{children}</main>
        </div>
      </div>
    </div>
  );
}
