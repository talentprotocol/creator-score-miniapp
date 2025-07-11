"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
      {/* Simple test navigation - visible on all screens */}
      <div
        style={{
          position: "fixed",
          bottom: "10px",
          left: "10px",
          display: "flex",
          gap: "10px",
          zIndex: 9999,
          backgroundColor: "yellow",
          padding: "10px",
          border: "3px solid blue",
        }}
      >
        {navItems.map((item, index) => {
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
                style={{
                  width: "60px",
                  height: "60px",
                  backgroundColor: "red",
                  color: "white",
                  border: "2px solid black",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  fontSize: "10px",
                }}
                title={item.label}
              >
                {item.icon ? (
                  <item.icon
                    style={{
                      width: "20px",
                      height: "20px",
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
                <span
                  style={{ color: "white", fontSize: "8px", marginTop: "2px" }}
                >
                  {item.label}
                </span>
              </button>
            );
          }

          if (item.href) {
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  width: "60px",
                  height: "60px",
                  backgroundColor: pathname === item.href ? "blue" : "green",
                  color: "white",
                  border: "2px solid black",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  fontSize: "10px",
                }}
                title={item.label}
              >
                {item.icon ? (
                  <item.icon
                    style={{
                      width: "20px",
                      height: "20px",
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
                <span
                  style={{ color: "white", fontSize: "8px", marginTop: "2px" }}
                >
                  {item.label}
                </span>
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
