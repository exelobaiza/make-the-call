/**
 * Marta's rules. Every threshold lives here, marked as coming from the brief or
 * assumed by us. Changing a rule is changing a number.
 */
export const RULES = {
  windMinKn: 12, // brief: under 12 kn, no lesson
  windMaxKn: 25, // brief: over 25 kn, beginners can't handle it
  gustGapTooGustyKn: 10, // brief: the gust gap matters more than either number; the 10 kn threshold is ours
  waveMaxM: 1.0, // brief: over ~1 m fails
  tideMinM: 0.5, // ours: under 0.5 m the sandbar closes the lesson zone. Tide is a fact, not a forecast: never "warn"
  beachFacingDeg: 270, // ours: spot setting, the beach faces west
  dirGoMaxDeg: 70, // ours: within 70° of onshore is on/side-onshore → go
  dirWarnMaxDeg: 90, // ours: 70–90° is side-shore → warn; over 90° blows offshore → no
  fullWetsuitBelowC: 16, // brief asks for the wetsuit call; threshold ours
  smallerKiteBelowC: 15, // ours: cold air is denser, one kite size down
  recheckAt: "10:00", // ours: when the morning runs update, the afternoon is clearer
} as const;

/** ours: kite size by gust midpoint, for a ~75 kg rider. Ordered from smallest kite. */
export const KITE_CHART = [
  { minGustKn: 30, size: "5–7" },
  { minGustKn: 26, size: "7–9" },
  { minGustKn: 22, size: "9–12" },
  { minGustKn: 18, size: "12–14" },
  { minGustKn: 0, size: "14–17" },
] as const;
