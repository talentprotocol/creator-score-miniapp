import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-xl mx-auto w-full p-4 space-y-4">
        {/* Creator Score Card Skeleton */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex items-end justify-between">
            <div className="space-y-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-16 w-32 rounded-lg" />
          </div>
        </Card>

        {/* Potential Rewards Card Skeleton */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex items-end justify-between">
            <div className="space-y-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-16 w-32 rounded-lg" />
          </div>
        </Card>

        {/* Top Creators Card Skeleton */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16 mt-1" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </Card>

        {/* Rewards Boosts Card Skeleton */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12 ml-auto" />
              </div>
            ))}
          </div>
        </Card>

        {/* Top Sponsors Card Skeleton */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16 mt-1" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </main>
  );
}
