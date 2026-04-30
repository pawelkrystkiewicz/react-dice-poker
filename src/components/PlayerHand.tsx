import { Card, Chip } from "chunks-ui";
import { evaluateHand } from "../evaluator";
import type { DiceSet, PlayerState } from "../types";
import { HAND_LABEL } from "../types";
import { Die } from "./Die";

type PlayerHandProps = {
  title: string;
  player: PlayerState;
  reveal: boolean;
  interactive: boolean;
  onToggleHold?: (index: number) => void;
};

export function PlayerHand({ title, player, reveal, interactive, onToggleHold }: PlayerHandProps) {
  const handLabel = reveal && player.dice ? safeHandLabel(player.dice) : null;
  const matched = player.dice
    ? matchedIndices(player.dice)
    : ([false, false, false, false, false] as const);
  const showHeld = !player.hasRerolled;

  return (
    <Card.Root className="flex flex-col gap-3 p-4">
      <Card.Header className="flex flex-row items-center justify-between p-0">
        <Card.Title className="text-lg">{title}</Card.Title>
        {handLabel ? <Chip>{handLabel}</Chip> : null}
      </Card.Header>
      <Card.Content className="flex gap-2 p-0">
        {(player.dice ?? [null, null, null, null, null]).map((value, i) => (
          <Die
            key={i}
            value={value}
            held={showHeld && player.held[i]}
            matched={matched[i]}
            interactive={interactive && !player.hasRerolled}
            onClick={interactive && onToggleHold ? () => onToggleHold(i) : undefined}
          />
        ))}
      </Card.Content>
    </Card.Root>
  );
}

function matchedIndices(dice: DiceSet): boolean[] {
  const counts = new Map<number, number>();
  for (const d of dice) counts.set(d, (counts.get(d) ?? 0) + 1);

  const isSmallStraight = [1, 2, 3, 4, 5].every((v) => counts.has(v));
  const isBigStraight = [2, 3, 4, 5, 6].every((v) => counts.has(v));
  if (isSmallStraight || isBigStraight) {
    return [true, true, true, true, true];
  }

  return dice.map((d) => (counts.get(d) ?? 0) >= 2);
}

function safeHandLabel(dice: DiceSet): string {
  try {
    return HAND_LABEL[evaluateHand(dice).class];
  } catch {
    return "?";
  }
}
