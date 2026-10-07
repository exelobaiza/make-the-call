import type { Forecast, ForecastUpdate } from "../data/types";

export type Unsubscribe = () => void;

/** Anything that can feed the screen: the mock today, an API or a socket tomorrow. */
export interface ForecastSource {
  load(): Promise<Forecast>;
  subscribe(onUpdate: (update: ForecastUpdate) => void): Unsubscribe;
}
