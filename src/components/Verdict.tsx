import type { ForecastView } from "../domain/view";
import { Icon } from "./Icon";
import { DIVIDER_CLASS, GATE_STATE, STATUS_ICON, VERDICT_CLASS } from "./status";

/**
 * Reserved heights, from the frames: nothing moves when the window or the data
 * changes. Exported so the loading twin can't drift out of sync with it.
 */
export const VERDICT_BOX =
  "mt-3 flex flex-col border-2 p-4 tablet:mt-[14px] tablet:px-[22px] tablet:py-[18px]" +
  " min-h-[298px] tablet:min-h-[240px] desktop:min-h-[184px]";

export function Verdict({ view }: { view: ForecastView }) {
  const { status, word, action, datum } = view.verdict;
  const { gates, kit } = view;

  return (
    <section
      data-status={status}
      className={`${VERDICT_BOX} ${VERDICT_CLASS[status]}`}
    >
      <p className="text-[13px] leading-[19px] font-bold text-text-primary tablet:text-[15px] tablet:leading-[22px]">
        <span className="short whitespace-pre-line">{action.short}</span>
        <span className="long">{action.long}</span>
      </p>

      <div className="mt-2 flex flex-col items-start gap-2 tablet:mt-[10px] tablet:flex-row tablet:items-center tablet:gap-[18px]">
        <p className="font-display text-[36px] leading-[36px] font-bold tablet:text-[44px] tablet:leading-[44px]">
          {word}
        </p>
        <p className="font-display text-[22px] leading-[26px] font-semibold tablet:text-[32px] tablet:leading-[32px]">
          <span className="short whitespace-pre-line">{datum.short}</span>
          <span className="long">· {datum.long}</span>
        </p>
      </div>

      <ul className="mt-4 grid grid-cols-[auto_auto] justify-start gap-x-6 gap-y-1 tablet:mt-[10px] tablet:flex tablet:gap-[18px]">
        {gates.map((gate) => (
          <li
            key={gate.key}
            className="flex items-center gap-[5px] text-[13px] leading-[18px] font-semibold text-text-secondary"
          >
            {gate.label}
            <Icon name={STATUS_ICON[gate.status]} size={14} />
            <span className="sr-only">{GATE_STATE[gate.status]}</span>
          </li>
        ))}
      </ul>

      <div
        className={`mt-auto flex flex-col gap-[6px] border-t pt-[10px] tablet:flex-row tablet:gap-[18px] ${DIVIDER_CLASS[status]}`}
      >
        <p className="flex items-center gap-2 text-[14px] leading-[19px] font-semibold text-text-primary">
          <Icon name="wind" size={14} />
          {kit.kite}
        </p>
        {kit.wetsuit ? (
          <p className="flex items-center gap-2 text-[14px] leading-[19px] font-semibold text-text-primary">
            <Icon name={kit.suit === "full" ? "snowflake" : "thermometer"} size={14} />
            {kit.coldest ? `${kit.wetsuit} · ${kit.coldest}` : kit.wetsuit}
          </p>
        ) : null}
      </div>
    </section>
  );
}
