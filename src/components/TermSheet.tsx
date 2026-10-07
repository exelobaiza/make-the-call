import { useEffect, useRef, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";
import { Popover } from "./Popover";

/** Where the label that opened it sits, in viewport coordinates. */
export type Anchor = { left: number; top: number; bottom: number; trigger: HTMLElement };

type Props = {
  title: string;
  body: string;
  anchor: Anchor;
  onClose: () => void;
};

/** Roughly how tall the desktop popover gets; only used to decide up or down. */
const GUESS = 140;

/**
 * One element, two shapes, switched by CSS: a popover by the label on desktop,
 * a drawer from the bottom below it.
 *
 * It renders in a portal on document.body because the row labels are sticky
 * cells with a z-index, and each one opens its own stacking context: inside the
 * table, the rows below would paint over this panel (and over the scrim) no
 * matter how high its z-index was.
 */
export function TermSheet({ title, body, anchor, onClose }: Props) {
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButton.current?.focus();
  }, []);

  useEffect(() => {
    /*
     * As a drawer this is a modal, so the page behind it shouldn't scroll. On
     * desktop it's a popover and scrolling is fine. This is the one place where
     * asking the breakpoint in JS is right: it's behaviour, not layout — layout
     * stays in CSS, where it can't get out of sync with the design.
     */
    if (window.matchMedia("(min-width: 1024px)").matches) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  // Not enough room under the label: open upwards instead.
  const up = anchor.bottom + GUESS > window.innerHeight;

  return createPortal(
    <>
      <span
        onPointerDown={onClose}
        className="fixed inset-0 z-40 bg-text-primary/35 desktop:hidden"
      />

      <Popover
        onClose={onClose}
        // Custom properties, not inline left/top: the mobile drawer ignores them.
        style={
          {
            "--anchor-left": `${anchor.left}px`,
            "--anchor-top": `${up ? anchor.top : anchor.bottom}px`,
          } as CSSProperties
        }
        className={`fixed inset-x-0 bottom-0 z-50 px-4 pt-[13px] pb-7 desktop:inset-x-auto desktop:bottom-auto desktop:left-[var(--anchor-left)] desktop:w-[256px] desktop:p-5 ${
          up
            ? "desktop:top-[var(--anchor-top)] desktop:-translate-y-[calc(100%+8px)]"
            : "desktop:top-[calc(var(--anchor-top)+8px)]"
        }`}
      >
        <span className="mx-auto block h-1 w-10 bg-border-default desktop:hidden" />

        <div className="mt-3 flex items-start justify-between gap-4 desktop:mt-0">
          <h3 className="text-[16px] leading-[22px] font-semibold desktop:text-[13px] desktop:leading-[19px]">
            {title}
          </h3>
          <button
            ref={closeButton}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-m-[10px] p-[10px]"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <p className="mt-3 text-[13px] leading-[19px] text-text-secondary desktop:mt-1">{body}</p>
      </Popover>
    </>,
    document.body,
  );
}
