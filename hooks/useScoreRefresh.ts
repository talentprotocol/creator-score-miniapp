import { useState, useRef } from "react";
import { triggerScoreCalculation } from "@/app/services/scoreRefreshService";

interface UseScoreRefreshResult {
  isRefreshing: boolean;
  successMessage: string | null;
  error: string | null;
  refreshScore: () => Promise<void>;
}

export function useScoreRefresh(
  talentUUID: string,
  onSuccess?: () => void,
): UseScoreRefreshResult {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear success message after some time to return to initial state
  const clearSuccessMessage = () => {
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }
    successTimeoutRef.current = setTimeout(() => {
      setSuccessMessage(null);
      successTimeoutRef.current = null;
    }, 3000);
  };

  // Clear error message after some time to return to initial state
  const clearErrorMessage = () => {
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
    errorTimeoutRef.current = setTimeout(() => {
      setError(null);
      errorTimeoutRef.current = null;
    }, 3000);
  };

  const refreshScore = async () => {
    if (!talentUUID || isRefreshing) return;

    console.log(
      "🎯 useScoreRefresh.refreshScore called with talentUUID:",
      talentUUID,
    );

    try {
      setIsRefreshing(true);
      // Clear any existing timeouts and messages
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
        errorTimeoutRef.current = null;
      }
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
        successTimeoutRef.current = null;
      }
      setError(null);
      setSuccessMessage(null);

      console.log("⏳ Calling triggerScoreCalculation...");
      const result = await triggerScoreCalculation(talentUUID);
      console.log("📊 triggerScoreCalculation result:", result);

      if (result.success) {
        console.log("✅ Score calculation triggered successfully");
        setSuccessMessage("Calculation enqueued");
        // Call onSuccess callback to trigger score refetch
        if (onSuccess) {
          console.log("🔄 Scheduling score refetch in 1 second...");
          // Small delay to show success message before refetching
          setTimeout(() => {
            console.log("🔄 Triggering score refetch now");
            onSuccess();
          }, 1000);
        }
        // Clear success message after 3 seconds to return to initial state
        clearSuccessMessage();
      } else {
        console.log("❌ Score calculation failed:", result.error);
        setError(result.error || "Failed to trigger calculation");
        // Clear error message after 3 seconds to return to initial state
        clearErrorMessage();
      }
    } catch (err) {
      console.log("❌ Exception in useScoreRefresh.refreshScore:", err);
      setError(
        err instanceof Error ? err.message : "Failed to trigger calculation",
      );
      // Clear error message after 3 seconds to return to initial state
      clearErrorMessage();
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    isRefreshing,
    successMessage,
    error,
    refreshScore,
  };
}
