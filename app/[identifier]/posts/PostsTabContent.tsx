"use client";

import { PostsList } from "@/components/profile/PostsList";
import { PostsChart } from "@/components/profile/PostsChart";
import { useProfileContext } from "@/contexts/ProfileContext";

interface PostsTabContentProps {
  identifier: string;
}

export function PostsTabContent({}: PostsTabContentProps) {
  const { profileData } = useProfileContext();

  // Extract data from server-fetched profileData
  const { posts, yearlyData } = profileData;

  // No loading states needed - data comes from server
  const postsLoading = false;
  const postsError = null;

  // Data comes from server, no loading check needed

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
