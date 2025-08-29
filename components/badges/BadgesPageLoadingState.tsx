import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/components/common/PageContainer";
import { Section } from "@/components/common/Section";

export function BadgesPageLoadingState() {
  return (
    <PageContainer>
      {/* Header section skeleton - matches Section variant="header" */}
      <Section variant="header">
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

        {/* Last Updated Date skeleton */}
        <div className="text-right">
          <Skeleton className="h-3 w-40 ml-auto" />
        </div>
      </Section>

      {/* Section skeletons - matches the page's exact structure */}
      {[...Array(2)].map((_, sectionIndex) => (
        <div key={sectionIndex}>
          <Section variant="content">
            <div className="space-y-8">
              <div className="badge-section">
                {/* Section title skeleton */}
                <Skeleton className="h-6 w-48 mb-6" />

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
            </div>
          </Section>

          {/* Full-width dividing line after each section (except the last) - matches page exactly */}
          {sectionIndex < 1 && (
            <Section variant="full-width">
              <div className="h-px bg-border mt-8 mb-4" />
            </Section>
          )}
        </div>
      ))}
    </PageContainer>
  );
}
