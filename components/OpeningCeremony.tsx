"use client";

import { useState } from "react";
import { unlockTender } from "@/app/actions/tenders";
import { switchUser } from "@/app/actions/session";
import { t, type Locale } from "@/lib/i18n";
import { firstName } from "@/lib/format";
import { DEMO_KEY_A, DEMO_KEY_B } from "@/lib/demo";

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
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const myLock = currentUserId === officerA.id ? "A" : currentUserId === officerB.id ? "B" : null;
  const firstA = firstName(officerA.name);
  const firstB = firstName(officerB.name);
  const already = myLock === "A" ? keyAUnlocked : myLock === "B" ? keyBUnlocked : true;
  const next = `/?item=${encodeURIComponent(itemKey ?? `ao:${tenderId}`)}&tab=opening`;

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

  function Officer({
    lock,
    officer,
    unlocked,
    demoPassword,
  }: {
    lock: "A" | "B";
    officer: { id: string; name: string };
    unlocked: boolean;
    demoPassword: string;
  }) {
    const mine = currentUserId === officer.id;
    const first = firstName(officer.name);
    const field = lock === "A" ? "passwordA" : "passwordB";
    return (
      <div className="soft-card p-4">
        <span className="block text-[13px] text-ink-soft">{first}</span>
        {unlocked ? (
          <p className="mt-2 flex min-h-11 items-center text-[16px] text-success">{t(locale, "opening.unlocked", { name: first })}</p>
        ) : mine ? (
          <form action={onSubmit} className="mt-2">
            <input
              type="password"
              name={field}
              autoComplete="off"
              disabled={!past}
              defaultValue={demo && past ? demoPassword : ""}
              placeholder={t(locale, "opening.password")}
              className="min-h-11 w-full rounded-full border border-line bg-paper px-4 text-[16px] disabled:bg-paper-2 disabled:text-ink-soft"
            />
            {demo ? (
              <p className="mt-1.5 font-mono text-[12px] text-ink-soft">{t(locale, "opening.demoHint", { password: demoPassword })}</p>
            ) : null}
            {past && !already && (
              <button
                disabled={pending}
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-cobalt px-6 text-[16px] font-medium text-paper shadow-[0_1px_2px_rgba(29,78,216,0.28)] hover:opacity-90 disabled:opacity-40 sm:w-auto"
              >
                {pending ? "…" : t(locale, "actions.unlockBids")}
              </button>
            )}
          </form>
        ) : (
          <>
            <input
              type="password"
              disabled
              placeholder={t(locale, "opening.locked")}
              className="mt-2 min-h-11 w-full rounded-full border border-line bg-paper-2 px-4 text-[16px] text-ink-soft"
            />
            {demo ? (
              <p className="mt-1.5 font-mono text-[12px] text-ink-soft">{t(locale, "opening.demoHint", { password: demoPassword })}</p>
            ) : null}
            <form action={switchUser} className="mt-3">
              <input type="hidden" name="userId" value={officer.id} />
              <input type="hidden" name="next" value={next} />
              <button
                type="submit"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-cobalt px-6 text-[16px] font-medium text-paper shadow-[0_1px_2px_rgba(29,78,216,0.28)] hover:opacity-90 sm:w-auto"
              >
                {t(locale, "opening.continueAs", { name: first })}
              </button>
            </form>
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      <p className="text-[13px] leading-[18px] text-ink-soft">{t(locale, "opening.why")}</p>
      {demo ? (
        <p className="mt-1.5 text-[13px] leading-[18px] text-ink">
          {t(locale, "opening.demoPath", { a: DEMO_KEY_A, b: DEMO_KEY_B })}
        </p>
      ) : null}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Officer lock="A" officer={officerA} unlocked={keyAUnlocked} demoPassword={DEMO_KEY_A} />
        <Officer lock="B" officer={officerB} unlocked={keyBUnlocked} demoPassword={DEMO_KEY_B} />
      </div>
      {msg && <p className="mt-2 text-[15px] text-danger">{msg}</p>}
    </div>
  );
}
