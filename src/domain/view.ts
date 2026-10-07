import type { AtmoPoint, Forecast, TidePoint } from "../data/types";
import { evaluateWindow, dirLabel, type WindowEval } from "./evaluate";
import { capitalize, compass, hourShort, num, range } from "./format";
import { RULES } from "./rules";
import type { Copy, GateKey, Status, WindCategory } from "./types";
import { availableWindows, hoursIn, WINDOWS, type WindowKey } from "./windows";

export const STATUS_WORD: Record<Status, string> = { go: "GO", warn: "UNSURE", no: "NO-GO" };

const GATE_LABEL: Record<GateKey, string> = { dir: "Direction", tide: "Tide", waves: "Waves", wind: "Wind" };
const GATE_ORDER: GateKey[] = ["dir", "tide", "waves", "wind"];

/** Gate labels in order, for the loading view (which has no data to evaluate). */
export const GATE_LABELS: string[] = GATE_ORDER.map((g) => GATE_LABEL[g]);

const CATEGORY_LABEL: Record<WindCategory, string> = {
  steady: "Steady",
  strong: "Too strong",
  gusty: "Too gusty",
  light: "Too light",
};
const CATEGORY_ORDER: WindCategory[] = ["steady", "strong", "gusty", "light"];

const WAVES_HEADLINE: Record<Status, string> = { go: "Knee high", warn: "Borderline", no: "Too big" };

/** `from` / `to` are the window's real first and last hour in this data. */
export type WindowOption = {
  key: WindowKey;
  label: string;
  from: string;
  to: string;
  status: Status;
  /** One line for the picker: why this window is what it is. */
  reason: string;
};

export type AgreementRow = { category: WindCategory; label: string; count: number; detail: string };

export type ForecastView = {
  windowKey: WindowKey;
  hour: string | null;
  windows: WindowOption[];
  verdict: { status: Status; word: string; action: Copy; datum: Copy; deciding: GateKey };
  gates: { key: GateKey; label: string; status: Status }[];
  /** `suit` is the decision; `wetsuit` is only its label. The icon reads `suit`. */
  kit: { kite: string; wetsuit: string | null; suit: "full" | "light" | null; coldest: string | null };
  hours: { hour: string; label: Copy; status: Status }[];
  cards: {
    tide: {
      status: Status;
      from: number | null;
      to: number | null;
      trend: "rising" | "falling" | "steady";
      pill: string;
      chart: TideChart;
    };
    waves: { status: Status; headline: string; range: string; agreement: string };
    wind: {
      status: Status;
      dir: { label: string; status: Status; from: string | null; deg: number | null };
      range: string;
      /** `gap` is coloured on its own: it is the number that decides "too gusty". */
      gusts: { text: string; gap: string; warn: boolean };
      /** n forecasts in total; rows only when they don't all say steady. */
      agreement: { n: number; allSteady: boolean; text: string; rows: AgreementRow[] };
    };
    air: { headline: string; cold: boolean; range: string; note: string };
  };
};

/** Everything the tide curve needs, already in the units it draws with. */
export type TideChart = {
  /** `label` is what the tooltip reads: "13:00 · 0.3 m ↓ · zone closed". */
  points: { hour: string; tideM: number; label: string }[];
  /** Index range of the chosen window, for the grey band. */
  window: { from: number; to: number } | null;
  /** Index range of the hours under the limit, for the amber band. */
  closed: { from: number; to: number } | null;
  /** Hours to print under the axis. */
  axis: string[];
  /** The first hour and the daily extremes: printed above the curve and dotted on it. */
  marks: { index: number; text: string; warn: boolean }[];
  limit: number;
  max: number;
  /** Read out instead of the curve. The Figma names the layer with this sentence. */
  description: string;
};

const lower = (s: string) => s.toLowerCase();

function plural(n: number, word: string): string {
  return n === 1 ? word : `${word}s`;
}

function agreeText(n: number): string {
  if (n === 1) return "1 of 1 forecast agrees";
  if (n === 2) return "Both forecasts agree";
  return `All ${n} forecasts agree`;
}

