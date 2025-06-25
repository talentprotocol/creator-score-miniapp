import React, { useEffect, useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { StatCard } from "@/components/profile/StatCard";
import {
  getCreatorScoreForTalentId,
  getCredentialsForTalentId,
  getSocialAccountsForTalentId,
} from "@/app/services/talentService";
import {
  getEthUsdcPrice,
  calculateTotalRewards,
  formatRewardValue,
} from "@/lib/utils";
import { sdk } from "@farcaster/frame-sdk";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { resolveTalentUser } from "@/lib/user-resolver";

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
  const [followers, setFollowers] = useState<string>("—");
  const [creatorScore, setCreatorScore] = useState<string>("—");
  const [totalRewards, setTotalRewards] = useState<string>("—");
  const [loading, setLoading] = useState(false);
  const [farcasterHandle, setFarcasterHandle] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [github, setGithub] = useState<string | null>(null);
  const [uuid, setUuid] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open || !talentId) return;
    setLoading(true);
    setFollowers("—");
    setCreatorScore("—");
    setTotalRewards("—");
    setFarcasterHandle(null);
    setGithub(null);
    setUuid(null);
    (async () => {
      try {
        // Fetch Creator Score
        const scoreData = await getCreatorScoreForTalentId(talentId);
        setCreatorScore(scoreData.score?.toLocaleString() ?? "0");
        // Fetch credentials for rewards
        const credentials = await getCredentialsForTalentId(talentId);
        const total = await calculateTotalRewards(credentials, getEthUsdcPrice);
        setTotalRewards(formatRewardValue(total));
        // Fetch social accounts for followers and Farcaster handle
        const socials = await getSocialAccountsForTalentId(talentId);
        const followersCount = socials.reduce(
          (sum, acc) => sum + (acc.followerCount ?? 0),
          0,
        );
        setFollowers(
          followersCount >= 1000
            ? `${(followersCount / 1000).toFixed(1)}k`
            : followersCount.toString(),
        );
        // Find Farcaster handle
        const farcaster = socials.find(
          (s) => s.source === "farcaster" && s.handle,
        );
        if (farcaster && farcaster.handle) {
          setFarcasterHandle(farcaster.handle.replace(/^@/, ""));
        }
        // Fetch canonical Github and UUID
        const user = await resolveTalentUser(String(talentId));
        if (user) {
          setGithub(user.github || null);
          setUuid(user.id || null);
        }
      } catch {
        setFollowers("—");
        setCreatorScore("—");
        setTotalRewards("—");
        setFarcasterHandle(null);
        setGithub(null);
        setUuid(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, talentId]);

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
              {followers} total followers
            </span>
          </div>
        </div>
        <div className="flex flex-row gap-4 w-full mt-6">
          <StatCard
            title="Creator Score"
            value={loading ? "—" : creatorScore}
          />
          <StatCard
            title="Total Rewards"
            value={loading ? "—" : totalRewards}
          />
        </div>
        <div className="mt-8 flex justify-center">
          <Button
            variant="default"
            className="w-full"
            onClick={() => {
              let url = "/";
              if (farcasterHandle) {
                url += farcasterHandle;
              } else if (github) {
                url += github;
              } else if (uuid) {
                url += uuid;
              } else if (talentId) {
                url += talentId;
              } else {
                return;
              }
              setLoadingProfile(true);
              router.push(url);
            }}
            disabled={loadingProfile}
          >
            {loadingProfile ? (
              <span className="flex items-center justify-center">
                <span className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Loading...
              </span>
            ) : (
              "See Profile"
            )}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
