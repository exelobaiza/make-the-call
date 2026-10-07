import { useEffect, useRef, useState } from "react";
import { STATUS_WORD, type WindowOption } from "../domain/view";
import type { WindowKey } from "../domain/windows";
import { WINDOWS } from "../domain/windows";
import { Icon } from "./Icon";
import { CHIP_CLASS, STATUS_ICON } from "./status";

type Props = {
  options: WindowOption[];
  value: WindowKey;
  onChange: (key: WindowKey) => void;
};

const label = (o: { label: string; from: string; to: string }) => `${o.label} · ${o.from}–${o.to}`;

/**
 * A disclosure with plain buttons, not an ARIA listbox: a real listbox needs
 * roving tabindex and arrow-key handling to be correct, while native buttons
 * already bring focus, Tab, Enter and Space. The ref holds the DOM node so the
 * outside-click handler can ask "was the click in here?" — never read in render.
 */
export function WindowPicker({ options, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  // Nothing to pick from until the forecast lands; the labels are ours, not the data's.
  const loading = options.length === 0;
  const selected = options.find((o) => o.key === value);
  const first = WINDOWS[0];

  useEffect(() => {
    if (!open) return;

    const close = () => setOpen(false);
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      close();
      button.current?.focus();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function pick(key: WindowKey) {
    onChange(key);
    setOpen(false);
    button.current?.focus();
  }

  return (
    // Full width up to tablet (frames 86:31 and 101:33); 380px only on desktop (83:33).
    <div ref={root} className="relative w-full desktop:w-[380px]">
      <button
        ref={button}
        type="button"
        disabled={loading}
        aria-expanded={open}
        // Only while the list exists: pointing at a missing id is worse than not pointing.
        aria-controls={open ? "lesson-windows" : undefined}
        onClick={() => setOpen((o) => !o)}
        className="flex h-12 w-full items-center justify-between border border-border-strong bg-surface-card px-[14px] text-left text-[14px] font-semibold text-text-primary tablet:text-[15px]"
      >
        {selected ? label(selected) : label({ label: first.label, from: first.from, to: first.to })}
        <Icon name="chevron-down" size={18} className="text-text-secondary" />
      </button>

      {open ? (
        <ul
          id="lesson-windows"
          aria-label="Lesson window"
          className="absolute top-full right-0 left-0 z-10 mt-1 divide-y divide-border-default border-2 border-action-active bg-surface-card"
        >
          {options.map((o) => (
            <li key={o.key}>
              <button
                type="button"
                aria-current={o.key === value}
                onClick={() => pick(o.key)}
                className={`flex w-full items-center justify-between gap-3 px-[14px] py-[14px] text-left ${
                  o.key === value ? "bg-surface-selected" : ""
                }`}
              >
                <span className="min-w-0">
                  <span className="block text-[14px] font-semibold text-text-primary tablet:text-[15px]">
                    {label(o)}
                  </span>
                  <span className="mt-[2px] block text-[13px] leading-[19px] text-text-secondary">
                    {o.reason}
                  </span>
                </span>
                <span
                  className={`flex w-[104px] shrink-0 items-center justify-center gap-[6px] border py-[5px] text-[13px] font-semibold ${CHIP_CLASS[o.status]}`}
                >
                  <Icon name={STATUS_ICON[o.status]} size={14} />
                  {STATUS_WORD[o.status]}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
