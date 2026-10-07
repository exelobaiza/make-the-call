import type { Status } from "../domain/types";
import type { ForecastView } from "../domain/view";
import { Card } from "./Card";
import { Icon } from "./Icon";
import { TideChart } from "./TideChart";

const TREND_ICON = { rising: "arrow-up", falling: "arrow-down", steady: "arrow-down-to-line" } as const;

type Props = {
  tide: ForecastView["cards"]["tide"];
  deciding: Status | null;
  /** Clicking the curve picks that hour, and the window it belongs to. */
  onPickHour: (hour: string) => void;
};

export function TideCard({ tide, deciding, onPickHour }: Props) {
  const { from, to, trend, pill, chart } = tide;
  const value = from === null || to === null ? "—" : `${from} → ${to}`;

  return (
    <Card icon="arrow-down-to-line" label="Tide" deciding={deciding} className="col-span-full">
      <div className="mt-[10px] flex flex-col items-start gap-2 tablet:flex-row tablet:items-center tablet:gap-4">
        <p className="font-display flex items-center gap-[6px] text-[32px] leading-[32px] font-semibold">
          {value}
          <span className="font-mono text-[15px] text-text-secondary">m</span>
          <Icon name={TREND_ICON[trend]} size={14} className="text-text-secondary" />
        </p>
        <p className="bg-surface-selected px-[10px] py-2 text-[14px] leading-[20px]">{pill}</p>
      </div>

      <div className="mt-[10px] flex justify-between gap-2 text-[12px] leading-[14px] font-semibold">
        {chart.marks.map((mark) => (
          <span key={mark.index} className={mark.warn ? "text-status-warn-text" : "text-text-secondary"}>
            {mark.text}
          </span>
        ))}
      </div>

      <div className="mt-[10px]">
        <TideChart chart={chart} onPick={onPickHour} />
      </div>

      <div className="mt-[10px] flex justify-between text-[12px] text-text-tertiary">
        {chart.axis.map((hour) => (
          <span key={hour}>{hour}</span>
        ))}
      </div>

      <p className="mt-[10px] flex items-center gap-[6px] text-[12px] text-status-warn-text">
        <span className="h-px w-[18px] border-t border-dashed border-current" />
        lesson zone limit · {chart.limit} m
      </p>
    </Card>
  );
}
