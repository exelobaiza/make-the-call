import type { AtmoPoint, Forecast, TidePoint, WavePoint } from "../data/types";
import { KITE_CHART, RULES } from "./rules";
import type { GateKey, Status, WindCategory } from "./types";
import { getWindow, hoursIn, type WindowDef, type WindowKey } from "./windows";

const STATUS_RANK: Record<Status, number> = { go: 0, warn: 1, no: 2 };
const CATEGORY_RANK: Record<WindCategory, number> = { steady: 0, light: 1, gusty: 2, strong: 3 };

/** The worst status wins. With nothing to judge, we can't promise a go. */
export function worst(statuses: Status[]): Status {
  if (statuses.length === 0) return "warn";
  return statuses.reduce((a, b) => (STATUS_RANK[b] > STATUS_RANK[a] ? b : a));
}

/** All pass → go, none pass → no, some pass (or no data) → warn. */
export function countStatus(passing: number, total: number): Status {
  if (total === 0) return "warn";
  if (passing === total) return "go";
  if (passing === 0) return "no";
  return "warn";
}

export function classifyWind(p: Pick<AtmoPoint, "windAvgKn" | "gustKn">): WindCategory {
  if (p.windAvgKn > RULES.windMaxKn) return "strong";
  if (p.gustKn - p.windAvgKn >= RULES.gustGapTooGustyKn) return "gusty";
  if (p.windAvgKn < RULES.windMinKn) return "light";
  return "steady";
}

/** Mean of angles: 350° and 10° average to 0°, not 180°. */
export function circularMean(degs: number[]): number | null {
  if (degs.length === 0) return null;
  let sin = 0;
  let cos = 0;
  for (const d of degs) {
    sin += Math.sin((d * Math.PI) / 180);
    cos += Math.cos((d * Math.PI) / 180);
  }
  const mean = (Math.atan2(sin, cos) * 180) / Math.PI;
  return (mean + 360) % 360;
}

function angularDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

export type DirLabel = "onshore" | "side-onshore" | "side-shore" | "side-offshore" | "offshore";

export function dirLabel(offsetDeg: number): DirLabel {
  if (offsetDeg < 20) return "onshore";
  if (offsetDeg < RULES.dirGoMaxDeg) return "side-onshore";
  if (offsetDeg <= RULES.dirWarnMaxDeg) return "side-shore";
  if (offsetDeg <= 135) return "side-offshore";
  return "offshore";
}

function dirStatus(offsetDeg: number | null): Status {
  if (offsetDeg === null) return "warn";
  if (offsetDeg < RULES.dirGoMaxDeg) return "go";
  if (offsetDeg <= RULES.dirWarnMaxDeg) return "warn";
  return "no";
}

type ModelPoint<P> = { modelId: string; point: P };

/** Points for one hour, looked up by the hour label. Models without a point for it don't count. */
function pointsAt<P extends { hour: string }>(
  byModel: Record<string, P[]>,
  hour: string,
): ModelPoint<P>[] {
  const out: ModelPoint<P>[] = [];
  for (const modelId of Object.keys(byModel)) {
    const point = byModel[modelId].find((p) => p.hour === hour);
    if (point) out.push({ modelId, point });
  }
  return out;
}

export type HourEval = {
  hour: string;
  status: Status;
  gates: Record<GateKey, Status>;
  wind: {
    /** Atmospheric models with data at this hour. */
    n: number;
    teachable: number;
    inRange: number;
    gapOk: number;
    categories: Record<string, WindCategory>;
    avg: number[];
    gust: number[];
    gap: number[];
    temp: number[];
  };
  waves: { n: number; ok: number; height: number[]; period: number[] };
  tide: TidePoint | null;
  dir: { meanDeg: number | null; offsetDeg: number | null };
};

export function evaluateHour(data: Forecast, hour: string): HourEval {
  const atmo = pointsAt<AtmoPoint>(data.atmospheric, hour);
  const wave = pointsAt<WavePoint>(data.wave, hour);
  const tide = data.tide.find((t) => t.hour === hour) ?? null;

  const categories: Record<string, WindCategory> = {};
  for (const { modelId, point } of atmo) categories[modelId] = classifyWind(point);
  const teachable = Object.values(categories).filter((c) => c === "steady").length;
  const inRange = atmo.filter(
    ({ point }) => point.windAvgKn >= RULES.windMinKn && point.windAvgKn <= RULES.windMaxKn,
  ).length;
  const gap = atmo.map(({ point }) => point.gustKn - point.windAvgKn);
  const gapOk = gap.filter((g) => g < RULES.gustGapTooGustyKn).length;

  const wavesOk = wave.filter(({ point }) => point.waveHeightM <= RULES.waveMaxM).length;

  const meanDeg = circularMean(atmo.map(({ point }) => point.directionDeg));
  const offsetDeg = meanDeg === null ? null : angularDistance(meanDeg, RULES.beachFacingDeg);

  const gates: Record<GateKey, Status> = {
    dir: dirStatus(offsetDeg),
    // Missing tide data is the only way tide can be "warn": we can't say the zone is open.
    tide: tide === null ? "warn" : tide.tideM < RULES.tideMinM ? "no" : "go",
    waves: countStatus(wavesOk, wave.length),
    wind: countStatus(teachable, atmo.length),
  };

  return {
    hour,
    status: worst(Object.values(gates)),
    gates,
    wind: {
      n: atmo.length,
      teachable,
      inRange,
      gapOk,
      categories,
      avg: atmo.map(({ point }) => point.windAvgKn),
      gust: atmo.map(({ point }) => point.gustKn),
      gap,
      temp: atmo.map(({ point }) => point.tempC),
    },
    waves: {
      n: wave.length,
      ok: wavesOk,
      height: wave.map(({ point }) => point.waveHeightM),
      period: wave.map(({ point }) => point.wavePeriodS),
    },
    tide,
    dir: { meanDeg, offsetDeg },
  };
}

