"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { useUserNavigation } from "@/hooks/useUserNavigation";
import { FarcasterAccessModal } from "@/components/navigation/FarcasterAccessModal";

export function BottomNav() {
  const pathname = usePathname();
  const { navItems, modalOpen, modalFeature, setModalOpen } =
    useUserNavigation();

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
          {navItems.map((item) => {
            const isActive = pathname === item.href;

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
                >
                  <item.icon className="h-6 w-6" />
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
        open={modalOpen}
        onOpenChange={setModalOpen}
        feature={modalFeature}
      />
    </>
  );
}
