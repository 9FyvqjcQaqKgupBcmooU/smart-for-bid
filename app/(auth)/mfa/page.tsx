"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function MfaVerifyPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const { error: err } = await authClient.twoFactor.verifyTotp({ code });
    setPending(false);
    if (err) {
      setError(err.message || "Invalid code");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-10">
      <h1 className="text-2xl font-semibold text-ink">Two-factor authentication</h1>
      <p className="mt-1 text-sm text-ink-soft">Enter the 6-digit code from your authenticator app.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4" data-testid="mfa-verify-form">
        <input
          className="w-full rounded-lg border border-line bg-paper px-3 py-2.5 font-mono tracking-widest"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="000000"
          data-testid="mfa-code"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-cobalt px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          data-testid="mfa-submit"
        >
          Verify
        </button>
      </form>
    </div>
  );
}
