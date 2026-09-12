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
          className="inline-flex min-h-11 items-center rounded-full bg-cobalt px-6 text-[16px] font-medium text-paper shadow-[0_1px_2px_rgba(29,78,216,0.28)] hover:opacity-90"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
