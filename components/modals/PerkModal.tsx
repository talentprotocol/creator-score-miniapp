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
import { Gift } from "lucide-react";
import { openExternalUrl } from "@/lib/utils";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { Typography } from "@/components/ui/typography";
import posthog from "posthog-js";

export interface PerkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  color?: "purple" | "green" | "blue" | "pink";
  title: string;
  subtitle?: string;
  description: string;
  access?: string;
  distribution?: string;
  supply?: string;
  ctaLabel: string;
  ctaUrl: string;
  level?: number; // current user level
  requiredLevel?: number; // default 3
  perkId: string; // analytics id, e.g., "screen_studio"
  onClaim?: () => void; // optional callback when CTA succeeds
}

function Content({
  color,
  title,
  subtitle,
  description,
  access,
  distribution,
  supply,
  ctaLabel,
  ctaUrl,
  level = 0,
  requiredLevel = 3,
  perkId,
  onClaim,
}: Omit<PerkModalProps, "open" | "onOpenChange">) {
  const { context } = useMiniKit();
  const meetsLevel = (level ?? 0) >= (requiredLevel ?? 3);

  return (
    <div className="space-y-6" {...(color ? { "data-accent": color } : {})}>
      <div className="space-y-2">
        <Typography as="h3" size="lg" weight="bold" color="default">
          {title}
        </Typography>
        {subtitle && (
          <Typography size="sm" color="muted">
            {subtitle}
          </Typography>
        )}
      </div>

      <div className="space-y-3">
        <div className="h-px bg-border" />
        <Typography>{description}</Typography>
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
        </div>
      </div>

      <div className="space-y-2">
        <ButtonFullWidth
          variant="brand"
          icon={<Gift className="h-4 w-4" />}
          onClick={async () => {
            posthog.capture("perk_cta_clicked", { perk: perkId });
            await openExternalUrl(ctaUrl, context);
            onClaim?.();
          }}
          disabled={!meetsLevel}
        >
          {ctaLabel}
        </ButtonFullWidth>
        {!meetsLevel && (
          <Typography size="xs" color="muted">
            Requires Level {requiredLevel}
          </Typography>
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
            <DialogTitle>Creator Perk</DialogTitle>
            <DialogDescription>
              Access exclusive offers as your Creator Score increases.
            </DialogDescription>
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
          <DrawerTitle>Creator Perk</DrawerTitle>
          <DrawerDescription>
            Access exclusive offers as your Creator Score increases.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-8">
          <Content requiredLevel={requiredLevel} {...contentProps} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
