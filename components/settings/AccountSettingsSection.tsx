"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

export function AccountSettingsSection() {
  return (
    <div className="space-y-4">
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
