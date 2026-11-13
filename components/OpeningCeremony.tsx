"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { unlockTender } from "@/app/actions/tenders";
import { switchUser } from "@/app/actions/session";
import { t, type Locale } from "@/lib/i18n";
import { firstName } from "@/lib/format";

export function OpeningCeremony({
  tenderId,
  itemKey,
  deadline,
  keyAUnlocked,
  keyBUnlocked,
  officerA,
  officerB,
  currentUserId,
  currentName,
  compact = true,
  locale = "en",
  demo = false,
}: {
  tenderId: string;
  itemKey?: string;
  deadline: string;
  keyAUnlocked: boolean;
  keyBUnlocked: boolean;
  officerA: { id: string; name: string };
  officerB: { id: string; name: string };
  currentUserId: string;
  currentName: string;
  compact?: boolean;
  locale?: Locale;
  demo?: boolean;
}) {
  const past = Date.now() >= new Date(deadline).getTime();
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const myLock = currentUserId === officerA.id ? "A" : currentUserId === officerB.id ? "B" : null;
  const firstA = firstName(officerA.name);
  const firstB = firstName(officerB.name);
  const already = myLock === "A" ? keyAUnlocked : myLock === "B" ? keyBUnlocked : true;
  const next = `/appels-offres/${tenderId}?tab=cles`;

  async function onSubmit(formData: FormData) {
    if (!myLock) {
      setMsg(t(locale, "opening.wrongOfficer"));
      return;
    }
    setPending(true);
    setMsg(null);
    const pw = String(formData.get(myLock === "A" ? "passwordA" : "passwordB") ?? "");
    formData.set("id", tenderId);
    formData.set("lock", myLock);
    formData.set("password", pw);
    const res = await unlockTender(formData);
    setPending(false);
    if (res && "ok" in res && res.ok) {
      setMsg(t(locale, "opening.unlocked", { name: firstName(currentName) }));
      router.refresh();
      return;
    }
    if (res && "ok" in res && !res.ok) {
      const reason =
        res.reason === "wrong_officer"
          ? t(locale, "opening.wrongOfficer")
          : res.reason === "bad_password"
            ? t(locale, "opening.badPassword")
            : t(locale, "opening.fail");
      setMsg(reason);
    }
  }

  void compact;
  void currentName;
  void demo;
  void firstA;
  void firstB;
  void itemKey;

  function Officer({
    lock,
    officer,
    unlocked,
  }: {
    lock: "A" | "B";
    officer: { id: string; name: string };
    unlocked: boolean;
  }) {
    const mine = currentUserId === officer.id;
    const first = firstName(officer.name);
    const field = lock === "A" ? "passwordA" : "passwordB";
    return (
      <div className="soft-card px-5 py-5">
        <span className="block text-[11px] font-medium uppercase tracking-[0.08em] text-ink-soft">Key {lock}</span>
        <span className="mt-1 block text-[16px] font-semibold tracking-tight text-ink">{officer.name}</span>
        {unlocked ? (
          <p className="mt-3 flex min-h-11 items-center text-[14px] font-medium text-cobalt">{t(locale, "opening.unlocked", { name: first })}</p>
        ) : mine ? (
          <form action={onSubmit} className="mt-4">
            <input
              type="password"
              name={field}
              autoComplete="off"
              disabled={!past}
              placeholder={t(locale, "opening.password")}
              className="min-h-11 w-full rounded-xl border border-line bg-paper px-4 text-[16px] disabled:bg-paper-2 disabled:text-ink-soft"
            />
            {past && !already && (
              <button
                disabled={pending}
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-cobalt px-6 text-[14px] font-medium text-paper shadow-[0_1px_2px_rgba(29,78,216,0.18)] hover:bg-cobalt/90 disabled:opacity-40 sm:w-auto"
              >
                {pending ? "…" : t(locale, "actions.unlockBids")}
              </button>
            )}
          </form>
        ) : (
          <>
            <p className="mt-3 text-[13px] text-ink-soft">{t(locale, "opening.locked")}</p>
            <form action={switchUser} className="mt-4">
              <input type="hidden" name="userId" value={officer.id} />
              <input type="hidden" name="next" value={next} />
              <button
                type="submit"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-cobalt px-6 text-[14px] font-medium text-paper shadow-[0_1px_2px_rgba(29,78,216,0.18)] hover:bg-cobalt/90 sm:w-auto"
              >
                {t(locale, "opening.continueAs", { name: first })}
              </button>
            </form>
          </>
        )}
      </div>
    );
  }

  const placed = (keyAUnlocked ? 1 : 0) + (keyBUnlocked ? 1 : 0);

  return (
    <div>
      <div className="mb-6 text-center">
        <p className="num text-[56px] font-medium leading-none tracking-tight text-ink">
          {placed}<span className="text-[28px] text-ink-soft">/2</span>
        </p>
        <p className="mt-2 text-[13px] text-ink-soft">Keys placed</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Officer lock="A" officer={officerA} unlocked={keyAUnlocked} />
        <Officer lock="B" officer={officerB} unlocked={keyBUnlocked} />
      </div>
      {msg && <p className="mt-3 text-center text-[15px] text-danger">{msg}</p>}
    </div>
  );
}
