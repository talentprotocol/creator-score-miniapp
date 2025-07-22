"use client";

import * as React from "react";
import { Bell, Mail } from "lucide-react";
import { Icon } from "@/components/ui/icon";

// TODO: Re-enable notification logic when notification system is ready for production
// This component currently only contains UI elements for future implementation

// TODO: Re-add interface when notification logic is re-implemented
// interface NotificationsSectionProps {
//   settings: UserSettings | null;
//   onUpdateNotifications: (notifications: {
//     farcaster: boolean;
//     email: boolean;
//   }) => Promise<{ success: boolean; message: string }>;
// }

export function NotificationsSection() {
  // TODO: Add notification state management logic here when ready
  // - Check Farcaster frame environment
  // - Handle notification permissions
  // - Show install modal for first-time users
  // - Manage notification settings

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
              <p className="text-xs text-muted-foreground">Coming soon</p>
            </div>
          </div>
          <ToggleSwitch enabled={false} onToggle={() => {}} disabled={true} />
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
    </div>
  );
}
