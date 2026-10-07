import type { Forecast } from "../data/types";
import { countStatus, evaluateHour, type HourEval } from "./evaluate";
import { num, range } from "./format";
import type { Status } from "./types";

/** `status` null = neutral (reference only, no rule behind it). */
export type Cell = {
  hour: string;
  text: string;
  status: Status | null;
  /** Direction row: arrow rotation. */
  deg?: number;
  /** Forecasts-agree row: segments of the bar. */
  agree?: { k: number; n: number };
};

export type RowKey = "beginners" | "wind" | "gusts" | "agree" | "dir" | "waves" | "period" | "tide" | "air";

export type Row = { key: RowKey; label: string; cells: Cell[] };

const ROWS: { key: RowKey; label: string; cell: (h: HourEval) => Omit<Cell, "hour"> }[] = [
  { key: "beginners", label: "Beginners", cell: (h) => ({ text: "", status: h.status }) },
  {
    key: "wind",
    label: "Wind kn",
    cell: (h) => ({ text: range(h.wind.avg), status: countStatus(h.wind.inRange, h.wind.n) }),
  },
  {
    key: "gusts",
    label: "Gusts kn",
    cell: (h) => ({ text: range(h.wind.gust), status: countStatus(h.wind.gapOk, h.wind.n) }),
  },
  {
    key: "agree",
    label: "Forecasts agree",
    cell: (h) => ({
      text: `${h.wind.teachable}/${h.wind.n}`,
      status: h.gates.wind,
      agree: { k: h.wind.teachable, n: h.wind.n },
    }),
  },
  {
    key: "dir",
    label: "Direction °",
    cell: (h) =>
      h.dir.meanDeg === null
        ? { text: "—", status: h.gates.dir }
        : { text: String(Math.round(h.dir.meanDeg)), status: h.gates.dir, deg: h.dir.meanDeg },
  },
  {
    key: "waves",
    label: "Waves m",
    cell: (h) => ({ text: range(h.waves.height, 1), status: h.gates.waves }),
  },
  { key: "period", label: "Period s", cell: (h) => ({ text: range(h.waves.period), status: null }) },
  {
    key: "tide",
    label: "Tide m",
    cell: (h) => ({ text: h.tide === null ? "—" : num(h.tide.tideM, 1), status: h.gates.tide }),
  },
  { key: "air", label: "Air °C", cell: (h) => ({ text: range(h.wind.temp), status: null }) },
];

/** One row per variable, one cell per hour in the data. */
export function tableRows(data: Forecast): Row[] {
  const hours = data.hours.map((h) => evaluateHour(data, h));
  return ROWS.map((r) => ({
    key: r.key,
    label: r.label,
    cells: hours.map((h) => ({ hour: h.hour, ...r.cell(h) })),
  }));
}
