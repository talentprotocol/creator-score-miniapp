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
import {
  getBuilderScore,
  SCORER_SLUGS,
  getCredentialsForFarcaster,
  type IssuerCredentialGroup,
} from "@/app/services/talentService";
import { getUserWalletAddresses } from "@/app/services/neynarService";
import { getUserContext } from "@/lib/user-context";
import {
  filterEthAddresses,
  calculateScoreProgress,
  calculatePointsToNextLevel,
} from "@/lib/utils";

function shouldShowUom(uom: string | null): boolean {
  if (!uom) return false;
  const hiddenUoms = [
    "creation date",
    "out transactions",
    "followers",
    "stack points",
  ];
  return !hiddenUoms.includes(uom);
}

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

        const addresses = filterEthAddresses([
          ...walletData.addresses,
          walletData.primaryEthAddress,
          walletData.primarySolAddress,
        ]);

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

  const progress = calculateScoreProgress(score ?? 0, level ?? 1);
  const pointsToNext = calculatePointsToNextLevel(score ?? 0, level ?? 1);

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
                ? `${pointsToNext.toString()} points to Level ${(level + 1).toString()}`
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

function formatReadableValue(value: string | null): string {
  if (!value) return "";
  if (/[a-zA-Z]/.test(value)) return value;
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

function ScoreDataPoints() {
  const [credentials, setCredentials] = React.useState<IssuerCredentialGroup[]>(
    [],
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { context } = useMiniKit();
  const user = getUserContext(context);
  const fid = user?.fid;

  React.useEffect(() => {
    async function fetchCredentials() {
      if (!fid) return;
      try {
        setIsLoading(true);
        setError(null);
        const data = await getCredentialsForFarcaster(fid.toString());
        setCredentials(data);
      } catch (err) {
        console.error("Failed to fetch credentials:", err);
        setError("Failed to load score breakdown");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCredentials();
  }, [fid]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">
          Loading score breakdown...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-destructive">{error}</div>
      </div>
    );
  }

  if (credentials.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">
          No score data available
        </div>
      </div>
    );
  }

  return (
    <Accordion type="multiple" className="space-y-2">
      {credentials.map((issuer, index) => (
        <AccordionItem
          key={issuer.issuer}
          value={`issuer-${index}`}
          className="bg-white rounded-2xl shadow border p-0 mb-3"
        >
          <AccordionTrigger className="px-6 py-4 flex items-center justify-between">
            <div className="flex flex-col flex-1 gap-1">
              <span className="text-base font-medium text-foreground">
                {issuer.issuer}
              </span>
              <span className="text-xs text-muted-foreground">
                {issuer.points.length} credential
                {issuer.points.length !== 1 ? "s" : ""}
              </span>
            </div>
            <span className="ml-4 text-xl font-semibold text-foreground w-16 text-right">
              {issuer.total}
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-5">
            <ul className="space-y-2">
              {issuer.points.map((pt) => (
                <li
                  key={pt.label}
                  className="flex items-center justify-between text-xs"
                >
                  <span
                    className="truncate text-muted-foreground max-w-[60%]"
                    title={pt.label}
                  >
                    {pt.label}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {pt.readable_value && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        {pt.uom === "USDC" ? (
                          `$${formatReadableValue(pt.readable_value)}`
                        ) : (
                          <>
                            {formatReadableValue(pt.readable_value)}
                            {shouldShowUom(pt.uom) && <span>{pt.uom}</span>}
                          </>
                        )}
                      </span>
                    )}
                    {pt.readable_value && (
                      <span className="mx-1 text-muted-foreground">
                        &middot;
                      </span>
                    )}
                    <span className="font-medium text-xs text-muted-foreground whitespace-nowrap">
                      {pt.value}/{pt.max_score} {pt.value === 1 ? "pt" : "pts"}
                    </span>
                  </div>
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
  socialAccounts: import("@/app/services/talentService").SocialAccount[];
}

export function ProfileTabs({
  accountsCount,
  socialAccounts,
}: ProfileTabsProps) {
  const [credentialsCount, setCredentialsCount] = React.useState<number>(0);
  const { context } = useMiniKit();
  const user = getUserContext(context);
  const fid = user?.fid;

  React.useEffect(() => {
    async function fetchCredentialsCount() {
      if (!fid) return;
      try {
        const data = await getCredentialsForFarcaster(fid.toString());
        // Sum up all credentials across all issuers
        const total = data.reduce(
          (sum, issuer) => sum + issuer.points.length,
          0,
        );
        setCredentialsCount(total);
      } catch (err) {
        console.error("Failed to fetch credentials count:", err);
      }
    }

    fetchCredentialsCount();
  }, [fid]);

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
          Credentials
          <Badge
            variant="secondary"
            className="ml-2 bg-muted text-muted-foreground"
          >
            {credentialsCount}
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
