"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import {
  Heart,
  Star,
  Circle,
  Bell,
  Home,
  Search,
  Trophy,
  Settings,
  Loader2,
  Info,
} from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TabContainer } from "@/components/common/TabContainer";
import { Callout } from "@/components/common/Callout";
import { cn } from "@/lib/utils";
import { PageContainer } from "@/components/common/PageContainer";

function IconDemo({
  icon,
  label,
  className,
  code,
}: {
  icon: React.ReactNode;
  label: string;
  className?: string;
  code?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-2 p-2", className)}>
      {icon}
      <span className="text-xs text-muted-foreground">{label}</span>
      {code && (
        <span className="text-[10px] text-muted-foreground font-mono">
          {code}
        </span>
      )}
    </div>
  );
}

function Section({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Card className="p-4 sm:p-6 overflow-x-auto bg-background/80 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
        <h2 className="text-lg font-medium mb-4">{title}</h2>
        {children}
      </Card>
    </div>
  );
}

function NavExample() {
  const [activeTab, setActiveTab] = React.useState("home");

  return (
    <div className="flex gap-4 items-center justify-center border-t border-border py-4">
      {[
        { id: "home", icon: Home },
        { id: "search", icon: Search },
        { id: "rewards", icon: Trophy },
        { id: "settings", icon: Settings },
      ].map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className="p-2"
        >
          <Icon icon={item.icon} size="lg" isActive={activeTab === item.id} />
        </button>
      ))}
    </div>
  );
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin", className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export default function DesignPage() {
  const [isClicked, setIsClicked] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("icons");

  const tabs = [
    { id: "icons", label: "Icons" },
    { id: "buttons", label: "Buttons" },
    { id: "cards", label: "Cards" },
    { id: "lists", label: "Lists" },
    { id: "modals", label: "Modals" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "icons":
        return (
          <div className="space-y-6">
            <Section title="Icon States">
              <div className="space-y-6">
                {/* Basic States */}
                <div className="grid grid-cols-3 gap-4">
                  <IconDemo
                    icon={<Icon icon={Heart} size="lg" />}
                    label="Default"
                    code="text-muted-foreground"
                  />
                  <IconDemo
                    icon={<Icon icon={Heart} size="lg" isActive />}
                    label="Active"
                    code="text-foreground fill-current"
                  />
                  <IconDemo
                    icon={<Icon icon={Heart} size="lg" disabled />}
                    label="Disabled"
                    code="disabled:opacity-50"
                  />
                </div>

                {/* Click Effect */}
                <div className="space-y-2">
                  <span className="text-sm font-medium">Click Effect</span>
                  <div className="flex flex-wrap gap-4 justify-center">
                    <button
                      className="flex flex-col items-center gap-2 p-2"
                      onClick={() => setIsClicked(!isClicked)}
                    >
                      <Icon icon={Heart} size="lg" isActive={isClicked} />
                      <span className="text-xs text-muted-foreground">
                        Toggle fill state
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        active:scale-110 active:fill-current
                      </span>
                    </button>
                  </div>
                </div>

                {/* Navigation Example */}
                <div className="space-y-2">
                  <span className="text-sm font-medium">
                    Navigation Example
                  </span>
                  <NavExample />
                </div>
              </div>
            </Section>

            <Section title="Icon Colors">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  {
                    name: "Default",
                    color: "default" as const,
                    class: "text-foreground",
                  },
                  {
                    name: "Muted",
                    color: "muted" as const,
                    class: "text-muted-foreground",
                  },
                  {
                    name: "Brand",
                    color: "brand" as const,
                    class: "text-purple-500",
                  },
                  {
                    name: "Error",
                    color: "error" as const,
                    class: "text-destructive",
                  },
                ].map((colorStyle) => (
                  <IconDemo
                    key={colorStyle.name}
                    icon={
                      <Icon icon={Heart} size="lg" color={colorStyle.color} />
                    }
                    label={colorStyle.name}
                    code={colorStyle.class}
                  />
                ))}
              </div>
            </Section>

            <Section title="Icon Sizes">
              <div className="flex items-end justify-center gap-8">
                {[
                  { size: "sm" as const, px: 14, usage: "Small indicators" },
                  { size: "md" as const, px: 18, usage: "Engagement icons" },
                  { size: "lg" as const, px: 24, usage: "Navigation" },
                ].map(({ size, px, usage }) => (
                  <IconDemo
                    key={size}
                    icon={<Icon icon={Heart} size={size} />}
                    label={size}
                    code={`${px}px (size-${px / 4}) - ${usage}`}
                  />
                ))}
              </div>
            </Section>

            <Section title="Loading">
              <div className="flex gap-8 justify-center">
                <IconDemo
                  icon={<Spinner className="size-6" />}
                  label="Default Spinner"
                  code="animate-spin opacity-25/75"
                />
              </div>
            </Section>
          </div>
        );

      case "buttons":
        return (
          <div className="space-y-6">
            <Section title="Button Variants">
              <div className="flex flex-wrap gap-4">
                <Button>Default (Outline)</Button>
                <Button variant="special">Special</Button>
                <Button variant="destructive">Destructive</Button>
                <div className="w-full mt-2">
                  <div className="text-xs text-muted-foreground font-mono space-y-1">
                    <div>default: border-input hover:border-gray-400</div>
                    <div>
                      special: bg-purple-100 hover:bg-purple-200 text-purple-700
                    </div>
                    <div>
                      destructive: bg-red-100 hover:bg-red-200 text-red-700
                    </div>
                  </div>
                </div>
              </div>
            </Section>

            <Section title="Ghost Buttons">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-primary">
                    Info Button Example
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-muted-foreground hover:text-primary"
                  >
                    <Icon icon={Info} size="sm" color="muted" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  ghost: no background, no border, hover:text-foreground
                </div>
              </div>
            </Section>

            <Section title="Callouts">
              <div className="space-y-4">
                <Callout>
                  This is our default callout component with brand styling
                </Callout>
                <div className="text-xs text-muted-foreground font-mono">
                  bg-purple-100 text-purple-700
                </div>
              </div>
            </Section>
          </div>
        );

      // Placeholder content for other tabs
      default:
        return (
          <div className="py-12 text-center text-muted-foreground">
            Content for {activeTab} coming soon
          </div>
        );
    }
  };

  return (
    <PageContainer noPadding className="bg-holographic">
      {/* Header section with padding */}
      <div className="px-4 py-6">
        <h1 className="text-xl font-semibold">Design System</h1>
        <p className="text-sm text-muted-foreground">
          Component library & guidelines
        </p>
      </div>

      {/* Full width tabs */}
      <TabContainer
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Content section with padding */}
      <div className="px-4 py-6">
        <div
          key={activeTab}
          className="animate-in fade-in zoom-in-98 duration-300 ease-out"
        >
          {renderContent()}
        </div>
      </div>
    </PageContainer>
  );
}
