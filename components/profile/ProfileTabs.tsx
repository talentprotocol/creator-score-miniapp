import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AccountGrid } from "./AccountGrid";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { type IssuerCredentialGroup } from "@/app/services/talentService";
import {
  calculateScoreProgress,
  calculatePointsToNextLevel,
  shouldShowUom,
  formatReadableValue,
  cleanCredentialLabel,
} from "@/lib/utils";
import { sdk } from "@farcaster/frame-sdk";
import { ExternalLink } from "lucide-react";
import { COMING_SOON_CREDENTIALS } from "./comingSoonCredentials";
import { useProfileCredentials } from "@/hooks/useProfileCredentials";
import { useProfileCreatorScore } from "@/hooks/useProfileCreatorScore";
import { LEVEL_RANGES } from "@/lib/constants";

function ScoreProgressAccordion({ talentUUID }: { talentUUID: string }) {
  const { creatorScore, lastCalculatedAt, loading } =
    useProfileCreatorScore(talentUUID);

  const score = typeof creatorScore === "number" ? creatorScore : null;

  // Calculate level using LEVEL_RANGES
  const level = score
    ? (() => {
        const levelInfo = LEVEL_RANGES.find(
          (range) => score >= range.min && score <= range.max,
        );
        return levelInfo ? LEVEL_RANGES.indexOf(levelInfo) + 1 : 1;
      })()
    : null;

  const progress = calculateScoreProgress(score ?? 0, level ?? 1);
  const pointsToNext = calculatePointsToNextLevel(score ?? 0, level ?? 1);

  return (
    <Accordion type="single" collapsible className="space-y-2">
      <AccordionItem
        value="score-progress"
        className="bg-muted rounded-xl p-0 mb-3 border-0 shadow-none"
      >
        <AccordionTrigger className="px-6 py-4 flex items-center justify-between bg-muted rounded-xl">
          <div className="flex flex-col flex-1 gap-1 text-left">
            <span className="font-medium text-base text-foreground">
              Creator Score
            </span>
            <span className="text-xs text-muted-foreground font-normal mt-0.5">
              Level {level ?? "—"}
            </span>
          </div>
          <span className="ml-4 text-xl font-semibold text-foreground w-16 text-right">
            {loading ? "—" : (score?.toLocaleString() ?? "—")}
          </span>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-5 bg-muted rounded-b-xl">
          <div className="space-y-2">
            <div className="relative w-full flex items-center justify-center mb-0">
              <Progress
                value={progress}
                className="h-2 bg-muted-foreground/20 [&>div]:bg-foreground"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
              <span>
                {pointsToNext && level
                  ? `${pointsToNext.toString()} points to Level ${(level + 1).toString()}`
                  : level === 6
                    ? "Master level reached!"
                    : "Level up!"}
              </span>
              <span>
                Last updated:{" "}
                {lastCalculatedAt
                  ? new Date(lastCalculatedAt).toLocaleDateString()
                  : "—"}
              </span>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function ScoreDataPoints({ talentUUID }: { talentUUID: string }) {
  const {
    credentials,
    loading: isLoading,
    error,
  } = useProfileCredentials(talentUUID);

  // Filter out coming soon credentials if they already exist in the API response (by slug)
  const apiCredentialSlugs = new Set(
    credentials.flatMap((c) => c.points.map((pt) => pt.slug).filter(Boolean)),
  );
  const filteredComingSoon = COMING_SOON_CREDENTIALS.map((issuer) => ({
    ...issuer,
    points: issuer.points.filter(
      (pt) => !pt.slug || !apiCredentialSlugs.has(pt.slug),
    ),
  })).filter((issuer) => issuer.points.length > 0);

  // Merge real credentials with coming soon ones, combining data points for existing issuers
  const existingIssuers = new Map(credentials.map((c) => [c.issuer, c]));
  const comingSoonMap = new Map(filteredComingSoon.map((c) => [c.issuer, c]));

  // Combine existing and coming soon credentials
  const allCredentials = Array.from(
    new Set([
      ...credentials.map((c) => c.issuer),
      ...filteredComingSoon.map((c) => c.issuer),
    ]),
  )
    .map((issuer) => {
      const existing = existingIssuers.get(issuer);
      const comingSoon = comingSoonMap.get(issuer);
      if (existing && comingSoon) {
        // Merge points: real credentials first, then coming soon points not already present
        const realLabels = new Set(existing.points.map((pt) => pt.label));
        const mergedPoints = [
          ...existing.points,
          ...comingSoon.points.filter((pt) => !realLabels.has(pt.label)),
        ];
        return {
          ...existing,
          points: mergedPoints,
        };
      }
      return existing || comingSoon;
    })
    .filter((issuer): issuer is IssuerCredentialGroup => issuer !== undefined);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-sm text-muted-foreground">
          Loading score breakdown...
        </span>
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

  if (!credentials || credentials.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <span className="text-muted-foreground text-sm">
          No credentials available for this user.
        </span>
      </div>
    );
  }

  if (allCredentials.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">
          No score data available
        </div>
      </div>
    );
  }

  const handleCredentialClick = async (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    try {
      const externalUrl = `${url}${url.includes("?") ? "&" : "?"}_external=true`;
      await sdk.actions.openUrl(externalUrl);
    } catch {
      // Fallback to regular link if SDK fails
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const sortedCredentials = [
    ...allCredentials.filter((c) => c.total > 0),
    ...allCredentials
      .filter((c) => c.total === 0)
      .sort((a, b) => a.issuer.localeCompare(b.issuer)),
  ];

  return (
    <div>
      <Accordion type="multiple" className="space-y-2">
        {sortedCredentials.map((issuer, index) => (
          <AccordionItem
            key={issuer.issuer}
            value={`issuer-${index}`}
            className="bg-card rounded-2xl shadow border p-0 mb-3"
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
                      {pt.external_url ? (
                        <a
                          href={pt.external_url}
                          onClick={(e) =>
                            handleCredentialClick(e, pt.external_url!)
                          }
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {cleanCredentialLabel(pt.label, issuer.issuer)}
                        </a>
                      ) : (
                        cleanCredentialLabel(pt.label, issuer.issuer)
                      )}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {pt.value > 0 ? (
                        <>
                          {pt.readable_value && pt.uom === "USDC" ? (
                            `$${formatReadableValue(pt.readable_value)}`
                          ) : pt.readable_value ? (
                            <>
                              {formatReadableValue(pt.readable_value, pt.uom)}
                              {shouldShowUom(pt.uom) && <span>{pt.uom}</span>}
                            </>
                          ) : null}
                          {pt.readable_value && (
                            <span className="mx-1 text-muted-foreground">
                              &middot;
                            </span>
                          )}
                          <span className="font-medium text-xs text-muted-foreground whitespace-nowrap">
                            {pt.value}/{pt.max_score}{" "}
                            {pt.value === 1 ? "pt" : "pts"}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          Coming soon
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

function CredentialIdeasCallout() {
  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    const url = "https://farcaster.xyz/juampi";
    try {
      await sdk.actions.openUrl(url + "?_external=true");
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };
  return (
    <div className="border border-border bg-muted rounded-xl px-6 py-4 my-1 flex items-center text-muted-foreground text-xs">
      <span className="font-semibold mr-0.5">New credential ideas?</span>
      <span className="ml-0.5">Reach out to </span>
      <a
        href="https://farcaster.xyz/juampi"
        onClick={handleClick}
        className="ml-1 text-muted-foreground hover:text-foreground flex items-center font-normal"
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: "none" }}
      >
        @juampi
        <ExternalLink className="w-3 h-3 ml-[2px] stroke-[1.2] opacity-70" />
      </a>
    </div>
  );
}

interface ProfileTabsProps {
  accountsCount: number;
  socialAccounts: import("@/app/services/talentService").SocialAccount[];
  talentUUID: string;
}

export function ProfileTabs({
  accountsCount,
  socialAccounts,
  talentUUID,
}: ProfileTabsProps) {
  const { credentials } = useProfileCredentials(talentUUID);

  // Calculate credentials count from the hook data
  const credentialsCount = credentials.reduce(
    (sum: number, issuer: IssuerCredentialGroup) => sum + issuer.points.length,
    0,
  );

  return (
    <Tabs defaultValue="accounts" className="w-full flex flex-col">
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
      <TabsContent value="accounts" className="mt-6 p-2">
        <AccountGrid socialAccounts={socialAccounts} />
      </TabsContent>
      <TabsContent value="score" className="mt-6 space-y-6">
        <ScoreProgressAccordion talentUUID={talentUUID} />
        <CredentialIdeasCallout />
        <ScoreDataPoints talentUUID={talentUUID} />
      </TabsContent>
    </Tabs>
  );
}
