import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState() {
  return (
    <div className="max-w-xl mx-auto w-full p-4 space-y-6 pb-24">
      <div className="space-y-1">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-5 w-48" />
      </div>

      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-muted rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-5 w-8" />
            </div>
            <div className="grid grid-cols-3 gap-x-3 gap-y-4 md:gap-x-4 md:gap-y-6">
              {[...Array(6)].map((_, j) => (
                <div key={j} className="flex flex-col items-center gap-1">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
