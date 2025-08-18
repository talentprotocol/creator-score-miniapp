import { Callout } from "@/components/common/Callout";

interface ErrorStateProps {
  error: string;
}

export function ErrorState({ error }: ErrorStateProps) {
  return (
    <div className="max-w-xl mx-auto w-full p-4 space-y-6 pb-24">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Badges</h1>
        <p className="text-muted-foreground">
          Track your progress and unlock achievements
        </p>
      </div>

      <Callout>
        {error}
      </Callout>
    </div>
  );
}
