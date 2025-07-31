"use client";

import * as React from "react";
import { Mail, Trash2 } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  UserSettings,
  AccountManagementAction,
} from "@/app/services/types";

interface AccountSettingsSectionProps {
  settings: UserSettings | null;
  onAction: (
    action: AccountManagementAction,
  ) => Promise<{ success: boolean; message: string }>;
}

export function AccountSettingsSection({
  settings,
}: AccountSettingsSectionProps) {
  const [email, setEmail] = React.useState(settings?.email || "");

  // Update email state when settings change
  React.useEffect(() => {
    setEmail(settings?.email || "");
  }, [settings?.email]);

  return (
    <div className="space-y-4">
      {/* Email Address Section */}
      <div className="bg-background border rounded-lg p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Icon icon={Mail} size="sm" color="muted" />
            <div className="flex-1">
              <h4 className="font-medium">Email Address</h4>
              <p className="text-xs text-muted-foreground">Coming soon</p>
            </div>
          </div>

          <div className="space-y-3 opacity-50">
            <Input
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                }
              }}
              disabled={true}
              className="w-full"
            />

            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                disabled={true}
                className="min-w-[80px]"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Section */}
      <div className="bg-background border rounded-lg p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Icon icon={Trash2} size="sm" color="muted" />
            <div className="flex-1">
              <h4 className="font-medium">Delete Account</h4>
              <p className="text-xs text-muted-foreground">Coming soon</p>
            </div>
          </div>

          <div className="space-y-3 opacity-50">
            <p className="text-sm text-muted-foreground">
              Permanently remove your account and all associated data. This
              action cannot be undone.
            </p>

            <Button
              type="button"
              styling="destructive"
              size="sm"
              disabled={true}
            >
              Delete Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
