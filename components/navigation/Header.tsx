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

          {/* Desktop Navigation - Using reliable CSS instead of problematic Tailwind classes */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
            className="desktop-nav"
          >
            {navItems.map((item) => {
              if (item.onClick) {
                return (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                    title={item.label}
                  >
                    {item.icon && <item.icon className="h-5 w-5" />}
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
                  >
                    {item.icon && <item.icon className="h-5 w-5" />}
                  </Link>
                );
              }

              return null;
            })}
          </nav>
        </div>
      </header>

      <style jsx>{`
        .desktop-nav {
          display: none;
        }

        @media (min-width: 768px) {
          .desktop-nav {
            display: flex;
            align-items: center;
            gap: 4px;
          }
        }
      `}</style>

      <FarcasterAccessModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        feature={modalFeature}
      />
    </>
  );
}
