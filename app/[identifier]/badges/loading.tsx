import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileBadgesLoading() {
  return (
    <div className="space-y-6">
      {/* Badge Grid Skeleton */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="flex flex-col items-center space-y-3">
            {/* Badge image skeleton */}
            <Skeleton className="w-28 h-28 rounded-lg" />

            {/* Badge title skeleton */}
            <Skeleton className="w-20 h-4" />

            {/* Badge subtitle skeleton */}
            <Skeleton className="w-16 h-3" />
          </div>
        ))}
      </div>
    </div>
  );
}