function datum(w: WindowEval): Copy {
  const wind = range(w.wind.avg);
  const maxGust = w.wind.gust.length > 0 ? Math.max(...w.wind.gust) : null;
  const dir = w.dir.offsetDeg === null ? "direction unknown" : dirLabel(w.dir.offsetDeg);
  const from = w.dir.meanDeg === null ? "" : `from ${compass(w.dir.meanDeg)}`;

  if (w.status === "go") return { long: `${wind} kn`, short: `${wind} kn` };

  switch (w.deciding) {
    case "tide": {
      const tide = w.tide.min === null ? "—" : num(w.tide.min, 1);
      return { long: `tide ${tide} m`, short: `tide ${tide} m` };
    }
    case "waves": {
      const heights = w.status === "no" ? w.waves.height.filter((h) => h > RULES.waveMaxM) : w.waves.height;
      const waves = range(heights, 1);
      return { long: `waves ${waves} m`, short: `waves ${waves} m` };
    }
    case "dir":
      return { long: `${dir} · ${from}`, short: `${dir}\n${from}` };
    case "wind": {
      const gusting = maxGust === null ? "" : `gusting ${maxGust}`;
      if (w.status === "warn") return { long: `wind ${wind} ${gusting}`, short: `wind ${wind} kn\n${gusting}` };
      const cats = Object.values(w.wind.categories);
      if (cats.includes("strong") || cats.includes("gusty")) return { long: gusting, short: gusting };
      return { long: `wind ${wind} kn`, short: `wind ${wind} kn` };
    }
  }
}

/** The one-line reason under each window in the picker, in Marta's words. */
function reason(w: WindowEval): string {
  if (w.status === "go") return `Steady ${range(w.wind.avg)} kn. All forecasts agree.`;

  switch (w.deciding) {
    case "tide": {
      const low = w.tide.points.reduce<TidePoint | null>(
        (lowest, p) => (lowest === null || p.tideM < lowest.tideM ? p : lowest),
        null,
      );
      return low === null || w.gates.tide === "warn"
        ? "No tide data."
        : `Low tide at ${low.hour}. No lesson zone.`;
    }
    case "waves":
      return w.status === "no" && w.waves.overFrom !== null
        ? `Waves over ${num(RULES.waveMaxM)} m from ${w.waves.overFrom}.`
        : "Forecasts disagree on the waves.";
    case "dir":
      return w.gates.dir === "no" ? "Wind blows offshore." : "Side-shore wind.";
    case "wind": {
      if (w.status === "warn") return "Forecasts disagree on the wind.";
      const categories = new Set(Object.values(w.wind.categories));
      if (categories.size === 1 && categories.has("light")) return `Under ${RULES.windMinKn} kn all window.`;
      if (categories.size === 1 && categories.has("strong")) return `Over ${RULES.windMaxKn} kn all window.`;
      return "No forecast is teachable.";
    }
  }
}

function action(w: WindowEval, otherGo: WindowOption | undefined): Copy {
  const recheck = RULES.recheckAt;
  if (w.status === "go") return { long: "Run it. Load the van.", short: "Run it.\nLoad the van." };
  if (w.status === "no") {
    if (!otherGo) return { long: "Cancel tomorrow", short: "Cancel tomorrow" };
    const span = `${otherGo.from}–${otherGo.to}`;
    return { long: `Move to ${lower(otherGo.label)} ${span}`, short: `Move to ${lower(otherGo.label)}\n${span}` };
  }
  if (!otherGo) return { long: `Recheck tomorrow at ${recheck}`, short: `Recheck tomorrow at ${recheck}` };
  return {
    long: `Book the ${lower(otherGo.label)} · recheck tomorrow ${recheck}`,
    short: `Book the ${lower(otherGo.label)}\nRecheck tomorrow at ${recheck}`,
  };
}

function kit(w: WindowEval): ForecastView["kit"] {
  if (w.status === "no")
    return { kite: `No lessons at ${lower(w.window.label)}`, wetsuit: null, suit: null, coldest: null };
  const kite = w.kit.kite === null ? `Kite: recheck at ${RULES.recheckAt}` : `Kites ${w.kit.kite} m`;
  const wetsuit = w.kit.wetsuit === null ? null : w.kit.wetsuit === "full" ? "Full wetsuit" : "Light wetsuit";
  // The coldest hour of the window is what justifies the wetsuit, so it travels with it.
  const coldest = w.temp.length === 0 ? null : `${degrees(Math.min(...w.temp))} °C`;
  return { kite, wetsuit, suit: w.kit.wetsuit, coldest };
}

