export default function Loading() {
  return (
    <div className="flex h-full min-h-[320px] flex-col bg-paper">
      <div className="flex items-center gap-3 border-b border-line/70 px-5 py-3">
        <div className="h-4 w-28 animate-pulse rounded bg-paper-2" />
        <div className="ml-auto flex gap-2">
          <div className="h-7 w-14 animate-pulse rounded-full bg-paper-2" />
          <div className="h-7 w-16 animate-pulse rounded-full bg-paper-2" />
          <div className="h-7 w-16 animate-pulse rounded-full bg-paper-2" />
        </div>
      </div>
      <div className="space-y-0 px-5 py-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-line/50 py-3">
            <div className="h-3 w-24 animate-pulse rounded bg-paper-2" />
            <div className="h-3 w-48 animate-pulse rounded bg-paper-2" />
            <div className="h-5 w-16 animate-pulse rounded-full bg-paper-2" />
            <div className="ml-auto h-3 w-20 animate-pulse rounded bg-paper-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
