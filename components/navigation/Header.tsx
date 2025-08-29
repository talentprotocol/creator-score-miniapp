"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { useUserNavigation } from "@/hooks/useUserNavigation";
import { useBackButton } from "@/hooks/useBackButton";
import { FarcasterAccessModal } from "@/components/modals/FarcasterAccessModal";
import { usePrivyAuth } from "@/hooks/usePrivyAuth";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { navItems, settingsItem, talentUuid } = useUserNavigation();
  const { shouldShowBackButton, handleBack } = useBackButton();
  const [showModal, setShowModal] = React.useState(false);
  const [clickedIcon, setClickedIcon] = React.useState<string | null>(null);
  const [redirectPath, setRedirectPath] = React.useState<string>("/profile");
  const { talentId } = usePrivyAuth({});

  const handleTitleClick = () => {
    router.push("/leaderboard");
  };

  const handleNavClick = (
    item: (typeof navItems)[0] | typeof settingsItem,
    e: React.MouseEvent,
  ) => {
    setClickedIcon(item.href);
    // If user tries to access Profile, Settings, or Badges without user context or talentId, show modal
    if (
      !talentUuid &&
      !talentId &&
      (item.label === "Profile" ||
        item.label === "Settings" ||
        item.label === "Badges")
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

  return (
    <>
      <header className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="w-full flex items-center h-14">
          {/* Left: Back button or title */}
          <div className="flex-1 flex items-center md:justify-end">
            <div className="px-4 md:max-w-xl md:w-full md:mx-auto">
              {shouldShowBackButton ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center justify-center h-10 w-10 -ml-2 group transition-colors"
                  aria-label="Go back"
                >
                  <Icon
                    icon={ChevronLeft}
                    size="lg"
                    className="transition-colors group-hover:text-foreground"
                  />
                </button>
              ) : (
                <button
                  onClick={handleTitleClick}
                  className="h-9 w-24 cursor-pointer relative"
                  aria-label="Go to home"
                >
                  <Image
                    src="/cs-logo-header.svg"
                    alt="Creator Score"
                    priority
                    fetchPriority="high"
                    fill
                    className="object-contain"
                  />
                </button>
              )}
            </div>
          </div>

          {/* Center: Desktop nav */}

          <nav
            className="flex items-center gap-2 justify-center flex-1"
            style={{ display: "none" }}
          >
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
                    className="flex items-center justify-center h-10 w-12"
                    aria-label={item.label}
                  >
                    <Icon icon={item.icon} size="lg" disabled />
                  </span>
                );
              }

              if (item.href) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={(e) => handleNavClick(item, e)}
                    className="flex items-center justify-center h-10 w-12 group transition-colors"
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
                  </Link>
                );
              }
              return null;
            })}
          </nav>

          <style jsx>{`
            @media (min-width: 768px) {
              nav {
                display: flex !important;
              }
            }
          `}</style>

          {/* Right: Settings */}
          <div className="flex-1 flex items-center justify-end">
            <div className="px-4 md:max-w-xl md:w-full md:mx-auto md:flex md:justify-end">
              <Link
                href={settingsItem.href}
                onClick={(e) => handleNavClick(settingsItem, e)}
                className="flex items-center justify-center h-10 w-10 -mr-2 group transition-colors"
                aria-label={settingsItem.label}
                aria-current={
                  pathname === settingsItem.href ? "page" : undefined
                }
              >
                <Icon
                  icon={settingsItem.icon}
                  size="lg"
                  isActive={
                    pathname === settingsItem.href ||
                    clickedIcon === settingsItem.href
                  }
                  color={pathname === settingsItem.href ? "primary" : "muted"}
                  className="transition-colors group-hover:text-foreground"
                />
              </Link>
            </div>
          </div>
        </div>
      </header>

      <FarcasterAccessModal
        open={showModal}
        onOpenChange={setShowModal}
        redirectPath={redirectPath}
      />
    </>
  );
}
