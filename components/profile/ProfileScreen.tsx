"use client";

import * as React from "react";
import { ProfileHeader } from "./ProfileHeader";
import { StatCard } from "./StatCard";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { getUserContext } from "@/lib/user-context";
import { getUserWalletAddresses } from "@/app/services/neynarService";
import {
  getCreatorScore,
  getSocialAccountsForFarcaster,
  SocialAccount,
  getCredentialsForFarcaster,
} from "@/app/services/talentService";
import { ProfileTabs } from "./ProfileTabs";
import { getEthUsdcPrice, convertEthToUsdc } from "@/lib/utils";

interface ProfileScreenProps {
  children?: React.ReactNode;
}

export function ProfileScreen({ children }: ProfileScreenProps) {
  const { context } = useMiniKit();
  const user = getUserContext(context);
  const fid = user?.fid;

  const [creatorScore, setCreatorScore] = React.useState<string | null>(null);
  const [scoreLoading, setScoreLoading] = React.useState(false);
  const [socialAccounts, setSocialAccounts] = React.useState<SocialAccount[]>(
    [],
  );
  const [totalUsdcRewards, setTotalUsdcRewards] = React.useState<number>(0);
  const [rewardsLoading, setRewardsLoading] = React.useState(false);

  React.useEffect(() => {
    async function fetchScore() {
      if (!fid) return;
      setScoreLoading(true);
      try {
        const walletData = await getUserWalletAddresses(fid);
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
  }, [fid]);

  React.useEffect(() => {
    async function fetchAccounts() {
      if (!fid) return;
      try {
        const accounts = await getSocialAccountsForFarcaster(String(fid));
        accounts.sort(
          (a, b) => (b.followerCount ?? 0) - (a.followerCount ?? 0),
        );
        setSocialAccounts(accounts);
      } catch {
        setSocialAccounts([]);
      }
    }
    fetchAccounts();
  }, [fid]);

  React.useEffect(() => {
    async function fetchRewards() {
      if (!fid) return;
      setRewardsLoading(true);
      try {
        const credentials = await getCredentialsForFarcaster(fid.toString());
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
  }, [fid]);

  // Calculate total followers
  const totalFollowers = socialAccounts.reduce(
    (sum, acc) => sum + (acc.followerCount ?? 0),
    0,
  );
  function formatK(num: number): string {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  }

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="container max-w-md mx-auto px-4 py-6 space-y-6">
        <ProfileHeader followers={formatK(totalFollowers)} />
        <div className="flex flex-row gap-4 w-full">
          <StatCard
            title="Creator Score"
            value={scoreLoading ? "—" : (creatorScore ?? "—")}
          />
          <StatCard
            title="Total Rewards"
            value={
              rewardsLoading
                ? "—"
                : `$${totalUsdcRewards.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
            }
          />
        </div>
        <ProfileTabs
          accountsCount={socialAccounts.length}
          socialAccounts={socialAccounts}
        />
        {children}
      </div>
    </main>
  );
}
