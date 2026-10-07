import { num } from "./format";
import type { Copy, Status } from "./types";
import { getWindow, type WindowKey } from "./windows";

/**
 * One revision from the feed and what it did to the three verdicts. The state
 * layer fills it in; the shape lives here because it is a domain idea.
 */
export type Change = {
  modelId: string;
  hour: string;
  field: string;
  from: number;
  to: number;
  /** Epoch ms, taken from the update itself. */
  at: number;
  verdictBefore: Record<WindowKey, Status>;
  verdictAfter: Record<WindowKey, Status>;
};

/** Which card a revision belongs to. Tide and air are never touched by the feed. */
export function cardForChange(change: Change | null): "wind" | "waves" | null {
  if (change === null) return null;
  return change.field === "waveHeightM" ? "waves" : "wind";
}

/** Marta's words for a verdict inside a sentence. */
const SPOKEN: Record<Status, string> = { go: "a go", warn: "unsure", no: "a no-go" };

/** The feed only ever revises these three. Anything else falls back to its own name. */
const FIELD: Record<string, { word: string; unit: string }> = {
  windAvgKn: { word: "wind", unit: "kn" },
  gustKn: { word: "gusts", unit: "kn" },
  waveHeightM: { word: "waves", unit: "m" },
};

/** What the change means for the window Marta is looking at. */
function consequence(change: Change, windowKey: WindowKey): Copy {
  const before = change.verdictBefore[windowKey];
  const after = change.verdictAfter[windowKey];

  if (before !== after) {
    const label = getWindow(windowKey).label;
    return { long: `${label} is now ${SPOKEN[after]}.`, short: `${label} is now ${SPOKEN[after]}` };
  }

  // Someone else moved: say so, so "no change" doesn't read as "nothing happened".
  const movedElsewhere = (Object.keys(change.verdictAfter) as WindowKey[]).some(
    (key) => change.verdictAfter[key] !== change.verdictBefore[key],
  );
  if (movedElsewhere) {
    const label = getWindow(windowKey).label;
    return { long: `${label} unchanged.`, short: `${label} unchanged` };
  }

  return { long: `Still ${SPOKEN[after]}.`, short: `still ${SPOKEN[after]}` };
}

/**
 * "One forecast raised its 17:00 gusts from 26 to 29 kn. Still unsure."
 * Never the model's name: the brief says not to teach Marta what a model is.
 */
export function changeCopy(change: Change, windowKey: WindowKey): Copy {
  const { word, unit } = FIELD[change.field] ?? { word: change.field, unit: "" };
  const direction = change.to > change.from ? "raised" : "lowered";
  const from = num(change.from);
  const to = num(change.to);
  const result = consequence(change, windowKey);

  return {
    long: `One forecast ${direction} its ${change.hour} ${word} from ${from} to ${to} ${unit}. ${result.long}`,
    short: `${change.hour} ${word} ${from} → ${to} ${unit} · ${result.short}`,
  };
}
