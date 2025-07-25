import { useUserResolution } from "./useUserResolution";
import { useProfileCreatorScore } from "./useProfileCreatorScore";
import { useProfileSocialAccounts } from "./useProfileSocialAccounts";
import { useProfileTotalEarnings } from "./useProfileTotalEarnings";
import { useProfileHeaderData } from "./useProfileHeaderData";
import { calculateTotalFollowers, formatWithK, formatK } from "@/lib/utils";

export function useShareData() {
  const { talentUuid } = useUserResolution();

  // Get creator score
  const { creatorScore, loading: scoreLoading } = useProfileCreatorScore(
    talentUuid || "",
  );

  // Get social accounts for followers count
  const { socialAccounts, loading: socialsLoading } = useProfileSocialAccounts(
    talentUuid || "",
  );
  const totalFollowers = calculateTotalFollowers(socialAccounts || []);

  // Get total earnings
  const { totalEarnings, loading: earningsLoading } = useProfileTotalEarnings(
    talentUuid || "",
  );

  // Get user profile data
  const { profile, loading: profileLoading } = useProfileHeaderData(
    talentUuid || "",
  );

  const loading =
    scoreLoading || socialsLoading || earningsLoading || profileLoading;

  return {
    creatorScore: creatorScore || 0,
    totalFollowers,
    totalEarnings: totalEarnings || 0,
    loading,
    talentUuid,
    // Profile data
    avatarUrl: profile?.image_url,
    displayName: profile?.display_name || profile?.name || "Creator",
    handle: profile?.fname || profile?.wallet_address || talentUuid || "",
    formattedFollowers: formatK(totalFollowers),
    formattedEarnings: formatWithK(totalEarnings || 0),
  };
}
