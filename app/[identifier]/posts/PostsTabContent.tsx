"use client";

import { PostsList } from "@/components/profile/PostsList";
import { PostsChart } from "@/components/profile/PostsChart";
import { useProfilePostsAll } from "@/hooks/useProfilePostsAll";
import { useProfileHeaderData } from "@/hooks/useProfileHeaderData";

interface PostsTabContentProps {
  identifier: string;
}

export function PostsTabContent({ identifier }: PostsTabContentProps) {
  const { profile } = useProfileHeaderData(identifier);
  const talentUUID = profile?.id;

  const {
    posts,
    yearlyData,
    loading: postsLoading,
    error: postsError,
  } = useProfilePostsAll(talentUUID || "");

  if (!talentUUID) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <PostsChart
        yearlyData={yearlyData}
        loading={postsLoading}
        error={postsError}
      />
      <PostsList posts={posts} loading={postsLoading} error={postsError} />
    </div>
  );
}
