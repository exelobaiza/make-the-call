import type { Forecast, ForecastUpdate } from "../data/types";

type Point = { hour: string };

function series(data: Forecast, u: ForecastUpdate): Point[] | undefined {
  return u.kind === "atmospheric" ? data.atmospheric[u.modelId] : data.wave[u.modelId];
}

/** The current value of the cell an update points at, or undefined if that cell doesn't exist or isn't a number. */
export function cellValue(data: Forecast, u: ForecastUpdate): number | undefined {
  const point = series(data, u)?.find((p) => p.hour === u.hour);
  const value = point ? (point as Record<string, unknown>)[u.field] : undefined;
  return typeof value === "number" ? value : undefined;
}

/**
 * Returns a new Forecast with one cell changed. Only that model's array and that
 * point are copied; everything else is shared by reference. If the cell doesn't
 * exist or already has that value, returns the same object.
 */
export function applyUpdate(data: Forecast, u: ForecastUpdate): Forecast {
  const current = cellValue(data, u);
  if (current === undefined || current === u.value) return data;

  const points = series(data, u) ?? [];
  const next = points.map((p) => (p.hour === u.hour ? { ...p, [u.field]: u.value } : p));

  return u.kind === "atmospheric"
    ? { ...data, atmospheric: { ...data.atmospheric, [u.modelId]: next as Forecast["atmospheric"][string] } }
    : { ...data, wave: { ...data.wave, [u.modelId]: next as Forecast["wave"][string] } };
}
