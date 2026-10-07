import { useEffect, useState } from "react";

/**
 * True for `ms` after `at`, then false.
 *
 * On purpose this is NOT the 1s clock the status row uses: a card doesn't need
 * to count seconds, it needs to stop being highlighted once. So it's a single
 * timer and a single extra render — and only in the card that actually changed.
 */
export function useFresh(at: number | null, ms: number): boolean {
  // A change that already expired — switching back from the table, say — must
  // not flash for a frame before the timer catches up.
  const [expired, setExpired] = useState<number | null>(() =>
    at !== null && at + ms <= Date.now() ? at : null,
  );

  useEffect(() => {
    if (at === null) return;
    // Reading the clock in an effect is fine; the state change happens in the
    // timer's callback, never synchronously inside the effect.
    const left = Math.max(0, at + ms - Date.now());
    const timer = setTimeout(() => setExpired(at), left);
    return () => clearTimeout(timer);
  }, [at, ms]);

  return at !== null && expired !== at;
}
