import { useFidToTalentUuid } from "./useUserResolution";
import { useProfileSocialAccounts } from "./useProfileSocialAccounts";
import { useProfileTotalEarnings } from "./useProfileTotalEarnings";
import {
  calculateTotalFollowers,
  formatNumberWithSuffix,
  formatCompactNumber,
} from "@/lib/utils";
import { useResolvedTalentProfile } from "./useResolvedTalentProfile";

export function useShareData() {
  const { talentUuid } = useFidToTalentUuid();

  // Unified profile data
  const {
    creatorScore,
    avatarUrl,
    displayName,
    loading: profileLoading,
  } = useResolvedTalentProfile();

  // Get social accounts for followers count
  const { socialAccounts, loading: socialsLoading } = useProfileSocialAccounts(
    talentUuid || "",
  );
  const totalFollowers = calculateTotalFollowers(socialAccounts || []);

  // Get total earnings
  const { totalEarnings, loading: earningsLoading } = useProfileTotalEarnings(
    talentUuid || "",
  );

  const loading = profileLoading || socialsLoading || earningsLoading;

  return {
    creatorScore: creatorScore || 0,
    totalFollowers,
    totalEarnings: totalEarnings || 0,
    loading,
    talentUuid,
    // Profile data
    avatarUrl: avatarUrl || null,
    displayName: displayName || "Creator",
    handle: talentUuid || "",
    formattedFollowers: formatCompactNumber(totalFollowers),
    formattedEarnings: formatNumberWithSuffix(totalEarnings || 0),
  };
}
