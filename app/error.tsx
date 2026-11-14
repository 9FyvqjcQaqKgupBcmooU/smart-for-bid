"use client";

import Link from "next/link";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex h-full items-center justify-center px-6 text-center">
      <div className="max-w-md">
        <p className="text-[22px] font-semibold tracking-tight text-ink">Something went wrong</p>
        <p className="mt-2 text-[14px] leading-5 text-ink-soft">
          The page could not be loaded. If you were in the middle of a two-key opening on a preview, the change may not have reached this server instance.
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex min-h-10 items-center rounded-xl bg-cobalt px-4 text-[14px] font-semibold text-paper hover:bg-cobalt/90"
          >
            Try again
          </button>
          <Link href="/" className="inline-flex min-h-10 items-center rounded-xl border border-line px-4 text-[14px] font-semibold text-ink hover:bg-paper-2">
            Back to RFQs
          </Link>
        </div>
      </div>
    </div>
  );
}
