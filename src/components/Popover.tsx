import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

type Props = {
  onClose: () => void;
  /** Positioning and size: a popover on desktop, a drawer on small screens. */
  className?: string;
  /** Anchor coordinates, as custom properties the className can read. */
  style?: CSSProperties;
  children: ReactNode;
};

/** Escape and a click outside close it. Same contract as the window picker. */
export function Popover({ onClose, className = "", style, children }: Props) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      if (root.current?.contains(target)) return;
      /*
       * The trigger toggles on click, and pointerdown fires first: closing here
       * would let the click reopen it, so the button could never close it.
       * Whatever is currently expanded is exempt and handles its own toggle.
       */
      if (target.closest?.('[aria-expanded="true"]')) return;
      onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={root}
      role="dialog"
      style={style}
      className={`border border-text-tertiary bg-surface-card ${className}`}
    >
      {children}
    </div>
  );
}
