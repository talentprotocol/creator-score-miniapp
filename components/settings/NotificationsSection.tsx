"use client";

import * as React from "react";
import { Bell, Mail } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import type { UserSettings } from "@/app/services/types";

// Extend Window interface for Farcaster frame API
declare global {
  interface Window {
    farcaster?: {
      showInstallPrompt: () => Promise<void>;
    };
  }
}

interface NotificationsSectionProps {
  settings: UserSettings | null;
  onUpdateNotifications: (notifications: {
    farcaster: boolean;
    email: boolean;
  }) => Promise<{ success: boolean; message: string }>;
}

export function NotificationsSection({
  settings,
  onUpdateNotifications,
}: NotificationsSectionProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [localSettings, setLocalSettings] = React.useState(
    settings?.notifications || { farcaster: false, email: false },
  );

  // Update local state when settings change
  React.useEffect(() => {
    if (settings?.notifications) {
      setLocalSettings(settings.notifications);
    }
  }, [settings?.notifications]);

  const handleFarcasterToggle = async () => {
    if (localSettings.farcaster) {
      // If already enabled, disable it
      const newSettings = { ...localSettings, farcaster: false };
      setLocalSettings(newSettings);

      try {
        await onUpdateNotifications(newSettings);
      } catch (error) {
        console.error("Error updating notification settings:", error);
        // Revert on error
        setLocalSettings(localSettings);
      }
    } else {
      // If not enabled, show install modal for first-time users
      setIsLoading(true);

      try {
        // Check if we're in a Farcaster frame environment
        const isInFrame =
          typeof window !== "undefined" &&
          (window.location.href.includes("warpcast.com") ||
            window.location.href.includes("farcaster.xyz") ||
            window.location.href.includes("farcaster.com"));

        if (isInFrame) {
          // In Farcaster frame - show install modal
          if (typeof window !== "undefined" && window.farcaster) {
            try {
              await window.farcaster.showInstallPrompt();
              console.log("Install modal shown successfully");
            } catch (error) {
              console.error("Error showing install modal:", error);
            }
          }
        } else {
          // Not in Farcaster frame - just enable the setting
          const newSettings = { ...localSettings, farcaster: true };
          setLocalSettings(newSettings);
          await onUpdateNotifications(newSettings);
        }
      } catch (error) {
        console.error("Error handling Farcaster toggle:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const ToggleSwitch = ({
    enabled,
    onToggle,
    disabled = false,
  }: {
    enabled: boolean;
    onToggle: () => void;
    disabled?: boolean;
  }) => (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background
        ${enabled ? "bg-primary shadow-lg" : "bg-input"}
        ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:shadow-md"}
      `}
      aria-label={enabled ? "Enabled" : "Disabled"}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-background shadow-lg transition-all duration-300 ease-in-out ring-0
          ${enabled ? "translate-x-6 shadow-xl" : "translate-x-1"}
          ${disabled ? "" : "hover:scale-110"}
        `}
      />
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Farcaster Notifications */}
      <div className="bg-background border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon icon={Bell} size="sm" color="muted" />
            <div>
              <h4 className="font-medium">Farcaster Notifications</h4>
              <p className="text-xs text-muted-foreground">
                {localSettings.farcaster ? "Enabled" : "Tap to enable"}
              </p>
            </div>
          </div>
          <ToggleSwitch
            enabled={localSettings.farcaster}
            onToggle={handleFarcasterToggle}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Email Notifications */}
      <div className="bg-background border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon icon={Mail} size="sm" color="muted" />
            <div>
              <h4 className="font-medium">Email Notifications</h4>
              <p className="text-xs text-muted-foreground">Coming soon</p>
            </div>
          </div>
          <ToggleSwitch enabled={false} onToggle={() => {}} disabled={true} />
        </div>
      </div>

      {/* Global Loading State */}
      {isLoading && (
        <div className="text-sm text-muted-foreground">
          Updating preferences...
        </div>
      )}
    </div>
  );
}
