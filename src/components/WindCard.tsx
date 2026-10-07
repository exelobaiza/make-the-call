import type { Status } from "../domain/types";
import type { AgreementRow, ForecastView } from "../domain/view";
import { Card } from "./Card";
import { Icon } from "./Icon";
import { STATUS_ICON } from "./status";

/** N segments, `filled` of them in the row's colour: counting heads, not teaching meteorology. */
function Bars({ n, filled, tone }: { n: number; filled: number; tone: string }) {
  return (
    <span className="flex w-[84px] shrink-0 gap-[2px]">
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className={`h-2 flex-1 ${i < filled ? tone : "bg-border-default"}`} />
      ))}
    </span>
  );
}

function Row({ row, n }: { row: AgreementRow; n: number }) {
  // Steady is the neutral one; every other category is a reason not to teach.
  const tone = row.category === "steady" ? "bg-border-strong" : "bg-chart-warn";

  return (
    <li className="flex h-[27px] items-center gap-2 text-[13px] leading-[18px]">
      <Bars n={n} filled={row.count} tone={tone} />
      <span className="w-7 shrink-0 font-semibold">
        {row.count}/{n}
      </span>
      <span className="font-semibold">
        {row.label}
        <span className="font-normal text-text-secondary"> · {row.detail}</span>
      </span>
    </li>
  );
}

type Props = {
  wind: ForecastView["cards"]["wind"];
  deciding: Status | null;
  freshAt: number | null;
  onSeeHours: () => void;
};

export function WindCard({ wind, deciding, freshAt, onSeeHours }: Props) {
  const { dir, range, gusts, agreement } = wind;

  return (
    <Card icon="wind" label="Wind" deciding={deciding} freshAt={freshAt} className="tablet:min-h-[298px]">
      <div className="mt-[10px] flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] leading-[20px]">
        <p className="flex items-center gap-[6px] font-semibold">
          {dir.label}
          <Icon name={STATUS_ICON[dir.status]} size={14} />
        </p>
        {dir.from === null || dir.deg === null ? null : (
          <p className="flex items-center gap-[6px] text-text-secondary">
            {/* The arrow points where the wind goes; `deg` is where it comes from. */}
            <Icon name="arrow-down" size={12} style={{ transform: `rotate(${dir.deg}deg)` }} />
            from {dir.from} · {dir.deg}°
          </p>
        )}
      </div>

      <p className="font-display mt-[10px] flex items-end gap-[6px] text-[32px] leading-[40px] font-semibold">
        {range}
        <span className="font-mono text-[15px] leading-[32px] text-text-secondary">kn</span>
      </p>

      <p className="mt-[10px] text-[14px] leading-[20px]">
        {gusts.text}{" "}
        <span className={gusts.warn ? "text-status-warn-text" : "text-text-secondary"}>{gusts.gap}</span>
      </p>

      {agreement.allSteady ? (
        <p className="mt-[10px] flex h-[27px] items-center gap-2 text-[13px] leading-[18px] font-semibold">
          <Bars n={agreement.n} filled={agreement.n} tone="bg-text-tertiary" />
          {agreement.text}
        </p>
      ) : (
        <ul className="mt-[10px]">
          {agreement.rows.map((row) => (
            <Row key={row.category} row={row} n={agreement.n} />
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={onSeeHours}
        className="mt-[10px] flex h-9 items-center gap-2 text-[13px] font-semibold underline"
      >
        See hour by hour
        <Icon name="chevron-right" size={13} />
      </button>
    </Card>
  );
}
