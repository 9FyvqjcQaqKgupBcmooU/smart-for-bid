export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="soft-card px-6 py-12 text-center">
      <p className="text-[22px] font-medium text-ink">{title}</p>
      {hint && <p className="mt-2 text-[15px] leading-[22px] text-ink-soft">{hint}</p>}
    </div>
  );
}
