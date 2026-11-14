import Link from "next/link";

export function PageHeader({
  kicker,
  title,
  action,
}: {
  kicker?: string;
  title: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <div>
        {kicker && <p className="text-[13px] text-ink-soft">{kicker}</p>}
        <h1 className="text-[22px] font-medium tracking-tight">{title}</h1>
      </div>
      {action && (
        <Link
          href={action.href}
          className="inline-flex min-h-10 items-center rounded-xl bg-cobalt px-4 text-[14px] font-medium text-paper shadow-[0_1px_2px_rgba(29,78,216,0.18)] hover:bg-cobalt/90"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
