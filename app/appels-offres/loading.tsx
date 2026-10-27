export default function Loading() {
  return (
    <div className="flex h-full min-h-[280px] flex-col bg-paper p-5">
      <div className="mb-4 h-5 w-40 animate-pulse rounded bg-paper-2" />
      <div className="mb-3 h-9 w-72 max-w-full animate-pulse rounded-full bg-paper-2" />
      <div className="space-y-3">
        <div className="h-24 animate-pulse rounded-xl bg-paper-2" />
        <div className="h-24 animate-pulse rounded-xl bg-paper-2" />
      </div>
    </div>
  );
}
