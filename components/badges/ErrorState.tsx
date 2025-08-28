import { Callout } from "@/components/common/Callout";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { RotateCcw, AlertCircle } from "lucide-react";

interface ErrorStateProps {
  error: string;
  retry?: () => void;
  showRetry?: boolean;
}

export function ErrorState({
  error,
  retry,
  showRetry = true,
}: ErrorStateProps) {
  return (
    <div className="max-w-xl mx-auto w-full p-4 space-y-6 pb-24">
      <div className="space-y-1">
        <Typography as="h1" size="2xl" weight="bold">
          Badges
        </Typography>
        <Typography color="muted">
          Track your progress and unlock achievements
        </Typography>
      </div>

      <Callout
        variant="muted"
        icon={<AlertCircle className="w-5 h-5" />}
        title="Unable to load badges"
        description={error}
      >
        {showRetry && retry && (
          <div className="mt-4 flex justify-center">
            <Button
              onClick={retry}
              variant="default"
              size="sm"
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </Button>
          </div>
        )}
      </Callout>
    </div>
  );
}
