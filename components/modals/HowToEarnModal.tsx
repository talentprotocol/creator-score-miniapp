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
import { Link2, Trophy, Coins, Rocket } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { BOOST_CONFIG } from "@/lib/constants";

interface HowToEarnModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function HowToEarnContent() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-brand-purple-light rounded-lg">
          <Link2 className="h-5 w-5 text-primary" />
        </div>
        <p className="text-sm">Connect your Creator Accounts</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="p-2 bg-brand-purple-light rounded-lg">
          <Trophy className="h-5 w-5 text-primary" />
        </div>
        <p className="text-sm">Reach the Top 200 Leaderboard</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="p-2 bg-brand-purple-light rounded-lg">
          <Rocket className="h-5 w-5 text-primary" />
        </div>
        <p className="text-sm">
          Hold {BOOST_CONFIG.TOKEN_THRESHOLD}+ $TALENT for a 10% Boost
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="p-2 bg-brand-purple-light rounded-lg">
          <Coins className="h-5 w-5 text-primary" />
        </div>
        <p className="text-sm">Get Paid USDC on Sep 1st</p>
      </div>
    </div>
  );
}

export function HowToEarnModal({ open, onOpenChange }: HowToEarnModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>How to Earn Rewards</DialogTitle>
            <DialogDescription>
              Follow these steps to earn Creator Rewards.
            </DialogDescription>
          </DialogHeader>
          <HowToEarnContent />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>How to Earn Rewards</DrawerTitle>
          <DrawerDescription>
            Follow these steps to earn Creator Rewards.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-8">
          <HowToEarnContent />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
