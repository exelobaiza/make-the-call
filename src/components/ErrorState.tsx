import { Icon } from "./Icon";

/** Replaces everything but the header: an old forecast is worse than no screen. */
export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <section
      role="alert"
      className="border border-border-default bg-surface-card px-4 py-6 tablet:p-10"
    >
      <p className="meta flex items-center gap-[6px] text-text-secondary">
        <Icon name="x" size={12} />
        Couldn't load
      </p>

      <h2 className="mt-[14px] text-[18px] leading-[24px] font-semibold tablet:text-[22px] tablet:leading-[30px]">
        Tomorrow's forecast didn't load.
      </h2>

      <p className="mt-[14px] text-[13px] leading-[19px] text-text-secondary tablet:max-w-[520px] tablet:text-[14px] tablet:leading-[21px]">
        Nothing is shown rather than an old forecast. Check your connection and try again.
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-[18px] h-12 w-full bg-text-primary text-[14px] font-semibold text-surface-bg tablet:mt-5 tablet:h-11 tablet:w-auto tablet:px-5"
      >
        Try again
      </button>
    </section>
  );
}
