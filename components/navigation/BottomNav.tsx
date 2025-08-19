"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { useUserNavigation } from "@/hooks/useUserNavigation";
import { FarcasterAccessModal } from "@/components/modals/FarcasterAccessModal";
import { usePrivyAuth } from "@/hooks/usePrivyAuth";

export function BottomNav() {
  const [mounted, setMounted] = React.useState(false);
  const pathname = usePathname();
  const { navItems, talentUuid } = useUserNavigation();
  const [showModal, setShowModal] = React.useState(false);
  const [clickedIcon, setClickedIcon] = React.useState<string | null>(null);
  const [redirectPath, setRedirectPath] = React.useState<string>("/profile");
  const { talentId } = usePrivyAuth({});

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleNavClick = (item: (typeof navItems)[0], e: React.MouseEvent) => {
    setClickedIcon(item.href);

    // If user tries to access Profile or Badges without user context, show modal
    if (
      !talentUuid &&
      !talentId &&
      (item.label === "Profile" || item.label === "Badges")
    ) {
      e.preventDefault();
      setRedirectPath(item.href);
      setShowModal(true);
      return;
    }
    // Otherwise, navigate normally (Link component handles it)
  };

  // Reset clicked state after navigation
  React.useEffect(() => {
    setClickedIcon(null);
  }, [pathname]);

  // Prevent hydration mismatch by not rendering pathname-dependent content until mounted
  if (!mounted) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t pb-safe md:hidden">
        <div className="max-w-xl mx-auto flex items-center justify-around h-[88px]">
          {navItems.map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center justify-center h-[64px] w-[68px]"
            >
              <Icon icon={item.icon} size="lg" />
              <span className="text-xs mt-1 text-muted-foreground">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </nav>
    );
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t pb-safe md:hidden">
        <div className="max-w-xl mx-auto flex items-center justify-around h-[88px]">
          {navItems.map((item) => {
            const current = pathname || "";
            const isActive =
              item.href === "/"
                ? current === item.href
                : current.startsWith(item.href) ||
                  (item.alternateHrefs?.some((href) =>
                    current.startsWith(href),
                  ) ??
                    false);

            const isClicked = clickedIcon === item.href;

            if (item.disabled) {
              return (
                <span
                  key={item.label}
                  className="flex flex-col items-center justify-center h-[64px] w-[68px]"
                  aria-label={item.label}
                >
                  <Icon icon={item.icon} size="lg" disabled />
                  <span className="text-xs mt-1 text-muted-foreground">
                    {item.label}
                  </span>
                </span>
              );
            }

            if (item.href) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleNavClick(item, e)}
                  className="flex flex-col items-center justify-center h-[64px] w-[68px] group transition-colors"
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon
                    icon={item.icon}
                    size="lg"
                    isActive={isActive || isClicked}
                    color={isActive ? "primary" : "muted"}
                    className="transition-colors group-hover:text-foreground"
                  />
                  <span
                    className={`text-xs mt-1 transition-colors ${
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            }
            return null;
          })}
        </div>
      </nav>

      <FarcasterAccessModal
        open={showModal}
        onOpenChange={setShowModal}
        redirectPath={redirectPath}
      />
    </>
  );
}
