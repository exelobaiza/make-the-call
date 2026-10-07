import { useCallback, useEffect, useReducer } from "react";
import type { Forecast, ForecastUpdate } from "../data/types";
import { applyUpdate, cellValue } from "../domain/applyUpdate";
import type { Change } from "../domain/change";
import { defaultWindow, windowStatuses } from "../domain/view";
import type { WindowKey } from "../domain/windows";
import type { ForecastSource } from "../source/types";

/** `data` only exists while ready, so "ready but empty" doesn't compile. */
export type ForecastState =
  | { status: "loading"; attempt: number }
  | { status: "error"; attempt: number; error: Error }
  | {
      status: "ready";
      attempt: number;
      data: Forecast;
      /**
       * The window to show until Marta picks one. Decided once, when the data
       * lands: recomputing it on every revision would move the screen under her.
       */
      suggestedWindow: WindowKey;
      loadedAt: number;
      /** When the feed last said anything, changed or not. Drives "Updated 4s ago". */
      lastUpdateAt: number;
      lastChange: Change | null;
    };

type Action =
  | { type: "loaded"; data: Forecast; at: number }
  | { type: "failed"; error: Error }
  | { type: "update"; update: ForecastUpdate }
  | { type: "retry" };

const INITIAL: ForecastState = { status: "loading", attempt: 0 };

/**
 * Pure: same state + same action, same result. It never reads the clock —
 * the time comes in with the action, so StrictMode's double call is harmless.
 */
export function reducer(state: ForecastState, action: Action): ForecastState {
  switch (action.type) {
    case "loaded":
      return {
        status: "ready",
        attempt: state.attempt,
        data: action.data,
        suggestedWindow: defaultWindow(action.data),
        loadedAt: action.at,
        lastUpdateAt: action.at,
        lastChange: null,
      };

    case "failed":
      return { status: "error", attempt: state.attempt, error: action.error };

    case "retry":
      return { status: "loading", attempt: state.attempt + 1 };

    case "update": {
      if (state.status !== "ready") return state;
      const u = action.update;
      const from = cellValue(state.data, u);
      const data = applyUpdate(state.data, u);

      // Heard something, nothing moved: keep `data` and `lastChange` by reference
      // so nothing downstream recomputes.
      if (data === state.data || from === undefined) return { ...state, lastUpdateAt: u.at };

      return {
        ...state,
        data,
        lastUpdateAt: u.at,
        lastChange: {
          modelId: u.modelId,
          hour: u.hour,
          field: u.field,
          from,
          to: u.value,
          at: u.at,
          verdictBefore: windowStatuses(state.data),
          verdictAfter: windowStatuses(data),
        },
      };
    }
  }
}

const toError = (e: unknown): Error => (e instanceof Error ? e : new Error(String(e)));

/**
 * The whole data lifecycle for the screen: load, subscribe, apply revisions, retry.
 * It takes the source as a parameter, so it never knows whether it's the mock or an API.
 */
export function useForecast(source: ForecastSource) {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const { status, attempt } = state;

  // Loads once per attempt. `cancelled` keeps an in-flight load from landing after a retry.
  useEffect(() => {
    let cancelled = false;
    source.load().then(
      (data) => {
        if (!cancelled) dispatch({ type: "loaded", data, at: Date.now() });
      },
      (error) => {
        if (!cancelled) dispatch({ type: "failed", error: toError(error) });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [source, attempt]);

  // Only listens once there's something to patch. The cleanup is the feed's own stop().
  useEffect(() => {
    if (status !== "ready") return;
    return source.subscribe((update) => dispatch({ type: "update", update }));
  }, [source, status]);

  const retry = useCallback(() => dispatch({ type: "retry" }), []);

  return { ...state, retry };
}
