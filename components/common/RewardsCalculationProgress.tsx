import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";

interface RewardsCalculationProgressProps {
  progress: number;
  message?: string;
}

export function RewardsCalculationProgress({
  progress,
  message = "Calculating rewards...",
}: RewardsCalculationProgressProps) {
  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{message}</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
