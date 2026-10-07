import { useCallback, useState } from "react";
import type { Change } from "../domain/change";
import { rowHelp } from "../domain/help";
import { useFresh } from "../state/useFresh";
import { hourShort } from "../domain/format";
import type { Cell, Row, RowKey } from "../domain/tableRows";
import type { Status } from "../domain/types";
import { Icon } from "./Icon";
import { STATUS_ICON } from "./status";
import { TableInfo } from "./TableInfo";
import { TermSheet, type Anchor } from "./TermSheet";

/** Which row a revision lands in, so its cell can be outlined. */
const FIELD_ROW: Record<string, RowKey> = {
  windAvgKn: "wind",
  gustKn: "gusts",
  waveHeightM: "waves",
};

/*
 * Only amber and red tint a value: a green cell on every passing number would
 * paint most of the table. Green lives in the Beginners row, which is the summary.
 */
const CELL_TINT: Record<Status, string> = {
  go: "",
  warn: "bg-status-warn-bg",
  no: "bg-status-no-bg/50",
};

const CELL_TEXT: Record<Status, string> = {
  go: "",
  warn: "text-status-warn-text",
  no: "text-status-no-text",
};

const CHIP: Record<Status, string> = {
  go: "bg-status-go-bg text-status-go-text",
  warn: "bg-status-warn-bg text-status-warn-text",
  no: "bg-status-no-bg text-status-no-text",
};

function CellBody({ row, cell }: { row: RowKey; cell: Cell }) {
  if (row === "beginners") {
    return (
      <span className={`flex h-6 items-center justify-center ${CHIP[cell.status ?? "warn"]}`}>
        <Icon name={STATUS_ICON[cell.status ?? "warn"]} size={14} />
      </span>
    );
  }

  if (row === "agree" && cell.agree) {
    const { k, n } = cell.agree;
    return (
      <span className="flex flex-col items-center gap-[3px]">
        <span className="flex w-[52px] gap-[2px]">
          {Array.from({ length: n }, (_, i) => (
            <span
              key={i}
              className={`h-[5px] flex-1 ${i < k ? "bg-status-go-fill" : "bg-chart-warn"}`}
            />
          ))}
        </span>
        <span className="font-semibold">{cell.text}</span>
      </span>
    );
  }

  if (row === "dir" && cell.deg !== undefined) {
    return (
      <span className="flex items-center justify-center gap-[2px]">
        {/* The arrow points where the wind goes; the number is where it comes from. */}
        <Icon name="arrow-down" size={12} style={{ transform: `rotate(${cell.deg}deg)` }} />
        {cell.text}
      </span>
    );
  }

  return <>{cell.text}</>;
}

type Props = {
  rows: Row[];
  hours: string[];
  /** The chosen window's hours, or just the chosen one: those columns are shaded. */
  highlight: string[];
  lastChange: Change | null;
  /** How many atmospheric forecasts the data has, for the help copy. */
  forecasts: number;
};

export function ForecastTable({ rows, hours, highlight, lastChange, forecasts }: Props) {
  const lit = new Set(highlight);
  // One at a time: opening a row term closes the (i), and the other way round.
  const [open, setOpen] = useState<"table" | RowKey | null>(null);
  // Measured when the label is clicked, never during render.
  const [anchor, setAnchor] = useState<Anchor | null>(null);

  const close = useCallback(() => {
    setOpen(null);
    anchor?.trigger.focus();
  }, [anchor]);

  function openTerm(key: RowKey, trigger: HTMLElement) {
    const box = trigger.getBoundingClientRect();
    setAnchor({ left: box.left, top: box.top, bottom: box.bottom, trigger });
    setOpen(key);
  }
  // Same 4s window as the status row: the outline is a notice, not a permanent mark.
  const recent = useFresh(lastChange?.at ?? null, 4000);

  return (
    <>
      <div className="relative flex items-center gap-2">
        <h2 className="meta">Hour by hour · every forecast</h2>
        <button
          type="button"
          aria-expanded={open === "table"}
          aria-label="How to read this table"
          onClick={() => setOpen(open === "table" ? null : "table")}
          className="flex size-6 items-center justify-center border border-border-default text-text-secondary"
        >
          <Icon name="info" size={14} />
        </button>
        {open === "table" ? <TableInfo n={forecasts} onClose={close} /> : null}
      </div>

      {/* Native <table>: the row and column semantics come for free. */}
      {/* Scrolls where it has to; on desktop the table fits, so the row popovers aren't clipped. */}
      <div className="-mx-4 mt-4 overflow-x-auto tablet:mx-0 desktop:overflow-visible">
      <table className="w-full min-w-[900px] border-separate border-spacing-0 px-4 text-[13px] tablet:px-0">
        <thead>
          <tr>
            <th
              scope="col"
              className="sticky left-0 z-10 w-[128px] bg-surface-card py-[14px] text-left font-normal text-text-tertiary tablet:w-[168px]"
            >
              Hour
            </th>
            {hours.map((hour) => (
              <th
                key={hour}
                scope="col"
                className={`w-[72px] px-1 py-[14px] text-center tablet:w-auto ${
                  lit.has(hour) ? "bg-surface-selected font-semibold" : "font-normal text-text-tertiary"
                }`}
              >
                {hourShort(hour)}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <th scope="row" className="sticky left-0 z-10 bg-surface-card py-[14px] text-left">
                <span className="relative inline-block">
                  <button
                    type="button"
                    aria-expanded={open === row.key}
                    onClick={(event) =>
                      open === row.key ? close() : openTerm(row.key, event.currentTarget)
                    }
                    // Browsers centre button text by default; the th's text-left doesn't reach it.
                    className="text-left font-semibold underline"
                  >
                    {row.label}
                  </button>
                  {open === row.key && anchor ? (
                    <TermSheet
                      title={row.label}
                      body={rowHelp(row.key, forecasts)}
                      anchor={anchor}
                      onClose={close}
                    />
                  ) : null}
                </span>
              </th>
              {row.cells.map((cell) => {
                const fresh =
                  recent &&
                  lastChange !== null &&
                  lastChange.hour === cell.hour &&
                  FIELD_ROW[lastChange.field] === row.key;
                const status = row.key === "beginners" ? null : cell.status;

                return (
                  <td
                    key={cell.hour}
                    data-fresh={fresh ? "" : undefined}
                    className={`px-1 py-[14px] text-center tablet:px-2 ${
                      lit.has(cell.hour) ? "bg-surface-selected" : ""
                    } ${status ? `${CELL_TINT[status]} ${CELL_TEXT[status]}` : ""} data-fresh:outline data-fresh:outline-action-active`}
                  >
                    <CellBody row={row.key} cell={cell} />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </>
  );
}
