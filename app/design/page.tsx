"use client";

import * as React from "react";
import {
  Heart,
  Home,
  Search,
  Trophy,
  Settings,
  Info,
  Trash2,
  FileText,
  Users,
} from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ButtonFullWidth } from "@/components/ui/button-full-width";
import { TabContainer } from "@/components/common/TabContainer";
import { Callout } from "@/components/common/Callout";
import { SectionAccordion } from "@/components/common/SectionAccordion";
import { CredentialAccordion } from "@/components/common/CredentialAccordion";
import { CreatorList } from "@/components/common/CreatorList";
import { TopListCard } from "@/components/common/TopListCard";
import { cn } from "@/lib/utils";
import { PageContainer } from "@/components/common/PageContainer";
import { StatCard } from "@/components/common/StatCard";
import { SegmentedBar } from "@/components/common/SegmentedBar";
import { CreatorScoreCard } from "@/components/home/CreatorScoreCard";
import { PotentialRewardsCard } from "@/components/home/PotentialRewardsCard";
import { RewardsBoostsCard } from "@/components/home/RewardsBoostsCard";
import { CreatorNotFoundCard } from "@/components/common/CreatorNotFoundCard";

import { RewardsCalculationProgress } from "@/components/common/RewardsCalculationProgress";

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
                    code="text-foreground stroke-2"
                  />
                  <IconDemo
                    icon={<Icon icon={Heart} size="lg" disabled />}
                    label="Disabled"
                    code="stroke-[1.5] opacity-20"
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
                        active:scale-110 stroke-2
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
                    name: "Primary",
                    color: "primary" as const,
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
            <Section title="Button Components">
              <div className="space-y-6">
                {/* Regular Buttons */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    Base Button
                    <a
                      href="https://github.com/talentprotocol/creator-score-miniapp/tree/main/components/ui/button.tsx"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                    >
                      components/ui/button.tsx
                    </a>
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    <Button variant="default">Default</Button>
                    <Button variant="brand-purple">Brand Purple</Button>
                    <Button variant="destructive">Destructive</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button disabled>Disabled</Button>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground font-mono space-y-1">
                    <div>
                      default: border border-input hover:border-gray-400
                    </div>
                    <div>
                      brand: bg-brand-purple-light hover:bg-brand-purple-dark
                      text-brand-purple
                    </div>
                    <div>
                      destructive: bg-red-100 hover:bg-red-200 text-red-700
                    </div>
                    <div>
                      ghost: border-0 bg-transparent hover:text-foreground
                    </div>
                    <div>
                      disabled: opacity-50 cursor-not-allowed
                      text-muted-foreground
                    </div>
                  </div>
                </div>

                {/* Icon Buttons */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Icon Buttons</h3>
                  <div className="flex flex-wrap gap-4 items-center">
                    <Button variant="default" size="icon">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button variant="brand-purple" size="icon">
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Full-Width Buttons */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    Full-Width Buttons
                    <a
                      href="https://github.com/talentprotocol/creator-score-miniapp/tree/main/components/ui/button-full-width.tsx"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                    >
                      components/ui/button-full-width.tsx
                    </a>
                  </h3>
                  <div className="space-y-3">
                    <ButtonFullWidth
                      variant="default"
                      icon={<Settings className="h-4 w-4" />}
                      align="left"
                      href="/settings"
                    >
                      Settings (Variant: Default)
                    </ButtonFullWidth>

                    <ButtonFullWidth
                      variant="brand-purple"
                      icon={<Heart className="h-4 w-4" />}
                      align="left"
                    >
                      Follow (Variant: Brand Purple)
                    </ButtonFullWidth>

                    <ButtonFullWidth
                      variant="destructive"
                      icon={<Trash2 className="h-4 w-4" />}
                      align="left"
                    >
                      Delete (Variant: Destructive)
                    </ButtonFullWidth>

                    <ButtonFullWidth
                      variant="muted"
                      icon={<Info className="h-4 w-4" />}
                      align="left"
                    >
                      More info (Variant: Muted)
                    </ButtonFullWidth>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground font-mono space-y-1">
                    <div>
                      Layout: w-full flex justify-start items-center gap-3 px-6
                      py-4 h-auto rounded-xl
                    </div>
                    <div>
                      Props: icon (required), href/external (optional), variant:
                      default | brand | destructive | muted, align: left |
                      center (default auto: left when href present; center
                      otherwise), showRightIcon (optional), onClick, etc.
                    </div>
                    <div>Default keeps border; muted has no border.</div>
                    <div>
                      Label uses Typography base with variant color; left and
                      right icons match variant color.
                    </div>
                  </div>
                </div>
              </div>
            </Section>

            <Section title="Button Sizes">
              <div className="space-y-6">
                <div className="flex flex-wrap gap-4 items-end">
                  <div className="space-y-2 text-center">
                    <Button size="sm">Small</Button>
                    <div className="text-xs text-muted-foreground font-mono">
                      sm: h-8 px-3 text-xs
                    </div>
                  </div>
                  <div className="space-y-2 text-center">
                    <Button size="default">Default</Button>
                    <div className="text-xs text-muted-foreground font-mono">
                      default: h-9 px-4
                    </div>
                  </div>
                  <div className="space-y-2 text-center">
                    <Button size="lg">Large</Button>
                    <div className="text-xs text-muted-foreground font-mono">
                      lg: h-10 px-8
                    </div>
                  </div>
                  <div className="space-y-2 text-center">
                    <Button size="icon">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <div className="text-xs text-muted-foreground font-mono">
                      icon: h-9 w-9
                    </div>
                  </div>
                </div>
              </div>
            </Section>

            <Section title="Callout Components">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    Informational Callouts
                    <a
                      href="https://github.com/talentprotocol/creator-score-miniapp/tree/main/components/common/Callout.tsx"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                    >
                      components/common/Callout.tsx
                    </a>
                  </h3>
                  <div className="space-y-3">
                    <Callout
                      variant="brand-purple"
                      icon={<Info className="h-4 w-4" />}
                      onClose={() => {}}
                      title="Get an extra boost for sharing videos"
                      description="Post a video on Farcaster to earn +500 bonus points this week"
                    />
                    <Callout
                      variant="muted"
                      icon={<Info className="h-4 w-4" />}
                      onClose={() => {}}
                      title="Profile visibility"
                      description="Complete your profile to increase discoverability"
                    />
                  </div>
                </div>

                {/* Interactive Callouts */}
                <div>
                  <h3 className="text-sm font-medium mb-3">
                    Interactive Callouts
                  </h3>
                  <div className="space-y-3">
                    <Callout
                      mode="interactive"
                      variant="brand-purple"
                      icon={<Info className="h-4 w-4" />}
                      href="/leaderboard"
                      title="Explore Leaderboard"
                      description="Tap to browse top creators"
                    />
                    <Callout
                      mode="interactive"
                      variant="muted"
                      icon={<FileText className="h-4 w-4" />}
                      href="https://example.com"
                      external
                      title="Read the docs"
                      description="Opens external link"
                    />
                  </div>
                </div>

                <div className="text-xs text-muted-foreground font-mono space-y-1">
                  <div>Brand: bg-brand-purple-light</div>
                  <div>Muted: bg-muted</div>
                  <div>Structure: left icon + title + description</div>
                  <div>
                    Modes: informative (dismissible) | interactive (clickable
                    with arrow)
                  </div>
                </div>
              </div>
            </Section>
          </div>
        );

      case "cards":
        return (
          <div className="space-y-8">
            {/* Base Card Component */}
            <Section title="Base Card Component">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    Base Card
                    <a
                      href="https://github.com/talentprotocol/creator-score-miniapp/tree/main/components/ui/card.tsx"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                    >
                      components/ui/card.tsx
                    </a>
                  </h3>
                  <Card className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium">
                        Base Card Example
                      </span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm">
                        This is the foundational card component used throughout
                        the app.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Uses semantic color classes and consistent spacing.
                      </p>
                    </div>
                  </Card>
                </div>
              </div>
            </Section>

            {/* Stat Cards */}
            <Section title="Stat Cards">
              <div className="space-y-6">
                {/* StatCard */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    StatCard
                    <a
                      href="https://github.com/talentprotocol/creator-score-miniapp/tree/main/components/common/StatCard.tsx"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                    >
                      components/common/StatCard.tsx
                    </a>
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <StatCard title="Rewards Pool" value="$50,000" />
                    <StatCard
                      title="Your Rank"
                      value="#42"
                      onClick={() => alert("Clicked!")}
                    />
                  </div>
                </div>

                {/* SegmentedBar */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    SegmentedBar
                    <a
                      href="https://github.com/talentprotocol/creator-score-miniapp/tree/main/components/common/SegmentedBar.tsx"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                    >
                      components/common/SegmentedBar.tsx
                    </a>
                  </h3>
                  <SegmentedBar
                    title="Social Activity"
                    total={2500}
                    segments={[
                      {
                        name: "Farcaster",
                        value: 1200,
                        percentage: 48,
                        url: "https://farcaster.xyz",
                      },
                      {
                        name: "Twitter",
                        value: 800,
                        percentage: 32,
                        url: "https://twitter.com",
                      },
                      {
                        name: "GitHub",
                        value: 500,
                        percentage: 20,
                        url: "https://github.com",
                      },
                    ]}
                    color="blue"
                  />
                </div>
              </div>
            </Section>

            {/* Home Page Cards */}
            <Section title="Home Page Cards">
              <div className="space-y-6">
                {/* CreatorScoreCard */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    CreatorScoreCard
                    <a
                      href="https://github.com/talentprotocol/creator-score-miniapp/tree/main/components/home/CreatorScoreCard.tsx"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                    >
                      components/home/CreatorScoreCard.tsx
                    </a>
                  </h3>
                  <CreatorScoreCard score={1250} />
                </div>

                {/* PotentialRewardsCard */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    PotentialRewardsCard
                    <a
                      href="https://github.com/talentprotocol/creator-score-miniapp/tree/main/components/home/PotentialRewardsCard.tsx"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                    >
                      components/home/PotentialRewardsCard.tsx
                    </a>
                  </h3>
                  <PotentialRewardsCard score={1250} />
                </div>

                {/* TopCreatorsCard */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    TopCreatorsCard
                    <a
                      href="https://github.com/talentprotocol/creator-score-miniapp/tree/main/components/home/TopCreatorsCard.tsx"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                    >
                      components/home/TopCreatorsCard.tsx
                    </a>
                  </h3>
                  <TopListCard
                    title="Top Creators"
                    seeMoreLink="/leaderboard"
                    items={[
                      {
                        id: "1",
                        name: "Alice Builder",
                        avatarUrl: undefined,
                        rank: 1,
                        secondaryMetric: "Creator Score: 5,230",
                      },
                      {
                        id: "2",
                        name: "Bob Creator",
                        avatarUrl: undefined,
                        rank: 2,
                        secondaryMetric: "Creator Score: 4,890",
                      },
                      {
                        id: "3",
                        name: "Carol Developer",
                        avatarUrl: undefined,
                        rank: 3,
                        secondaryMetric: "Creator Score: 4,120",
                      },
                    ]}
                    onItemClick={() => {}}
                  />
                </div>

                {/* TopSponsorsCard */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    TopSponsorsCard
                    <a
                      href="https://github.com/talentprotocol/creator-score-miniapp/tree/main/components/home/TopSponsorsCard.tsx"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                    >
                      components/home/TopSponsorsCard.tsx
                    </a>
                  </h3>
                  <TopListCard
                    title="Top Sponsors"
                    seeMoreLink="/leaderboard"
                    items={[
                      {
                        id: "1",
                        name: "Sponsor One",
                        avatarUrl: undefined,
                        rank: 1,
                        secondaryMetric: "@sponsor1",
                      },
                      {
                        id: "2",
                        name: "Sponsor Two",
                        avatarUrl: undefined,
                        rank: 2,
                        secondaryMetric: "@sponsor2",
                      },
                      {
                        id: "3",
                        name: "Sponsor Three",
                        avatarUrl: undefined,
                        rank: 3,
                        secondaryMetric: "@sponsor3",
                      },
                    ]}
                    onItemClick={() => {}}
                  />
                </div>

                {/* RewardsBoostsCard */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    RewardsBoostsCard
                    <a
                      href="https://github.com/talentprotocol/creator-score-miniapp/tree/main/components/home/RewardsBoostsCard.tsx"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                    >
                      components/home/RewardsBoostsCard.tsx
                    </a>
                  </h3>
                  <RewardsBoostsCard talentUuid="demo-123" />
                </div>
              </div>
            </Section>

            {/* Utility Cards */}
            <Section title="Utility Cards">
              <div className="space-y-6">
                {/* CreatorNotFoundCard */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    CreatorNotFoundCard
                    <a
                      href="https://github.com/talentprotocol/creator-score-miniapp/tree/main/components/common/CreatorNotFoundCard.tsx"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                    >
                      components/common/CreatorNotFoundCard.tsx
                    </a>
                  </h3>
                  <CreatorNotFoundCard />
                </div>

                {/* BadgeCard */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    BadgeCard
                    <a
                      href="https://github.com/talentprotocol/creator-score-miniapp/tree/main/components/badges/BadgeCard.tsx"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                    >
                      components/badges/BadgeCard.tsx
                    </a>
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Mock Badge for Design Showcase */}
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center text-white shadow-lg">
                      <Trophy className="w-8 h-8" />
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-lg flex items-center justify-center text-white shadow-lg">
                      <Users className="w-8 h-8" />
                    </div>
                  </div>
                </div>

                {/* RewardsCalculationProgress */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    RewardsCalculationProgress
                    <a
                      href="https://github.com/talentprotocol/creator-score-miniapp/tree/main/components/common/RewardsCalculationProgress.tsx"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                    >
                      components/common/RewardsCalculationProgress.tsx
                    </a>
                  </h3>
                  <RewardsCalculationProgress
                    progress={75}
                    message="Calculating your rewards..."
                  />
                </div>
              </div>
            </Section>

            {/* Accordion Components */}
            <Section title="Accordion Components">
              <div className="space-y-6">
                {/* Gray Accordion */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    Gray Accordion
                    <a
                      href="https://github.com/talentprotocol/creator-score-miniapp/tree/main/components/common/SectionAccordion.tsx"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                    >
                      components/common/SectionAccordion.tsx
                    </a>
                  </h3>
                  <SectionAccordion
                    type="single"
                    variant="gray"
                    sections={[
                      {
                        id: "connected-socials",
                        title: "Connected Socials",
                        icon: <Users className="h-4 w-4" />,
                        content: (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>Farcaster</span>
                              <span className="text-muted-foreground">
                                Connected
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span>Twitter</span>
                              <span className="text-muted-foreground">
                                Not connected
                              </span>
                            </div>
                          </div>
                        ),
                      },
                      {
                        id: "connected-wallets",
                        title: "Connected Wallets",
                        icon: <Settings className="h-4 w-4" />,
                        value: "2",
                        content: (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>0x1234...5678</span>
                              <span className="text-muted-foreground">
                                Primary
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span>0x8765...4321</span>
                              <span className="text-muted-foreground">
                                Secondary
                              </span>
                            </div>
                          </div>
                        ),
                      },
                    ]}
                  />
                </div>

                {/* White Accordion */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    White Accordion
                    <a
                      href="https://github.com/talentprotocol/creator-score-miniapp/tree/main/components/common/SectionAccordion.tsx"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                    >
                      components/common/SectionAccordion.tsx
                    </a>
                  </h3>
                  <SectionAccordion
                    type="multiple"
                    variant="white"
                    sections={[
                      {
                        id: "badge-section-1",
                        title: "Social Badges",
                        value: "3/5",
                        content: (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-2 bg-muted rounded-lg">
                              <div className="text-xs font-medium">
                                Farcaster
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Active
                              </div>
                            </div>
                            <div className="text-center p-2 bg-muted rounded-lg">
                              <div className="text-xs font-medium">Twitter</div>
                              <div className="text-xs text-muted-foreground">
                                Inactive
                              </div>
                            </div>
                          </div>
                        ),
                      },
                      {
                        id: "badge-section-2",
                        title: "Achievement Badges",
                        value: "1/3",
                        content: (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-2 bg-muted rounded-lg">
                              <div className="text-xs font-medium">
                                First Post
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Earned
                              </div>
                            </div>
                          </div>
                        ),
                      },
                    ]}
                  />
                </div>

                {/* Credential Accordion */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    Credential Accordion
                    <a
                      href="https://github.com/talentprotocol/creator-score-miniapp/tree/main/components/common/CredentialAccordion.tsx"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                    >
                      components/common/CredentialAccordion.tsx
                    </a>
                  </h3>
                  <CredentialAccordion
                    credentials={[
                      {
                        issuer: "Farcaster",
                        total: 1250,
                        max_total: 2000,
                        points: [
                          {
                            label: "Followers",
                            value: 500,
                            max_score: 1000,
                            readable_value: "500",
                            uom: "followers",
                            external_url: null,
                          },
                          {
                            label: "Posts",
                            value: 750,
                            max_score: 1000,
                            readable_value: "150",
                            uom: "posts",
                            external_url: null,
                          },
                        ],
                      },
                      {
                        issuer: "GitHub",
                        total: 800,
                        max_total: 1500,
                        points: [
                          {
                            label: "Repositories",
                            value: 300,
                            max_score: 500,
                            readable_value: "12",
                            uom: "repos",
                            external_url: null,
                          },
                          {
                            label: "Stars",
                            value: 500,
                            max_score: 1000,
                            readable_value: "45",
                            uom: "stars",
                            external_url: null,
                          },
                        ],
                      },
                    ]}
                  />
                </div>

                <div className="text-xs text-muted-foreground font-mono space-y-1">
                  <div>Gray: bg-muted rounded-xl border-0 shadow-none</div>
                  <div>White: bg-card rounded-xl border shadow-none</div>
                  <div>Credential: bg-card rounded-xl border shadow-none</div>
                  <div>Layout: px-6 py-4 flex items-center justify-between</div>
                  <div>Icons: h-4 w-4 text-muted-foreground</div>
                  <div>
                    Values: text-xl font-semibold text-foreground w-16
                    text-right
                  </div>
                </div>
              </div>
            </Section>
          </div>
        );

      case "lists":
        return (
          <div className="space-y-8">
            {/* Component Standardization Summary */}
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="text-sm font-medium mb-2">
                Component Standardization Summary
              </h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>
                  <strong>✅ Standardized:</strong> Reduced from 6 components to
                  2
                </div>
                <div>
                  <strong>CreatorList:</strong> Replaces SearchResults and
                  LeaderboardRow
                </div>
                <div>
                  <strong>TopListCard:</strong> Replaces TopCreatorsCard and
                  TopSponsorsCard
                </div>
                <div>
                  <strong>PostsList:</strong> Kept separate (unique structure)
                  but updated styling
                </div>
                <div>
                  <strong>Styling:</strong> Consistent semantic colors and hover
                  states
                </div>
              </div>
            </div>

            {/* 1. PostsList */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                1. PostsList
                <a
                  href="https://github.com/talentprotocol/creator-score-miniapp/tree/main/components/profile/PostsList.tsx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                >
                  components/profile/PostsList.tsx
                </a>
              </h3>
              <div className="text-xs text-muted-foreground mb-3">
                <strong>Use case:</strong> List of user posts with external
                links
                <br />
                <strong>Structure:</strong> Title + Date on left, External link
                + Platform on right
                <br />
                <strong>Features:</strong> External navigation, platform
                indicators
              </div>
              <div className="w-full">
                <div className="bg-background rounded-xl border border-input overflow-hidden">
                  <div className="flex gap-3 p-3 hover:bg-muted active:bg-muted/80 transition-colors cursor-pointer">
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <p className="font-medium text-sm truncate leading-tight">
                        My first post about Creator Score
                      </p>
                      <p className="text-xs text-muted-foreground">
                        2 days ago
                      </p>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <div className="text-muted-foreground p-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Twitter
                      </span>
                    </div>
                  </div>
                  <div className="h-px bg-border"></div>
                  <div className="flex gap-3 p-3 hover:bg-muted active:bg-muted/80 transition-colors cursor-pointer">
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <p className="font-medium text-sm truncate leading-tight">
                        Building the future of creator economy
                      </p>
                      <p className="text-xs text-muted-foreground">
                        1 week ago
                      </p>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <div className="text-muted-foreground p-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Farcaster
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. CreatorList */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                2. CreatorList
                <a
                  href="https://github.com/talentprotocol/creator-score-miniapp/tree/main/components/common/CreatorList.tsx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                >
                  components/common/CreatorList.tsx
                </a>
              </h3>
              <div className="text-xs text-muted-foreground mb-3">
                <strong>Use case:</strong> Standardized list for creators
                (replaces SearchResults and LeaderboardRow)
                <br />
                <strong>Structure:</strong> Avatar + Name + optional Rank +
                optional Primary/Secondary metrics
                <br />
                <strong>Features:</strong> Loading states, empty states, hover
                effects, click handlers
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-medium mb-3">
                    CreatorList - Search Results Style
                  </h4>
                  <CreatorList
                    items={[
                      {
                        id: "1",
                        name: "Alice Builder",
                        avatarUrl: undefined,
                        secondaryMetric: "Creator Score: 5,230",
                      },
                      {
                        id: "2",
                        name: "Bob Creator",
                        avatarUrl: undefined,
                        secondaryMetric: "Creator Score: 4,890",
                      },
                      {
                        id: "3",
                        name: "Carol Developer",
                        avatarUrl: undefined,
                        secondaryMetric: "Creator Score: 4,120",
                      },
                    ]}
                    onItemClick={() => {}}
                  />
                </div>

                <div>
                  <h4 className="text-xs font-medium mb-3">
                    CreatorList - Leaderboard Style (with Rank & Primary Metric)
                  </h4>
                  <CreatorList
                    items={[
                      {
                        id: "1",
                        name: "Alice Builder",
                        avatarUrl: undefined,
                        rank: 1,
                        primaryMetric: "$500",
                        secondaryMetric: "Creator Score: 5,230",
                      },
                      {
                        id: "2",
                        name: "Bob Creator",
                        avatarUrl: undefined,
                        rank: 2,
                        primaryMetric: "$450",
                        secondaryMetric: "Creator Score: 4,890",
                      },
                      {
                        id: "3",
                        name: "Carol Developer",
                        avatarUrl: undefined,
                        rank: 3,
                        primaryMetric: "$400",
                        secondaryMetric: "Creator Score: 4,120",
                      },
                    ]}
                    onItemClick={() => {}}
                  />
                </div>

                <div>
                  <h4 className="text-xs font-medium mb-3">
                    CreatorList - Loading State
                  </h4>
                  <CreatorList items={[]} loading={true} />
                </div>

                <div>
                  <h4 className="text-xs font-medium mb-3">
                    CreatorList - Empty State
                  </h4>
                  <CreatorList items={[]} loading={false} />
                </div>
              </div>
            </div>

            {/* 3. TopListCard */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                3. TopListCard
                <a
                  href="https://github.com/talentprotocol/creator-score-miniapp/tree/main/components/common/TopListCard.tsx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                >
                  components/common/TopListCard.tsx
                </a>
              </h3>
              <div className="text-xs text-muted-foreground mb-3">
                <strong>Use case:</strong> Card container for top lists
                (replaces TopCreatorsCard and TopSponsorsCard)
                <br />
                <strong>Structure:</strong> Clickable title with chevron +
                CreatorList (shows top 3)
                <br />
                <strong>Features:</strong> External links, loading states,
                consistent styling
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-medium mb-3">
                    TopListCard - Top Creators
                  </h4>
                  <TopListCard
                    title="Top Creators"
                    seeMoreLink="/leaderboard"
                    items={[
                      {
                        id: "1",
                        name: "Alice Builder",
                        avatarUrl: undefined,
                        rank: 1,
                        secondaryMetric: "Creator Score: 5,230",
                      },
                      {
                        id: "2",
                        name: "Bob Creator",
                        avatarUrl: undefined,
                        rank: 2,
                        secondaryMetric: "Creator Score: 4,890",
                      },
                      {
                        id: "3",
                        name: "Carol Developer",
                        avatarUrl: undefined,
                        rank: 3,
                        secondaryMetric: "Creator Score: 4,120",
                      },
                    ]}
                    onItemClick={() => {}}
                  />
                </div>

                <div>
                  <h4 className="text-xs font-medium mb-3">
                    TopListCard - Top Sponsors
                  </h4>
                  <TopListCard
                    title="Top Sponsors"
                    seeMoreLink="/leaderboard"
                    items={[
                      {
                        id: "1",
                        name: "Sponsor One",
                        avatarUrl: undefined,
                        rank: 1,
                        secondaryMetric: "@sponsor1",
                      },
                      {
                        id: "2",
                        name: "Sponsor Two",
                        avatarUrl: undefined,
                        rank: 2,
                        secondaryMetric: "@sponsor2",
                      },
                      {
                        id: "3",
                        name: "Sponsor Three",
                        avatarUrl: undefined,
                        rank: 3,
                        secondaryMetric: "@sponsor3",
                      },
                    ]}
                    onItemClick={() => {}}
                  />
                </div>

                <div>
                  <h4 className="text-xs font-medium mb-3">
                    TopListCard - Loading State
                  </h4>
                  <TopListCard title="Top Creators" items={[]} loading={true} />
                </div>
              </div>
            </div>

            {/* Implementation Notes */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium mb-2 text-blue-900">
                Implementation Notes
              </h4>
              <div className="text-xs text-blue-800 space-y-1">
                <div>
                  <strong>CreatorList:</strong> Replaces SearchResults and
                  LeaderboardRow
                </div>
                <div>
                  <strong>TopListCard:</strong> Replaces TopCreatorsCard and
                  TopSponsorsCard
                </div>
                <div>
                  <strong>Styling:</strong> Uses PostsList patterns for
                  consistency
                </div>
                <div>
                  <strong>Props:</strong> Flexible optional props for different
                  use cases
                </div>
                <div>
                  <strong>States:</strong> Loading, empty, pinned, hover states
                  included
                </div>
              </div>
            </div>
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
    <PageContainer className="bg-holographic">
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
