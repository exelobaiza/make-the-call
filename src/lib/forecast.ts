import { forecast } from "../data/forecast";
import type { Forecast, ForecastUpdate } from "../data/types";

/**
 * ---------------------------------------------------------------------------
 * Mock forecast backend.
 *
 * You do NOT build any networking. This simulates the forecast source so you
 * can focus on the screen.
 *
 *   1. loadForecast()        – async initial load (drives loading / error states).
 *   2. subscribeToForecast() – a live feed that pushes revisions as they arrive.
 *
 * The models deliberately disagree about the afternoon, and the feed keeps
 * revising it — that's the situation Marta has to read.
 * ---------------------------------------------------------------------------
 */

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}
const pick = <T>(rng: () => number, xs: readonly T[]) => xs[Math.floor(rng() * xs.length)];

export type LoadOptions = {
  /** Artificial latency in ms. Default 900. */
  delayMs?: number;
  /** If true, the promise rejects — use it to exercise your error state. */
  fail?: boolean;
};

/** Fetches the full forecast. Resolves after `delayMs`, or rejects when `fail`. */
export function loadForecast(options: LoadOptions = {}): Promise<Forecast> {
  const { delayMs = 900, fail = false } = options;
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (fail) return reject(new Error("Couldn't load the forecast. Please retry."));
      // Deep-ish copy so callers own their state.
      resolve({
        spot: { ...forecast.spot },
        hours: [...forecast.hours],
        models: forecast.models.map((m) => ({ ...m })),
        atmospheric: Object.fromEntries(
          Object.entries(forecast.atmospheric).map(([id, ps]) => [id, ps.map((p) => ({ ...p }))]),
        ),
        wave: Object.fromEntries(
          Object.entries(forecast.wave).map(([id, ps]) => [id, ps.map((p) => ({ ...p }))]),
        ),
        tide: forecast.tide.map((p) => ({ ...p })),
      });
    }, delayMs);
  });
}

export type SubscribeOptions = {
  /** Milliseconds between revisions. Default 2500. */
  intervalMs?: number;
  /** PRNG seed for reproducible sequences. Default 11. */
  seed?: number;
};

// Afternoon hours are where the models argue — bias revisions there.
const AFTERNOON = ["15:00", "16:00", "17:00", "18:00", "19:00"];
const ATMO_FIELDS = ["windAvgKn", "gustKn"] as const;

/**
 * Subscribes to the live feed. Every `intervalMs` one model revises one field
 * for one afternoon hour (wind, gust or wave height). Returns an unsubscribe fn.
 *
 *   const stop = subscribeToForecast((u) => {
 *     // u.modelId, u.hour, u.field, u.value — patch that one cell in place.
 *   });
 *   // later: stop();
 */
export function subscribeToForecast(
  callback: (update: ForecastUpdate) => void,
  options: SubscribeOptions = {},
): () => void {
  const { intervalMs = 2500, seed = 11 } = options;
  const rng = makeRng(seed);
  const atmoIds = Object.keys(forecast.atmospheric);
  const waveIds = Object.keys(forecast.wave);

  const timer = setInterval(() => {
    const hour = pick(rng, AFTERNOON);
    const at = Date.now();

    if (rng() < 0.75) {
      const modelId = pick(rng, atmoIds);
      const field = pick(rng, ATMO_FIELDS);
      const base = forecast.atmospheric[modelId].find((p) => p.hour === hour)![field];
      const value = Math.max(0, Math.round(base + (rng() - 0.5) * 8));
      callback({ modelId, kind: "atmospheric", hour, field, value, at });
    } else {
      const modelId = pick(rng, waveIds);
      const base = forecast.wave[modelId].find((p) => p.hour === hour)!.waveHeightM;
      const value = Math.max(0, Math.round((base + (rng() - 0.5) * 0.4) * 10) / 10);
      callback({ modelId, kind: "wave", hour, field: "waveHeightM", value, at });
    }
  }, intervalMs);

  return () => clearInterval(timer);
}
