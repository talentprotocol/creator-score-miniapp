"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useSwipeable } from "react-swipeable";

interface SwipeWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function SwipeWrapper({ children, className = "" }: SwipeWrapperProps) {
  const router = useRouter();

  const handlers = useSwipeable({
    onSwipedRight: () => {
      // Only handle swipe right to go back
      if (typeof window !== "undefined" && window.history.length > 1) {
        router.back();
      }
    },
    preventScrollOnSwipe: false, // Allow normal scrolling
    trackMouse: false, // Only track touch events, not mouse
    delta: 50, // Minimum distance for swipe detection
  });

  return (
    <div {...handlers} className={className}>
      {children}
    </div>
  );
}
