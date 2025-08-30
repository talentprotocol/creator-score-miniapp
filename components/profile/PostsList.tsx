"use client";

import React from "react";
import { ExternalLink } from "lucide-react";
import { formatPostDate } from "@/lib/utils";
import type { Post } from "@/lib/types";

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

interface PostRowProps {
  post: Post;
}

const PostRow: React.FC<PostRowProps> = ({ post }) => {
  const handleRowClick = () => {
    window.open(post.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="flex gap-3 p-3 hover:bg-muted active:bg-muted/80 transition-colors cursor-pointer"
      onClick={handleRowClick}
    >
      {/* Left side: Title + Date stacked */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <p className="font-medium text-sm truncate leading-tight">
          {post.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatPostDate(post.onchain_created_at)}
        </p>
      </div>

      {/* Right side: External link + Platform stacked */}
      <div className="flex flex-col items-end justify-between">
        <div className="text-muted-foreground p-1">
          <ExternalLink className="w-4 h-4" />
        </div>
        <span className="text-xs text-muted-foreground">
          {capitalizeFirst(post.platform)}
        </span>
      </div>
    </div>
  );
};

interface PostsListProps {
  posts: Post[];
  loading: boolean;
  error: string | null;
}

export function PostsList({ posts, loading, error }: PostsListProps) {
  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-destructive">{error}</div>
      </div>
    );
  }

  if (loading && posts.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-sm text-muted-foreground">
          Loading posts...
        </span>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No Mirror, Paragraph or Zora posts available.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-background rounded-xl border border-input overflow-hidden">
        {posts.map((post, index) => (
          <React.Fragment key={`${post.onchain_address}-${index}`}>
            <PostRow post={post} />
            {index < posts.length - 1 && <div className="h-px bg-border" />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
