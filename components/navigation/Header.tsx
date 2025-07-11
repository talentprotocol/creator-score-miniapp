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
          {/* Simple test navigation - visible on all screens */}
          <div
            style={{
              position: "absolute",
              top: "50px",
              right: "10px",
              display: "flex",
              gap: "10px",
              zIndex: 9999,
              backgroundColor: "yellow",
              padding: "10px",
              border: "3px solid red",
            }}
          >
            {navItems.map((item, index) => {
              console.log(`[Header] Rendering nav item ${index}:`, {
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
                    style={{
                      width: "50px",
                      height: "50px",
                      backgroundColor: "red",
                      color: "white",
                      border: "2px solid black",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    title={item.label}
                  >
                    {item.icon ? (
                      <item.icon
                        style={{
                          width: "30px",
                          height: "30px",
                          color: "white",
                          stroke: "white",
                          fill: "white",
                        }}
                      />
                    ) : (
                      <span style={{ color: "white", fontWeight: "bold" }}>
                        {item.label[0]}
                      </span>
                    )}
                  </button>
                );
              }

              if (item.href) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      width: "50px",
                      height: "50px",
                      backgroundColor:
                        pathname === item.href ? "blue" : "green",
                      color: "white",
                      border: "2px solid black",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    title={item.label}
                  >
                    {item.icon ? (
                      <item.icon
                        style={{
                          width: "30px",
                          height: "30px",
                          color: "white",
                          stroke: "white",
                          fill: "white",
                        }}
                      />
                    ) : (
                      <span style={{ color: "white", fontWeight: "bold" }}>
                        {item.label[0]}
                      </span>
                    )}
                  </Link>
                );
              }

              return null;
            })}
          </div>
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
