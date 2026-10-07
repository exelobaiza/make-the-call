import type { ReactNode } from "react";
import { useFresh } from "../state/useFresh";
import { Icon } from "./Icon";
import { CARD_DECIDING } from "./status";
import type { Status } from "../domain/types";
import type { IconName } from "./icons";

/** Same window the status row uses for "Just updated". */
const FRESH_MS = 4000;

type Props = {
  icon: IconName;
  label: string;
  /**
   * Set on the card that explains the verdict, with that verdict's status: its
   * border takes the status colour, which is what tells it apart from the
   * neutral "just changed" border.
   */
  deciding?: Status | null;
  /** When this card's own number last changed: the neutral border, for 4s. */
  freshAt?: number | null;
  className?: string;
  children: ReactNode;
};

/** The shell every card shares: 20px of padding, an icon and a small caps label. */
export function Card({ icon, label, deciding = null, freshAt = null, className = "", children }: Props) {
  const fresh = useFresh(freshAt, FRESH_MS);

  /*
   * The two marks use different channels on purpose, so neither hides the other:
   *
   *   border  — permanent, in the verdict's colour, on the card that explains it.
   *   outline — for 4s, neutral, on the card whose number just moved.
   *
   * If "just updated" took the border, it would swallow the status colour: the
   * feed revises something every 2.5s, less than the 4s the notice lasts, so the
   * border would never make it back. And an outline is drawn outside the box
   * without taking space, so it can't move anything either.
   */
  const edge = deciding
    ? // The 2px border eats a pixel of padding so the content never moves.
      `border-2 ${CARD_DECIDING[deciding]} p-[15px] tablet:p-[19px]`
    : "border border-border-default p-4 tablet:p-5";
  const notice = fresh ? "outline-2 outline-action-active" : "";

  return (
    <article
      data-fresh={fresh ? "" : undefined}
      className={`bg-surface-card ${edge} ${notice} ${className}`}
    >
      <h3 className="meta flex items-center gap-[6px]">
        <Icon name={icon} size={14} />
        {label}
      </h3>
      {children}
    </article>
  );
}
