import * as React from "react";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  calculateScoreProgress,
  calculatePointsToNextLevel,
} from "@/lib/utils";
import { useProfileCreatorScore } from "@/hooks/useProfileCreatorScore";
import { LEVEL_RANGES } from "@/lib/constants";

export function ScoreProgressAccordion({ talentUUID }: { talentUUID: string }) {
  const { creatorScore, lastCalculatedAt, loading } =
    useProfileCreatorScore(talentUUID);

  const score = typeof creatorScore === "number" ? creatorScore : null;

  // Calculate level using LEVEL_RANGES
  const level = score
    ? (() => {
        const levelInfo = LEVEL_RANGES.find(
          (range) => score >= range.min && score <= range.max,
        );
        return levelInfo ? LEVEL_RANGES.indexOf(levelInfo) + 1 : 1;
      })()
    : null;

  const progress = calculateScoreProgress(score ?? 0, level ?? 1);
  const pointsToNext = calculatePointsToNextLevel(score ?? 0, level ?? 1);

  return (
    <Accordion type="single" collapsible className="space-y-2">
      <AccordionItem
        value="score-progress"
        className="bg-muted rounded-xl p-0 mb-3 border-0 shadow-none"
      >
        <AccordionTrigger className="px-6 py-4 flex items-center justify-between bg-muted rounded-xl">
          <div className="flex flex-col flex-1 gap-1 text-left">
            <span className="font-medium text-base text-foreground">
              Creator Score
            </span>
            <span className="text-xs text-muted-foreground font-normal mt-0.5">
              Level {level ?? "—"}
            </span>
          </div>
          <span className="ml-4 text-xl font-semibold text-foreground w-16 text-right">
            {loading ? "—" : (score?.toLocaleString() ?? "—")}
          </span>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-5 bg-muted rounded-b-xl">
          <div className="space-y-2">
            <div className="relative w-full flex items-center justify-center mb-0">
              <Progress
                value={progress}
                className="h-2 bg-muted-foreground/20 [&>div]:bg-foreground"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
              <span>
                {pointsToNext && level
                  ? `${pointsToNext.toString()} points to Level ${(level + 1).toString()}`
                  : level === 6
                    ? "Master level reached!"
                    : "Level up!"}
              </span>
              <span>
                Last updated:{" "}
                {lastCalculatedAt
                  ? new Date(lastCalculatedAt).toLocaleDateString()
                  : "—"}
              </span>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
