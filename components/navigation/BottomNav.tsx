"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserNavigation } from "@/hooks/useUserNavigation";
import { FarcasterAccessModal } from "@/components/navigation/FarcasterAccessModal";

export function BottomNav() {
  const pathname = usePathname();
  const { navItems, modalOpen, modalFeature, setModalOpen } =
    useUserNavigation();

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden">
        <div className="flex justify-around items-center h-16 px-4">
          {navItems.map((item) => {
            if (item.onClick) {
              return (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className="flex flex-col items-center gap-1 p-2 text-muted-foreground hover:text-foreground transition-colors"
                  title={item.label}
                >
                  {item.icon && <item.icon className="h-5 w-5" />}
                  <span className="text-xs">{item.label}</span>
                </button>
              );
            }

            if (item.href) {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 p-2 transition-colors ${
                    isActive
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title={item.label}
                >
                  {item.icon && <item.icon className="h-5 w-5" />}
                  <span className="text-xs">{item.label}</span>
                </Link>
              );
            }

            return null;
          })}
        </div>
      </nav>

      <FarcasterAccessModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        feature={modalFeature}
      />
    </>
  );
}
