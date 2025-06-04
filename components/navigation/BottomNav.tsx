"use client";

import { User, Trophy, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/profile",
      icon: User,
      label: "Profile",
    },
    {
      href: "/leaderboard",
      icon: Trophy,
      label: "Leaderboard",
    },
    {
      href: "/settings",
      icon: Settings,
      label: "Settings",
    },
  ];

  return (
    <>
      {/* Mobile: bottom fixed full width */}
      <Card className="fixed bottom-0 left-0 right-0 w-full p-0 bg-white backdrop-blur supports-[backdrop-filter]:bg-white rounded-none shadow-lg border-t z-50 md:hidden">
        <nav className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
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
          })}
        </nav>
      </Card>
      {/* Desktop: nothing rendered here, handled in Header */}
    </>
  );
}