/** The curve is drawn from the data: the whole day, the window and the closed stretch. */
function tideChart(data: Forecast, w: WindowEval): TideChart {
  const points = data.tide.map((p, i, all) => {
    const previous = i === 0 ? null : all[i - 1].tideM;
    const arrow = previous === null || previous === p.tideM ? "" : p.tideM > previous ? " ↑" : " ↓";
    const closed = p.tideM < RULES.tideMinM ? " · zone closed" : "";
    return { hour: p.hour, tideM: p.tideM, label: `${p.hour} · ${num(p.tideM, 1)} m${arrow}${closed}` };
  });
  const indexOf = (hour: string) => points.findIndex((p) => p.hour === hour);

  const windowHours = w.hours.map((h) => h.hour);
  const first = windowHours.length > 0 ? indexOf(windowHours[0]) : -1;
  const last = windowHours.length > 0 ? indexOf(windowHours[windowHours.length - 1]) : -1;

  const closedIndexes = points.flatMap((p, i) => (p.tideM < RULES.tideMinM ? [i] : []));

  const marks = data.tide.flatMap((p, i) => {
    if (i !== 0 && p.extreme === null) return [];
    const word = p.extreme === null ? "" : `${p.extreme} `;
    return [{ index: i, text: `${p.hour} · ${word}${num(p.tideM, 1)} m`, warn: p.tideM < RULES.tideMinM }];
  });

  const closed =
    closedIndexes.length === 0
      ? null
      : { from: closedIndexes[0], to: closedIndexes[closedIndexes.length - 1] };

  const spoken = data.tide.flatMap((p, i) => {
    if (i !== 0 && p.extreme === null) return [];
    const word = p.extreme === null ? "" : `${p.extreme} of `;
    return [`${word}${num(p.tideM, 1)} m at ${p.hour}`];
  });
  const closedSentence =
    closed === null
      ? ""
      : ` Lesson zone closed under ${num(RULES.tideMinM, 1)} m, around ${points[closed.from].hour} to ${points[closed.to].hour}.`;

  return {
    points,
    window: first === -1 || last === -1 ? null : { from: first, to: last },
    closed,
    axis: points.filter((_, i) => i % 2 === 0).map((p) => hourShort(p.hour)),
    marks,
    limit: RULES.tideMinM,
    max: points.length === 0 ? 0 : Math.max(...points.map((p) => p.tideM)),
    description: `Tide: ${spoken.join(", ")}.${closedSentence}`,
  };
}

function tideCard(data: Forecast, w: WindowEval): ForecastView["cards"]["tide"] {
  const points = w.tide.points;
  const from = points.length > 0 ? points[0].tideM : null;
  const to = points.length > 0 ? points[points.length - 1].tideM : null;
  const trend = from === null || to === null || from === to ? "steady" : to > from ? "rising" : "falling";
  const status = w.gates.tide;
  const pill =
    status === "go"
      ? `${trend === "steady" ? "Slack" : capitalize(trend)}. Lesson zone open.`
      : status === "no"
        ? "Low tide. No lesson zone."
        : "No tide data.";
  return { status, from, to, trend, pill, chart: tideChart(data, w) };
}

/**
 * Whole degrees for display — but never rounded UP across the wetsuit threshold.
 * 15.5 °C printed as "16" right next to "under 16 °C we suggest full wetsuits"
 * would read as a contradiction, so it prints as 15.
 */
function degrees(c: number): string {
  const rounded = Math.round(c);
  const crosses = c < RULES.fullWetsuitBelowC && rounded >= RULES.fullWetsuitBelowC;
  return String(crosses ? Math.floor(c) : rounded);
}

function degreeRange(temps: number[]): string {
  if (temps.length === 0) return "—";
  const lo = Math.min(...temps);
  const hi = Math.max(...temps);
  return lo === hi ? degrees(lo) : `${degrees(lo)}\u2013${degrees(hi)}`;
}

/** Air is not a gate: it never carries a status colour, only the wetsuit call. */
function airCard(w: WindowEval): ForecastView["cards"]["air"] {
  if (w.temp.length === 0) return { headline: "—", cold: false, range: "—", note: "" };

  const min = Math.min(...w.temp);
  const cold = min < RULES.fullWetsuitBelowC;
  const coldest = w.hours.find((h) => h.wind.temp.length > 0 && Math.min(...h.wind.temp) === min);
  const where = coldest === undefined ? "" : `Coldest at ${coldest.hour}. `;

  return {
    headline: cold ? "Cold" : "Mild",
    cold,
    // The Figma rounds the air to whole degrees: 13.5 reads as 14.
    range: degreeRange(w.temp),
    note: `${where}Under ${RULES.fullWetsuitBelowC} °C we suggest full wetsuits.`,
  };
}

function wavesCard(w: WindowEval): ForecastView["cards"]["waves"] {
  const status = w.gates.waves;
  const { n, over, overFrom } = w.waves;
  const agreement =
    over === 0 || overFrom === null
      ? agreeText(n)
      : `${over} of ${n} ${plural(n, "forecast")} over ${num(RULES.waveMaxM)} m from ${overFrom}`;
  return { status, headline: WAVES_HEADLINE[status], range: range(w.waves.height, 1), agreement };
}

