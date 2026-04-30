import { Card } from "chunks-ui";
import { MATCH_MAX_GAMES, MATCH_TARGET } from "../types";

type ScoreboardProps = {
  userWins: number;
  aiWins: number;
  gamesPlayed: number;
};

export function Scoreboard({ userWins, aiWins, gamesPlayed }: ScoreboardProps) {
  return (
    <Card.Root className="flex flex-row justify-between items-center gap-4 p-4">
      <ScoreCell label="You" value={userWins} />
      <div className="text-sm text-muted-foreground">
        Game {Math.min(gamesPlayed + 1, MATCH_MAX_GAMES)} / {MATCH_MAX_GAMES}
        <div className="text-xs">First to {MATCH_TARGET} wins</div>
      </div>
      <ScoreCell label="Opponent" value={aiWins} />
    </Card.Root>
  );
}

function ScoreCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-3xl font-semibold tabular-nums">{value}</span>
    </div>
  );
}
