// Icons from Lucide (ISC License, https://lucide.dev), copied as SVG files.
import arrowDown from "../assets/icons/arrow-down.svg";
import arrowDownToLine from "../assets/icons/arrow-down-to-line.svg";
import arrowUp from "../assets/icons/arrow-up.svg";
import check from "../assets/icons/check.svg";
import chevronDown from "../assets/icons/chevron-down.svg";
import chevronRight from "../assets/icons/chevron-right.svg";
import circleHelp from "../assets/icons/circle-help.svg";
import info from "../assets/icons/info.svg";
import refreshCw from "../assets/icons/refresh-cw.svg";
import snowflake from "../assets/icons/snowflake.svg";
import thermometer from "../assets/icons/thermometer.svg";
import waves from "../assets/icons/waves.svg";
import wind from "../assets/icons/wind.svg";
import x from "../assets/icons/x.svg";

export const ICONS = {
  "arrow-down": arrowDown,
  "arrow-down-to-line": arrowDownToLine,
  "arrow-up": arrowUp,
  check,
  "chevron-down": chevronDown,
  "chevron-right": chevronRight,
  "circle-help": circleHelp,
  info,
  "refresh-cw": refreshCw,
  snowflake,
  thermometer,
  waves,
  wind,
  x,
} as const;

export type IconName = keyof typeof ICONS;
