import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, TrendingUp, Heart, Repeat, Users, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedPost {
  platform: "zora" | "farcaster" | "lens" | "paragraph" | "twitter" | "pods";
  title?: string;
  content?: string;
  revenue?: string;
  collectors?: number;
  retweets?: number;
  likes?: number;
  date: string;
  url?: string;
}

interface FeedGridProps {
  posts?: FeedPost[];
}

const platformConfig = {
  zora: {
    name: "Zora",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    icon: "🎨",
  },
  farcaster: {
    name: "Farcaster",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: "🟣",
  },
  lens: {
    name: "Lens",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: "🌿",
  },
  paragraph: {
    name: "Paragraph",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    icon: "📝",
  },
  twitter: {
    name: "Twitter",
    color: "bg-sky-100 text-sky-700 border-sky-200",
    icon: "🐦",
  },
  pods: {
    name: "Pods",
    color: "bg-indigo-100 text-indigo-700 border-indigo-200",
    icon: "🎧",
  },
};

export function FeedGrid({ posts = [] }: FeedGridProps) {
  // Mock data for demonstration - in real app this would come from API
  const mockPosts: FeedPost[] = [
    {
      platform: "zora",
      title: "Digital Art Collection #1",
      revenue: "2.5 ETH",
      collectors: 45,
      date: "2024-01-15",
      url: "https://zora.co/collection/123",
    },
    {
      platform: "farcaster",
      content: "Just launched my new creator score app! 🚀",
      retweets: 23,
      likes: 156,
      date: "2024-01-20",
      url: "https://warpcast.com/~/cast/123",
    },
    {
      platform: "lens",
      content: "Building the future of social media...",
      retweets: 12,
      likes: 89,
      date: "2024-01-18",
      url: "https://lens.xyz/posts/123",
    },
    {
      platform: "paragraph",
      title: "The Future of Creator Economy",
      revenue: "0.8 ETH",
      collectors: 23,
      date: "2024-01-22",
      url: "https://paragraph.xyz/article/123",
    },
    {
      platform: "twitter",
      content: "Excited to share my latest project with everyone! 🚀",
      retweets: 45,
      likes: 234,
      date: "2024-01-19",
      url: "https://twitter.com/user/status/123",
    },
    {
      platform: "pods",
      title: "Creator Economy Podcast #15",
      revenue: "1.2 ETH",
      collectors: 67,
      date: "2024-01-21",
      url: "https://pods.xyz/podcast/123",
    },
  ];

  const displayPosts = posts.length > 0 ? posts : mockPosts;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric",
      year: "numeric"
    });
  };

  const truncateText = (text: string, maxLength: number = 20) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const handlePostClick = async (url?: string) => {
    if (!url) return;
    
    try {
      // Try to open in Farcaster frame if available
      if (typeof window !== "undefined" && (window as any).farcaster) {
        await (window as any).farcaster.openUrl(url);
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {displayPosts.map((post, index) => {
        const config = platformConfig[post.platform];
        
        return (
          <Card 
            key={index} 
            className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02]",
              "border-2 hover:border-primary/20"
            )}
            onClick={() => handlePostClick(post.url)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{config.icon}</span>
                  <CardTitle className="text-sm font-semibold">
                    {config.name}
                  </CardTitle>
                </div>
                {post.url && (
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {/* Content */}
              <div className="space-y-2">
                {post.title && (
                  <h4 className="font-medium text-sm leading-tight">
                    {truncateText(post.title, 25)}
                  </h4>
                )}
                {post.content && (
                  <p className="text-xs text-muted-foreground leading-tight">
                    {truncateText(post.content, 30)}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="space-y-2">
                {post.revenue && (
                  <div className="flex items-center gap-1 text-xs">
                    <TrendingUp className="w-3 h-3 text-green-600" />
                    <span className="font-medium text-green-600">{post.revenue}</span>
                  </div>
                )}
                
                {post.collectors && (
                  <div className="flex items-center gap-1 text-xs">
                    <Users className="w-3 h-3 text-blue-600" />
                    <span className="text-muted-foreground">{post.collectors} collectors</span>
                  </div>
                )}
                
                {(post.retweets || post.likes) && (
                  <div className="flex items-center gap-3 text-xs">
                    {post.retweets && (
                      <div className="flex items-center gap-1">
                        <Repeat className="w-3 h-3 text-blue-500" />
                        <span className="text-muted-foreground">{post.retweets}</span>
                      </div>
                    )}
                    {post.likes && (
                      <div className="flex items-center gap-1">
                        <Heart className="w-3 h-3 text-red-500" />
                        <span className="text-muted-foreground">{post.likes}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Date */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1 border-t">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(post.date)}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
} 