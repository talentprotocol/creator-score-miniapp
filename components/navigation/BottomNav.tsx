"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { useUserNavigation } from "@/hooks/useUserNavigation";
import { FarcasterAccessModal } from "@/components/modals/FarcasterAccessModal";

export function BottomNav() {
  const pathname = usePathname();
  const { navItems, user } = useUserNavigation();
  const [showModal, setShowModal] = React.useState(false);
  const [modalFeature, setModalFeature] = React.useState<
    "Profile" | "Settings"
  >("Profile");

  const handleNavClick = (item: (typeof navItems)[0], e: React.MouseEvent) => {
    // If user tries to access Profile or Settings without user context, show modal
    if (!user && (item.label === "Profile" || item.label === "Settings")) {
      e.preventDefault();
      setModalFeature(item.label as "Profile" | "Settings");
      setShowModal(true);
      return;
    }
    // Otherwise, navigate normally (Link component handles it)
  };

  return (
    <>
      {/* Mobile: bottom fixed full width */}
      <Card className="fixed bottom-0 left-0 right-0 w-full p-0 bg-white backdrop-blur supports-[backdrop-filter]:bg-white rounded-none shadow-lg border-t z-50 md:hidden">
        <nav className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            if (item.disabled) {
              return (
                <span
                  key={item.label}
                  className={cn(
                    "flex items-center justify-center p-4 flex-1 text-muted-foreground opacity-50 cursor-not-allowed",
                  )}
                  aria-label={item.label}
                >
                  <item.icon className="h-6 w-6" />
                </span>
              );
            }
            if (item.href) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleNavClick(item, e)}
                  className={cn(
                    "flex items-center justify-center p-4 flex-1 transition-colors",
                    "hover:bg-muted/50",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                >
                  <item.icon className="h-6 w-6" />
                </Link>
              );
            }
            return null;
          })}
        </nav>
      </Card>
      {/* Desktop: nothing rendered here, handled in Header */}
      <FarcasterAccessModal
        open={showModal}
        onOpenChange={setShowModal}
        feature={modalFeature}
      />
    </>
  );
}
