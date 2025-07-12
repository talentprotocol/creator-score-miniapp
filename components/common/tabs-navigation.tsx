"use client";

import type React from "react";

interface Tab {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
  indicator?: "live" | "new" | boolean;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  showCounts?: boolean;
  className?: string;
}

export function TabNavigation({
  tabs,
  activeTab,
  onTabChange,
  showCounts = true,
  className = "",
}: TabNavigationProps) {
  return (
    <div
      className={`flex border-b border-gray-200 bg-white overflow-x-auto ${className}`}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center justify-center gap-2 px-4 py-3 text-center relative whitespace-nowrap ${
              tabs.length <= 3 ? "flex-1" : "min-w-0"
            } ${isActive ? "text-gray-900" : "text-gray-500"}`}
          >
            {/* Icon if provided */}
            {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}

            {/* Label */}
            <span className="text-sm font-normal">{tab.label}</span>

            {/* Count badge - only for sponsors */}
            {showCounts && tab.count !== undefined && (
              <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full font-normal flex-shrink-0 min-w-[20px] text-center">
                {tab.count}
              </span>
            )}

            {/* Active indicator line */}
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
            )}
          </button>
        );
      })}
    </div>
  );
}
