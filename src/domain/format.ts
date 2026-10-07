const EN_DASH = "\u2013";

/** 20 → "20", 13.5 → "13.5", 1 with decimals 1 → "1.0". */
export function num(n: number, decimals?: number): string {
  if (decimals !== undefined) return n.toFixed(decimals);
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

/** [9, 20, 14] → "9–20"; a single value → "20"; nothing → "—". */
export function range(xs: number[], decimals?: number): string {
  if (xs.length === 0) return "—";
  const lo = Math.min(...xs);
  const hi = Math.max(...xs);
  return lo === hi ? num(lo, decimals) : `${num(lo, decimals)}${EN_DASH}${num(hi, decimals)}`;
}

/** "15:00" → "15". */
export function hourShort(hour: string): string {
  return hour.split(":")[0];
}

/** 301° → "NW". The direction the wind blows from. */
export function compass(deg: number): string {
  const points = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return points[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
