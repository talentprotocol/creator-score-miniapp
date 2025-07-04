import { useState, useEffect } from "react";
import {
  getSocialAccountsForTalentId,
  SocialAccount,
} from "@/app/services/talentService";

export function useProfileSocialAccounts(talentUUID: string) {
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!talentUUID) return;
    setLoading(true);
    getSocialAccountsForTalentId(talentUUID)
      .then((accounts) => {
        setSocialAccounts(accounts);
        setLoading(false);
      })
      .catch(() => {
        setSocialAccounts([]);
        setLoading(false);
      });
  }, [talentUUID]);

  return { socialAccounts, loading };
}
