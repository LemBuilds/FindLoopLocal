"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "./BottomNav";

/* Renders the global bottom nav on every non-auth page */
export function SiteNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/auth")) return null;
  return <BottomNav />;
}
