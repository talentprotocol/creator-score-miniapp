"use client";

import * as React from "react";
import { ProfileHeader } from "./ProfileHeader";
import { StatCard } from "./StatCard";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { getUserContext } from "@/lib/user-context";
import {
  getUserWalletAddresses,
  getUserWalletAddressesByWallet,
} from "@/app/services/neynarService";
import {
  getCreatorScore,
  getSocialAccountsForFarcaster,
  SocialAccount,
  getCredentialsForFarcaster,
} from "@/app/services/talentService";
import { ProfileTabs } from "./ProfileTabs";
import {
  getEthUsdcPrice,
  convertEthToUsdc,
  formatNumberWithSuffix,
} from "@/lib/utils";
import { sdk } from "@farcaster/frame-sdk";
import { Button } from "@/components/ui/button";
import { Lock, X } from "lucide-react";
import { useEffect, useState } from "react";

interface ProfileScreenProps {
  children?: React.ReactNode;
  fid?: number | string;
  wallet?: string;
  github?: string;
}

function FrameGateOverlay({ onAddFrame }: { onAddFrame: () => void }) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl p-6 max-w-sm w-full shadow-lg border text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold">Creator Score Mini App</h2>
        <p className="text-muted-foreground text-sm">
          To use Creator Score, you need to add the mini app on Farcaster and
          enable notifications.
        </p>
        <Button onClick={onAddFrame} className="w-full">
          Add to Farcaster
        </Button>
      </div>
    </div>
  );
}

