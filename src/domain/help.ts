import { num } from "./format";
import { RULES } from "./rules";
import type { RowKey } from "./tableRows";
import type { Status } from "./types";

export type HelpSection = { label: string; body: string };

/**
 * The "(i) How to read this table" copy. Every number comes from RULES and from
 * how many forecasts the data actually has, so changing a rule rewrites the help.
 */
export function tableHelp(n: number): {
  colors: { chip: string; status: Status; body: string }[];
  sections: HelpSection[];
} {
  const teachable = `between ${RULES.windMinKn} and ${RULES.windMaxKn} kn, with gusts less than ${RULES.gustGapTooGustyKn} kn above the wind`;

  return {
    colors: [
      { chip: "18", status: "go", body: `All ${n} forecasts pass your rule.` },
      { chip: "11–19", status: "warn", body: "Some forecasts pass, some don't." },
      { chip: "0.3", status: "no", body: "No forecast passes." },
    ],
    sections: [
      { label: "Ranges", body: `"11–19" is the lowest to highest forecast for that hour.` },
      {
        label: "Forecasts agree",
        body: `How many of the ${n} forecasts give a teachable wind for that hour: ${teachable}.`,
      },
      {
        label: "How we read your rules",
        body:
          `Wind ${RULES.windMinKn}–${RULES.windMaxKn} kn · gusty = gusts ${RULES.gustGapTooGustyKn}+ kn over the wind` +
          ` · waves over ${num(RULES.waveMaxM)} m · low tide = under ${num(RULES.tideMinM, 1)} m.`,
      },
      { label: "Shaded column", body: "The window or hour you picked." },
    ],
  };
}

/**
 * One explanation per row label. "Forecasts agree" is the wording from the Figma
 * (frame 116:2); the rest follow the same voice and read their numbers from RULES.
 */
export function rowHelp(key: RowKey, n: number): string {
  switch (key) {
    case "beginners":
      return "The call for that hour. Every rule has to pass.";
    case "wind":
      return `Average wind. A lesson needs between ${RULES.windMinKn} and ${RULES.windMaxKn} kn.`;
    case "gusts":
      return `The strongest gust. What matters is the gap: ${RULES.gustGapTooGustyKn}+ kn over the average is unteachable.`;
    case "agree":
      return (
        `How many of the ${n} forecasts give a teachable wind for that hour: between ${RULES.windMinKn}` +
        ` and ${RULES.windMaxKn} kn, with gusts less than ${RULES.gustGapTooGustyKn} kn above the wind.`
      );
    case "dir":
      return "Where the wind comes from, in degrees, and whether it blows onto the beach or off it.";
    case "waves":
      return `Wave height. Over ${num(RULES.waveMaxM)} m the lesson zone stops working.`;
    case "period":
      return "Seconds between waves. Reference only: it doesn't change the call.";
    case "tide":
      return `Water height. Under ${num(RULES.tideMinM, 1)} m the sandbar closes the lesson zone.`;
    case "air":
      return "Air temperature. It decides wetsuits, not whether there's a lesson.";
  }
}
