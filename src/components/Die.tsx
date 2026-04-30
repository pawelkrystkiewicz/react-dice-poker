import { cn } from "chunks-ui";
import type { DieValue } from "../types";

type DieProps = {
  value: DieValue | null;
  held?: boolean;
  matched?: boolean;
  interactive?: boolean;
  hidden?: boolean;
  onClick?: () => void;
};

const PIPS: Record<DieValue, [number, number][]> = {
  1: [[1, 1]],
  2: [
    [0, 0],
    [2, 2],
  ],
  3: [
    [0, 0],
    [1, 1],
    [2, 2],
  ],
  4: [
    [0, 0],
    [0, 2],
    [2, 0],
    [2, 2],
  ],
  5: [
    [0, 0],
    [0, 2],
    [1, 1],
    [2, 0],
    [2, 2],
  ],
  6: [
    [0, 0],
    [0, 2],
    [1, 0],
    [1, 2],
    [2, 0],
    [2, 2],
  ],
};

export function Die({ value, held, matched, interactive, hidden, onClick }: DieProps) {
  const showFace = value !== null && !hidden;
  const showMatchDot = !!matched && showFace;
  return (
    <div className="flex flex-col items-center gap-1">
      <span
        aria-hidden
        className={cn("size-2 rounded-full", showMatchDot ? "bg-warning" : "bg-transparent")}
      />
      <button
        type="button"
        disabled={!interactive}
        onClick={onClick}
        aria-label={
          showFace
            ? `Die showing ${value}${held ? ", held" : ""}${matched ? ", matched" : ""}`
            : "Die"
        }
        aria-pressed={held}
        className={cn(
          "size-16 rounded-xl border-2 transition-all p-2 grid grid-cols-3 grid-rows-3 gap-0.5",
          held ? "border-primary bg-primary/15 ring-2 ring-primary/40" : "border-border bg-card",
          interactive && "cursor-pointer hover:border-primary/60",
          !interactive && "cursor-default",
        )}
      >
        {showFace ? (
          PIPS[value].map(([row, col]) => (
            <span
              key={`${row}-${col}`}
              style={{ gridRow: row + 1, gridColumn: col + 1 }}
              className="size-2 rounded-full bg-foreground self-center justify-self-center"
            />
          ))
        ) : (
          <span className="col-span-3 row-span-3 self-center justify-self-center text-xs text-muted-foreground">
            ?
          </span>
        )}
      </button>
    </div>
  );
}
