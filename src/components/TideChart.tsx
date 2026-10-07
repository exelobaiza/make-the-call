import { useState } from "react";
import type { TideChart as Chart } from "../domain/view";

/*
 * Drawn by hand in an SVG, no library: it is one small chart and this way we
 * control every pixel of it — which is what keeps it from moving.
 *
 * The scale comes from the data, never from this dataset: 0 m sits at y=46 and
 * the highest tide of the day at y=19, so the curve always fills the same band.
 */
const W = 120;
const H = 50;
const BASE = 46;
const SPAN = 27;

export function TideChart({ chart, onPick }: { chart: Chart; onPick: (hour: string) => void }) {
  const [hover, setHover] = useState<number | null>(null);
  const { points, max, limit, window, closed, marks, description } = chart;
  const n = points.length;
  if (n === 0) return null;

  const x = (i: number) => (n === 1 ? W / 2 : (i / (n - 1)) * W);
  const y = (metres: number) => (max === 0 ? BASE : BASE - (metres / max) * SPAN);

  // Cubic segments with the control points on the midpoints: a smooth curve from plain data.
  const curve = points
    .map((p, i) => {
      if (i === 0) return `M${x(0)} ${y(p.tideM)}`;
      const mid = (x(i - 1) + x(i)) / 2;
      return `C${mid} ${y(points[i - 1].tideM)} ${mid} ${y(p.tideM)} ${x(i)} ${y(p.tideM)}`;
    })
    .join(" ");

  /** Bands run to the half hour either side, so they frame the hours they cover. */
  const band = (from: number, to: number) => {
    const left = Math.max(0, x(from - 0.5));
    const right = Math.min(W, x(to + 0.5));
    return { x: left, width: right - left };
  };

  return (
    <div
      role="img"
      aria-label={description}
      onPointerLeave={() => setHover(null)}
      className="relative h-[106px] tablet:h-[116px]"
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        className="h-full w-full text-text-primary"
      >
        {window ? (
          <rect {...band(window.from, window.to)} y={0} height={H} className="fill-surface-selected" />
        ) : null}
        {closed ? (
          <rect {...band(closed.from, closed.to)} y={0} height={H} className="fill-tide-closed" />
        ) : null}

        <path d={`${curve} L${W} ${H} L0 ${H} Z`} className="fill-tide-fill" />
        <line
          x1={0}
          x2={W}
          y1={y(limit)}
          y2={y(limit)}
          strokeDasharray="2 2"
          strokeWidth={1}
          className="stroke-status-warn-text/40 [vector-effect:non-scaling-stroke]"
        />
        <path
          d={curve}
          fill="none"
          strokeWidth={1.5}
          className="stroke-current [vector-effect:non-scaling-stroke]"
        />

        {hover === null ? null : (
          <line
            x1={x(hover)}
            x2={x(hover)}
            y1={0}
            y2={H}
            strokeWidth={1}
            className="stroke-current [vector-effect:non-scaling-stroke]"
          />
        )}
      </svg>

      {/* Dots are HTML, not SVG: the viewBox is stretched, so a circle in it would be an ellipse. */}
      {/*
       * Pointer-only hit zones, one per hour, hidden from assistive tech: the
       * keyboard path to the same action is the hour strip, a real control, and
       * 13 extra tab stops would only duplicate it.
       */}
      <div className="absolute inset-0 flex" aria-hidden="true">
        {points.map((point, i) => (
          <button
            key={point.hour}
            type="button"
            tabIndex={-1}
            onPointerEnter={() => setHover(i)}
            onClick={() => onPick(point.hour)}
            // The first and last cover half a slot, like the Figma.
            style={{ flex: i === 0 || i === n - 1 ? "0 0 auto" : "1 1 0", width: i === 0 || i === n - 1 ? `${50 / (n - 1)}%` : undefined }}
            className="h-full cursor-pointer"
          />
        ))}
      </div>

      {hover === null ? null : (
        <p
          className="pointer-events-none absolute z-10 -translate-x-1/2 border border-border-strong bg-surface-card px-2 py-1 text-[12px] whitespace-nowrap"
          style={{
            left: `clamp(0px, ${(x(hover) / W) * 100}%, 100%)`,
            top: `calc(${(y(points[hover].tideM) / H) * 100}% - 32px)`,
          }}
        >
          {points[hover].label}
        </p>
      )}

      {marks.map((mark) => (
        <span
          key={mark.index}
          className="pointer-events-none absolute size-[6px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-text-primary"
          style={{ left: `${(x(mark.index) / W) * 100}%`, top: `${(y(points[mark.index].tideM) / H) * 100}%` }}
        />
      ))}

      {hover === null ? null : (
        <span
          className="pointer-events-none absolute size-[8px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-text-primary bg-surface-card"
          style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(points[hover].tideM) / H) * 100}%` }}
        />
      )}
    </div>
  );
}
