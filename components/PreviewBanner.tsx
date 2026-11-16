/** Visible only on Vercel preview (or preview isolated on BID_DEMO_DB). Never on production. */
export function PreviewBanner() {
  const env = process.env.VERCEL_ENV;
  const demoDb = process.env.BID_DEMO_DB === "1" || process.env.BID_DEMO_DB === "true";
  if (env === "production") return null;
  if (env !== "preview" && !demoDb) return null;
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
