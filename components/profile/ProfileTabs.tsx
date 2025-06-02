import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AccountGrid } from "./AccountGrid";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { getBuilderScore, SCORER_SLUGS } from "@/app/services/talentService";
import { getUserWalletAddresses } from "@/app/services/neynarService";
import { getUserContext } from "@/lib/user-context";

const LEVEL_RANGES = [
  { min: 0, max: 39, name: "Level 1" },
  { min: 40, max: 79, name: "Level 2" },
  { min: 80, max: 119, name: "Level 3" },
  { min: 120, max: 169, name: "Level 4" },
  { min: 170, max: 249, name: "Level 5" },
  { min: 250, max: Infinity, name: "Level 6" },
] as const;

const mockScoreData = [
  {
    issuer: "Ethereum",
    total: 120,
    points: [
      { label: "EFP Followers", value: 60 },
      { label: "ENS Account Age", value: 60 },
    ],
  },
  {
    issuer: "Farcaster",
    total: 180,
    points: [
      { label: "Farcaster Rewards USDC Earnings", value: 60 },
      { label: "Farcaster Account Age", value: 60 },
      { label: "Farcaster Followers", value: 60 },
    ],
  },
  {
    issuer: "Lens",
    total: 80,
    points: [
      { label: "Lens Account Age", value: 40 },
      { label: "Lens Followers", value: 40 },
    ],
  },
  {
    issuer: "LinkedIn",
    total: 40,
    points: [{ label: "LinkedIn Followers", value: 40 }],
  },
  {
    issuer: "Onchain Activity",
    total: 60,
    points: [
      { label: "First Transaction", value: 20 },
      { label: "ETH Balance", value: 20 },
      { label: "Outgoing Transactions", value: 20 },
    ],
  },
  {
    issuer: "Stack",
    total: 30,
    points: [{ label: "Stack Score", value: 30 }],
  },
  {
    issuer: "Talent Protocol",
    total: 20,
    points: [{ label: "Human Checkmark", value: 20 }],
  },
  {
    issuer: "X/Twitter",
    total: 100,
    points: [
      { label: "X Account Age", value: 50 },
      { label: "X Followers", value: 50 },
    ],
  },
  {
    issuer: "Zora",
    total: 40,
    points: [
      { label: "Zora Followers", value: 20 },
      { label: "Zora Rewards", value: 20 },
    ],
  },
];

