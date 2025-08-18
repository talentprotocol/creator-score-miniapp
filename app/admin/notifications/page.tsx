"use client";

import React, { useEffect, useState } from "react";
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
  const [token, setToken] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [body, setBody] = useState<string>("");
  const [targetUrl, setTargetUrl] = useState<string>("");
  const [fidsText, setFidsText] = useState<string>("");
  const [dryRun, setDryRun] = useState<boolean>(true);
  const [testingMode, setTestingMode] = useState<boolean>(true);
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [fetchingUsers, setFetchingUsers] = useState<boolean>(false);
  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [fetchingHistory, setFetchingHistory] = useState<boolean>(false);

  // Check if user is authenticated via either Farcaster or Privy
  const isAuthenticated = user || talentId;

  useEffect(() => {
    const saved = sessionStorage.getItem("admin_api_token");
    if (saved) setToken(saved);
  }, []);

  function persistToken(val: string) {
    setToken(val);
    sessionStorage.setItem("admin_api_token", val);
  }

  async function fetchNotificationUsers() {
    setFetchingUsers(true);
    try {
      const res = await fetch("/api/admin/notifications/users", {
        headers: { Authorization: `Bearer ${token}` },
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
      const res = await fetch("/api/admin/notifications/history", {
        headers: { Authorization: `Bearer ${token}` },
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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          body,
          targetUrl,
          fids,
          dryRun,
          testingMode,
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

        {/* Admin Status Section */}
        <div className="space-y-2 p-3 border rounded-md bg-muted/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Admin Access</span>
            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
              ✅ Active
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            {isAuthenticated ? (
              <>
                Authenticated as FID: {user?.fid || talentId}
                <br />
                <span className="text-orange-600">
                  ⚠️ Using token-based auth (legacy mode)
                </span>
              </>
            ) : (
              <>
                <span className="text-orange-600">
                  ⚠️ No Farcaster context - using token-based auth
                </span>
              </>
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
              disabled={fetchingUsers}
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
          <label className="text-sm text-muted-foreground">Admin Token</label>
          <Input
            type="password"
            placeholder="Paste ADMIN_API_TOKEN"
            value={token}
            onChange={(e) => persistToken(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Title (≤ 32)</label>
          <Input 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="Enter notification title (max 32 characters)"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Body (≤ 128)</label>
          <textarea
            className="w-full rounded-md border border-input bg-background px-3 py-3 text-sm"
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Enter notification message (max 128 characters)"
          />
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
            Testing mode (restrict to FID 8446)
          </label>
          <input
            type="checkbox"
            checked={testingMode}
            onChange={(e) => setTestingMode(e.target.checked)}
          />
        </div>
        <div className="flex gap-2">
          <Button disabled={loading} onClick={callApi}>
            {loading ? "Running..." : dryRun ? "Dry run" : "Send"}
          </Button>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Result</label>
          <pre className="text-xs whitespace-pre-wrap bg-muted p-3 rounded-md">
            {result}
          </pre>
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
              disabled={fetchingHistory}
            >
              {fetchingHistory ? "Loading..." : "Refresh History"}
            </Button>
          </div>
          {history.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-blue-600">
                📊 {history.length} notifications sent
              </div>
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
                      <tr key={notification.id} className="border-b border-gray-100">
                        <td className="p-1 max-w-32 truncate" title={notification.title}>
                          {notification.title}
                        </td>
                        <td className="p-1">{notification.audience_size}</td>
                        <td className="p-1 text-green-600">{notification.success_count}</td>
                        <td className="p-1 text-red-600">{notification.failed_count}</td>
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
