import type { Forecast } from "../data/types";

/** Defined by hour label, not by index, and resolved against whatever hours the data has. */
export const WINDOWS = [
  { key: "morning", label: "Morning", from: "07:00", to: "11:00" },
  { key: "midday", label: "Midday", from: "12:00", to: "14:00" },
  { key: "afternoon", label: "Afternoon", from: "15:00", to: "19:00" },
] as const;

export type WindowDef = (typeof WINDOWS)[number];
export type WindowKey = WindowDef["key"];

export function getWindow(key: WindowKey): WindowDef {
  return WINDOWS.find((w) => w.key === key) ?? WINDOWS[0];
}

/** "HH:MM" labels sort as strings, so the range check is a string comparison. */
export function hoursIn(data: Forecast, w: WindowDef): string[] {
  return data.hours.filter((h) => h >= w.from && h <= w.to);
}

/** Windows with no hours in the data are not shown. */
export function availableWindows(data: Forecast): WindowDef[] {
  return WINDOWS.filter((w) => hoursIn(data, w).length > 0);
}

/** The window an hour belongs to, for picking one straight off the tide curve. */
export function windowForHour(hour: string): WindowKey | null {
  return WINDOWS.find((w) => hour >= w.from && hour <= w.to)?.key ?? null;
}
