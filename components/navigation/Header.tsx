"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUserNavigation } from "@/hooks/useUserNavigation";
import { FarcasterAccessModal } from "@/components/navigation/FarcasterAccessModal";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { navItems, modalOpen, modalFeature, setModalOpen } =
    useUserNavigation();

  // Debug logging
  React.useEffect(() => {
    console.log("[Header] Render info:", {
      navItemsCount: navItems.length,
      pathname,
      navItems: navItems.map((item) => ({
        label: item.label,
        hasHref: !!item.href,
        hasOnClick: !!item.onClick,
        href: item.href,
      })),
    });
  }, [navItems, pathname]);

  const handleTitleClick = () => {
    router.push("/");
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-white backdrop-blur supports-[backdrop-filter]:bg-white">
        <div className="flex h-14 w-full items-center justify-between px-4 md:px-8 relative">
          <h1
            className="text-lg font-semibold cursor-pointer hover:opacity-70 transition-opacity"
            onClick={handleTitleClick}
          >
            Creator Score
          </h1>
          {/* Desktop nav icons, centered */}
          <nav className="hidden md:flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
            {navItems.length > 0 ? (
              navItems.map((item, index) => {
                const isActive = pathname === item.href;
                console.log(`[Header] Rendering nav item ${index}:`, {
                  label: item.label,
                  hasIcon: !!item.icon,
                  hasOnClick: !!item.onClick,
                  hasHref: !!item.href,
                  isActive,
                });

                if (item.onClick) {
                  return (
                    <button
                      key={item.label}
                      onClick={item.onClick}
                      className="flex items-center justify-center h-10 w-12 rounded-full transition-colors text-muted-foreground hover:bg-muted/50"
                      aria-label={item.label}
                      title={item.label} // Added for debugging
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
                      className={
                        "flex items-center justify-center h-10 w-12 rounded-full transition-colors " +
                        (isActive
                          ? "bg-muted text-primary"
                          : "text-muted-foreground hover:bg-muted/50")
                      }
                      aria-label={item.label}
                      aria-current={isActive ? "page" : undefined}
                      title={item.label} // Added for debugging
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
              <div className="text-xs text-red-500">No nav items</div>
            )}
          </nav>
        </div>
      </header>
      <FarcasterAccessModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        feature={modalFeature}
      />
    </>
  );
}
