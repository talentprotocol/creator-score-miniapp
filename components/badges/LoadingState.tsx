import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState() {
  return (
    <div className="space-y-6">
      {/* Badge grid skeleton - matches ProfileBadgesClient layout exactly */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex flex-col items-center">
            {/* Badge artwork skeleton - matches BadgeCard w-28 h-28 */}
            <Skeleton className="w-28 h-28 rounded-lg" />

            {/* Badge info skeleton */}
            <div className="text-center w-full mt-2">
              {/* Title skeleton */}
              <Skeleton className="h-4 w-20 mx-auto" />

              {/* Progress bar skeleton - matches BadgeCard w-28 */}
              <Skeleton className="w-28 h-1 rounded-full mx-auto mt-1" />

              {/* Subtitle skeleton */}
              <Skeleton className="h-3 w-16 mx-auto mt-0.5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
