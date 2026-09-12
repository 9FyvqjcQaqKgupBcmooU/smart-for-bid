import type { ReactNode } from "react";
import { cn } from "@/lib/format";

export function Chip({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "cobalt" | "ok";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center truncate rounded-full px-2.5 py-1 text-[12px] font-medium leading-4",
        tone === "cobalt" && "bg-cobalt-soft text-cobalt ring-1 ring-cobalt/20",
        tone === "ok" && "bg-cobalt-soft text-moss ring-1 ring-moss/20",
        tone === "neutral" && "bg-paper-2 text-ink-soft",
        className
      )}
    >
      {children}
    </span>
  );
}
