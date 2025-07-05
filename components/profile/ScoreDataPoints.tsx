import * as React from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  shouldShowUom,
  formatReadableValue,
  cleanCredentialLabel,
} from "@/lib/utils";
import { sdk } from "@farcaster/frame-sdk";
import { ExternalLink } from "lucide-react";
import { COMING_SOON_CREDENTIALS } from "./comingSoonCredentials";
import { useProfileCredentials } from "@/hooks/useProfileCredentials";
import {
  mergeCredentialsWithComingSoon,
  sortCredentialsByTotal,
} from "@/lib/credentialUtils";

export function ScoreDataPoints({ talentUUID }: { talentUUID: string }) {
  const {
    credentials,
    loading: isLoading,
    error,
  } = useProfileCredentials(talentUUID);

  // Merge credentials with coming soon credentials using utility
  const allCredentials = mergeCredentialsWithComingSoon(
    credentials,
    COMING_SOON_CREDENTIALS,
  );

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

  const sortedCredentials = sortCredentialsByTotal(allCredentials);

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
                      {pt.external_url && (
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
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
