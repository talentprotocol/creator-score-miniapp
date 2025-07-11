"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { useUserNavigation } from "@/hooks/useUserNavigation";

export function BottomNav() {
  const pathname = usePathname();
  const { navItems } = useUserNavigation();

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
    </>
  );
}
