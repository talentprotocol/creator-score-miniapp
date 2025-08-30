"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminSnapshotPage() {
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const canCreateSnapshot = apiKey.trim().length > 0;

  const handleCreateSnapshot = async () => {
    if (!canCreateSnapshot) return;

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/snapshot/trigger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({
          type: "success",
          text: `Snapshot created successfully! ${data.entriesCount} entries captured.`,
        });
      } else {
        setMessage({
          type: "error",
          text: data.error || data.message || "Failed to create snapshot",
        });
      }
    } catch {
      setMessage({
        type: "error",
        text: "Network error. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Admin Snapshot Creation</CardTitle>
          <CardDescription>
            Create a leaderboard snapshot for the rewards distribution deadline
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* API Key Input */}
          <div className="space-y-2">
            <label htmlFor="api-key" className="text-sm font-medium">
              Admin API Key
            </label>
            <Input
              id="api-key"
              type="password"
              placeholder="Enter SNAPSHOT_ADMIN_API_KEY"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="font-mono"
            />
          </div>

          {/* Create Button */}
          <Button
            onClick={handleCreateSnapshot}
            disabled={!canCreateSnapshot || loading}
            className="w-full"
          >
            {loading ? "Creating Snapshot..." : "Create Snapshot"}
          </Button>

          {/* Feedback Message */}
          {message && (
            <div
              className={`p-4 border rounded-lg ${
                message.type === "success"
                  ? "border-green-200 bg-green-50 text-green-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Instructions */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              • API key must match SNAPSHOT_ADMIN_API_KEY environment variable
            </p>
            <p>• Only one snapshot can exist at a time</p>
            <p>
              • Snapshot contains top 200 leaderboard entries with rank and
              rewards
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
