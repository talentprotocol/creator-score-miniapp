"use client";

import { useState, useEffect } from "react";

export function useBasecampTabVisibility() {
  const [showCoinsTab, setShowCoinsTab] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkCoinsTab = async () => {
      try {
        const response = await fetch("/api/basecamp-stats");
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const stats = await response.json();
        setShowCoinsTab(stats.totalCreatorCoins > 0);
      } catch (error) {
        console.error("Error checking coins tab visibility:", error);
        setShowCoinsTab(false);
      } finally {
        setLoading(false);
      }
    };

    checkCoinsTab();
  }, []);

  return { showCoinsTab, loading };
}
