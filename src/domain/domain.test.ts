import { describe, expect, it } from "vitest";
import { forecast } from "../data/forecast";
import type { Forecast, ForecastUpdate } from "../data/types";
import { applyUpdate, cellValue } from "./applyUpdate";
import { cardForChange, changeCopy } from "./change";
import { circularMean, classifyWind, evaluateHour, evaluateWindow } from "./evaluate";
import { rowHelp, tableHelp } from "./help";
import { range } from "./format";
import { tableRows } from "./tableRows";
import { buildView, defaultWindow, windowStatuses } from "./view";

const data = (): Forecast => structuredClone(forecast);

/** Fewer models (3 atmospheric, 1 wave) and fewer hours (07:00–16:00). */
function smallerDataset(): Forecast {
  const d = data();
  const keep = (h: string) => h <= "16:00";
  d.hours = d.hours.filter(keep);
  delete d.atmospheric.gfs;
  delete d.atmospheric.ecmwf;
  delete d.wave.gwam;
  for (const id of Object.keys(d.atmospheric)) d.atmospheric[id] = d.atmospheric[id].filter((p) => keep(p.hour));
  for (const id of Object.keys(d.wave)) d.wave[id] = d.wave[id].filter((p) => keep(p.hour));
  d.tide = d.tide.filter((p) => keep(p.hour));
  return d;
}

describe("windows with today's data", () => {
  it("morning is a go with 9–12 m kites and a full wetsuit", () => {
    const v = buildView(data(), "morning", null);
    expect(v.verdict.word).toBe("GO");
    expect(v.verdict.datum.long).toBe("17–20 kn");
    expect(v.verdict.action.long).toBe("Run it. Load the van.");
    expect(v.kit).toEqual({ kite: "Kites 9–12 m", wetsuit: "Full wetsuit", suit: "full", coldest: "14 °C" });
    expect(v.cards.wind.agreement.allSteady).toBe(true);
    expect(v.cards.wind.agreement.text).toBe("All 5 forecasts agree");
    expect(v.cards.wind.gusts).toEqual({ text: "Gusts 20–23 kn", gap: "· +3", warn: false });
    expect(v.cards.waves.agreement).toBe("Both forecasts agree");
  });

  it("midday is a no-go because of the tide, and points to the morning", () => {
    const v = buildView(data(), "midday", null);
    expect(v.verdict.word).toBe("NO-GO");
    expect(v.verdict.deciding).toBe("tide");
    expect(v.verdict.datum.long).toBe("tide 0.3 m");
    expect(v.verdict.action).toEqual({ long: "Move to morning 07:00–11:00", short: "Move to morning\n07:00–11:00" });
    expect(v.kit).toEqual({ kite: "No lessons at midday", wetsuit: null, suit: null, coldest: null });
    expect(v.cards.tide.pill).toBe("Low tide. No lesson zone.");
  });

  it("afternoon is unsure: the forecasts split on the wind", () => {
    const d = data();
    expect(evaluateHour(d, "15:00").wind.teachable).toBe(3);
    expect(evaluateHour(d, "16:00").wind.teachable).toBe(2);

    const v = buildView(d, "afternoon", null);
    expect(v.verdict.word).toBe("UNSURE");
    expect(v.verdict.deciding).toBe("wind");
    expect(v.verdict.datum).toEqual({ long: "wind 9–20 gusting 31", short: "wind 9–20 kn\ngusting 31" });
    expect(v.verdict.action.long).toBe("Book the morning · recheck tomorrow 10:00");
    expect(v.kit).toMatchObject({ kite: "Kites 9–12 m", wetsuit: "Light wetsuit" });
    expect(v.cards.wind.gusts).toEqual({ text: "Gusts 13–31 kn", gap: "· up to +19", warn: true });
    expect(v.cards.wind.agreement.rows).toEqual([
      { category: "steady", label: "Steady", count: 2, detail: "18–20 kn" },
      { category: "gusty", label: "Too gusty", count: 2, detail: "gusts to 31 kn" },
      { category: "light", label: "Too light", count: 1, detail: "under 12 kn" },
    ]);
    expect(v.cards.waves.agreement).toBe("1 of 2 forecasts over 1 m from 17:00");
    expect(v.cards.tide.pill).toBe("Rising. Lesson zone open.");
  });

  it("picking one hour re-evaluates the verdict for that hour", () => {
    const v = buildView(data(), "afternoon", "15:00");
    expect(v.verdict.word).toBe("UNSURE");
    expect(v.hours.map((h) => h.hour)).toEqual(["15:00", "16:00", "17:00", "18:00", "19:00"]);
    expect(v.hours[0].label).toEqual({ long: "15:00", short: "15" });
  });

  it("defaults to the first go window and reports every window's status", () => {
    expect(defaultWindow(data())).toBe("morning");
    expect(windowStatuses(data())).toEqual({ morning: "go", midday: "no", afternoon: "warn" });
  });
});

