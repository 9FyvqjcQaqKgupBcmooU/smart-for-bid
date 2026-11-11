"use client";

import Link from "next/link";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex h-full items-center justify-center px-6 text-center">
      <div className="max-w-md">
        <p className="text-[16px] font-semibold text-ink">Something went wrong</p>
        <p className="mt-2 text-[14px] leading-5 text-ink-soft">
          The page could not be loaded. If you were in the middle of a two-key opening on a preview, the change may not have reached this server instance.
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex min-h-10 items-center rounded-full bg-cobalt px-4 text-[14px] font-semibold text-paper"
          >
            Try again
          </button>
          <Link href="/" className="inline-flex min-h-10 items-center rounded-full border border-line px-4 text-[14px] font-semibold text-ink">
            Back to RFQs
          </Link>
        </div>
      </div>
    </div>
  );
}
