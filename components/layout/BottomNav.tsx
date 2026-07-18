"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FigmaIcon } from "@/components/icons/FigmaIcon";
import type { FigmaIconName } from "@/lib/figma-icons";
import { cn } from "@/lib/utils";

const tabs: { href: string; label: string; icon: FigmaIconName }[] = [
  { href: "/home", label: "Map", icon: "mapNav" },
  { href: "/favorites", label: "Favorites", icon: "favorites" },
  { href: "/help", label: "Help", icon: "help" },
];

export function BottomNav() {
  const pathname = usePathname();
  const showNav = tabs.some((tab) => tab.href === pathname);

  if (!showNav) return null;

  return (
    <nav
      aria-label="Primary"
      className="relative z-[1100] shrink-0 border-t border-hairline bg-canvas-softer pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1"
    >
      <div className="grid grid-cols-3 px-2">
        {tabs.map((tab) => {
          const active = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                active ? "bg-canvas text-ink" : "text-body hover:bg-canvas hover:text-ink",
              )}
            >
              <FigmaIcon name={tab.icon} size={24} className="h-6 w-6" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
