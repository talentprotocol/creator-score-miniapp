"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ButtonFullWidth } from "@/components/ui/button-full-width";
import { Gift, Lock, Check, Ban } from "lucide-react";
import { openExternalUrl } from "@/lib/utils";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import posthog from "posthog-js";
import { Loader2 } from "lucide-react";
import { usePerkEntry } from "@/hooks/usePerkEntry";

export interface PerkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  color?: "purple" | "green" | "blue" | "pink";
  title: string;
  subtitle?: string;
  access?: string;
  distribution?: string;
  supply?: string;
  url?: string; // URL property for the perk
  ctaLabel: string; // label when enabled
  level?: number; // current user level
  requiredLevel?: number; // default 3
  perkId: string; // analytics id, e.g., "screen_studio"
  onClaim?: () => void; // optional callback when CTA succeeds
  iconUrl?: string;
  iconAlt?: string;
  talentUUID?: string | null;
  deadlineIso?: string; // UTC ISO string for entry deadline
}

function Content({
  color,
  access,
  distribution,
  supply,
  url,
  ctaLabel,
  level = 0,
  requiredLevel = 3,
  perkId,
  onClaim,
  talentUUID,
  deadlineIso,
}: Omit<PerkModalProps, "open" | "onOpenChange">) {
  const { context } = useMiniKit();
  const meetsLevel = (level ?? 0) >= (requiredLevel ?? 3);
  const { data, loading, enter } = usePerkEntry(perkId, talentUUID);
  const status = data?.status;

  const isNotEligible = !meetsLevel;
  const isEntered = status === "entered";
  const isClosed = status === "closed";
  const computedVariant =
    isNotEligible || isClosed ? "muted" : ("brand" as const);
  const computedIcon = loading ? (
    <Loader2 className="h-4 w-4 animate-spin" />
  ) : isNotEligible ? (
    <Lock className="h-4 w-4" />
  ) : isEntered ? (
    <Check className="h-4 w-4" />
  ) : isClosed ? (
    <Ban className="h-4 w-4" />
  ) : (
    <Gift className="h-4 w-4" />
  );

  function formatDeadline(iso?: string): string | null {
    if (!iso) return null;
    try {
      const d = new Date(iso);
      const month = d.toLocaleString("en-US", { month: "short" });
      const day = d.getUTCDate();
      const hours = String(d.getUTCHours()).padStart(2, "0");
      const minutes = String(d.getUTCMinutes()).padStart(2, "0");
      const j = day % 10;
      const k = day % 100;
      const suffix =
        j == 1 && k != 11
          ? "st"
          : j == 2 && k != 12
            ? "nd"
            : j == 3 && k != 13
              ? "rd"
              : "th";
      return `${month} ${day}${suffix} ${hours}:${minutes} UTC`;
    } catch {
      return null;
    }
  }

  return (
    <div className="space-y-6" {...(color ? { "data-accent": color } : {})}>
      <div className="space-y-3">
        <div className="h-px bg-border" />
        <div className="space-y-2 text-sm">
          {access && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Access</span>
              <span>{access}</span>
            </div>
          )}
          {distribution && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Distribution</span>
              <span>{distribution}</span>
            </div>
          )}
          {supply && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Supply</span>
              <span>{supply}</span>
            </div>
          )}
          {url && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">URL</span>
              <button
                type="button"
                className="underline hover:no-underline"
                onClick={() => openExternalUrl(url, context)}
              >
                {url}
              </button>
            </div>
          )}
          {formatDeadline(deadlineIso ?? data?.deadlineIso) && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Deadline</span>
              <span>{formatDeadline(deadlineIso ?? data?.deadlineIso)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <ButtonFullWidth
          variant={computedVariant}
          icon={computedIcon}
          onClick={async () => {
            posthog.capture("perk_draw_enter_success", { perk: perkId });
            const res = await enter();
            if (res.ok) {
              onClaim?.();
            }
          }}
          disabled={loading || isNotEligible || isEntered || isClosed}
        >
          {(() => {
            if (isNotEligible) return `Requires Level ${requiredLevel}`;
            if (isEntered) return "You'" + "re in!";
            if (isClosed) return "Entries closed";
            return ctaLabel;
          })()}
        </ButtonFullWidth>
        {/* Success message */}
        {status === "entered" && (
          <div className="text-xs text-center space-y-1">
            <div className="text-muted-foreground">
              Winners will be announced on{" "}
              <button
                type="button"
                className="underline hover:no-underline"
                onClick={() =>
                  openExternalUrl("https://farcaster.xyz/talent", context)
                }
              >
                Farcaster
              </button>{" "}
              on Aug 21st, and we’ll reach out to winners via DM.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function PerkModal(props: PerkModalProps) {
  const { open, onOpenChange, requiredLevel = 3, ...contentProps } = props;
  const isDesktop = useMediaQuery("(min-width: 768px)");

  React.useEffect(() => {
    if (open) {
      posthog.capture("perk_modal_opened", { perk: props.perkId });
    }
  }, [open, props.perkId]);

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent {...(props.color ? { "data-accent": props.color } : {})}>
          <DialogHeader className="text-left">
            <div className="flex items-center gap-2">
              <DialogTitle>{props.title}</DialogTitle>
              {props.iconUrl ? (
                <Avatar className="h-5 w-5">
                  <AvatarImage
                    src={props.iconUrl}
                    alt={props.iconAlt || "perk icon"}
                  />
                  <AvatarFallback className="p-0">
                    <div className="h-5 w-5 rounded-full bg-brand/20 flex items-center justify-center">
                      <Gift className="h-3 w-3 text-brand" />
                    </div>
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="h-5 w-5 rounded-full bg-brand/20 flex items-center justify-center">
                  <Gift className="h-3 w-3 text-brand" />
                </div>
              )}
            </div>
            {props.subtitle && (
              <DialogDescription>{props.subtitle}</DialogDescription>
            )}
          </DialogHeader>
          <Content requiredLevel={requiredLevel} {...contentProps} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent {...(props.color ? { "data-accent": props.color } : {})}>
        <DrawerHeader className="text-left">
          <div className="flex items-center gap-2">
            <DrawerTitle>{props.title}</DrawerTitle>
            {props.iconUrl ? (
              <Avatar className="h-5 w-5">
                <AvatarImage
                  src={props.iconUrl}
                  alt={props.iconAlt || "perk icon"}
                />
                <AvatarFallback className="p-0">
                  <div className="h-5 w-5 rounded-full bg-brand/20 flex items-center justify-center">
                    <Gift className="h-3 w-3 text-brand" />
                  </div>
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="h-5 w-5 rounded-full bg-brand/20 flex items-center justify-center">
                <Gift className="h-3 w-3 text-brand" />
              </div>
            )}
          </div>
          {props.subtitle && (
            <DrawerDescription>{props.subtitle}</DrawerDescription>
          )}
        </DrawerHeader>
        <div className="px-4 pb-8">
          <Content requiredLevel={requiredLevel} {...contentProps} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
