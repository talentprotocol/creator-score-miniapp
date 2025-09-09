"use client";

import * as React from "react";
import { Loader2, CheckCircle2, XCircle, Info } from "lucide-react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTalentAuthToken } from "@/hooks/useTalentAuthToken";

type EmailAccount = {
  id?: number | string;
  email?: string;
  verified?: boolean;
  primary?: boolean;
  created_at?: string;
  last_confirmation_email_sent_at?: string | null;
};

interface ConnectedEmailsSectionProps {
  expanded: boolean;
}

export function ConnectedEmailsSection({ expanded }: ConnectedEmailsSectionProps) {
  const { token, ensureTalentAuthToken } = useTalentAuthToken();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [emails, setEmails] = React.useState<EmailAccount[] | null>(null);
  const hasFetchedRef = React.useRef(false);
  const [newEmail, setNewEmail] = React.useState("");
  const [connecting, setConnecting] = React.useState(false);
  const [nowTs, setNowTs] = React.useState<number>(() => Date.now());
  const [primaryConfirmOpen, setPrimaryConfirmOpen] = React.useState(false);
  const [primaryTarget, setPrimaryTarget] = React.useState<{ id: number | string; email?: string } | null>(null);
  const [makingPrimary, setMakingPrimary] = React.useState(false);
  const [removeConfirmOpen, setRemoveConfirmOpen] = React.useState(false);
  const [removeTarget, setRemoveTarget] = React.useState<{ id: number | string; email?: string } | null>(null);
  const [removing, setRemoving] = React.useState(false);

  // Tick every second so countdowns update smoothly
  React.useEffect(() => {
    const t = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Auto-clear success messages after a few seconds
  React.useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(null), 4000);
    return () => clearTimeout(t);
  }, [success]);

  // Normalize API error responses to a clean message
  const extractErrorMessage = async (resp: Response): Promise<string> => {
    try {
      const contentType = resp.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await resp.json();
        if (typeof data?.error === "string") return data.error;
        if (typeof data?.message === "string") return data.message;
        return `HTTP ${resp.status}`;
      }
      const text = await resp.text();
      // If server returned stringified JSON, try to parse for `error`
      try {
        const parsed = JSON.parse(text);
        if (typeof parsed?.error === "string") return parsed.error;
      } catch {}
      return text || `HTTP ${resp.status}`;
    } catch {
      return `HTTP ${resp.status}`;
    }
  };

  // Build a redirect URL that preserves current path and wraps in Farcaster if in mini app
  const buildRedirectUrl = (): string => {
    if (typeof window === "undefined") return "";
    const current = window.location.href;
    const isMiniApp = Boolean((window as unknown as { __FC_MINIAPP__?: boolean }).__FC_MINIAPP__);
    return isMiniApp
      ? `https://farcaster.xyz/?launchFrameUrl=${encodeURIComponent(current)}`
      : current;
  };

  const fetchEmails = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let t = token;
      if (!t) {
        t = (await ensureTalentAuthToken()) || null;
      }
      if (!t) throw new Error("Missing Talent auth token");

      const resp = await fetch("/api/talent-email-accounts", {
        headers: { "x-talent-auth-token": t },
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || `HTTP ${resp.status}`);
      }
      const data = await resp.json();
      const rawList: unknown = Array.isArray(data?.email_accounts)
        ? data.email_accounts
        : Array.isArray(data)
        ? data
        : [];

      const list: EmailAccount[] = (Array.isArray(rawList) ? rawList : []).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (r: any) => ({
          id: r?.id,
          email: r?.email_address,
          verified: Boolean(r?.confirmed),
          primary:
            Boolean(r?.primary) || Boolean(r?.is_primary) || r?.kind === "primary",
          created_at: r?.created_at,
          last_confirmation_email_sent_at: r?.last_confirmation_email_sent_at ?? null,
        }),
      );

      setEmails(list);
      hasFetchedRef.current = true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load emails");
    } finally {
      setLoading(false);
    }
  }, [token, ensureTalentAuthToken]);

  const resendVerification = async (emailAccountId: number | string) => {
    try {
      setError(null);
      let t = token;
      if (!t) {
        t = (await ensureTalentAuthToken()) || null;
      }
      if (!t) throw new Error("Missing Talent auth token");

      const resp = await fetch("/api/talent-email-accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-talent-auth-token": t,
        },
        body: JSON.stringify({ email_account_id: emailAccountId, redirect_to_url: buildRedirectUrl() }),
      });
      if (!resp.ok) {
        const msg = await extractErrorMessage(resp);
        throw new Error(msg);
      }
      // Optimistically set last sent timestamp so countdown starts immediately
      const nowIso = new Date().toISOString();
      setEmails((prev) =>
        Array.isArray(prev)
          ? prev.map((e) =>
              String(e.id) === String(emailAccountId)
                ? { ...e, last_confirmation_email_sent_at: nowIso }
                : e,
            )
          : prev,
      );
      // Refresh list to sync with server
      await fetchEmails();
      setSuccess("Verification email sent.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to resend verification");
    }
  };

  // Helpers for resend gating
  const FIVE_MIN_MS = 5 * 60 * 1000;
  const canResendAt = (lastSent?: string | null): number | null => {
    if (!lastSent) return null; // can resend immediately
    const last = Date.parse(lastSent);
    if (Number.isNaN(last)) return null;
    return last + FIVE_MIN_MS;
  };

  const remainingSeconds = (lastSent?: string | null): number => {
    const at = canResendAt(lastSent);
    if (!at) return 0;
    const remMs = at - nowTs;
    return remMs > 0 ? Math.ceil(remMs / 1000) : 0;
  };

  const formatMMSS = (totalSeconds: number): string => {
    const m = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(1, "0");
    const s = Math.floor(totalSeconds % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

  const connectEmail = async () => {
    try {
      if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
        setError("Please enter a valid email address");
        return;
      }
      setConnecting(true);
      setError(null);
      let t = token;
      if (!t) {
        t = (await ensureTalentAuthToken()) || null;
      }
      if (!t) throw new Error("Missing Talent auth token");

      const resp = await fetch("/api/talent-email-accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-talent-auth-token": t,
        },
        body: JSON.stringify({ email: newEmail, redirect_to_url: buildRedirectUrl() }),
      });
      if (!resp.ok) {
        const msg = await extractErrorMessage(resp);
        throw new Error(msg);
      }
      setNewEmail("");
      // Refresh the list to include the new email
      await fetchEmails();
      setSuccess("Verification email sent.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to connect email");
    } finally {
      setConnecting(false);
    }
  };

  const makePrimary = async (emailAccountId: number | string) => {
    try {
      setError(null);
      let t = token;
      if (!t) {
        t = (await ensureTalentAuthToken()) || null;
      }
      if (!t) throw new Error("Missing Talent auth token");

      const resp = await fetch("/api/talent-email-accounts", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-talent-auth-token": t,
        },
        body: JSON.stringify({ email_account_id: emailAccountId }),
      });
      if (!resp.ok) {
        const msg = await extractErrorMessage(resp);
        throw new Error(msg);
      }
      // Refresh list to reflect new primary
      await fetchEmails();
      setSuccess("Primary email updated.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to set primary email");
    }
  };

  const requestMakePrimary = (emailAccountId: number | string, email?: string) => {
    setPrimaryTarget({ id: emailAccountId, email });
    setPrimaryConfirmOpen(true);
  };

  const confirmMakePrimary = async () => {
    if (!primaryTarget) return;
    try {
      setMakingPrimary(true);
      await makePrimary(primaryTarget.id);
      setPrimaryConfirmOpen(false);
      setPrimaryTarget(null);
    } finally {
      setMakingPrimary(false);
    }
  };

  const removeEmail = async (emailAccountId: number | string) => {
    try {
      setError(null);
      let t = token;
      if (!t) {
        t = (await ensureTalentAuthToken()) || null;
      }
      if (!t) throw new Error("Missing Talent auth token");

      // Optimistic update: remove locally first
      setEmails((prev) => (Array.isArray(prev) ? prev.filter((e) => String(e.id) !== String(emailAccountId)) : prev));

      const resp = await fetch("/api/talent-email-accounts", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-talent-auth-token": t,
        },
        body: JSON.stringify({ email_account_id: emailAccountId }),
      });
      if (!resp.ok) {
        const msg = await extractErrorMessage(resp);
        throw new Error(msg);
      }
      // Refresh list to ensure consistency
      await fetchEmails();
      setSuccess("Email removed.");
    } catch (e) {
      // Rollback by refetching
      await fetchEmails();
      setError(e instanceof Error ? e.message : "Failed to remove email");
    }
  };

  const requestRemoveEmail = (emailAccountId: number | string, email?: string) => {
    setRemoveTarget({ id: emailAccountId, email });
    setRemoveConfirmOpen(true);
  };

  const confirmRemoveEmail = async () => {
    if (!removeTarget) return;
    try {
      setRemoving(true);
      await removeEmail(removeTarget.id);
      setRemoveConfirmOpen(false);
      setRemoveTarget(null);
    } finally {
      setRemoving(false);
    }
  };

  // Lazy fetch when expanded for the first time
  React.useEffect(() => {
    if (expanded && !hasFetchedRef.current && !loading) {
      void fetchEmails();
    }
  }, [expanded, fetchEmails, loading]);

  return (
    <div className="space-y-3">
      {/* Connect new email */}
      <div className="flex items-center gap-2">
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="name@example.com"
          className="flex-1 h-9 px-3 rounded-md border text-sm"
          disabled={connecting}
        />
        <Button size="sm" onClick={() => void connectEmail()} disabled={connecting || !newEmail}>
          {connecting ? "Connecting..." : "Connect Email"}
        </Button>
      </div>
      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading emails...
        </div>
      )}

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

      {!loading && emails && emails.length === 0 && (
        <p className="text-sm text-muted-foreground">No connected emails.</p>
      )}

      {!loading && emails && emails.length > 0 && (() => {
        const primaryDisplay = emails.find((e) => e.primary) || null;
        const others = emails.filter((e) => !e.primary);

        return (
          <div className="space-y-3">
            {primaryDisplay && (
              <div className="bg-background border rounded-lg p-3">
                <div className="flex items-center gap-2">
                  {typeof (primaryDisplay as EmailAccount).verified === "boolean" ? (
                    (primaryDisplay as EmailAccount).verified ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-amber-600" />
                    )
                  ) : null}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{(primaryDisplay as EmailAccount).email || "Unknown"}</span>
                    <span className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-0.5">
                      Primary Email
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground" aria-label="Primary email info" />
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            Primary email is used for receiving updates and news from us.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </span>
                  </div>
                  {typeof (primaryDisplay as EmailAccount).verified === "boolean" &&
                    !(primaryDisplay as EmailAccount).verified && (
                      <div className="ml-auto">
                        {(() => {
                          const rem = remainingSeconds((primaryDisplay as EmailAccount).last_confirmation_email_sent_at);
                          const disabled = rem > 0;
                          return (
                            <Button
                              size="sm"
                              disabled={disabled}
                              onClick={() => void resendVerification((primaryDisplay as EmailAccount).id || "")}
                            >
                              {disabled ? `Resend in ${formatMMSS(rem)}` : "Resend verification"}
                            </Button>
                          );
                        })()}
                      </div>
                    )}
                </div>
              </div>
            )}

            {others.length > 0 && (
              <div className="space-y-2">
                {others.map((e) => (
                  <div key={e.id || e.email} className="flex items-center justify-between bg-background border rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      {e.verified ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-amber-600" />
                      )}
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{e.email || "Unknown"}</span>
                        <span className="text-xs text-muted-foreground">Secondary</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      {!e.verified ? (
                        (() => {
                          const rem = remainingSeconds(e.last_confirmation_email_sent_at);
                          const disabled = rem > 0;
                          return (
                            <Button size="sm" disabled={disabled} onClick={() => void resendVerification(e.id || "")}>
                              {disabled ? `Resend in ${formatMMSS(rem)}` : "Resend verification"}
                            </Button>
                          );
                        })()
                      ) : (
                        <Button size="sm" onClick={() => requestMakePrimary(e.id || "", e.email)}>Make primary</Button>
                      )}
                      <Button size="sm" variant="destructive" onClick={() => requestRemoveEmail(e.id || "", e.email)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}
      {/* Confirm make primary modal */}
      <Dialog open={primaryConfirmOpen} onOpenChange={setPrimaryConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make this your primary email?</DialogTitle>
            <DialogDescription>
              You will receive product updates and communications on {primaryTarget?.email || "this address"}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPrimaryConfirmOpen(false)} disabled={makingPrimary}>
              Cancel
            </Button>
            <Button onClick={() => void confirmMakePrimary()} disabled={makingPrimary}>
              {makingPrimary ? "Updating..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm remove email modal */}
      <Dialog open={removeConfirmOpen} onOpenChange={setRemoveConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove this email?</DialogTitle>
            <DialogDescription>
              Removing {removeTarget?.email || "this address"} may reduce your Creator Score if it impacts verification or credentials.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRemoveConfirmOpen(false)} disabled={removing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void confirmRemoveEmail()} disabled={removing}>
              {removing ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