describe("rule thresholds", () => {
  it("classifies wind with danger first: strong > gusty > light > steady", () => {
    expect(classifyWind({ windAvgKn: 12, gustKn: 16 })).toBe("steady");
    expect(classifyWind({ windAvgKn: 11, gustKn: 15 })).toBe("light");
    expect(classifyWind({ windAvgKn: 25, gustKn: 30 })).toBe("steady");
    expect(classifyWind({ windAvgKn: 26, gustKn: 28 })).toBe("strong");
    expect(classifyWind({ windAvgKn: 15, gustKn: 25 })).toBe("gusty");
    expect(classifyWind({ windAvgKn: 15, gustKn: 24 })).toBe("steady");
    expect(classifyWind({ windAvgKn: 11, gustKn: 25 })).toBe("gusty");
    expect(classifyWind({ windAvgKn: 26, gustKn: 40 })).toBe("strong");
  });

  it("waves at exactly 1.0 m pass; tide at exactly 0.5 m passes", () => {
    const d = data();
    d.tide.find((t) => t.hour === "07:00")!.tideM = 0.5;
    expect(evaluateHour(d, "07:00").gates.tide).toBe("go");
    d.tide.find((t) => t.hour === "07:00")!.tideM = 0.49;
    expect(evaluateHour(d, "07:00").gates.tide).toBe("no");
    expect(evaluateHour(d, "16:00").gates.waves).toBe("go");
  });

  it("averages angles on a circle", () => {
    expect(circularMean([350, 10])).toBeCloseTo(0, 5);
    expect(circularMean([])).toBeNull();
  });

  it("formats ranges with an en dash and a dash when empty", () => {
    expect(range([9, 20, 14])).toBe("9–20");
    expect(range([20, 20])).toBe("20");
    expect(range([])).toBe("—");
    expect(range([0.5, 1.3], 1)).toBe("0.5–1.3");
  });

  it("falls back to 'recheck' when no forecast is steady the whole window", () => {
    const d = data();
    d.atmospheric.gfs.find((p) => p.hour === "17:00")!.gustKn = 35;
    d.atmospheric.ecmwf.find((p) => p.hour === "18:00")!.gustKn = 35;
    const v = buildView(d, "afternoon", null);
    expect(v.verdict.word).toBe("UNSURE");
    expect(v.kit.kite).toBe("Kite: recheck at 10:00");
  });
});

describe("not tied to this dataset", () => {
  it("counts the forecasts it gets", () => {
    const d = smallerDataset();
    expect(evaluateHour(d, "15:00").wind).toMatchObject({ n: 3, teachable: 1 });
    const v = buildView(d, "afternoon", null);
    expect(v.hours.map((h) => h.hour)).toEqual(["15:00", "16:00"]);
    expect(v.cards.waves.agreement).toBe("1 of 1 forecast agrees");
    expect(buildView(d, "morning", null).cards.wind.agreement.text).toBe("All 3 forecasts agree");
  });

  it("a model missing an hour just doesn't count for that hour", () => {
    const d = data();
    d.atmospheric.hrw = d.atmospheric.hrw.filter((p) => p.hour !== "15:00");
    expect(evaluateHour(d, "15:00").wind).toMatchObject({ n: 4, teachable: 2 });
  });

  it("drops windows with no hours and never throws on empty data", () => {
    const d = smallerDataset();
    d.hours = d.hours.filter((h) => h < "12:00");
    expect(buildView(d, "afternoon", null).windowKey).toBe("morning");
    const empty: Forecast = { ...data(), hours: [], atmospheric: {}, wave: {}, tide: [] };
    expect(() => buildView(empty, "morning", null)).not.toThrow();
    expect(evaluateWindow(empty, "morning").status).toBe("warn");
  });
});

