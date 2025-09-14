import { useState, useEffect, useCallback } from "react";
import { useFidToTalentUuid } from "./useUserResolution";
import {
  Base200UserPreferencesResponse,
  Base200UserPreferencesUpdateRequest,
} from "@/lib/types/base200-user-preferences";

interface UseBase200UserPreferencesReturn {
  data: Base200UserPreferencesResponse | null;
  loading: boolean;
  error: string | null;
  updatePreferences: (
    req: Omit<Base200UserPreferencesUpdateRequest, "talent_uuid">,
  ) => Promise<void>;
  addDismissedId: (id: string) => Promise<void>;
  addPermanentlyHiddenId: (id: string) => Promise<void>;
  removeDismissedId: (id: string) => Promise<void>;
  removePermanentlyHiddenId: (id: string) => Promise<void>;
}

export function useBase200UserPreferences(): UseBase200UserPreferencesReturn {
  const [data, setData] = useState<Base200UserPreferencesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { talentUuid } = useFidToTalentUuid();

  const fetchPreferences = useCallback(async () => {
    if (!talentUuid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/base200-user-preferences?talent_uuid=${talentUuid}`,
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch preferences: ${response.status}`);
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error fetching BASE200 user preferences:", err);
    } finally {
      setLoading(false);
    }
  }, [talentUuid]);

  const updatePreferences = useCallback(
    async (req: Omit<Base200UserPreferencesUpdateRequest, "talent_uuid">) => {
      if (!talentUuid) {
        throw new Error("No talent UUID available");
      }

      try {
        setError(null);

        const response = await fetch("/api/base200-user-preferences", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            talent_uuid: talentUuid,
            ...req,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to update preferences: ${response.status}`);
        }

        const result = await response.json();

        if (result.error) {
          throw new Error(result.error);
        }

        setData(result);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        console.error("Error updating BASE200 user preferences:", err);
        throw err;
      }
    },
    [talentUuid],
  );

  const addDismissedId = useCallback(
    async (id: string) => {
      await updatePreferences({ add_dismissed_id: id });
    },
    [updatePreferences],
  );

  const addPermanentlyHiddenId = useCallback(
    async (id: string) => {
      await updatePreferences({ add_permanently_hidden_id: id });
    },
    [updatePreferences],
  );

  const removeDismissedId = useCallback(
    async (id: string) => {
      await updatePreferences({ remove_dismissed_id: id });
    },
    [updatePreferences],
  );

  const removePermanentlyHiddenId = useCallback(
    async (id: string) => {
      await updatePreferences({ remove_permanently_hidden_id: id });
    },
    [updatePreferences],
  );

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    data,
    loading,
    error,
    updatePreferences,
    addDismissedId,
    addPermanentlyHiddenId,
    removeDismissedId,
    removePermanentlyHiddenId,
  };
}
