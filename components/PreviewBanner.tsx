/** Visible only on Vercel preview: writes do not persist across serverless instances. */
export function PreviewBanner() {
  if (process.env.VERCEL !== "1") return null;
  return (
    <div
      className="border-b border-line/80 bg-cobalt-soft px-3 py-2.5 text-[12px] leading-4 text-ink md:px-6"
      data-testid="preview-isolated-db"
    >
      Preview environment — each server instance has its own demo database. The two-key
      opening and other write-then-reload steps need a shared database to persist here;
      they are verified in the local test suite.
    </div>
  );
}
