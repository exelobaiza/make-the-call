import type { Status } from "../domain/types";
import type { ForecastView } from "../domain/view";
import { Card } from "./Card";
import { Icon } from "./Icon";
import { STATUS_ICON } from "./status";

type Props = {
  waves: ForecastView["cards"]["waves"];
  deciding: Status | null;
  freshAt: number | null;
};

export function WavesCard({ waves, deciding, freshAt }: Props) {
  return (
    <Card icon="waves" label="Waves" deciding={deciding} freshAt={freshAt} className="tablet:min-h-[298px]">
      <p className="mt-[10px] flex items-center gap-[6px] text-[14px] leading-[20px] font-semibold">
        {waves.headline}
        <Icon name={STATUS_ICON[waves.status]} size={14} />
      </p>

      <p className="font-display mt-[10px] flex items-end gap-[6px] text-[32px] leading-[40px] font-semibold">
        {waves.range}
        <span className="font-mono text-[15px] leading-[32px] text-text-secondary">m</span>
      </p>

      <p className="mt-[10px] text-[13px] leading-[18px] text-text-secondary">{waves.agreement}</p>
    </Card>
  );
}
