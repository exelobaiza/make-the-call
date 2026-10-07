import { describe, expect, it } from "vitest";
import { forecast } from "../data/forecast";
import type { Forecast, ForecastUpdate } from "../data/types";
import { reducer, type ForecastState } from "./useForecast";

const data = (): Forecast => structuredClone(forecast);

const LOADING: ForecastState = { status: "loading", attempt: 0 };

/** A ready state, built the same way the hook builds it. */
const ready = (d: Forecast = data()): ForecastState =>
  reducer(LOADING, { type: "loaded", data: d, at: 1000 });

/** gfs already says 22 kn of gusts at 17:00, so this update changes nothing. */
const SAME_GUST: ForecastUpdate = {
  modelId: "gfs",
  kind: "atmospheric",
  hour: "17:00",
  field: "gustKn",
  value: 22,
  at: 2000,
};

describe("loading, error and retry", () => {
  it("starts the clock on load, with nothing changed yet", () => {
    const s = ready();
    expect(s.status).toBe("ready");
    expect(s).toMatchObject({ loadedAt: 1000, lastUpdateAt: 1000, lastChange: null });
  });

  it("retry goes back to loading with one more attempt, which re-runs the load effect", () => {
    const failed = reducer(LOADING, { type: "failed", error: new Error("boom") });
    expect(failed).toEqual({ status: "error", attempt: 0, error: new Error("boom") });
    expect(reducer(failed, { type: "retry" })).toEqual({ status: "loading", attempt: 1 });
  });

  it("ignores an update that arrives before the data", () => {
    expect(reducer(LOADING, { type: "update", update: SAME_GUST })).toBe(LOADING);
  });
});

describe("applying a revision", () => {
  it("keeps every reference when the value didn't move", () => {
    const before = ready();
    const after = reducer(before, { type: "update", update: SAME_GUST });

    if (before.status !== "ready" || after.status !== "ready") throw new Error("not ready");
    // toBe is identity: nothing downstream recomputes.
    expect(after.data).toBe(before.data);
    expect(after.lastChange).toBe(before.lastChange);
    // We still heard from the feed.
    expect(after.lastUpdateAt).toBe(2000);
  });

  it("records what changed, timed by the update itself", () => {
    const before = ready();
    const after = reducer(before, { type: "update", update: { ...SAME_GUST, value: 29 } });

    if (before.status !== "ready" || after.status !== "ready") throw new Error("not ready");
    expect(after.data).not.toBe(before.data);
    expect(after.lastChange).toMatchObject({
      modelId: "gfs",
      hour: "17:00",
      field: "gustKn",
      from: 22,
      to: 29,
      at: 2000,
    });
    // Gustier, but the afternoon was already unsure: "Still unsure."
    expect(after.lastChange?.verdictBefore).toEqual(after.lastChange?.verdictAfter);
  });

  it("catches a revision that moves a verdict", () => {
    const before = ready();
    const bigWaves: ForecastUpdate = {
      modelId: "ww3",
      kind: "wave",
      hour: "09:00",
      field: "waveHeightM",
      value: 2,
      at: 3000,
    };
    const after = reducer(before, { type: "update", update: bigWaves });

    if (after.status !== "ready") throw new Error("not ready");
    // One of two wave forecasts over the limit: the morning stops being a go.
    expect(after.lastChange?.verdictBefore.morning).toBe("go");
    expect(after.lastChange?.verdictAfter.morning).toBe("warn");
    // The other windows don't move: "Midday unchanged."
    expect(after.lastChange?.verdictAfter.midday).toBe(after.lastChange?.verdictBefore.midday);
    expect(after.lastChange?.verdictAfter.afternoon).toBe(after.lastChange?.verdictBefore.afternoon);
  });
});

describe("purity (StrictMode runs it twice)", () => {
  it("gives the same result for the same state and action", () => {
    const before = ready();
    const action = { type: "update", update: { ...SAME_GUST, value: 29 } } as const;
    expect(reducer(before, action)).toEqual(reducer(before, action));
  });
});
