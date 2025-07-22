"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  checkFarcasterNotificationState,
  triggerFarcasterNotificationModal,
} from "@/lib/farcaster-notifications";
import { useState, useEffect } from "react";

export default function TestFramePage() {
  const [notificationState, setNotificationState] = useState({
    isEnabled: false,
    isSupported: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFrameInstalling, setIsFrameInstalling] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [permissionText, setPermissionText] = useState("Loading...");

  useEffect(() => {
    setIsClient(true);
    const state = checkFarcasterNotificationState();
    setNotificationState(state);

    // Set permission text after client-side hydration
    if (typeof Notification !== "undefined") {
      setPermissionText(Notification.permission);
    } else {
      setPermissionText("Not available");
    }
  }, []);

  const handleNotifications = async () => {
    setIsLoading(true);
    try {
      const success = await triggerFarcasterNotificationModal();
      if (success) {
        console.log("Notification modal triggered successfully");
        // Re-check state after a short delay
        setTimeout(() => {
          const newState = checkFarcasterNotificationState();
          setNotificationState(newState);
          if (typeof Notification !== "undefined") {
            setPermissionText(Notification.permission);
          }
        }, 1000);
      } else {
        console.error("Failed to trigger notification modal");
      }
    } catch (error) {
      console.error("Error enabling notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFrameInstallation = async () => {
    setIsFrameInstalling(true);
    try {
      // Trigger frame installation modal using postMessage
      window.parent.postMessage(
        {
          type: "addFrame",
          frameUrl:
            process.env.NEXT_PUBLIC_URL || "https://www.creatorscore.app",
        },
        "*",
      );
      console.log("Frame installation modal triggered");
    } catch (error) {
      console.error("Error triggering frame installation modal:", error);
    } finally {
      setIsFrameInstalling(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto w-full p-4 space-y-4">
      <Card className="p-6 space-y-4">
        <h1 className="text-xl font-bold">Frame Installation Test</h1>
        <p className="text-sm text-muted-foreground">
          This page tests the Farcaster frame installation according to official
          docs.
        </p>

        <div className="space-y-2">
          <h2 className="font-semibold">What should happen:</h2>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>
              • Frame installation modal should appear automatically on first
              visit
            </li>
            <li>
              • No manual triggering needed - it&apos;s handled by Farcaster
              client
            </li>
            <li>
              • Frame metadata is properly configured in
              /.well-known/farcaster.json
            </li>
          </ul>
        </div>

        {isClient && (
          <div className="space-y-2">
            <h2 className="font-semibold">Current Notification State:</h2>
            <div className="text-sm space-y-1">
              <p>
                Supported:{" "}
                <span
                  className={
                    notificationState.isSupported
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {notificationState.isSupported ? "Yes" : "No"}
                </span>
              </p>
              <p>
                Enabled:{" "}
                <span
                  className={
                    notificationState.isEnabled
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {notificationState.isEnabled ? "Yes" : "No"}
                </span>
              </p>
              <p>
                Permission:{" "}
                <span className="text-blue-600">{permissionText}</span>
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h2 className="font-semibold">Test Actions:</h2>

          <div className="space-y-2">
            <Button
              onClick={handleFrameInstallation}
              variant="ghost"
              size="sm"
              disabled={isFrameInstalling}
              className="w-full justify-start"
            >
              {isFrameInstalling
                ? "Triggering..."
                : "🔧 Force Trigger Frame Installation"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Manually trigger the &quot;add mini app&quot; modal (should happen
              automatically on first visit)
            </p>
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleNotifications}
              variant="ghost"
              size="sm"
              disabled={isLoading || !notificationState.isSupported}
              className="w-full justify-start"
            >
              {isLoading ? "Triggering..." : "🔔 Enable Notifications"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Trigger the notification permission modal
            </p>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>Check the console for any errors or frame installation logs.</p>
          <p>
            Go to Settings → Test Frame to access this page from within
            Farcaster.
          </p>
        </div>
      </Card>
    </div>
  );
}
