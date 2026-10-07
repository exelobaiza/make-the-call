import { tableHelp } from "../domain/help";
import { Icon } from "./Icon";
import { Popover } from "./Popover";

const CHIP: Record<string, string> = {
  go: "bg-surface-selected text-text-primary",
  warn: "bg-status-warn-bg text-status-warn-text",
  no: "bg-status-no-bg/50 text-status-no-text",
};

/** "How to read this table": every number in it comes from the rules. */
export function TableInfo({ n, onClose }: { n: number; onClose: () => void }) {
  const help = tableHelp(n);

  return (
    <Popover
      onClose={onClose}
      className="absolute top-full left-0 z-20 mt-2 w-[min(460px,calc(100vw-48px))] p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-[16px] leading-[22px] font-semibold text-text-secondary">
          How to read this table
        </h3>
        <button type="button" onClick={onClose} aria-label="Close" className="-m-[10px] p-[10px]">
          <Icon name="x" size={16} />
        </button>
      </div>

      <p className="meta mt-4">Colors</p>
      <ul className="mt-2 flex flex-col gap-2">
        {help.colors.map((color) => (
          <li key={color.chip} className="flex items-center gap-[10px] text-[13px] leading-[19px] text-text-secondary">
            <span className={`flex w-16 shrink-0 justify-center py-1 ${CHIP[color.status]}`}>
              {color.chip}
            </span>
            {color.body}
          </li>
        ))}
      </ul>

      {help.sections.map((section) => (
        <div key={section.label}>
          <p className="meta mt-4">{section.label}</p>
          <p className="mt-1 text-[13px] leading-[19px] text-text-secondary">{section.body}</p>
        </div>
      ))}
    </Popover>
  );
}
