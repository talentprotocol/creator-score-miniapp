"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Using native textarea to avoid adding new UI primitives

const AdminNotificationsPage: React.FC = () => {
  const [token, setToken] = useState<string>("");
  const [title, setTitle] = useState<string>("Eligible: Free Screen Studio");
  const [body, setBody] = useState<string>(
    "Creators with Score 80+ can enter a draw to win a Screen Studio monthly subscription. Open to enter.",
  );
  const [targetUrl, setTargetUrl] = useState<string>(
    "/leaderboard?perk=screen-studio",
  );
         const [fidsText, setFidsText] = useState<string>("8446");
       const [dryRun, setDryRun] = useState<boolean>(true);
  const [testingMode, setTestingMode] = useState<boolean>(true);
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [fetchingUsers, setFetchingUsers] = useState<boolean>(false);

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
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Body (≤ 128)</label>
          <textarea
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Target URL</label>
          <Input
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
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
            placeholder="8446 or all"
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
      </div>
    </div>
  );
};

export default AdminNotificationsPage;
