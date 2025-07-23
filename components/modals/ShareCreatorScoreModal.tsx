"use client";

import * as React from "react";
import Image from "next/image";
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
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShareCreatorScoreModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareCreatorScoreModal({
  open,
  onOpenChange,
}: ShareCreatorScoreModalProps) {
  const isDesktop = useMediaQuery("(min-width: 640px)");

  const content = (
    <div className="relative">
      <button
        onClick={() => onOpenChange(false)}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      >
        <X className="h-4 w-4 text-white" />
      </button>
      <Image
        src="/images/share/bg-vertical-optimized.png"
        alt="Creator Score Share"
        width={480}
        height={853}
        className="w-full h-auto"
        priority
      />
    </div>
  );

  const headerContent = (
    <>
      <div className={cn("sr-only")}>
        {isDesktop ? (
          <>
            <DialogTitle>Creator Score Preview</DialogTitle>
            <DialogDescription>
              Preview of your Creator Score card that you can share with others
            </DialogDescription>
          </>
        ) : (
          <>
            <DrawerTitle>Creator Score Preview</DrawerTitle>
            <DrawerDescription>
              Preview of your Creator Score card that you can share with others
            </DrawerDescription>
          </>
        )}
      </div>
    </>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[480px] p-0">
          <DialogHeader className="sr-only">{headerContent}</DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="p-0 max-w-[480px] mx-auto">
        <DrawerHeader className="sr-only">{headerContent}</DrawerHeader>
        {content}
      </DrawerContent>
    </Drawer>
  );
}