export function ProfileScreen({
  children,
  fid: fidProp,
  wallet: walletProp,
  github: githubProp,
}: ProfileScreenProps) {
  const { context } = useMiniKit();
  const user = getUserContext(context);
  const hasIdentifier = !!(fidProp || walletProp || githubProp);
  // Only use current user if no identifier is provided
  const identifier = hasIdentifier
    ? (fidProp ?? walletProp ?? githubProp)
    : user?.fid;

  const [isFrameAdded, setIsFrameAdded] = React.useState(false);
  const [hasNotifications, setHasNotifications] = React.useState(false);

  const [creatorScore, setCreatorScore] = React.useState<string | null>(null);
  const [scoreLoading, setScoreLoading] = React.useState(false);
  const [socialAccounts, setSocialAccounts] = React.useState<SocialAccount[]>(
    [],
  );
  const [totalUsdcRewards, setTotalUsdcRewards] = React.useState<number>(0);
  const [rewardsLoading, setRewardsLoading] = React.useState(false);

  // Detect if we're inside Farcaster (context?.user exists)
  const isInFarcaster = !!context?.user;

  // Only run SDK logic if inside Farcaster
  React.useEffect(() => {
    if (!isInFarcaster) return;

    // Listen to frame events
    const handleFrameAdded = () => {
      setIsFrameAdded(true);
      setHasNotifications(true);
    };

    const handleFrameRemoved = () => {
      setIsFrameAdded(false);
      setHasNotifications(false);
    };

    const handleNotificationsEnabled = () => {
      setHasNotifications(true);
    };

    const handleNotificationsDisabled = () => {
      setHasNotifications(false);
    };

    sdk.on("frameAdded", handleFrameAdded);
    sdk.on("frameRemoved", handleFrameRemoved);
    sdk.on("notificationsEnabled", handleNotificationsEnabled);
    sdk.on("notificationsDisabled", handleNotificationsDisabled);

    // Check initial frame state
    async function checkFrameState() {
      try {
        const result = await sdk.actions.addFrame();
        const frameResult = result as {
          added: boolean;
          notificationDetails?: { url: string; token: string };
        };
        if (frameResult.added) {
          setIsFrameAdded(true);
          setHasNotifications(!!frameResult.notificationDetails);
        }
      } catch (error) {
        console.log("Frame add request was rejected or already added:", error);
      }
    }
    checkFrameState();

    // Cleanup listeners on unmount
    return () => {
      sdk.removeAllListeners();
    };
  }, [isInFarcaster]);

  // New: state for real profile data
  const [profile, setProfile] = useState<{
    display_name?: string;
    image_url?: string;
    fid?: number;
    wallet?: string;
    github?: string;
  } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    if (!identifier) return;
    setProfileLoading(true);
    setProfileError(null);
    fetch(`/api/talent-user?id=${identifier}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) setProfileError("Profile not found");
        setProfile(data);
      })
      .catch(() => setProfileError("Profile not found"))
      .finally(() => setProfileLoading(false));
  }, [identifier]);

  React.useEffect(() => {
    async function fetchScore() {
      // Use props if provided, otherwise use identifiers from loaded profile
      const effectiveFid = fidProp || profile?.fid;
      const effectiveWallet = walletProp || profile?.wallet;
      if (!effectiveFid && !effectiveWallet) {
        setCreatorScore(null);
        setScoreLoading(false);
        return;
      }
      setScoreLoading(true);
      try {
        let walletData;
        if (effectiveFid) {
          walletData = await getUserWalletAddresses(Number(effectiveFid));
        } else if (effectiveWallet) {
          walletData = await getUserWalletAddressesByWallet(effectiveWallet);
        } else {
          setCreatorScore(null);
          setScoreLoading(false);
          return;
        }
        if (walletData.error) {
          setCreatorScore(null);
          setScoreLoading(false);
          return;
        }
        if (walletData.addresses.length > 0) {
          const scoreData = await getCreatorScore(walletData.addresses);
          setCreatorScore(scoreData.score?.toLocaleString() ?? "0");
        } else {
          setCreatorScore("0");
        }
      } catch {
        setCreatorScore(null);
      } finally {
        setScoreLoading(false);
      }
    }
    fetchScore();
  }, [identifier, fidProp, walletProp, profile?.fid, profile?.wallet]);

  React.useEffect(() => {
    async function fetchAccounts() {
      if (!identifier) return;
      try {
        const accounts = await getSocialAccountsForFarcaster(
          String(identifier),
        );
        accounts.sort(
          (a, b) => (b.followerCount ?? 0) - (a.followerCount ?? 0),
        );
        setSocialAccounts(accounts);
      } catch {
        setSocialAccounts([]);
      }
    }
    fetchAccounts();
  }, [identifier]);

  React.useEffect(() => {
    async function fetchRewards() {
      if (!identifier) return;
      setRewardsLoading(true);
      try {
        const credentials = await getCredentialsForFarcaster(
          String(identifier),
        );
        const ethPrice = await getEthUsdcPrice();

        // Sum up all rewards, converting ETH to USDC
        const total = credentials.reduce((sum, issuer) => {
          const issuerTotal = issuer.points.reduce((acc, pt) => {
            // Skip ETH Balance credential
            if (pt.label === "ETH Balance") {
              return acc;
            }

            if (!pt.readable_value) return acc;

            const value = parseFloat(
              pt.readable_value.replace(/[^0-9.-]+/g, ""),
            );
            if (isNaN(value)) return acc;

            let contribution = 0;
            if (pt.uom === "ETH") {
              contribution = convertEthToUsdc(value, ethPrice);
            } else if (pt.uom === "USDC") {
              contribution = value;
            }
            return acc + contribution;
          }, 0);

          return sum + issuerTotal;
        }, 0);

        setTotalUsdcRewards(total);
      } catch (err) {
        console.error("Failed to fetch rewards:", err);
        setTotalUsdcRewards(0);
      } finally {
        setRewardsLoading(false);
      }
    }
    fetchRewards();
  }, [identifier]);

  // Calculate total followers
  const totalFollowers = socialAccounts.reduce(
    (sum, acc) => sum + (acc.followerCount ?? 0),
    0,
  );
  function formatK(num: number): string {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  }

  // Dismiss Farcaster splash screen when ready
  React.useEffect(() => {
    if (isInFarcaster) {
      sdk.actions.ready();
    }
  }, [isInFarcaster]);

  // Extract identifiers from loaded profile if present
  const profileFid = profile?.fid;
  const profileWallet = profile?.wallet;
  const profileGithub = profile?.github;

  // Render loading or error state if identifier is provided and profile is loading or errored
  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="mt-4 text-base text-muted-foreground">
          Loading profile...
        </span>
      </div>
    );
  }
  if (hasIdentifier && profileError) {
    return (
      <div className="p-8 text-center text-destructive">{profileError}</div>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto relative">
      {isInFarcaster && <FrameGateOverlay onAddFrame={() => {}} />}
      <div className="container max-w-md mx-auto px-4 py-6 space-y-6">
        <ProfileHeader
          followers={formatK(totalFollowers)}
          displayName={profile?.display_name}
          profileImage={profile?.image_url}
        />
        <div className="flex flex-row gap-4 w-full">
          <StatCard
            title="Creator Score"
            value={scoreLoading ? "—" : (creatorScore ?? "—")}
          />
          <StatCard
            title="Total Rewards"
            value={
              rewardsLoading ? "—" : formatNumberWithSuffix(totalUsdcRewards)
            }
          />
        </div>
        <ProfileTabs
          accountsCount={socialAccounts.length}
          socialAccounts={socialAccounts}
          fid={fidProp || profileFid}
          wallet={walletProp || profileWallet}
          github={githubProp || profileGithub}
        />
        {children}
      </div>
    </main>
  );
}
