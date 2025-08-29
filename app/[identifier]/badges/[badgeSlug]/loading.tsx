import { Skeleton } from "@/components/ui/skeleton";

export default function PublicBadgeLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
      {/* Badge image skeleton */}
      <Skeleton className="w-64 h-64 rounded-lg" />

      {/* Badge title skeleton */}
      <Skeleton className="w-48 h-8" />

      {/* Badge description skeleton */}
      <div className="space-y-2">
        <Skeleton className="w-96 h-4" />
        <Skeleton className="w-80 h-4" />
      </div>

      {/* CTA button skeleton */}
      <Skeleton className="w-32 h-10 rounded-md" />
    </div>
  );
}