export type WindowEval = {
  window: WindowDef;
  /** The selected hour, or null for the whole window. */
  hour: string | null;
  hours: HourEval[];
  status: Status;
  gates: Record<GateKey, Status>;
  /** The gate that explains the verdict: its number goes next to the word and its card gets the border. */
  deciding: GateKey;
  wind: {
    n: number;
    /** A model is steady only if it's teachable every hour; otherwise it takes the most dangerous category it had. */
    categories: Record<string, WindCategory>;
    avg: number[];
    gust: number[];
    gapMax: number | null;
  };
  waves: {
    n: number;
    height: number[];
    /** Models over the limit at some hour, and the first hour any of them is over. */
    over: number;
    overFrom: string | null;
  };
  tide: { points: TidePoint[]; min: number | null };
  dir: { meanDeg: number | null; offsetDeg: number | null };
  temp: number[];
  kit: { kite: string | null; wetsuit: "full" | "light" | null };
};

function decidingGate(status: Status, gates: Record<GateKey, Status>): GateKey {
  if (status === "go") return "wind";
  const order: GateKey[] = status === "no" ? ["tide", "waves", "wind", "dir"] : ["wind", "waves", "dir", "tide"];
  return order.find((g) => gates[g] === status) ?? "wind";
}

function kiteSize(gusts: number[], minTemp: number | null): string | null {
  if (gusts.length === 0) return null;
  const midpoint = (Math.min(...gusts) + Math.max(...gusts)) / 2;
  let i = KITE_CHART.findIndex((k) => midpoint >= k.minGustKn);
  if (minTemp !== null && minTemp < RULES.smallerKiteBelowC) i = Math.max(0, i - 1);
  return KITE_CHART[i].size;
}

export function evaluateWindow(data: Forecast, key: WindowKey, hour: string | null = null): WindowEval {
  const window = getWindow(key);
  const hours = (hour === null ? hoursIn(data, window) : [hour]).map((h) => evaluateHour(data, h));

  const gates: Record<GateKey, Status> = {
    dir: worst(hours.map((h) => h.gates.dir)),
    tide: worst(hours.map((h) => h.gates.tide)),
    waves: worst(hours.map((h) => h.gates.waves)),
    wind: worst(hours.map((h) => h.gates.wind)),
  };
  const status = worst(hours.map((h) => h.status));

  const categories: Record<string, WindCategory> = {};
  for (const h of hours) {
    for (const [modelId, c] of Object.entries(h.wind.categories)) {
      const prev = categories[modelId];
      if (prev === undefined || CATEGORY_RANK[c] > CATEGORY_RANK[prev]) categories[modelId] = c;
    }
  }

  const gaps = hours.flatMap((h) => h.wind.gap);
  const temp = hours.flatMap((h) => h.wind.temp);
  const minTemp = temp.length > 0 ? Math.min(...temp) : null;

  let overFrom: string | null = null;
  const overModels = new Set<string>();
  for (const h of hours) {
    for (const { modelId, point } of pointsAt<WavePoint>(data.wave, h.hour)) {
      if (point.waveHeightM > RULES.waveMaxM) {
        overModels.add(modelId);
        overFrom ??= h.hour;
      }
    }
  }
  const waveModels = new Set(hours.flatMap((h) => pointsAt<WavePoint>(data.wave, h.hour).map((m) => m.modelId)));

  const tidePoints = hours.flatMap((h) => (h.tide ? [h.tide] : []));
  const meanDeg = circularMean(
    hours.flatMap((h) => pointsAt<AtmoPoint>(data.atmospheric, h.hour).map((m) => m.point.directionDeg)),
  );

  // Kit only from models that are teachable the whole window: never promise a size for a window that may not happen.
  const steadyGusts = hours.flatMap((h) =>
    pointsAt<AtmoPoint>(data.atmospheric, h.hour)
      .filter((m) => categories[m.modelId] === "steady")
      .map((m) => m.point.gustKn),
  );

  return {
    window,
    hour,
    hours,
    status,
    gates,
    deciding: decidingGate(status, gates),
    wind: {
      n: Object.keys(categories).length,
      categories,
      avg: hours.flatMap((h) => h.wind.avg),
      gust: hours.flatMap((h) => h.wind.gust),
      gapMax: gaps.length > 0 ? Math.max(...gaps) : null,
    },
    waves: {
      n: waveModels.size,
      height: hours.flatMap((h) => h.waves.height),
      over: overModels.size,
      overFrom,
    },
    tide: {
      points: tidePoints,
      min: tidePoints.length > 0 ? Math.min(...tidePoints.map((t) => t.tideM)) : null,
    },
    dir: { meanDeg, offsetDeg: meanDeg === null ? null : angularDistance(meanDeg, RULES.beachFacingDeg) },
    temp,
    kit: {
      kite: status === "no" ? null : kiteSize(steadyGusts, minTemp),
      wetsuit: status === "no" || minTemp === null ? null : minTemp < RULES.fullWetsuitBelowC ? "full" : "light",
    },
  };
}
