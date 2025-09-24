"use client";

import { useEffect, useState } from "react";

/**
 * Returns the Talent Protocol UUID if present in localStorage and
 * keeps it updated by listening to "talentUserIdUpdated" and storage events.
 */
export function useTalentUuid(): { talentUuid: string | null } {
  const [talentUuid, setTalentUuid] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        setTalentUuid(localStorage.getItem("talentUserId") || null);

        const handleIdUpdate = (e: Event) => {
          const detail = (e as CustomEvent).detail || {};
          const id = detail?.talentUserId ?? null;
          if (typeof id === "string" && id.trim()) setTalentUuid(id);
          else if (id === null) setTalentUuid(null);
        };

        const handleStorage = (e: StorageEvent) => {
          if (e.key === "talentUserId") {
            setTalentUuid(localStorage.getItem("talentUserId") || null);
          }
        };

        window.addEventListener("talentUserIdUpdated", handleIdUpdate as EventListener);
        window.addEventListener("storage", handleStorage);

        return () => {
          window.removeEventListener("talentUserIdUpdated", handleIdUpdate as EventListener);
          window.removeEventListener("storage", handleStorage);
        };
      }
    } catch {}
  }, []);

  return { talentUuid };
}
