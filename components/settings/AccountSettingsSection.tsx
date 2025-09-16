"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTalentAuthToken } from "@/hooks/useTalentAuthToken";
import { usePrivyAuth } from "@/hooks/usePrivyAuth";

export function AccountSettingsSection({ hasPrimaryEmail = false }: { hasPrimaryEmail?: boolean }) {
  const { token, ensureTalentAuthToken } = useTalentAuthToken();
  const { handleLogout } = usePrivyAuth({});
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleDeleteClick = () => {
    setOpen(true);
  };

  const confirmDelete = async () => {
    if (busy) return;
    setBusy(true);
    try {
      setError(null);
      let t = token;
      if (!t) {
        t = (await ensureTalentAuthToken({ force: true })) || null;
      }
      if (!t) throw new Error("Wallet signature required");

      const resp = await fetch("/api/user-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-talent-auth-token": t,
        },
        body: JSON.stringify({ action: "delete_account_email" }),
      });
      // We consider 200 OK as success and show final message
      if (!resp.ok) {
        // Try to parse error
        try {
          const data = await resp.json();
          throw new Error(data?.error || "Failed to request deletion email");
        } catch (e) {
          throw new Error(e instanceof Error ? e.message : "Failed to request deletion email");
        }
      }
      setSuccess(true);
      // After 5 seconds, sign the user out
      setTimeout(() => {
        void handleLogout();
      }, 5000);
    } catch (e) {
      // Keep dialog open to allow retry
      // Optional: surface error in UI later
      setError(e instanceof Error ? e.message : "Request failed");
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Delete Account Section */}
      <div className="bg-background border rounded-lg p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Icon icon={Trash2} size="sm" color="muted" />
            <div className="flex-1">
              <h4 className="font-medium">Delete Account</h4>
              <p className="text-xs text-muted-foreground">Permanently remove your account and all associated data. This action cannot be undone.</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button className="w-full" variant="destructive" onClick={handleDeleteClick} disabled={!hasPrimaryEmail}>
              Delete Account
            </Button>
          </div>
        </div>
      </div>

      {/* Confirm Delete Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This will send a confirmation email to delete your account. After confirming, you will be signed out in 5 seconds.
            </DialogDescription>
            {success && (
              <DialogDescription>
                Email sent. You will be signed out shortly. Please check your inbox to confirm the account deletion.
              </DialogDescription>
            )}
            {error && (
              <DialogDescription>
                {error}
              </DialogDescription>
            )}
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void confirmDelete()} disabled={busy}>
              {busy ? "Sending..." : success ? "Email Sent" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
