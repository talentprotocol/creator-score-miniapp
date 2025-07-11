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
          {/* Desktop nav - positioned within header for normal flow */}
          <div className="hidden md:flex items-center gap-2">
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
                      width: "40px",
                      height: "40px",
                      backgroundColor: "red",
                      color: "white",
                      border: "2px solid black",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "50%",
                    }}
                    title={item.label}
                  >
                    {item.icon ? (
                      <item.icon
                        style={{
                          width: "24px",
                          height: "24px",
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
                      width: "40px",
                      height: "40px",
                      backgroundColor:
                        pathname === item.href ? "blue" : "green",
                      color: "white",
                      border: "2px solid black",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "50%",
                    }}
                    title={item.label}
                  >
                    {item.icon ? (
                      <item.icon
                        style={{
                          width: "24px",
                          height: "24px",
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

      {/* Additional test navigation - positioned outside header */}
      <div
        style={{
          position: "fixed",
          top: "70px",
          right: "20px",
          display: "flex",
          gap: "10px",
          zIndex: 9999,
          backgroundColor: "yellow",
          padding: "15px",
          border: "3px solid red",
          borderRadius: "10px",
        }}
        className="hidden md:block"
      >
        <div
          style={{ color: "black", fontWeight: "bold", marginRight: "10px" }}
        >
          TEST NAV:
        </div>
        {navItems.map((item, index) => {
          if (item.onClick) {
            return (
              <button
                key={index}
                onClick={item.onClick}
                style={{
                  width: "50px",
                  height: "50px",
                  backgroundColor: "purple",
                  color: "white",
                  border: "2px solid black",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
                title={item.label}
              >
                {item.label[0]}
              </button>
            );
          }

          if (item.href) {
            return (
              <Link
                key={index}
                href={item.href}
                style={{
                  width: "50px",
                  height: "50px",
                  backgroundColor:
                    pathname === item.href ? "darkblue" : "purple",
                  color: "white",
                  border: "2px solid black",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  fontWeight: "bold",
                  cursor: "pointer",
                  textDecoration: "none",
                }}
                title={item.label}
              >
                {item.label[0]}
              </Link>
            );
          }

          return null;
        })}
      </div>

      <FarcasterAccessModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        feature={modalFeature}
      />
    </>
  );
}
