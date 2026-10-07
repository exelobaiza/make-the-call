import type { ForecastView } from "../domain/view";
import { Icon } from "./Icon";
import { STATUS_ICON } from "./status";

type Props = {
  hours: ForecastView["hours"];
  selected: string | null;
  onSelect: (hour: string | null) => void;
};

const CELL =
  "flex h-[52px] flex-col items-center justify-center gap-[2px] border text-[13px] font-semibold tablet:h-[56px]";

/** Equal columns, so the strip never reflows when a window has three hours instead of five. */
export function HourStrip({ hours, selected, onSelect }: Props) {
  const tone = (on: boolean) =>
    on ? "border-action-active bg-surface-selected" : "border-border-default bg-surface-card";

  return (
    <div
      className="mt-[10px] grid gap-1 tablet:gap-2"
      // The column count comes from the data, and Tailwind can't build a class at runtime.
      style={{ gridTemplateColumns: `repeat(${hours.length + 1}, minmax(0, 1fr))` }}
    >
      <button type="button" aria-pressed={selected === null} onClick={() => onSelect(null)} className={`${CELL} ${tone(selected === null)}`}>
        All
      </button>

      {hours.map((hour) => (
        <button
          key={hour.hour}
          type="button"
          aria-pressed={selected === hour.hour}
          onClick={() => onSelect(hour.hour)}
          className={`${CELL} ${tone(selected === hour.hour)}`}
        >
          <span>
            <span className="long">{hour.label.long}</span>
            <span className="short">{hour.label.short}</span>
          </span>
          <Icon name={STATUS_ICON[hour.status]} size={16} className="text-text-secondary" />
        </button>
      ))}
    </div>
  );
}