describe("applyUpdate", () => {
  const update: ForecastUpdate = {
    modelId: "icon",
    kind: "atmospheric",
    hour: "17:00",
    field: "gustKn",
    value: 33,
    at: 0,
  };

  it("changes one cell and shares everything else", () => {
    const before = data();
    const after = applyUpdate(before, update);
    expect(cellValue(before, update)).toBe(29);
    expect(cellValue(after, update)).toBe(33);
    expect(after.atmospheric.gfs).toBe(before.atmospheric.gfs);
    expect(after.wave).toBe(before.wave);
    expect(after.atmospheric.icon[0]).toBe(before.atmospheric.icon[0]);
  });

  it("returns the same object when nothing changes or the cell doesn't exist", () => {
    const d = data();
    expect(applyUpdate(d, { ...update, value: 29 })).toBe(d);
    expect(applyUpdate(d, { ...update, modelId: "nope" })).toBe(d);
    expect(applyUpdate(d, { ...update, hour: "23:00" })).toBe(d);
  });
});

describe("table rows", () => {
  it("colors each variable on its own: at 15:00 wind passes, gusts are split", () => {
    const rows = tableRows(data());
    const at15 = (key: string) => rows.find((r) => r.key === key)!.cells.find((c) => c.hour === "15:00")!;
    expect(rows).toHaveLength(9);
    expect(at15("wind")).toMatchObject({ text: "12–20", status: "go" });
    expect(at15("gusts")).toMatchObject({ text: "16–26", status: "warn" });
    expect(at15("agree")).toMatchObject({ text: "3/5", agree: { k: 3, n: 5 } });
  });
});

describe("the picker's one-line reasons", () => {
  it("explains each window the way the design does", () => {
    const v = buildView(data(), "morning", null);
    expect(v.windows.map((w) => w.reason)).toEqual([
      "Steady 17–20 kn. All forecasts agree.",
      "Low tide at 13:00. No lesson zone.",
      "Forecasts disagree on the wind.",
    ]);
  });
});

describe("what the live row says", () => {
  const base = {
    modelId: "gfs",
    hour: "17:00",
    field: "gustKn",
    from: 26,
    to: 29,
    at: 1000,
    verdictBefore: { morning: "go", midday: "no", afternoon: "warn" },
    verdictAfter: { morning: "go", midday: "no", afternoon: "warn" },
  } as const;

  it("names what moved, never the model, and says it changed nothing", () => {
    expect(changeCopy(base, "afternoon")).toEqual({
      long: "One forecast raised its 17:00 gusts from 26 to 29 kn. Still unsure.",
      short: "17:00 gusts 26 → 29 kn · still unsure",
    });
  });

  it("calls out the window Marta is looking at when its verdict moves", () => {
    const change = { ...base, verdictAfter: { ...base.verdictAfter, morning: "warn" } } as const;
    expect(changeCopy(change, "morning").long).toBe(
      "One forecast raised its 17:00 gusts from 26 to 29 kn. Morning is now unsure.",
    );
  });

  it("says her window is unchanged when a different one moves", () => {
    const change = { ...base, verdictAfter: { ...base.verdictAfter, afternoon: "no" } } as const;
    expect(changeCopy(change, "morning").long).toBe(
      "One forecast raised its 17:00 gusts from 26 to 29 kn. Morning unchanged.",
    );
  });

  it("handles a wave going down, in metres", () => {
    const change = { ...base, field: "waveHeightM", from: 1.1, to: 0.8 } as const;
    expect(changeCopy(change, "afternoon").long).toBe(
      "One forecast lowered its 17:00 waves from 1.1 to 0.8 m. Still unsure.",
    );
  });
});

