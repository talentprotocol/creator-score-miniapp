import * as React from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { sdk } from "@farcaster/frame-sdk";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Lock, X } from "lucide-react";

// FrameGateDrawer: bottom sheet for Farcaster gate
function FrameGateDrawer({
  open,
  onClose,
  onAddFrame,
}: {
  open: boolean;
  onClose: () => void;
  onAddFrame: () => void;
}) {
  return (
    <Drawer open={open} onOpenChange={onClose}>
      <DrawerContent className="max-w-md mx-auto w-full p-6 rounded-t-2xl relative">
        <button
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted focus:outline-none"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-center">
          Creator Score Mini App
        </h2>
        <p className="text-muted-foreground text-sm text-center mb-4">
          To use Creator Score, you need to add the mini app on Farcaster and
          enable notifications.
        </p>
        <Button onClick={onAddFrame} className="w-full">
          Add to Farcaster
        </Button>
      </DrawerContent>
    </Drawer>
  );
}

export function FarcasterGate() {
  const { context } = useMiniKit();
  // Detect if we're inside Farcaster (context?.user exists)
  const isInFarcaster = !!context?.user;
  const [isFrameAdded, setIsFrameAdded] = React.useState(false);
  const [hasNotifications, setHasNotifications] = React.useState(false);
  const [showFrameGate, setShowFrameGate] = React.useState(false);
  // For debugging: force open the drawer
  const [forceOpen, setForceOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isInFarcaster) return;

    // Listen to frame events
    const handleFrameAdded = () => {
      setIsFrameAdded(true);
      setHasNotifications(true);
      setShowFrameGate(false);
    };
    const handleFrameRemoved = () => {
      setIsFrameAdded(false);
      setHasNotifications(false);
      setShowFrameGate(true);
    };
    const handleNotificationsEnabled = () => {
      setHasNotifications(true);
      setShowFrameGate(false);
    };
    const handleNotificationsDisabled = () => {
      setHasNotifications(false);
      setShowFrameGate(true);
    };
    sdk.on("frameAdded", handleFrameAdded);
    sdk.on("frameRemoved", handleFrameRemoved);
    sdk.on("notificationsEnabled", handleNotificationsEnabled);
    sdk.on("notificationsDisabled", handleNotificationsDisabled);

    // On mount, show the gate if not added/enabled (conservative default)
    setShowFrameGate(!(isFrameAdded && hasNotifications));

    return () => {
      sdk.removeAllListeners();
    };
  }, [isInFarcaster, hasNotifications, isFrameAdded]);

  // Only show the gate if in Farcaster and not added/enabled, or if forced open for debug
  const shouldShowFrameGate = (isInFarcaster && showFrameGate) || forceOpen;

  return (
    <>
      {/* Debug button to force open the drawer (remove in prod) */}
      <button
        style={{ position: "fixed", bottom: 16, right: 16, zIndex: 10000 }}
        onClick={() => setForceOpen(true)}
      >
        Test Farcaster Gate
      </button>
      {shouldShowFrameGate && (
        <FrameGateDrawer
          open={true}
          onClose={() => {
            setShowFrameGate(false);
            setForceOpen(false);
          }}
          onAddFrame={async () => {
            try {
              const result = await sdk.actions.addFrame();
              setIsFrameAdded(!!result.notificationDetails);
              setHasNotifications(!!result.notificationDetails);
              if (result.notificationDetails) {
                setShowFrameGate(false);
                setForceOpen(false);
              }
            } catch {
              setIsFrameAdded(false);
              setHasNotifications(false);
              setShowFrameGate(true); // fallback: keep open if error
            }
          }}
        />
      )}
    </>
  );
}
