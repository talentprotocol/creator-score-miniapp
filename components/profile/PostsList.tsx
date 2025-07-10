"use client";

import React from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatPostDate } from "@/lib/utils";
import type { Post } from "@/app/services/types";

// Platform styling - using more muted colors to match existing design
const platformStyles = {
  paragraph: "text-blue-600",
  mirror: "text-purple-600",
  zora: "text-green-600",
  default: "text-muted-foreground",
} as const;

function getPlatformStyle(platform: string): string {
  const normalizedPlatform =
    platform.toLowerCase() as keyof typeof platformStyles;
  return platformStyles[normalizedPlatform] || platformStyles.default;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

interface PostRowProps {
  post: Post;
}

const PostRow: React.FC<PostRowProps> = ({ post }) => {
  const handleLinkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.open(post.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex gap-3 p-3 hover:bg-gray-100 transition-colors">
      {/* Left side: Title + Date stacked */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <p className="font-medium text-sm truncate leading-tight">
          {post.name}
        </p>
        <p className="text-xs text-gray-600">
          {formatPostDate(post.onchain_created_at)}
        </p>
      </div>

      {/* Right side: External link + Platform stacked */}
      <div className="flex flex-col items-end justify-between">
        <button
          onClick={handleLinkClick}
          className="text-gray-600 hover:text-gray-900 transition-colors p-1"
          aria-label={`Open ${post.name}`}
        >
          <ExternalLink className="w-4 h-4" />
        </button>
        <span className="text-xs text-gray-600">
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
  hasMore: boolean;
  onLoadMore: () => void;
}

export function PostsList({
  posts,
  loading,
  error,
  hasMore,
  onLoadMore,
}: PostsListProps) {
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
        <p className="text-sm">No posts available.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {posts.map((post, index) => (
          <React.Fragment key={`${post.onchain_address}-${index}`}>
            <PostRow post={post} />
            {index < posts.length - 1 && (
              <div className="border-t border-gray-100" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center mt-6">
          <Button
            onClick={onLoadMore}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
