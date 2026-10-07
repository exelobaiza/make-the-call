import { loadForecast, subscribeToForecast } from "../lib/forecast";
import type { ForecastSource } from "./types";

/** `?fail` forces the error state, `?slow` stretches the loading state to 4s. */
export const mockSource: ForecastSource = {
  load: () => {
    const query = new URLSearchParams(window.location.search);
    return loadForecast({
      fail: query.has("fail"),
      delayMs: query.has("slow") ? 4000 : undefined,
    });
  },
  subscribe: (onUpdate) => subscribeToForecast(onUpdate),
};
