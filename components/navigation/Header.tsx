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

  const handleTitleClick = () => {
    router.push("/");
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-white backdrop-blur supports-[backdrop-filter]:bg-white">
        <div className="flex h-14 w-full items-center justify-between px-4 md:px-8">
          <h1
            className="text-lg font-semibold cursor-pointer hover:opacity-70 transition-opacity"
            onClick={handleTitleClick}
          >
            Creator Score
          </h1>

          {/* TEST 1: Always visible navigation - no media queries */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "red",
              padding: "8px",
              border: "3px solid blue",
              zIndex: 99999,
              position: "relative",
            }}
          >
            <span
              style={{ color: "white", fontWeight: "bold", fontSize: "12px" }}
            >
              NAV:
            </span>
            {navItems.map((item, index) => {
              console.log(`[Header] Rendering desktop nav item ${index}:`, {
                label: item.label,
                hasIcon: !!item.icon,
                iconName: item.icon?.name,
                hasOnClick: !!item.onClick,
                hasHref: !!item.href,
              });

              if (item.onClick) {
                return (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    title={item.label}
                    style={{
                      backgroundColor: "yellow",
                      border: "2px solid black",
                      padding: "8px",
                      cursor: "pointer",
                      minWidth: "40px",
                      minHeight: "40px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {item.icon ? (
                      <item.icon
                        style={{
                          width: "20px",
                          height: "20px",
                          color: "purple",
                          stroke: "purple",
                          strokeWidth: "2px",
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          color: "red",
                          fontWeight: "bold",
                          fontSize: "16px",
                        }}
                      >
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
                    title={item.label}
                    style={{
                      backgroundColor:
                        pathname === item.href ? "green" : "yellow",
                      border: "2px solid black",
                      padding: "8px",
                      textDecoration: "none",
                      minWidth: "40px",
                      minHeight: "40px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {item.icon ? (
                      <item.icon
                        style={{
                          width: "20px",
                          height: "20px",
                          color: "purple",
                          stroke: "purple",
                          strokeWidth: "2px",
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          color: "red",
                          fontWeight: "bold",
                          fontSize: "16px",
                        }}
                      >
                        {item.label[0]}
                      </span>
                    )}
                  </Link>
                );
              }

              return null;
            })}
          </nav>
        </div>
      </header>

      {/* TEST 2: Fixed positioned navigation - completely independent */}
      <div
        style={{
          position: "fixed",
          top: "70px",
          right: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          zIndex: 999999,
          backgroundColor: "orange",
          padding: "20px",
          border: "5px solid purple",
          borderRadius: "10px",
        }}
      >
        <div style={{ color: "black", fontWeight: "bold", fontSize: "14px" }}>
          FIXED TEST:
        </div>
        {navItems.map((item, index) => (
          <div
            key={index}
            style={{
              width: "60px",
              height: "60px",
              backgroundColor: "lime",
              color: "black",
              border: "3px solid black",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              fontWeight: "bold",
              fontSize: "20px",
              cursor: "pointer",
            }}
            onClick={
              item.onClick ||
              (() => item.href && (window.location.href = item.href))
            }
          >
            {item.label[0]}
          </div>
        ))}
      </div>

      <FarcasterAccessModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        feature={modalFeature}
      />
    </>
  );
}
