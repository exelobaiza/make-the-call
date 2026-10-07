import type { ForecastView } from "../domain/view";
import { Card } from "./Card";
import { Icon } from "./Icon";

/** Not a gate: never a status colour, never a border. It only explains the wetsuit. */
export function AirCard({ air }: { air: ForecastView["cards"]["air"] }) {
  return (
    <Card icon="thermometer" label="Air" className="tablet:col-span-2 desktop:col-span-1 desktop:min-h-[298px]">
      <p className="mt-[10px] flex items-center gap-[6px] text-[14px] leading-[20px] font-semibold">
        {air.headline}
        <Icon name={air.cold ? "snowflake" : "thermometer"} size={14} />
      </p>

      <p className="font-display mt-[10px] flex items-end gap-[6px] text-[32px] leading-[40px] font-semibold">
        {air.range}
        <span className="font-mono text-[15px] leading-[32px] text-text-secondary">°C</span>
      </p>

      <p className="mt-[10px] text-[13px] leading-[18px] text-text-secondary">{air.note}</p>
    </Card>
  );
}
