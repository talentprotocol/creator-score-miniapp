import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { BadgeItem } from "@/lib/badge-data";
import { Icon } from "@/components/ui/icon";

interface BadgeModalProps {
  badge: BadgeItem | null;
  onClose: () => void;
}

export function BadgeModal({ badge, onClose }: BadgeModalProps) {
  const [isDesktop, setIsDesktop] = useState(false);

  // Check if it's desktop on mount and resize
  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 640);
    };

    // Check on mount
    checkIsDesktop();

    // Add resize listener
    window.addEventListener("resize", checkIsDesktop);

    // Cleanup
    return () => window.removeEventListener("resize", checkIsDesktop);
  }, []);

  if (!badge) return null;

  const ModalContent = () => (
    <div className="space-y-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div
          className={`p-3 rounded-full ${
            badge.completed ? "bg-green-100" : "bg-muted"
          }`}
        >
          <Icon
            icon={badge.icon}
            size="md"
            color={badge.completed ? "brand" : "muted"}
            className={badge.completed ? "fill-current" : ""}
          />
        </div>
        <div>
          <h3 className="font-semibold">{badge.name}</h3>
          <p className="text-sm text-muted-foreground">
            {badge.completed ? "Completed" : "In Progress"}
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-600">{badge.description}</p>

      <div className="flex justify-center">
        <Button
          onClick={onClose}
          styling={badge.completed ? "default" : "ghost"}
        >
          {badge.completed ? "Share" : "Take Action"}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Modal */}
      {isDesktop && (
        <Dialog open={!!badge} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Badge Details</DialogTitle>
            </DialogHeader>
            <ModalContent />
          </DialogContent>
        </Dialog>
      )}

      {/* Mobile Bottom Sheet */}
      {!isDesktop && (
        <Drawer open={!!badge} onOpenChange={onClose}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Badge Details</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4">
              <ModalContent />
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}
