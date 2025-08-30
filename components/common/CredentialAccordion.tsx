"use client";

import * as React from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { cn, formatReadableValue } from "@/lib/utils";
import { type IssuerCredentialGroup } from "@/lib/types";

type CredentialIssuer = IssuerCredentialGroup;

interface CredentialAccordionProps {
  credentials: CredentialIssuer[];
  onCredentialClick?: (url: string) => void;
  className?: string;
}

export function CredentialAccordion({
  credentials,
  onCredentialClick,
  className,
}: CredentialAccordionProps) {
  function cleanLabel(label: string, issuer: string): string {
    const prefix = `${issuer} `;
    return label.startsWith(prefix) ? label.slice(prefix.length) : label;
  }

  function renderReadableValue(
    issuer: string,
    label: string,
    readableValue: string | null,
    uom: string | null,
    points: number,
  ): string {
    // Exception: Farcaster Engagement should not display readable value
    const normalizedIssuer = issuer.toLowerCase();
    const normalizedLabel = label.toLowerCase();
    if (
      normalizedIssuer === "farcaster" &&
      (normalizedLabel === "engagement" ||
        normalizedLabel.includes("engagement"))
    ) {
      return "";
    }

    if (uom === "boolean") {
      return points > 0 ? "True" : "False";
    }

    if (!readableValue) {
      return "—";
    }

    // USD and ETH are formatted with prefixes inside formatReadableValue
    return formatReadableValue(readableValue, uom);
  }
  const handleCredentialClick = async (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    if (onCredentialClick) {
      onCredentialClick(url);
    } else {
      // Default behavior: open in new tab
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Accordion type="multiple" className={cn("w-full space-y-2", className)}>
      {credentials.map((issuer, index) => (
        <AccordionItem
          key={issuer.issuer}
          value={`issuer-${index}`}
          className="bg-card rounded-xl border shadow-none p-0 mb-3"
        >
          <AccordionTrigger className="px-6 py-4 flex items-center justify-between">
            <div className="flex flex-col flex-1 gap-1">
              <span className="text-base font-medium text-foreground">
                {issuer.issuer}
              </span>
              <span className="text-xs text-muted-foreground">
                {issuer.points.filter((pt) => pt.value > 0).length}/
                {issuer.points.length} credentials
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
                        {cleanLabel(pt.label, issuer.issuer)}
                      </a>
                    ) : (
                      cleanLabel(pt.label, issuer.issuer)
                    )}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {pt.max_score !== null ? (
                      <>
                        <span className="text-xs text-foreground whitespace-nowrap">
                          {renderReadableValue(
                            issuer.issuer,
                            pt.label,
                            pt.readable_value,
                            pt.uom,
                            pt.value,
                          )}
                        </span>
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
  );
}
