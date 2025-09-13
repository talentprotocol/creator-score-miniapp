"use client";

import { PostsContent } from "@/components/profile/PostsContent";

interface ProfilePostsPageProps {
  params: { identifier: string };
}

export default function ProfilePostsPage({}: ProfilePostsPageProps) {
  return <PostsContent />;
}
