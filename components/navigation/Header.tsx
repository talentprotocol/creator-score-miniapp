"use client";

import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InfoDrawer } from "./InfoModal";
import * as React from "react";

export function Header() {
  const [infoOpen, setInfoOpen] = React.useState(false);
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-md items-center justify-between px-4">
        <h1 className="text-lg font-semibold">Creator Score</h1>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          aria-label="Learn more about Creator Score"
          onClick={() => setInfoOpen(true)}
        >
          <HelpCircle className="h-5 w-5 text-muted-foreground" />
        </Button>
        <InfoDrawer open={infoOpen} onOpenChange={setInfoOpen} />
      </div>
    </header>
  );
}
