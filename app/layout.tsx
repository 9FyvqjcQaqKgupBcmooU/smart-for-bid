import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { getLocale } from "@/lib/i18n/server";
import { getTheme, THEME_BOOT_SCRIPT } from "@/lib/theme";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Smart For Bid",
  description: "Sealed RFQs — Decathlon",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const theme = await getTheme();
  return (
    <html
      lang={locale === "fr" ? "fr" : "en-GB"}
      className={`${geist.variable} ${geistMono.variable} ${geist.className} min-h-full overflow-x-hidden md:h-full md:overflow-hidden${theme === "dark" ? " dark" : ""}`}
      style={{ colorScheme: theme }}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-full overflow-x-hidden bg-paper text-ink antialiased md:h-full md:overflow-hidden">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
