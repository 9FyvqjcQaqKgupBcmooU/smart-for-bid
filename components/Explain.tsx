"use client";

import { useEffect, useId, useRef, useState } from "react";

export function Explain({
  children,
  tip,
  className = "",
}: {
  children: React.ReactNode;
  tip: string;
  className?: string;
}) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  function place() {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const width = 280;
    let left = r.left;
    if (left + width > window.innerWidth - 12) left = Math.max(12, window.innerWidth - width - 12);
    let top = r.bottom + 6;
    if (top + 96 > window.innerHeight) top = Math.max(12, r.top - 90);
    setPos({ top, left });
  }

  useEffect(() => {
    if (!open) return;
    place();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setPinned(false);
        triggerRef.current?.focus();
      }
    }
    function onDoc(e: MouseEvent) {
      const n = e.target as Node;
      if (triggerRef.current?.contains(n) || tipRef.current?.contains(n)) return;
      setOpen(false);
      setPinned(false);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDoc);
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDoc);
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  return (
    <span className={className}>
      <button
        ref={triggerRef}
        type="button"
        className="cursor-help bg-transparent p-0 font-[inherit] text-[length:inherit] leading-[inherit] text-inherit underline decoration-dotted decoration-ink-soft/70 underline-offset-[3px]"
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onMouseEnter={() => {
          setOpen(true);
        }}
        onMouseLeave={() => {
          if (!pinned) setOpen(false);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          if (!pinned) setOpen(false);
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (pinned) {
            setPinned(false);
            setOpen(false);
          } else {
            setPinned(true);
            setOpen(true);
          }
        }}
      >
        {children}
      </button>
      {open && pos && (
        <span
          ref={tipRef}
          id={id}
          role="tooltip"
          style={{ position: "fixed", top: pos.top, left: pos.left }}
          className="z-[80] w-max max-w-[280px] rounded-md border border-line bg-paper px-3 py-2 text-[13px] font-normal leading-[18px] text-ink shadow-[0_4px_16px_rgba(26,31,28,0.08)]"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => {
            if (!pinned) setOpen(false);
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {tip}
        </span>
      )}
    </span>
  );
}
