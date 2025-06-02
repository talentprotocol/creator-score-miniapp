import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Link, Zap, BadgeDollarSign } from "lucide-react";
import * as React from "react";

interface InfoDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InfoDrawer({ open, onOpenChange }: InfoDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-w-sm mx-auto w-full p-4 sm:p-6 rounded-t-2xl">
        <DrawerHeader>
          <DrawerTitle className="text-2xl font-bold mb-2">
            How Creator Score Works
          </DrawerTitle>
        </DrawerHeader>
        <div className="space-y-5 px-2">
          <div className="flex items-start gap-3">
            <span className="mt-1 text-muted-foreground">
              <Link className="h-5 w-5 text-muted-foreground" />
            </span>
            <div>
              <div className="font-semibold">Connect Multiple Platforms</div>
              <div className="text-sm text-muted-foreground">
                The first cross-platform score that aggregates your Zora,
                Farcaster, Mirror, Lens, and other onchain activities.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-1 text-yellow-500">
              <Zap className="h-5 w-5 text-yellow-500" />
            </span>
            <div>
              <div className="font-semibold">Automatic Updates</div>
              <div className="text-sm text-muted-foreground">
                Your score updates automatically as you create, earn, and engage
                across platforms – no manual updates needed.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-1 text-amber-600">
              <BadgeDollarSign className="h-5 w-5 text-amber-600" />
            </span>
            <div>
              <div className="font-semibold">Earn Creator Rewards</div>
              <div className="text-sm text-muted-foreground">
                Top creators earn weekly ETH rewards based on their verified
                reputation and impact.
              </div>
            </div>
          </div>
        </div>
        <DrawerFooter className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" className="w-full" asChild>
            <a href="/leaderboard">Start Earning</a>
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
