"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const { error: err } = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL: "/orgs/new",
    });
    setPending(false);
    if (err) {
      setError(err.message || "Sign-up failed");
      return;
    }
    router.push("/orgs/new");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Create account</h1>
      <p className="mt-1 text-sm text-ink-soft">Smart For Bid</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4" data-testid="sign-up-form">
        <label className="block text-sm">
          <span className="text-ink-soft">Name</span>
          <input
            className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2.5"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-testid="sign-up-name"
          />
        </label>
        <label className="block text-sm">
          <span className="text-ink-soft">Email</span>
          <input
            className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2.5"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-testid="sign-up-email"
          />
        </label>
        <label className="block text-sm">
          <span className="text-ink-soft">Password (min 8)</span>
          <input
            className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2.5"
            type="password"
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            data-testid="sign-up-password"
          />
        </label>
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-cobalt px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          data-testid="sign-up-submit"
        >
          {pending ? "…" : "Sign up"}
        </button>
      </form>
      <p className="mt-6 text-sm text-ink-soft">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-cobalt hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
