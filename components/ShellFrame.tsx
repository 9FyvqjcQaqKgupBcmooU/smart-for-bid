"use client";

import { useState, type ReactNode } from "react";
import { NavSidebar } from "./NavSidebar";
import { TopBar } from "./TopBar";
import type { Locale } from "@/lib/i18n";
import type { ThemePreference } from "@/lib/theme";
import type { User, Vendor } from "@prisma/client";

type U = User & { vendor: Vendor | null };

export function ShellFrame({
  locale,
  theme,
  demo,
  isSupplier,
  canCreate,
  companyName,
  current,
  users,
  children,
}: {
  locale: Locale;
  theme: ThemePreference;
  demo: boolean;
  isSupplier: boolean;
  canCreate: boolean;
  companyName?: string;
  current: U;
  users: U[];
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="flex min-h-dvh flex-col md:h-full md:overflow-hidden">
      <TopBar
        current={current}
        users={users}
        locale={locale}
        theme={theme}
        demo={demo}
        onMenu={() => setMobileOpen(true)}
      />
      <div className="relative flex min-h-0 flex-1 md:overflow-hidden">
        <NavSidebar
          locale={locale}
          isSupplier={isSupplier}
          canCreate={canCreate}
          companyName={companyName}
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />
        <main className="min-w-0 flex-1 md:min-h-0 md:overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
