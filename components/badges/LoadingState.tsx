import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/components/common/PageContainer";
import { Section } from "@/components/common/Section";

export function LoadingState() {
  return (
    <PageContainer>
      {/* Header section skeleton */}
      <Section variant="header">
        <div className="space-y-1">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-5 w-48" />
        </div>
      </Section>

      {/* Badge grid skeleton - matches current layout */}
      <Section variant="content">
        <div className="grid grid-cols-2 gap-x-3 gap-y-4 md:grid-cols-3 md:gap-x-4 md:gap-y-6">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              {/* Badge artwork skeleton - matches BadgeCard w-28 h-28 */}
              <Skeleton className="w-28 h-28 rounded-lg" />
              {/* Title skeleton */}
              <Skeleton className="h-4 w-20" />
              {/* Progress bar skeleton */}
              <Skeleton className="w-28 h-1 rounded-full" />
              {/* Subtitle skeleton */}
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </Section>
    </PageContainer>
  );
}
