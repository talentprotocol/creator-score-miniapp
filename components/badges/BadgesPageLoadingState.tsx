import { Skeleton } from "@/components/ui/skeleton";

export function BadgesPageLoadingState() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-24" /> {/* "Badges" title */}
            <Skeleton className="h-4 w-32" /> {/* completion percentage */}
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-32" /> {/* refresh button */}
            <Skeleton className="h-10 w-10" /> {/* filter button */}
          </div>
        </div>
        <div className="text-right">
          <Skeleton className="h-3 w-40 ml-auto" /> {/* last updated date */}
        </div>
      </div>

      {/* Section skeletons - matches the page's section layout */}
      {[...Array(3)].map((_, sectionIndex) => (
        <div key={sectionIndex} className="space-y-6">
          {/* Section title skeleton */}
          <div className="space-y-6">
            <Skeleton className="h-6 w-48" /> {/* section title with count */}
            {/* Badge grid skeleton - matches page layout exactly */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-4 md:grid-cols-3 md:gap-x-4 md:gap-y-6">
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

          {/* Divider skeleton (except for last section) */}
          {sectionIndex < 2 && <div className="h-px bg-border mt-8 mb-4" />}
        </div>
      ))}
    </div>
  );
}