describe("the tide chart and the air card", () => {
  it("hands the chart the whole day, the window and the closed stretch", () => {
    const chart = buildView(data(), "morning", null).cards.tide.chart;
    expect(chart.points).toHaveLength(13);
    expect(chart.window).toEqual({ from: 0, to: 4 }); // 07:00–11:00
    expect(chart.closed).toEqual({ from: 5, to: 7 }); // 12:00–14:00, under 0.5 m
    expect(chart.axis).toEqual(["07", "09", "11", "13", "15", "17", "19"]);
    expect(chart.marks).toEqual([
      { index: 0, text: "07:00 · 2.5 m", warn: false },
      { index: 6, text: "13:00 · low 0.3 m", warn: true },
      { index: 12, text: "19:00 · high 2.5 m", warn: false },
    ]);
    expect(chart.max).toBe(2.5);
  });

  it("calls the morning cold and says which hour is the coldest", () => {
    expect(buildView(data(), "morning", null).cards.air).toEqual({
      headline: "Cold",
      cold: true,
      range: "14–17",
      note: "Coldest at 07:00. Under 16 °C we suggest full wetsuits.",
    });
  });
});

describe("the tide chart's spoken description", () => {
  it("reads out the shape of the day instead of the curve", () => {
    expect(buildView(data(), "morning", null).cards.tide.chart.description).toBe(
      "Tide: 2.5 m at 07:00, low of 0.3 m at 13:00, high of 2.5 m at 19:00." +
        " Lesson zone closed under 0.5 m, around 12:00 to 14:00.",
    );
  });
});

describe("the tide tooltip", () => {
  it("reads the hour, the height, where it is going and whether the zone is closed", () => {
    const points = buildView(data(), "morning", null).cards.tide.chart.points;
    expect(points[6].label).toBe("13:00 · 0.3 m ↓ · zone closed");
    expect(points[0].label).toBe("07:00 · 2.5 m");
    expect(points[12].label).toBe("19:00 · 2.5 m ↑");
  });
});

describe("the table's help", () => {
  it("writes itself from the rules and the number of forecasts", () => {
    const help = tableHelp(5);
    expect(help.colors[0].body).toBe("All 5 forecasts pass your rule.");
    expect(help.sections[1].body).toBe(
      "How many of the 5 forecasts give a teachable wind for that hour:" +
        " between 12 and 25 kn, with gusts less than 10 kn above the wind.",
    );
    expect(help.sections[2].body).toBe(
      "Wind 12–25 kn · gusty = gusts 10+ kn over the wind · waves over 1 m · low tide = under 0.5 m.",
    );
    // Same wording as the Figma's row popover.
    expect(rowHelp("agree", 5)).toBe(help.sections[1].body);
  });
});

describe("which card a revision lights up", () => {
  const base = { modelId: "gfs", hour: "17:00", from: 1, to: 2, at: 1000 } as const;
  const verdicts = { morning: "go", midday: "no", afternoon: "warn" } as const;

  it("maps the feed's three fields to a card, and nothing else", () => {
    const of = (field: string) =>
      cardForChange({ ...base, field, verdictBefore: verdicts, verdictAfter: verdicts });
    expect(of("windAvgKn")).toBe("wind");
    expect(of("gustKn")).toBe("wind");
    expect(of("waveHeightM")).toBe("waves");
    expect(cardForChange(null)).toBeNull();
  });
});

describe("temperatures never contradict the wetsuit rule", () => {
  it("rounds to whole degrees but never up across the threshold", () => {
    const d = data();
    // 15.5 °C would round to 16 and read as "16 °C · full wetsuit under 16 °C".
    for (const id of Object.keys(d.atmospheric)) {
      for (const point of d.atmospheric[id]) point.tempC = 15.5;
    }
    const v = buildView(d, "morning", null);
    expect(v.kit.coldest).toBe("15 °C");
    expect(v.cards.air.range).toBe("15");
    expect(v.cards.air.cold).toBe(true);
  });
});
