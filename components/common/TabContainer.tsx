import * as React from "react";
import { cn } from "@/lib/utils";

export interface Tab {
  id: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

interface TabContainerProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function TabContainer({
  tabs,
  activeTab,
  onTabChange,
  className,
}: TabContainerProps) {
  return (
    <div className="w-full">
      <nav className={cn("flex w-full border-b", className)}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && onTabChange(tab.id)}
              disabled={tab.disabled}
              className={cn(
                "flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                isActive
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
                tab.disabled && "opacity-50 cursor-not-allowed",
              )}
            >
              <span className="flex items-center justify-center gap-2">
                {tab.label}
                {tab.count !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    {tab.count}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