function ScoreProgressAccordion() {
  const [score, setScore] = React.useState<number | null>(null);
  const [level, setLevel] = React.useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = React.useState<string | null>(null);
  const { context } = useMiniKit();
  const user = getUserContext(context);
  const fid = user?.fid;

  React.useEffect(() => {
    async function fetchScore() {
      if (!fid) return;
      try {
        const walletData = await getUserWalletAddresses(fid);
        if (walletData.error) {
          throw new Error(walletData.error);
        }

        const addresses = [
          ...walletData.addresses,
          walletData.primaryEthAddress,
          walletData.primarySolAddress,
        ].filter(
          (addr): addr is string =>
            typeof addr === "string" && addr.startsWith("0x"),
        );

        if (addresses.length === 0) {
          throw new Error("No wallet addresses found");
        }

        const scoreData = await getBuilderScore(
          addresses,
          SCORER_SLUGS.CREATOR,
        );
        if (scoreData.error) {
          throw new Error(scoreData.error);
        }

        setScore(scoreData.score);
        setLevel(scoreData.level);
        setLastUpdated(
          scoreData.lastCalculatedAt
            ? new Date(scoreData.lastCalculatedAt).toLocaleDateString()
            : null,
        );
      } catch (err) {
        console.error("Failed to fetch score:", err);
      }
    }

    fetchScore();
  }, [fid]);

  // Calculate progress to next level
  const getProgressToNextLevel = () => {
    if (!score || !level) return 0;
    const currentLevel = LEVEL_RANGES[level - 1];
    const nextLevel = LEVEL_RANGES[level];
    if (!nextLevel || score >= nextLevel.min) return 100;
    const range = nextLevel.min - currentLevel.min;
    const progress = score - currentLevel.min;
    return (progress / range) * 100;
  };

  // Calculate points to next level
  const getPointsToNextLevel = () => {
    if (!score || !level) return null;
    const nextLevel = LEVEL_RANGES[level];
    if (!nextLevel || score >= nextLevel.min) return null;
    return nextLevel.min - score;
  };

  const progress = getProgressToNextLevel();
  const pointsToNext = getPointsToNextLevel();

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue="score-progress"
      className="space-y-2"
    >
      <AccordionItem
        value="score-progress"
        className="bg-gray-100 rounded-xl p-0 mb-3 border-0 shadow-none"
      >
        <AccordionTrigger className="px-6 py-4 flex items-center justify-between bg-gray-100 rounded-xl">
          <div className="flex flex-col flex-1 gap-1 text-left">
            <span className="font-medium text-base text-foreground">
              Creator Score
            </span>
            <span className="text-xs text-muted-foreground font-normal mt-0.5">
              Level {level ?? "—"}
            </span>
          </div>
          <span className="ml-4 text-xl font-semibold text-foreground w-16 text-right">
            {score?.toLocaleString() ?? "—"}
          </span>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-5 bg-gray-100 rounded-b-xl">
          <div className="space-y-2">
            <div className="w-full text-xs text-muted-foreground text-right mb-1">
              {pointsToNext && level
                ? `${pointsToNext} points to Level ${level + 1}`
                : level === 6
                  ? "Master level reached!"
                  : "Level up!"}
            </div>
            <div className="relative w-full flex items-center justify-center mb-0">
              <Progress
                value={progress}
                className="h-4 bg-gray-200 [&>div]:bg-gray-800"
              />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-medium text-foreground">
                {progress.toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <Button size="sm" variant="outline" className="gap-1">
                <RefreshCw className="h-4 w-4" /> Refresh Score
              </Button>
              <span className="text-xs text-muted-foreground">
                Last updated:{" "}
                {lastUpdated
                  ? new Date(lastUpdated).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })
                  : "—"}
              </span>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function ScoreDataPoints() {
  return (
    <Accordion type="multiple" className="space-y-2">
      {mockScoreData.map((issuer) => (
        <AccordionItem
          key={issuer.issuer}
          value={issuer.issuer}
          className="bg-white rounded-2xl shadow border p-0 mb-3"
        >
          <AccordionTrigger className="px-6 py-4 flex items-center justify-between">
            <div className="flex flex-col flex-1 gap-1">
              <span className="font-medium text-base text-foreground">
                {issuer.issuer}
              </span>
              <span className="text-xs text-muted-foreground font-normal">
                {issuer.points.length} data point
                {issuer.points.length !== 1 ? "s" : ""}
              </span>
            </div>
            <span className="ml-4 text-xl font-semibold text-foreground w-16 text-right">
              {issuer.total}
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-5">
            <ul className="space-y-1">
              {issuer.points.map((pt) => (
                <li
                  key={pt.label}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{pt.label}</span>
                  <span className="font-medium">{pt.value}</span>
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

interface ProfileTabsProps {
  accountsCount: number;
  scoreValue: string;
  socialAccounts: import("@/app/services/talentService").SocialAccount[];
}

export function ProfileTabs({
  accountsCount,
  scoreValue,
  socialAccounts,
}: ProfileTabsProps) {
  return (
    <Tabs
      defaultValue="accounts"
      className="w-full flex flex-col max-h-[500px] overflow-y-auto"
    >
      <TabsList className="w-full justify-start bg-transparent p-0 h-auto gap-6">
        <TabsTrigger
          value="accounts"
          className={cn(
            "relative px-0 py-2 text-base font-medium",
            "data-[state=active]:bg-transparent data-[state=active]:shadow-none",
            "data-[state=active]:text-foreground data-[state=active]:after:absolute",
            "data-[state=active]:after:bottom-0 data-[state=active]:after:left-0",
            "data-[state=active]:after:right-0 data-[state=active]:after:h-0.5",
            "data-[state=active]:after:bg-primary",
          )}
        >
          Accounts
          <Badge
            variant="secondary"
            className="ml-2 bg-muted text-muted-foreground"
          >
            {accountsCount}
          </Badge>
        </TabsTrigger>
        <TabsTrigger
          value="score"
          className={cn(
            "relative px-0 py-2 text-base font-medium",
            "data-[state=active]:bg-transparent data-[state=active]:shadow-none",
            "data-[state=active]:text-foreground data-[state=active]:after:absolute",
            "data-[state=active]:after:bottom-0 data-[state=active]:after:left-0",
            "data-[state=active]:after:right-0 data-[state=active]:after:h-0.5",
            "data-[state=active]:after:bg-primary",
          )}
        >
          Score
          <Badge
            variant="secondary"
            className="ml-2 bg-muted text-muted-foreground"
          >
            {scoreValue}
          </Badge>
        </TabsTrigger>
      </TabsList>
      <TabsContent
        value="accounts"
        className="mt-6 overflow-y-auto max-h-[60vh] p-2"
      >
        <AccountGrid socialAccounts={socialAccounts} />
      </TabsContent>
      <TabsContent
        value="score"
        className="mt-6 space-y-6 overflow-y-auto max-h-[60vh]"
      >
        <ScoreProgressAccordion />
        <ScoreDataPoints />
      </TabsContent>
    </Tabs>
  );
}
