export type { AtmoPoint, Forecast, ForecastUpdate, TidePoint, WavePoint } from "../data/types";
export type { WindowKey } from "./windows";

/** go = passes, warn = forecasts disagree or it's borderline, no = fails. */
export type Status = "go" | "warn" | "no";

export type GateKey = "dir" | "tide" | "waves" | "wind";

/** One category per model and hour, by danger to a beginner: strong > gusty > light > steady. */
export type WindCategory = "steady" | "gusty" | "light" | "strong";

/** Same message in two lengths; the component renders both and CSS shows one per breakpoint. */
export type Copy = { long: string; short: string };
