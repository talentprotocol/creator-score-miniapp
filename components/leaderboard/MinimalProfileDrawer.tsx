import React, { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { StatCard } from "@/components/profile/StatCard";
import { sdk } from "@farcaster/frame-sdk";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { formatK, formatNumberWithSuffix } from "@/lib/utils";
import { useProfileHeaderData } from "@/hooks/useProfileHeaderData";
import { useProfileCreatorScore } from "@/hooks/useProfileCreatorScore";
import { useProfileSocialAccounts } from "@/hooks/useProfileSocialAccounts";
import { useProfileTotalEarnings } from "@/hooks/useProfileTotalEarnings";

interface MinimalProfileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  talentId: string | number | undefined;
  name: string;
  avatarUrl?: string;
}

export const MinimalProfileDrawer: React.FC<MinimalProfileDrawerProps> = ({
  open,
  onOpenChange,
  talentId,
  name,
  avatarUrl,
}) => {
  const [loadingProfile, setLoadingProfile] = useState(false);
  const router = useRouter();

  const talentUUID = String(talentId || "");

  // Use existing profile hooks when drawer is open and we have a talentId
  const shouldFetch = open && talentId;
  const { profile } = useProfileHeaderData(shouldFetch ? talentUUID : "");
  const { creatorScore, loading: scoreLoading } = useProfileCreatorScore(
    shouldFetch ? talentUUID : "",
  );
  const { socialAccounts } = useProfileSocialAccounts(
    shouldFetch ? talentUUID : "",
  );
  const { totalEarnings, loading: earningsLoading } = useProfileTotalEarnings(
    shouldFetch ? talentUUID : "",
  );

  // Calculate derived data
  const totalFollowers = socialAccounts.reduce(
    (sum, acc) => sum + (acc.followerCount ?? 0),
    0,
  );

  const farcasterAccount = socialAccounts.find(
    (s) => s.source === "farcaster" && s.handle,
  );
  const farcasterHandle = farcasterAccount?.handle?.replace(/^@/, "") || null;

  const loading = scoreLoading || earningsLoading;

  const handleSeeProfile = () => {
    let url = "/";
    if (farcasterHandle) {
      url += farcasterHandle;
    } else if (profile?.github) {
      url += profile.github;
    } else if (profile?.id) {
      url += profile.id;
    } else if (talentId) {
      url += talentId;
    } else {
      return;
    }
    setLoadingProfile(true);
    router.push(url);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-w-md mx-auto w-full p-6 rounded-t-2xl">
        <DrawerHeader>
          <DrawerTitle className="sr-only">User profile preview</DrawerTitle>
          <DrawerDescription className="sr-only">
            Minimal user profile with name, avatar, followers, Creator Score,
            and Total Rewards.
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex items-center justify-between mb-2">
          <Avatar className="h-20 w-20 mr-4">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={name} />
            ) : (
              <AvatarFallback>{name[0]}</AvatarFallback>
            )}
          </Avatar>
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            {farcasterHandle ? (
              <button
                type="button"
                className="font-bold text-2xl truncate leading-tight text-primary hover:underline text-left bg-transparent border-0 p-0 m-0 cursor-pointer"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    sdk.actions.openUrl(
                      `https://farcaster.xyz/${farcasterHandle}`,
                    );
                  }
                }}
              >
                {name}
              </button>
            ) : (
              <span className="font-bold text-2xl truncate leading-tight">
                {name}
              </span>
            )}
            <span className="text-muted-foreground text-base">
              {formatK(totalFollowers)} total followers
            </span>
          </div>
        </div>
        <div className="flex flex-row gap-4 w-full mt-6">
          <StatCard
            title="Creator Score"
            value={loading ? "—" : (creatorScore?.toLocaleString() ?? "—")}
          />
          <StatCard
            title="Total Rewards"
            value={
              loading
                ? "—"
                : totalEarnings === null
                  ? "—"
                  : formatNumberWithSuffix(totalEarnings)
            }
          />
        </div>
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            className="w-full flex items-center justify-center"
            onClick={handleSeeProfile}
            disabled={loadingProfile}
          >
            {loadingProfile ? (
              <>
                <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent mr-2"></span>
                Loading...
              </>
            ) : (
              "See Profile"
            )}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
