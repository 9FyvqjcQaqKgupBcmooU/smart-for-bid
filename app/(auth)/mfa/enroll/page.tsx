"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import QRCode from "qrcode";

export default function MfaEnrollPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [totpURI, setTotpURI] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function startEnroll(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const { data, error: err } = await authClient.twoFactor.enable({
      password,
      method: "totp",
      issuer: "Smart For Bid",
    });
    setPending(false);
    if (err) {
      setError(err.message || "Could not start enrollment");
      return;
    }
    const uri = (data as { totpURI?: string })?.totpURI;
    const codes = (data as { backupCodes?: string[] })?.backupCodes || [];
    if (uri) {
      setTotpURI(uri);
      setQrDataUrl(await QRCode.toDataURL(uri, { width: 220, margin: 1 }));
    }
    setBackupCodes(codes);
  }

  async function confirm(e: React.FormEvent) {
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
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-10">
      <h1 className="text-2xl font-semibold text-ink">Enroll authenticator (TOTP)</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Required for organization owners/admins and AO keyholders/evaluators.
      </p>

      {!totpURI ? (
        <form onSubmit={startEnroll} className="mt-8 space-y-4" data-testid="mfa-enroll-start">
          <label className="block text-sm">
            <span className="text-ink-soft">Confirm password</span>
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2.5"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-testid="mfa-enroll-password"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-cobalt px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            data-testid="mfa-enroll-start-btn"
          >
            Generate QR
          </button>
        </form>
      ) : (
        <div className="mt-8 space-y-6" data-testid="mfa-enroll-confirm">
          {qrDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="TOTP QR code" className="mx-auto rounded-lg border border-line" width={220} height={220} />
          )}
          <p className="break-all font-mono text-[11px] text-ink-soft">{totpURI}</p>
          {backupCodes.length > 0 && (
            <div>
              <p className="text-sm font-medium">Backup codes (store securely)</p>
              <ul className="mt-2 grid grid-cols-2 gap-1 font-mono text-xs">
                {backupCodes.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          )}
          <form onSubmit={confirm} className="space-y-3">
            <input
              className="w-full rounded-lg border border-line bg-paper px-3 py-2.5 font-mono tracking-widest"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="000000"
              data-testid="mfa-enroll-code"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-cobalt px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
              data-testid="mfa-enroll-confirm-btn"
            >
              Confirm enrollment
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
