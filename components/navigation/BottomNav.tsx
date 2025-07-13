"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { useUserNavigation } from "@/hooks/useUserNavigation";
import { FarcasterAccessModal } from "@/components/modals/FarcasterAccessModal";

export function BottomNav() {
  const [mounted, setMounted] = React.useState(false);
  const pathname = usePathname();
  const { navItems, user } = useUserNavigation();
  const [showModal, setShowModal] = React.useState(false);
  const [modalFeature, setModalFeature] = React.useState<"Profile">("Profile");

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleNavClick = (item: (typeof navItems)[0], e: React.MouseEvent) => {
    // If user tries to access Profile without user context, show modal
    if (!user && item.label === "Profile") {
      e.preventDefault();
      setModalFeature("Profile");
      setShowModal(true);
      return;
    }
    // Otherwise, navigate normally (Link component handles it)
  };

  // Prevent hydration mismatch by not rendering pathname-dependent content until mounted
  if (!mounted) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 pb-safe">
        <div className="grid grid-cols-3 gap-1">
          {navItems.map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center justify-center py-2 px-4 min-h-[60px]"
            >
              <item.icon className="w-5 h-5 text-gray-400" />
              <span className="text-xs mt-1 text-gray-400">{item.label}</span>
            </div>
          ))}
        </div>
      </nav>
    );
  }

  return (
    <>
      {/* Mobile: bottom fixed full width */}
      <Card className="fixed bottom-0 left-0 right-0 w-full p-0 bg-white backdrop-blur supports-[backdrop-filter]:bg-white rounded-none shadow-lg border-t z-50 md:hidden">
        <nav
          className="flex items-center justify-around"
          style={{
            height: "88px", // Fixed height - cannot be compressed
            paddingTop: "12px",
            paddingBottom:
              "max(20px, calc(env(safe-area-inset-bottom) + 12px))",
          }}
        >
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            if (item.disabled) {
              return (
                <span
                  key={item.label}
                  className={cn(
                    "flex items-center justify-center h-14 px-4 flex-1 text-muted-foreground opacity-50 cursor-not-allowed",
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
                    "flex items-center justify-center h-14 px-4 flex-1 transition-colors",
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