function windCard(data: Forecast, w: WindowEval): ForecastView["cards"]["wind"] {
  const hourSet = new Set(w.hours.map((h) => h.hour));
  const pointsOf = (modelId: string): AtmoPoint[] =>
    (data.atmospheric[modelId] ?? []).filter((p) => hourSet.has(p.hour));

  const byCategory = new Map<WindCategory, string[]>();
  for (const [modelId, c] of Object.entries(w.wind.categories)) {
    byCategory.set(c, [...(byCategory.get(c) ?? []), modelId]);
  }

  const detail = (c: WindCategory, models: string[]): string => {
    const points = models.flatMap(pointsOf);
    switch (c) {
      case "steady":
        return `${range(points.map((p) => p.windAvgKn))} kn`;
      case "gusty":
        return `gusts to ${Math.max(...points.map((p) => p.gustKn))} kn`;
      case "light":
        return `under ${RULES.windMinKn} kn`;
      case "strong":
        return `over ${RULES.windMaxKn} kn`;
    }
  };

  const rows = CATEGORY_ORDER.flatMap((c) => {
    const models = byCategory.get(c);
    return models ? [{ category: c, label: CATEGORY_LABEL[c], count: models.length, detail: detail(c, models) }] : [];
  });

  const n = w.wind.n;
  const allSteady = n > 0 && rows.length === 1 && rows[0].category === "steady";
  const gapMax = w.wind.gapMax;
  const gustWarn = gapMax !== null && gapMax >= RULES.gustGapTooGustyKn;
  const gap = gapMax === null ? "" : gustWarn ? `· up to +${gapMax}` : `· +${gapMax}`;

  return {
    status: w.gates.wind,
    dir: {
      label: w.dir.offsetDeg === null ? "Unknown" : capitalize(dirLabel(w.dir.offsetDeg)),
      status: w.gates.dir,
      from: w.dir.meanDeg === null ? null : compass(w.dir.meanDeg),
      deg: w.dir.meanDeg === null ? null : Math.round(w.dir.meanDeg),
    },
    range: range(w.wind.avg),
    gusts: { text: `Gusts ${range(w.wind.gust)} kn`, gap, warn: gustWarn },
    agreement: { n, allSteady, text: agreeText(n), rows },
  };
}

/** Status of every window for the whole window, used for the picker chips and to detect verdict changes. */
export function windowStatuses(data: Forecast): Record<WindowKey, Status> {
  const out = {} as Record<WindowKey, Status>;
  for (const w of WINDOWS) out[w.key] = evaluateWindow(data, w.key).status;
  return out;
}

/** First window that is a go, otherwise the first one. Call it once, at load. */
export function defaultWindow(data: Forecast): WindowKey {
  const windows = availableWindows(data);
  const go = windows.find((w) => evaluateWindow(data, w.key).status === "go");
  return (go ?? windows[0] ?? WINDOWS[0]).key;
}

export function buildView(data: Forecast, windowKey: WindowKey, hour: string | null): ForecastView {
  const options: WindowOption[] = availableWindows(data).map((w) => {
    const hours = hoursIn(data, w);
    const evaluated = evaluateWindow(data, w.key);
    return {
      key: w.key,
      label: w.label,
      from: hours[0],
      to: hours[hours.length - 1],
      status: evaluated.status,
      reason: reason(evaluated),
    };
  });
  const key = options.some((o) => o.key === windowKey) ? windowKey : (options[0]?.key ?? windowKey);

  const whole = evaluateWindow(data, key);
  const w = hour === null ? whole : evaluateWindow(data, key, hour);
  const otherGo = options.find((o) => o.key !== key && o.status === "go");

  return {
    windowKey: key,
    hour,
    windows: options,
    verdict: {
      status: w.status,
      word: STATUS_WORD[w.status],
      action: action(w, otherGo),
      datum: datum(w),
      deciding: w.deciding,
    },
    gates: GATE_ORDER.map((g) => ({ key: g, label: GATE_LABEL[g], status: w.gates[g] })),
    kit: kit(w),
    hours: whole.hours.map((h) => ({ hour: h.hour, label: { long: h.hour, short: hourShort(h.hour) }, status: h.status })),
    cards: {
      tide: tideCard(data, w),
      waves: wavesCard(w),
      wind: windCard(data, w),
      air: airCard(w),
    },
  };
}