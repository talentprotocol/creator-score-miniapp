"use client";

import * as React from "react";
import { Mail, Trash2 } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { UserSettings, AccountManagementAction } from "@/lib/types";

interface AccountSettingsSectionProps {
  settings: UserSettings | null;
  onAction: (
    action: AccountManagementAction,
  ) => Promise<{ success: boolean; message: string }>;
}

export function AccountSettingsSection({
  settings,
  onAction,
}: AccountSettingsSectionProps) {
  const [email, setEmail] = React.useState(settings?.email || "");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const onActionRef = React.useRef(onAction);
  React.useEffect(() => {
    onActionRef.current = onAction;
  }, [onAction]);

  // Enable save only when email is non-empty and different from current settings
  const canSave = React.useMemo(() => {
    const current = (settings?.email || "").trim();
    const next = (email || "").trim();
    if (next.length === 0) return false;
    return next !== current;
  }, [email, settings?.email]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    const result = await onActionRef.current({
      action: "update_email",
      data: { email },
    });
    if (result.success) {
      setSuccess("Email updated. Click on the link in your email to verify.");
    } else {
      setError(result.message || "Failed to update email");
    }
    setSaving(false);
  }

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
            </div>
          </div>

          <div className="space-y-3">
            <Input
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleSave();
                }
              }}
              disabled={saving}
              className="w-full"
            />

            <div className="flex gap-2 items-center">
              <Button
                type="button"
                size="sm"
                disabled={saving || !canSave}
                className="min-w-[80px]"
                onClick={() => void handleSave()}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
              {settings?.emailConfirmed ? (
                <span className="text-xs text-green-600">Verified</span>
              ) : (
                <span className="text-xs text-yellow-600">Please confirm your email.</span>
              )}
            </div>

            {error && (
              <p className="text-xs text-red-600" role="alert">
                {error}
              </p>
            )}
            {success && (
              <p className="text-xs text-green-600" role="status">
                {success}
              </p>
            )}
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

            <Button className="w-full" variant="destructive" disabled={true}>
              Delete Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
