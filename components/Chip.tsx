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
        "inline-flex max-w-full items-center truncate rounded-full px-2 py-0.5 text-[12px] font-medium leading-4",
        tone === "cobalt" && "bg-cobalt text-paper",
        tone === "ok" && "bg-cobalt-soft text-cobalt ring-1 ring-cobalt/25",
        tone === "neutral" && "bg-paper-2 text-ink-soft",
        className
      )}
    >
      {children}
    </span>
  );
}
