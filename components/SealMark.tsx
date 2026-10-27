import { cn } from "@/lib/format";

export type SealState = "sealed" | "one" | "opened";

/**
 * Two-key seal — the Smart For Bid signature. A padlock with two keyholes:
 * sealed = both keyholes closed, one = one key turned (hollow), opened = shackle lifted.
 */
export function SealMark({
  state = "sealed",
  size = 20,
  className,
  title,
}: {
  state?: SealState;
  size?: number;
  className?: string;
  title?: string;
}) {
  const open = state === "opened";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      className={cn("shrink-0 text-cobalt", className)}
    >
      {title ? <title>{title}</title> : null}
      <path
        d={open ? "M7.5 10.5V7a4.5 4.5 0 0 1 8.6-1.9" : "M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5"}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect
        x="3.5"
        y="10"
        width="17"
        height="11.5"
        rx="2.5"
        fill={open ? "none" : "currentColor"}
        stroke="currentColor"
        strokeWidth={open ? 2 : 0}
      />
      {open ? (
        <>
          <circle cx="9" cy="15.75" r="1.6" fill="currentColor" />
          <circle cx="15" cy="15.75" r="1.6" fill="currentColor" />
        </>
      ) : (
        <>
          <circle cx="9" cy="15.75" r="1.7" fill="var(--paper)" />
          {state === "one" ? (
            <circle cx="15" cy="15.75" r="1.7" fill="none" stroke="var(--paper)" strokeWidth="1.2" />
          ) : (
            <circle cx="15" cy="15.75" r="1.7" fill="var(--paper)" />
          )}
          {state === "one" ? null : <rect x="14.4" y="16.6" width="1.2" height="2.4" rx="0.6" fill="var(--paper)" />}
          <rect x="8.4" y="16.6" width="1.2" height="2.4" rx="0.6" fill="var(--paper)" />
        </>
      )}
    </svg>
  );
}

export function sealStateOf(t: { keyAUnlocked: boolean; keyBUnlocked: boolean; status?: string }): SealState {
  if (t.status === "opened" || t.status === "awarded" || (t.keyAUnlocked && t.keyBUnlocked)) return "opened";
  if (t.keyAUnlocked || t.keyBUnlocked) return "one";
  return "sealed";
}
