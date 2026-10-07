import type { ForecastState } from "../state/useForecast";
import { LiveChip } from "./LiveChip";

export type Mode = "summary" | "table";

const MODES: { key: Mode; label: string }[] = [
  { key: "summary", label: "Summary" },
  { key: "table", label: "Table" },
];

type Props = {
  status: ForecastState["status"];
  mode: Mode;
  onMode: (mode: Mode) => void;
};

/**
 * One flex row that wraps: on mobile the title and the chip share the first row
 * and the view toggle drops to a full-width second one. Same DOM at every width.
 */
export function Header({ status, mode, onMode }: Props) {
  // With nothing to show, mobile drops the toggle rather than stacking it over the error.
  const toggle = status === "error" ? "max-tablet:hidden" : "";

  return (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-4 pt-4 tablet:gap-y-0 tablet:pt-[22px] tablet:pb-[6px]">
      <div className="flex min-w-0 flex-1 flex-col gap-[2px] tablet:gap-1">
        <h1 className="text-[17px] leading-[22px] font-semibold tablet:text-[20px] tablet:leading-[26px]">
          Tomorrow at Playa Larga
        </h1>
        <p className="text-[12px] text-text-tertiary tablet:text-[13px]">
          <span className="short">Beginner lesson zone</span>
          <span className="long">Beginner lesson zone · sandbar shows at low tide</span>
        </p>
      </div>

      <div
        className={`order-1 flex w-full border border-border-default tablet:order-none tablet:w-auto ${toggle}`}
      >
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            aria-pressed={mode === m.key}
            onClick={() => onMode(m.key)}
            className={`flex-1 px-4 py-2 text-center text-[13px] tablet:flex-none ${
              mode === m.key
                ? "bg-text-primary font-semibold text-surface-bg"
                : "bg-surface-card text-text-secondary"
            } min-h-[44px] tablet:min-h-[36px]`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <LiveChip status={status} />
    </header>
  );
}
