import type { Status } from "../domain/types";
import type { IconName } from "./icons";

export const STATUS_ICON: Record<Status, IconName> = {
  go: "check",
  warn: "circle-help",
  no: "x",
};

/** Spoken status of a gate, from the Figma layer names ("Tide fails"). */
export const GATE_STATE: Record<Status, string> = { go: "passes", warn: "unsure", no: "fails" };

/*
 * Tailwind scans the source for whole class names, so a status can never build
 * its own class: every combination is written out here.
 */
export const VERDICT_CLASS: Record<Status, string> = {
  go: "border-status-go-border bg-status-go-bg text-status-go-text",
  warn: "border-status-warn-border bg-status-warn-bg text-status-warn-text",
  no: "border-status-no-border bg-status-no-bg text-status-no-text",
};

/** The card that explains the verdict: its border carries the verdict's colour. */
export const CARD_DECIDING: Record<Status, string> = {
  go: "border-status-go-border",
  warn: "border-status-warn-border",
  no: "border-status-no-border",
};

/** The rule above the kit line: the status colour at 60%. */
export const DIVIDER_CLASS: Record<Status, string> = {
  go: "border-status-go-border/60",
  warn: "border-status-warn-border/60",
  no: "border-status-no-border/60",
};

export const CHIP_CLASS: Record<Status, string> = {
  go: "border-status-go-border bg-status-go-bg text-status-go-text",
  warn: "border-status-warn-border bg-status-warn-bg text-status-warn-text",
  no: "border-status-no-border bg-status-no-bg text-status-no-text",
};
