"use client";

import { PostsList } from "@/components/profile/PostsList";
import { PostsChart } from "@/components/profile/PostsChart";
import { useProfileContext } from "@/contexts/ProfileContext";

export function PostsContent() {
  const { profileData } = useProfileContext();

  // Extract data from server-fetched profileData
  const { posts, yearlyData } = profileData;

  // No loading states needed - data comes from server
  const postsLoading = false;
  const postsError = null;

  return (
    <div className="space-y-6">
      <PostsChart
        yearlyData={yearlyData}
        loading={postsLoading}
        error={postsError}
      />
      <PostsList
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        posts={posts as any}
        loading={postsLoading}
        error={postsError}
      />
    </div>
  );
}
