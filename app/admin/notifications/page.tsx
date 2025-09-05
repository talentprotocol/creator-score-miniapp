"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { getUserContext } from "@/lib/user-context";
import { usePrivyAuth } from "@/hooks/usePrivyAuth";
// Using native textarea to avoid adding new UI primitives

interface NotificationHistory {
  id: string;
  campaign: string;
  title: string;
  body: string;
  target_url: string;
  audience_size: number;
  success_count: number;
  failed_count: number;
  sent_at: string;
  failed_fids: number[];
  dry_run: boolean;
}

const AdminNotificationsPage: React.FC = () => {
  const { context } = useMiniKit();
  const user = getUserContext(context);
  const { talentId } = usePrivyAuth({});
  const [title, setTitle] = useState<string>("");
  const [body, setBody] = useState<string>("");
  const [targetUrl, setTargetUrl] = useState<string>("");
  const [fidsText, setFidsText] = useState<string>("8446, 6730");
  const [dryRun, setDryRun] = useState<boolean>(true);
  const [testingMode, setTestingMode] = useState<boolean>(true);
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [fetchingUsers, setFetchingUsers] = useState<boolean>(false);
  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [fetchingHistory, setFetchingHistory] = useState<boolean>(false);
  const [apiToken, setApiToken] = useState<string>("");

  // Check if user is authenticated via either Farcaster or Privy
  const isAuthenticated = user || talentId;

  // Check if we have both authentications (Privy + API token) - TWO FACTOR AUTH
  const hasBothAuth = isAuthenticated && apiToken.trim();

  // Get the user identifier for admin validation
  const getUserIdentifier = () => {
    return user?.fid?.toString() || talentId;
  };

  // Show access denied if not authenticated via Privy
  if (!isAuthenticated) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto w-full p-4 space-y-4">
          <h1 className="text-lg font-semibold">Admin Notifications</h1>
          <div className="p-4 border rounded-md bg-red-50 border-red-200">
            <div className="flex items-center space-x-2">
              <span className="text-red-600">🔒</span>
              <span className="text-red-800 font-medium">Access Denied</span>
            </div>
            <p className="text-red-700 text-sm mt-2">
              You must be authenticated via Privy to access this admin page.
            </p>
            <p className="text-red-600 text-xs mt-1">
              Please connect your wallet to continue.
            </p>
          </div>
        </div>
      </div>
    );
  }

  async function fetchNotificationUsers() {
    setFetchingUsers(true);
    try {
      const authToken = apiToken.trim();
      if (!authToken) {
        setResult(
          "❌ Admin API token required - please enter your admin API token to perform this action",
        );
        return;
      }

      const userIdentifier = getUserIdentifier();
      if (!userIdentifier) {
        setResult(
          "❌ User identifier not available - please ensure you're properly authenticated",
        );
        return;
      }

      const res = await fetch("/api/admin/notifications/users", {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "X-User-Id": userIdentifier,
        },
      });
      const data = await res.json();
      if (data.count !== undefined) {
        setUserCount(data.count);
        // Auto-populate FIDs field with "all" to indicate sending to everyone
        setFidsText("all");
        // Show the full response in the Result area
        setResult(JSON.stringify(data, null, 2));
      } else {
        setResult(JSON.stringify(data, null, 2));
      }
    } catch (e) {
      setResult(String(e));
    } finally {
      setFetchingUsers(false);
    }
  }

  async function fetchNotificationHistory() {
    setFetchingHistory(true);
    try {
      const authToken = apiToken.trim();
      if (!authToken) {
        setResult(
          "❌ Admin API token required - please enter your admin API token to perform this action",
        );
        return;
      }

      const userIdentifier = getUserIdentifier();
      if (!userIdentifier) {
        setResult(
          "❌ User identifier not available - please ensure you're properly authenticated",
        );
        return;
      }

      const res = await fetch("/api/admin/notifications/history", {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "X-User-Id": userIdentifier,
        },
      });
      const data = await res.json();
      if (data.history) {
        setHistory(data.history);
        setResult(`✅ Fetched ${data.count} notification history records`);
      } else {
        setResult(JSON.stringify(data, null, 2));
      }
    } catch (e) {
      setResult(String(e));
    } finally {
      setFetchingHistory(false);
    }
  }

  async function callApi() {
    setLoading(true);
    setResult("");
    try {
      const authToken = apiToken.trim();
      if (!authToken) {
        setResult(
          "❌ Admin API token required - please enter your admin API token to perform this action",
        );
        setLoading(false);
        return;
      }

      const userIdentifier = getUserIdentifier();
      if (!userIdentifier) {
        setResult(
          "❌ User identifier not available - please ensure you're properly authenticated",
        );
        setLoading(false);
        return;
      }

      let fids: number[] = [];

      if (fidsText.trim() === "all") {
        // Send to all users with notifications enabled
        fids = [];
      } else {
        // Parse specific FIDs
        fids = fidsText
          .split(/[,\s]+/)
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s) => Number(s))
          .filter((n) => Number.isInteger(n) && n > 0);
      }

      const res = await fetch("/api/admin/notifications/manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          "X-User-Id": userIdentifier,
        },
        body: JSON.stringify({
          title,
          body,
          targetUrl,
          fids,
          dryRun,
        }),
      });
      const json = await res.json();
      setResult(JSON.stringify(json, null, 2));

      // Refresh history after sending a notification
      if (!dryRun) {
        fetchNotificationHistory();
      }
    } catch (e) {
      setResult(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-xl mx-auto w-full p-4 space-y-4">
        <h1 className="text-lg font-semibold">Manual Notifications</h1>

        {/* Admin Authentication Section */}
        <div className="space-y-2 p-3 border rounded-md bg-muted/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Two-Factor Authentication
            </span>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                hasBothAuth
                  ? "bg-green-100 text-green-800"
                  : "bg-orange-100 text-orange-800"
              }`}
            >
              {hasBothAuth
                ? "✅ Fully Authenticated"
                : "⚠️ Partially Authenticated"}
            </span>
          </div>

          {/* Privy Authentication Status */}
          <div className="space-y-2 p-2 bg-green-50 border border-green-200 rounded">
            <div className="flex items-center space-x-2">
              <span className="text-green-600">🔐</span>
              <span className="text-sm font-medium text-green-800">
                Privy Authentication
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                ✅ Active
              </span>
            </div>
            <div className="text-xs text-green-700">
              Authenticated as: {user?.fid || talentId}
            </div>
          </div>

          {/* API Token Input */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">
              Admin API Token (required for admin actions)
            </label>
            <Input
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="Enter your admin API token"
              className="text-sm"
            />
            <div className="text-xs text-muted-foreground">
              {apiToken.trim() ? (
                <span className="text-green-600">✅ API token provided</span>
              ) : (
                <span className="text-orange-600">
                  ⚠️ API token required for admin actions
                </span>
              )}
            </div>
          </div>

          {/* Authentication Summary */}
          <div className="text-xs text-muted-foreground">
            {hasBothAuth ? (
              <span className="text-green-600">
                ✅ Both authentications complete - you can perform admin actions
              </span>
            ) : (
              <span className="text-orange-600">
                ⚠️ Privy authentication complete, but API token required for
                admin actions
              </span>
            )}
          </div>
        </div>

        {/* User Count Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-muted-foreground">
              Users with notifications enabled
            </label>
            <Button
              size="sm"
              variant="ghost"
              onClick={fetchNotificationUsers}
              disabled={fetchingUsers || !hasBothAuth}
            >
              {fetchingUsers ? "Fetching..." : "Fetch Count"}
            </Button>
          </div>
          {userCount !== null && (
            <div className="text-sm font-medium text-green-600">
              ✅ {userCount} users have notifications enabled
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-muted-foreground">Title</label>
            <span
              className={`text-xs ${title.length > 32 ? "text-red-600" : "text-muted-foreground"}`}
            >
              {title.length}/32
            </span>
          </div>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter notification title (max 32 characters)"
            className={
              title.length > 32 ? "border-red-500 focus:border-red-500" : ""
            }
          />
          {title.length > 32 && (
            <p className="text-xs text-red-600">
              ⚠️ Title exceeds 32 character limit
            </p>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-muted-foreground">Body</label>
            <span
              className={`text-xs ${body.length > 128 ? "text-red-600" : "text-muted-foreground"}`}
            >
              {body.length}/128
            </span>
          </div>
          <textarea
            className={`w-full rounded-md border border-input bg-background px-3 py-3 text-sm ${
              body.length > 128 ? "border-red-500 focus:border-red-500" : ""
            }`}
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Enter notification message (max 128 characters)"
          />
          {body.length > 128 && (
            <p className="text-xs text-red-600">
              ⚠️ Body exceeds 128 character limit
            </p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Target URL</label>
          <Input
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="e.g., /leaderboard?perk=screen-studio"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">
            FIDs (comma separated, or type &quot;all&quot; for everyone)
          </label>
          <textarea
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            rows={2}
            value={fidsText}
            onChange={(e) => setFidsText(e.target.value)}
            placeholder="e.g., 8446, 374478 or type 'all' for everyone"
          />
        </div>
        <div className="space-y-2 flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Dry run</label>
          <input
            type="checkbox"
            checked={dryRun}
            onChange={(e) => setDryRun(e.target.checked)}
          />
        </div>
        <div className="space-y-2 flex items-center gap-2">
          <label className="text-sm text-muted-foreground">
            Testing mode (adds FIDs 8446, 6730)
          </label>
          <input
            type="checkbox"
            checked={testingMode}
            onChange={(e) => {
              setTestingMode(e.target.checked);
              if (e.target.checked) {
                setFidsText("8446, 6730");
              } else {
                setFidsText("");
              }
            }}
          />
        </div>
        <div className="flex gap-2">
          <Button
            disabled={
              loading || !hasBothAuth || title.length > 32 || body.length > 128
            }
            onClick={callApi}
          >
            {loading ? "Running..." : dryRun ? "Dry run" : "Send"}
          </Button>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Result</label>
          {result && (
            <>
              {(() => {
                try {
                  const jsonResult = JSON.parse(result);
                  return jsonResult.message ? (
                    <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                      {jsonResult.message}
                    </div>
                  ) : null;
                } catch {
                  return null;
                }
              })()}
              <pre className="text-xs whitespace-pre-wrap bg-muted p-3 rounded-md">
                {result}
              </pre>
            </>
          )}
        </div>

        {/* Notification History Section - Moved to bottom */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-muted-foreground">
              Notification History (Real sends only)
            </label>
            <Button
              size="sm"
              variant="ghost"
              onClick={fetchNotificationHistory}
              disabled={fetchingHistory || !hasBothAuth}
            >
              {fetchingHistory ? "Loading..." : "Refresh History"}
            </Button>
          </div>
          {history.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-blue-600">
                📊 {history.length} notifications sent
              </div>
              {history.some((n) => n.audience_size === -1) && (
                <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
                  ℹ️ Some entries show &quot;All (legacy data)&quot; - these are
                  from before we fixed the counting system. New notifications
                  will show actual numbers.
                </div>
              )}
              <div className="max-h-64 overflow-y-auto border rounded-md p-2">
                <table className="w-full text-xs">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-1">Title</th>
                      <th className="text-left p-1">Audience</th>
                      <th className="text-left p-1">Success</th>
                      <th className="text-left p-1">Failed</th>
                      <th className="text-left p-1">Sent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((notification) => (
                      <tr
                        key={notification.id}
                        className="border-b border-gray-100"
                      >
                        <td
                          className="p-1 max-w-32 truncate"
                          title={notification.title}
                        >
                          {notification.title}
                        </td>
                        <td className="p-1">
                          {notification.audience_size === -1
                            ? "All (legacy data)"
                            : notification.audience_size}
                        </td>
                        <td className="p-1 text-green-600">
                          {notification.success_count === -1
                            ? "All (legacy data)"
                            : notification.success_count}
                        </td>
                        <td className="p-1 text-red-600">
                          {notification.failed_count}
                        </td>
                        <td className="p-1 text-gray-500">
                          {new Date(notification.sent_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminNotificationsPage;
