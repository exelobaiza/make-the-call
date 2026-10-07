import { useEffect, useState } from "react";

/**
 * Ticks every `intervalMs` so relative times stay true. Call it in the smallest
 * component that shows a clock — every tick re-renders whoever calls it.
 */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}
