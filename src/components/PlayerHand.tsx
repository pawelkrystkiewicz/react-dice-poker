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
            held={player.held[i]}
            interactive={interactive && !player.hasRerolled}
            onClick={interactive && onToggleHold ? () => onToggleHold(i) : undefined}
          />
        ))}
      </Card.Content>
    </Card.Root>
  );
}

function safeHandLabel(dice: DiceSet): string {
  try {
    return HAND_LABEL[evaluateHand(dice).class];
  } catch {
    return "?";
  }
}
