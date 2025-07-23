"use client";

import { useEffect } from "react";
import { getFrameMetadata } from "@/lib/app-metadata";

export function FrameMetaTags() {
  const frameMetadata = getFrameMetadata();
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://www.creatorscore.app";

  useEffect(() => {
    // Set Farcaster Mini App Meta Tags dynamically
    const setMetaTag = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    const setPropertyMetaTag = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Farcaster Mini App Meta Tags - Required for embed functionality
    setMetaTag('fc:miniapp', 'vNext');
    setMetaTag('fc:miniapp:image', frameMetadata.ogImageUrl);
    setMetaTag('fc:miniapp:button:1', 'Open App');
    setMetaTag('fc:miniapp:post_url', baseUrl);
    setMetaTag('fc:miniapp:image:aspect_ratio', '1.91:1');

    // Open Graph Meta Tags
    setPropertyMetaTag('og:title', frameMetadata.ogTitle);
    setPropertyMetaTag('og:description', frameMetadata.ogDescription);
    setPropertyMetaTag('og:image', frameMetadata.ogImageUrl);
    setPropertyMetaTag('og:url', baseUrl);
    setPropertyMetaTag('og:type', 'website');

    // Twitter Card Meta Tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', frameMetadata.ogTitle);
    setMetaTag('twitter:description', frameMetadata.ogDescription);
    setMetaTag('twitter:image', frameMetadata.ogImageUrl);
  }, [frameMetadata, baseUrl]);

  return null; // This component doesn't render anything
} 