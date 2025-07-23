import { useState, useRef } from "react";
import { triggerScoreCalculation } from "@/app/services/scoreRefreshService";

interface UseScoreRefreshResult {
  isRefreshing: boolean;
  successMessage: string | null;
  error: string | null;
  refreshScore: () => Promise<void>;
  clearError: () => void;
}

export function useScoreRefresh(
  talentUUID: string,
  onSuccess?: () => void,
): UseScoreRefreshResult {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasCalledSuccessRef = useRef(false);

  const clearError = () => {
    setError(null);
  };

  const refreshScore = async () => {
    if (!talentUUID || isRefreshing) return;

    try {
      setIsRefreshing(true);
      // Clear any existing messages
      setError(null);
      setSuccessMessage(null);
      hasCalledSuccessRef.current = false;

      const result = await triggerScoreCalculation(talentUUID);

      if (result.success) {
        setSuccessMessage("Calculation enqueued");
        // Call onSuccess callback to trigger score refetch
        // Only call once per refresh to prevent loops
        if (onSuccess && !hasCalledSuccessRef.current) {
          hasCalledSuccessRef.current = true;
          // Small delay to show success message before refetching
          setTimeout(async () => {
            try {
              await onSuccess();
            } catch (error) {
              console.error("Error during score refetch:", error);
            }
          }, 1000);
        }
      } else {
        const errorMessage = result.error || "Failed to trigger calculation";
        setError(errorMessage);
        setIsRefreshing(false);
        // No auto-clear of error message
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to trigger calculation";
      setError(errorMessage);
      setIsRefreshing(false);
      // No auto-clear of error message
    }
  };

  return {
    isRefreshing,
    successMessage,
    error,
    refreshScore,
    clearError,
  };
}
