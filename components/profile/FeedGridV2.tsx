import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, TrendingUp, Heart, Repeat, Users, Calendar, Image } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedPostV2 {
  platform: "zora" | "farcaster" | "lens" | "paragraph" | "twitter" | "pods";
  title?: string;
  content?: string;
  revenue?: string;
  collectors?: number;
  retweets?: number;
  likes?: number;
  date: string;
  url?: string;
  imageUrl?: string;
  imageAlt?: string;
}

interface FeedGridV2Props {
  posts?: FeedPostV2[];
}

const platformConfig = {
  zora: {
    name: "Zora",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    icon: "🎨",
    placeholderImage: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=400&fit=crop&crop=center",
  },
  farcaster: {
    name: "Farcaster",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: "🟣",
    placeholderImage: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=400&fit=crop&crop=center",
  },
  lens: {
    name: "Lens",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: "🌿",
    placeholderImage: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=400&fit=crop&crop=center",
  },
  paragraph: {
    name: "Paragraph",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    icon: "📝",
    placeholderImage: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=400&fit=crop&crop=center",
  },
  twitter: {
    name: "Twitter",
    color: "bg-sky-100 text-sky-700 border-sky-200",
    icon: "🐦",
    placeholderImage: "https://images.unsplash.com/photo-1611605698335-8b1569810432?w=400&h=400&fit=crop&crop=center",
  },
  pods: {
    name: "Pods",
    color: "bg-indigo-100 text-indigo-700 border-indigo-200",
    icon: "🎧",
    placeholderImage: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=400&fit=crop&crop=center",
  },
};

export function FeedGridV2({ posts = [] }: FeedGridV2Props) {
  // Mock data for demonstration - in real app this would come from API
  const mockPosts: FeedPostV2[] = [
    {
      platform: "zora",
      title: "Digital Art Collection #1",
      revenue: "2.5 ETH",
      collectors: 45,
      date: "2024-01-15",
      url: "https://zora.co/collection/123",
      imageUrl: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=400&fit=crop&crop=center",
      imageAlt: "Digital art collection",
    },
    {
      platform: "farcaster",
      content: "Just launched my new creator score app! 🚀",
      retweets: 23,
      likes: 156,
      date: "2024-01-20",
      url: "https://warpcast.com/~/cast/123",
      imageUrl: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=400&fit=crop&crop=center",
      imageAlt: "App launch celebration",
    },
    {
      platform: "lens",
      content: "Building the future of social media...",
      retweets: 12,
      likes: 89,
      date: "2024-01-18",
      url: "https://lens.xyz/posts/123",
      imageUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=400&fit=crop&crop=center",
      imageAlt: "Social media future",
    },
    {
      platform: "paragraph",
      title: "The Future of Creator Economy",
      revenue: "0.8 ETH",
      collectors: 23,
      date: "2024-01-22",
      url: "https://paragraph.xyz/article/123",
      imageUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=400&fit=crop&crop=center",
      imageAlt: "Creator economy article",
    },
    {
      platform: "twitter",
      content: "Excited to share my latest project with everyone! 🚀",
      retweets: 45,
      likes: 234,
      date: "2024-01-19",
      url: "https://twitter.com/user/status/123",
      imageUrl: "https://images.unsplash.com/photo-1611605698335-8b1569810432?w=400&h=400&fit=crop&crop=center",
      imageAlt: "Project announcement",
    },
    {
      platform: "pods",
      title: "Creator Economy Podcast #15",
      revenue: "1.2 ETH",
      collectors: 67,
      date: "2024-01-21",
      url: "https://pods.xyz/podcast/123",
      imageUrl: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=400&fit=crop&crop=center",
      imageAlt: "Podcast episode",
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
    <div className="space-y-6">
      {displayPosts.map((post, index) => {
        const config = platformConfig[post.platform];
        const imageUrl = post.imageUrl || config.placeholderImage;
        
        return (
          <Card 
            key={index} 
            className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-lg",
              "border border-gray-200 overflow-hidden"
            )}
            onClick={() => handlePostClick(post.url)}
          >
            {/* Header */}
            <CardHeader className="pb-3 px-4 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-sm">{config.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{config.name}</h4>
                    <p className="text-xs text-muted-foreground">{formatDate(post.date)}</p>
                  </div>
                </div>
                {post.url && (
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </CardHeader>

            {/* Image */}
            <div className="relative aspect-square bg-gray-100">
              <img
                src={imageUrl}
                alt={post.imageAlt || `${config.name} post`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = config.placeholderImage;
                }}
              />
            </div>

            {/* Content */}
            <CardContent className="px-4 py-3 space-y-3">
              {/* Text Content */}
              <div className="space-y-2">
                {post.title && (
                  <h5 className="font-medium text-sm leading-tight">
                    {post.title}
                  </h5>
                )}
                {post.content && (
                  <p className="text-sm text-muted-foreground leading-tight">
                    {post.content}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {post.revenue && (
                    <div className="flex items-center gap-1 text-xs">
                      <TrendingUp className="w-3 h-3 text-green-600" />
                      <span className="font-medium text-green-600">{post.revenue}</span>
                    </div>
                  )}
                  
                  {post.collectors && (
                    <div className="flex items-center gap-1 text-xs">
                      <Users className="w-3 h-3 text-blue-600" />
                      <span className="text-muted-foreground">{post.collectors}</span>
                    </div>
                  )}
                  
                  {post.retweets && (
                    <div className="flex items-center gap-1 text-xs">
                      <Repeat className="w-3 h-3 text-blue-500" />
                      <span className="text-muted-foreground">{post.retweets}</span>
                    </div>
                  )}
                  
                  {post.likes && (
                    <div className="flex items-center gap-1 text-xs">
                      <Heart className="w-3 h-3 text-red-500" />
                      <span className="text-muted-foreground">{post.likes}</span>
                    </div>
                  )}
                </div>

                {/* Platform Badge */}
                <Badge 
                  variant="secondary" 
                  className={cn("text-xs", config.color)}
                >
                  {config.name}
                </Badge>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
} 