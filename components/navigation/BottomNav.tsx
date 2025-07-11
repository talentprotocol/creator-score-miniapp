"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { useUserNavigation } from "@/hooks/useUserNavigation";
import { FarcasterAccessModal } from "@/components/navigation/FarcasterAccessModal";
import React from "react";

export function BottomNav() {
  const pathname = usePathname();
  const { navItems, modalOpen, modalFeature, setModalOpen } =
    useUserNavigation();

  // Debug logging
  React.useEffect(() => {
    console.log("[BottomNav] Render info:", {
      navItemsCount: navItems.length,
      pathname,
    });
  }, [navItems, pathname]);

  return (
    <>
      {/* Mobile: bottom fixed full width */}
      <Card
        className="fixed bottom-0 left-0 right-0 w-full p-0 bg-white backdrop-blur supports-[backdrop-filter]:bg-white rounded-none shadow-lg border-t z-50 md:hidden"
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <nav className="flex items-center justify-around">
          {navItems.length > 0 ? (
            navItems.map((item, index) => {
              const isActive = pathname === item.href;
              console.log(`[BottomNav] Rendering nav item ${index}:`, {
                label: item.label,
                hasIcon: !!item.icon,
                hasOnClick: !!item.onClick,
                hasHref: !!item.href,
              });

              if (item.onClick) {
                return (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className={cn(
                      "flex items-center justify-center py-6 px-4 flex-1 transition-colors min-h-[60px]",
                      "hover:bg-muted/50 text-muted-foreground",
                    )}
                    aria-label={item.label}
                    title={item.label}
                  >
                    {item.icon ? (
                      <item.icon className="h-6 w-6" />
                    ) : (
                      <span className="text-xs">{item.label[0]}</span>
                    )}
                  </button>
                );
              }

              if (item.href) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-center py-6 px-4 flex-1 transition-colors min-h-[60px]",
                      "hover:bg-muted/50",
                      isActive ? "text-primary" : "text-muted-foreground",
                    )}
                    aria-label={item.label}
                    aria-current={isActive ? "page" : undefined}
                    title={item.label}
                  >
                    {item.icon ? (
                      <item.icon className="h-6 w-6" />
                    ) : (
                      <span className="text-xs">{item.label[0]}</span>
                    )}
                  </Link>
                );
              }

              return null;
            })
          ) : (
            <div className="text-xs text-red-500 p-4">No nav items</div>
          )}
        </nav>
      </Card>
      {/* Desktop: nothing rendered here, handled in Header */}
      <FarcasterAccessModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        feature={modalFeature}
      />
    </>
  );
}
