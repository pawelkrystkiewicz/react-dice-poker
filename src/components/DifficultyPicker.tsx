import { ToggleGroup } from "chunks-ui";
import type { Difficulty } from "../types";

type DifficultyPickerProps = {
  value: Difficulty;
  disabled?: boolean;
  onChange: (next: Difficulty) => void;
};

const OPTIONS: { value: Difficulty; label: string; hint: string }[] = [
  { value: "random", label: "Easy", hint: "AI re-rolls a random subset" },
  { value: "naive", label: "Medium", hint: "AI keeps its most-frequent value" },
  { value: "greedy", label: "Hard", hint: "AI plays toward the best hand (TODO)" },
];

export function DifficultyPicker({ value, disabled, onChange }: DifficultyPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">Difficulty</span>
      <ToggleGroup.Root
        value={[value]}
        onValueChange={(values: string[]) => {
          const next = values[0] as Difficulty | undefined;
          if (next) onChange(next);
        }}
        disabled={disabled}
      >
        {OPTIONS.map((opt) => (
          <ToggleGroup.Item key={opt.value} value={opt.value} title={opt.hint}>
            {opt.label}
          </ToggleGroup.Item>
        ))}
      </ToggleGroup.Root>
    </div>
  );
}
