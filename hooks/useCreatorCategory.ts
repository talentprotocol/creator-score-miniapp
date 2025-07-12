"use client";

import { useMemo } from "react";
import { useProfileCredentials } from "./useProfileCredentials";
import {
  processCreatorCategories,
  CreatorCategoryBreakdown,
} from "@/lib/credentialUtils";

export function useCreatorCategory(talentUUID: string) {
  const { credentials, loading, error } = useProfileCredentials(talentUUID);

  const data = useMemo(() => {
    if (!credentials || credentials.length === 0) {
      return null;
    }

    return processCreatorCategories(credentials);
  }, [credentials]);

  return { data, loading, error };
}
