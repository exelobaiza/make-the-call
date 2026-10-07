import { changeCopy, type Change } from "../domain/change";
import type { WindowKey } from "../domain/windows";
import { useNow } from "../state/useNow";
import { Icon } from "./Icon";

/** How long the row keeps saying "Just updated". Derived from the clock, not animated. */
const FRESH_MS = 4000;

const NO_CHANGES = { long: "No changes to the call.", short: "No changes to the call." };
const LOADING = { long: "Fetching tomorrow's forecast.", short: "Fetching tomorrow's forecast." };

type Props = {
  loading: boolean;
  /** When the feed last said anything, changed or not. */
  lastUpdateAt: number | null;
  lastChange: Change | null;
  windowKey: WindowKey;
};

function ago(ms: number): string {
  const seconds = Math.max(0, Math.round(ms / 1000));
  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m`;
}

/**
 * Fixed height, one place, always there: when a revision lands it rewrites
 * itself and darkens its border for a few seconds instead of pushing anything.
 * The 1s clock lives here so the rest of the screen doesn't re-render with it.
 */
export function StatusRow({ loading, lastUpdateAt, lastChange, windowKey }: Props) {
  const now = useNow(1000);
  const fresh = lastChange !== null && now - lastChange.at < FRESH_MS;

  const lead = loading ? "Loading…" : fresh ? "Just updated" : `Updated ${ago(now - (lastUpdateAt ?? now))} ago`;
  const detail = loading ? LOADING : fresh && lastChange ? changeCopy(lastChange, windowKey) : NO_CHANGES;

  return (
    <div
      data-fresh={fresh ? "" : undefined}
      /*
       * 42px of reserved height, from the frames, and one line of text inside it
       * at every width — see the spans below for how.
       */
      className="mt-3 flex min-h-[62px] flex-col justify-center gap-[2px] border border-border-default bg-surface-card px-[13px] py-[11px] text-[13px] leading-[18px] data-fresh:border-action-active tablet:mt-4 tablet:min-h-[42px] tablet:flex-row tablet:items-center tablet:gap-[10px]"
    >
      <p
        // Never let "Just updated" wrap: it steals the width the message needs.
        className={`flex shrink-0 items-center gap-[6px] font-semibold whitespace-nowrap ${fresh ? "text-text-primary" : "text-text-secondary"}`}
      >
        <Icon name="refresh-cw" size={13} />
        {lead}
      </p>
      {/*
        * This row flips to the short copy below 833px, not at the usual 601: between
        * those two the long sentence wraps, and a row that is one line tall for
        * some revisions and two for others is exactly the jump the brief rules
        * out. 833 is just under the tablet frame's 834, where the long one fits.
        */}
      <p aria-live="polite" className="text-text-secondary">
        <span className="long max-[833px]:hidden">{detail.long}</span>
        <span className="short max-[833px]:inline">{detail.short}</span>
      </p>
    </div>
  );
}
