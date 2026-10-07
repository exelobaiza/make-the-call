import { GATE_LABELS } from "../domain/view";
import { VERDICT_BOX } from "./Verdict";

/** Same shape and the same reserved height as the real verdict: em dashes, no skeletons. */
export function VerdictLoading() {
  return (
    // Same box as the real verdict, so the swap can't move anything.
    <section className={`${VERDICT_BOX} border-transparent bg-surface-selected`}>
      <p className="text-[13px] leading-[19px] font-bold text-text-tertiary tablet:text-[15px] tablet:leading-[22px]">
        Loading tomorrow's forecast…
      </p>

      <p className="font-display mt-2 text-[36px] leading-[36px] font-bold text-text-tertiary tablet:mt-[10px] tablet:text-[44px] tablet:leading-[44px]">
        —
      </p>

      <ul className="mt-4 grid grid-cols-[auto_auto] justify-start gap-x-6 gap-y-1 tablet:mt-[10px] tablet:flex tablet:gap-[18px]">
        {GATE_LABELS.map((label) => (
          <li
            key={label}
            className="text-[13px] leading-[18px] font-semibold text-text-tertiary"
          >
            {label}
          </li>
        ))}
      </ul>

      <p className="mt-auto border-t border-border-default pt-[10px] text-[14px] leading-[19px] font-semibold text-text-tertiary">
        —
      </p>
    </section>
  );
}
