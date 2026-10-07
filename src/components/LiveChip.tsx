import type { ForecastState } from "../state/useForecast";

const CHIP: Record<ForecastState["status"], { label: string; dot: string }> = {
  ready: { label: "Live", dot: "bg-status-go-fill" },
  loading: { label: "Loading…", dot: "bg-text-tertiary" },
  error: { label: "Offline", dot: "bg-text-tertiary" },
};

/** Connection only. Fixed width per breakpoint so switching views never moves it. */
export function LiveChip({ status }: { status: ForecastState["status"] }) {
  const { label, dot } = CHIP[status];

  return (
    <p className="flex h-[30px] w-[88px] shrink-0 items-center justify-center gap-[6px] border border-border-default bg-surface-card px-2 text-[12px] text-text-secondary tablet:h-[38px] tablet:w-[106px] tablet:gap-2 tablet:px-[14px] tablet:text-[13px]">
      <span className={`size-[6px] shrink-0 rounded-full ${dot}`} />
      {label}
    </p>
  );
}
