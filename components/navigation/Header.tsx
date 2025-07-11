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

          {/* Desktop Navigation - Icon Only */}
          <nav
            className="hidden md:flex items-center gap-1"
            style={{
              backgroundColor: "red",
              padding: "4px",
              border: "2px solid blue",
            }}
          >
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
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                    title={item.label}
                    style={{
                      backgroundColor: "yellow",
                      border: "1px solid black",
                    }}
                  >
                    {item.icon ? (
                      <item.icon
                        className="h-5 w-5"
                        style={{ color: "purple", stroke: "purple" }}
                      />
                    ) : (
                      <span style={{ color: "red", fontWeight: "bold" }}>
                        {item.label[0]}
                      </span>
                    )}
                  </button>
                );
              }

              if (item.href) {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`p-2 transition-colors ${
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title={item.label}
                    style={{
                      backgroundColor: "yellow",
                      border: "1px solid black",
                    }}
                  >
                    {item.icon ? (
                      <item.icon
                        className="h-5 w-5"
                        style={{ color: "purple", stroke: "purple" }}
                      />
                    ) : (
                      <span style={{ color: "red", fontWeight: "bold" }}>
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

      <FarcasterAccessModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        feature={modalFeature}
      />
    </>
  );
}
