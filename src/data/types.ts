export type ModelKind = "atmospheric" | "wave" | "tide";

export type ForecastModel = {
  id: string;
  /** Label as it appears in the source, e.g. "HRW-ARW 3". Marta won't know these. */
  name: string;
  kind: ModelKind;
};

/** One hour of one atmospheric model. Wind in knots, direction in degrees. */
export type AtmoPoint = {
  hour: string; // "07:00" … "19:00"
  windAvgKn: number;
  gustKn: number;
  directionDeg: number;
  tempC: number;
  cloudPct: number;
  rainMm: number;
};

/** One hour of one wave model. Height in metres, period in seconds. */
export type WavePoint = {
  hour: string;
  waveHeightM: number;
  wavePeriodS: number;
};

/** One hour of tide. `extreme` marks the daily low / high. */
export type TidePoint = {
  hour: string;
  tideM: number;
  extreme: "low" | "high" | null;
};

/**
 * The whole forecast for one spot, tomorrow, hour by hour.
 *
 * Several models cover the SAME variables and do NOT fully agree — especially
 * in the afternoon. `atmospheric` and `wave` are keyed by model id; `tide` is a
 * single source. Use `models` for labels / grouping.
 */
export type Forecast = {
  spot: { name: string; note: string };
  hours: string[];
  models: ForecastModel[];
  atmospheric: Record<string, AtmoPoint[]>;
  wave: Record<string, WavePoint[]>;
  tide: TidePoint[];
};

/**
 * A revision pushed by the live feed: one model changed one field for one hour.
 * Apply it in place — the screen must not jump when it lands.
 */
export type ForecastUpdate = {
  modelId: string;
  kind: "atmospheric" | "wave";
  hour: string;
  field: keyof AtmoPoint | keyof WavePoint;
  value: number;
  /** Epoch ms. */
  at: number;
};
