import { useCallback, useEffect, useState } from "react";
import { useFidToTalentUuid } from "./useUserResolution";

export interface AutoModalConfig {
  databaseField: string; // Field name in user_preferences table
  autoOpen?: boolean;
}

export function useAutoModal(config: AutoModalConfig) {
  const { databaseField, autoOpen = false } = config;
  const [isOpen, setIsOpen] = useState(false);
  const [hasSeenModal, setHasSeenModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const { talentUuid } = useFidToTalentUuid();

  const onOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
  }, []);

  useEffect(() => {
    if (!talentUuid) {
      setLoading(false);
      return;
    }

    const checkModalStatus = async () => {
      try {
        const response = await fetch(
          `/api/user-preferences/optout?talent_uuid=${talentUuid}`,
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const hasSeen = data.data?.[databaseField] === true;
            setHasSeenModal(hasSeen);

            // Auto-open modal if configured and user hasn't seen it
            if (autoOpen && !hasSeen) {
              setIsOpen(true);
            }
          }
        }
      } catch (error) {
        console.error("Error checking modal status:", error);
      } finally {
        setLoading(false);
      }
    };

    checkModalStatus();
  }, [talentUuid, databaseField, autoOpen]);

  return {
    isOpen,
    onOpenChange,
    hasSeenModal,
    loading,
  };
}
