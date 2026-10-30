export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center px-6 py-14 text-center">
      <p className="text-[16px] font-semibold text-ink">{title}</p>
      {hint ? <p className="mt-1.5 max-w-sm text-[13px] leading-[20px] text-ink/65">{hint}</p> : null}
    </div>
  );
}
