"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function SignInPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const { data, error: err } = await authClient.signIn.email({
      email,
      password,
      callbackURL: next,
    });
    setPending(false);
    if (err) {
      setError(err.message || "Sign-in failed");
      return;
    }
    if (data && "twoFactorRedirect" in data && (data as { twoFactorRedirect?: boolean }).twoFactorRedirect) {
      router.push("/mfa");
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Sign in</h1>
      <p className="mt-1 text-sm text-ink-soft">Smart For Bid — sealed-bid RFQs</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4" data-testid="sign-in-form">
        <label className="block text-sm">
          <span className="text-ink-soft">Email</span>
          <input
            className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-ink"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-testid="sign-in-email"
          />
        </label>
        <label className="block text-sm">
          <span className="text-ink-soft">Password</span>
          <input
            className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-ink"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            data-testid="sign-in-password"
          />
        </label>
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-cobalt px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          data-testid="sign-in-submit"
        >
          {pending ? "…" : "Sign in"}
        </button>
      </form>
      <p className="mt-6 text-sm text-ink-soft">
        No account?{" "}
        <Link href="/sign-up" className="text-cobalt hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
