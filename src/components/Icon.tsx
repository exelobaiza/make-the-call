import type { CSSProperties } from "react";
import { ICONS, type IconName } from "./icons";

type Props = {
  name: IconName;
  size?: number;
  className?: string;
  /** Only for rotating an icon, e.g. the wind arrow. */
  style?: CSSProperties;
};

/** Decorative icon painted with the surrounding text color. */
export function Icon({ name, size = 16, className = "", style }: Props) {
  const mask = `url("${ICONS[name]}") center / contain no-repeat`;

  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 bg-current ${className}`}
      style={{ width: size, height: size, mask, WebkitMask: mask, ...style }}
    />
  );
}
